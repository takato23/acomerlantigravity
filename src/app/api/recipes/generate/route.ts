import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UnifiedAIService } from "@/services/ai";
import { createClient } from '@/lib/supabase/server';
import type { AIRecipeRequest } from "@/services/ai/types";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { ingredients, cuisine, difficulty, servings } = body;

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient is required" },
        { status: 400 }
      );
    }

    // Get user profile for dietary preferences
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('dietary_restrictions, cuisine_preferences')
      .eq('user_id', user.id)
      .single();

    // Build AI generation params
    const dietaryRestrictions = Array.isArray(profile?.dietary_restrictions)
      ? (profile.dietary_restrictions as Array<'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'keto' | 'paleo'>)
      : [];

    const params: AIRecipeRequest = {
      ingredients: ingredients as string[],
      cuisine: cuisine || 'argentina',
      difficulty: difficulty || 'medium',
      servings: servings || 4,
      constraints: {
        dietary: dietaryRestrictions
      },
    };

    // Generate recipe using AI
    const aiService = UnifiedAIService.getInstance();
    const generatedRecipe = await aiService.generateRecipe(params);

    // Format recipe for frontend
    const recipe = {
      id: crypto.randomUUID(),
      name: generatedRecipe.name,
      title: generatedRecipe.name,
      description: generatedRecipe.description || '',
      ingredients: generatedRecipe.ingredients.map((ing: any) => ({
        name: ing.name,
        quantity: ing.quantity || ing.amount || 0,
        unit: ing.unit || 'g'
      })),
      instructions: generatedRecipe.instructions.map((inst) => inst.instruction),
      prepTime: generatedRecipe.prepTime || 15,
      cookTime: generatedRecipe.cookTime || 30,
      servings: generatedRecipe.servings || servings || 4,
      difficulty: generatedRecipe.difficulty || difficulty || 'medium',
      cuisine: generatedRecipe.cuisine || cuisine || 'argentina',
      tags: generatedRecipe.tags || [],
      nutrition: generatedRecipe.nutrition || {
        calories: 400,
        protein: 25,
        carbs: 45,
        fat: 15
      },
      isAiGenerated: true,
      source: 'ai',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
    };

    // Optionally save to database
    try {
      const { data: savedRecipe, error: saveError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: recipe.name,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prep_time: recipe.prepTime,
          cook_time: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine,
          tags: recipe.tags,
          nutrition: recipe.nutrition,
          source: 'ai',
          is_public: false
        })
        .select()
        .single();

      if (!saveError && savedRecipe) {
        recipe.id = savedRecipe.id;
      }
    } catch (dbError) {
      // Non-critical - continue even if save fails
      console.warn('Failed to save recipe to database:', dbError);
    }

    return NextResponse.json({ recipe, success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error generating recipe:", error);
    return NextResponse.json(
      {
        error: "Failed to generate recipe",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
