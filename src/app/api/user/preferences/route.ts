import { NextResponse } from "next/server";
import { logger } from '@/lib/logger';
import { getUser } from '@/lib/auth/supabase-auth';

// authOptions removed - using Supabase Auth;
import { db } from '@/lib/supabase/database.service';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // Update or create user preferences
    const preferences = await db.updateUserPreferences(user.id, {
      dietary_restrictions: data.dietaryRestrictions || [],
      cuisine_preferences: data.favoriteCuisines || [],
      cooking_skill_level: data.cookingSkillLevel || "intermediate",
      household_size: data.householdSize || 1,
      preferred_meal_types: data.preferredMealTypes || [],
      avoid_ingredients: data.avoidIngredients || [],
      calorie_target: data.calorieTarget,
      protein_target: data.proteinTarget,
      carb_target: data.carbTarget,
      fat_target: data.fatTarget,
    });

    // Update user's onboarding status
    await db.updateUserProfile(user.id, {
      onboarding_completed: true
    });

    return NextResponse.json({
      message: "Preferences saved successfully",
      preferences,
    });
  } catch (error: unknown) {
    logger.error("Error saving preferences:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await db.getUserProfile(user.id);
    return NextResponse.json(profile?.preferences || null);
  } catch (error: unknown) {
    logger.error("Error fetching preferences:", 'API:route', error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}
