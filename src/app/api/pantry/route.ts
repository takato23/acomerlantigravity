import { NextResponse } from "next/server";
import { getUser } from '@/lib/auth/supabase-auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/supabase/database.service';
import type { PantryItem } from '@/features/pantry/types';

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

    const pantryItems = await db.getPantryItems(user.id) as PantryItem[];

    let filteredItems = pantryItems;

    if (location && location !== "all") {
      filteredItems = filteredItems.filter((item: PantryItem) => item.location === location);
    }

    if (expiring === "true") {
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      filteredItems = filteredItems.filter((item: PantryItem) => {
        if (!item.expiration_date) return false;
        const expirationDate = new Date(item.expiration_date);
        return expirationDate >= now && expirationDate <= weekFromNow;
      });
    }

    if (lowStock === "true") {
      filteredItems = filteredItems.filter((item) => item.quantity <= 1);
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
    } = data;

    if (!ingredientName) {
      return NextResponse.json(
        { error: "Ingredient name is required" },
        { status: 400 }
      );
    }

    const ingredient = await db.findOrCreateIngredient(ingredientName);

    // Create new pantry item using Supabase service
    const newItem = await db.addPantryItem(user.id, {
      ingredientId: ingredient.id,
      quantity: quantity || 1,
      unit: unit || "un",
      location: location || "pantry",
      expirationDate: expiryDate ? new Date(expiryDate) : undefined,
      notes: notes || undefined,
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
