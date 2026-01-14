import { NextResponse } from "next/server";
import { getUser } from '@/lib/auth/supabase-auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/supabase/database.service';

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const expiring = searchParams.get("expiring");
    const lowStock = searchParams.get("lowStock");

    const where: any = {
      userId: user.id,
    };

    if (location && location !== "all") {
      where.location = location;
    }

    if (expiring === "true") {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      where.expiryDate = {
        lte: weekFromNow,
        gte: new Date(),
      };
    }

    const pantryItems = await db.getPantryItems(user.id, {
      where,
      orderBy: {
        createdAt: "desc",
      }
    });

    let filteredItems = pantryItems;

    if (lowStock === "true") {
      filteredItems = pantryItems.filter(item => item.quantity <= 1);
    }

    return NextResponse.json(filteredItems);
  } catch (error: unknown) {
    logger.error("Error fetching pantry items:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to fetch pantry items" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      ingredientName,
      quantity,
      unit,
      location,
      expiryDate,
      notes,
      purchasePrice,
      purchaseDate,
      barcode,
    } = data;

    // Create new pantry item using Supabase service
    const newItem = await db.addPantryItem(user.id, {
      name: ingredientName,
      quantity: quantity || 1,
      unit: unit || "un",
      location: location || "pantry",
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes: notes || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      barcode: barcode || null,
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: unknown) {
    logger.error("Error creating pantry item:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to create pantry item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Delete the item using Supabase service
    await db.deletePantryItem(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("Error deleting pantry item:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to delete pantry item" },
      { status: 500 }
    );
  }
}