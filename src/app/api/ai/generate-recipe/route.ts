import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UnifiedAIService } from '@/services/ai';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/services/logger';
import type { Database } from '@/lib/supabase/database.types';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients are required' },
        { status: 400 }
      );
    }

    // Generate recipe using AI
    const aiService = UnifiedAIService.getInstance();
    const generatedRecipe = await aiService.generateRecipe({
      ingredients: body.ingredients,
      preferences: {
        dietary: body.dietaryRestrictions,
        cuisinePreferences: body.cuisinePreference ? [body.cuisinePreference] : [],
        cookingSkillLevel: body.difficulty,
        familySize: body.servings,
      } as any
    });

    // Optionally save to database if requested
    if (body.save) {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          ...generatedRecipe,
          user_id: user.id,
          is_public: false,
          source: 'ai_generated',
        })
        .select()
        .single();

      if (recipeError) {
        logger.error('Failed to save recipe:', 'API:route', recipeError);
      } else {
        generatedRecipe.id = recipe.id;
      }
    }

    return NextResponse.json({ recipe: generatedRecipe });
  } catch (error: any) {
    logger.error('Recipe generation error:', 'API:route', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}