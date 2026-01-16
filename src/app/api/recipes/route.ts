import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// authOptions removed - using Supabase Auth;
import {
  validateQuery,
  validateAuthAndBody,
  createSuccessResponse,
  createPaginatedResponse
} from "@/lib/validation/middleware";
import {
  RecipeCreateSchema,
  RecipeQuerySchema
} from "@/lib/validation/schemas";
import { getUser } from '@/lib/auth/supabase-auth';

export const GET = validateQuery(RecipeQuerySchema, async (request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const user = await getUser();
    const query = request.validatedQuery!;

    const skip = (query.page - 1) * query.limit;
    const tags = query.tags ? query.tags.split(",") : [];

    let baseQuery = supabase.from('recipes').select('*');

    if (user?.id) {
      baseQuery = baseQuery.or(`is_public.eq.true,user_id.eq.${user.id}`);
    } else {
      baseQuery = baseQuery.eq('is_public', true);
    }

    const { data: recipesData, error } = await baseQuery;
    if (error) {
      throw error;
    }

    let recipes = recipesData || [];

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      recipes = recipes.filter((recipe) => {
        const name = (recipe.name || '').toLowerCase();
        const description = (recipe.description || '').toLowerCase();
        return name.includes(searchLower) || description.includes(searchLower);
      });
    }

    if (query.cuisine) {
      const cuisineLower = query.cuisine.toLowerCase();
      recipes = recipes.filter((recipe) =>
        (recipe.cuisine_type || '').toLowerCase() === cuisineLower
      );
    }

    if (query.difficulty) {
      recipes = recipes.filter((recipe) => recipe.difficulty_level === query.difficulty);
    }

    if (tags.length > 0) {
      recipes = recipes.filter((recipe) =>
        Array.isArray(recipe.tags) && recipe.tags.some((tag: string) => tags.includes(tag))
      );
    }

    if (query.authorId) {
      recipes = recipes.filter((recipe) => recipe.user_id === query.authorId);
    }

    if (query.isPublic !== undefined) {
      recipes = recipes.filter((recipe) => recipe.is_public === query.isPublic);
    }

    const maxPrepTime = query.maxPrepTime;
    if (maxPrepTime !== undefined) {
      recipes = recipes.filter((recipe) =>
        typeof recipe.preparation_time === 'number' && recipe.preparation_time <= maxPrepTime
      );
    }

    const maxCookTime = query.maxCookTime;
    if (maxCookTime !== undefined) {
      recipes = recipes.filter((recipe) =>
        typeof recipe.cooking_time === 'number' && recipe.cooking_time <= maxCookTime
      );
    }

    if (query.hasNutrition) {
      recipes = recipes.filter((recipe) => recipe.macronutrients != null);
    }

    const sortKey = query.sortBy === 'title' ? 'name' : (query.sortBy || 'created_at');
    recipes.sort((a, b) => {
      const dir = query.sortOrder === 'asc' ? 1 : -1;
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * dir;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * dir;
      }
      return 0;
    });

    const total = recipes.length;
    const paginatedRecipes = recipes.slice(skip, skip + query.limit);

    return createPaginatedResponse(paginatedRecipes, {
      page: query.page,
      limit: query.limit,
      total
    });
  } catch (error: unknown) {
    logger.error("Error fetching recipes:", 'API:route', error);
    throw new Error("Failed to fetch recipes");
  }
});

export const POST = validateAuthAndBody(RecipeCreateSchema, async (request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const data = request.validatedBody!;
    const userId = request.user!.id;

    const instructions = data.instructions
      .sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0))
      .map((inst) => inst.instruction);

    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        user_id: userId,
        name: data.title,
        description: data.description || null,
        preparation_time: data.prepTimeMinutes,
        cooking_time: data.cookTimeMinutes,
        servings: data.servings,
        difficulty_level: data.difficulty,
        cuisine_type: data.cuisine || null,
        image_url: data.imageUrl || null,
        instructions,
        ingredients: data.ingredients,
        macronutrients: data.nutrition || null,
        tags: data.tags,
        is_public: data.isPublic,
        is_ai_generated: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return createSuccessResponse(recipe, 201);
  } catch (error: unknown) {
    logger.error("Error creating recipe:", 'API:route', error);
    throw new Error("Failed to create recipe");
  }
});
