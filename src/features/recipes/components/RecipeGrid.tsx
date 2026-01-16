'use client';

import type { Database } from '@/lib/supabase/types';

import { RecipeCard } from './RecipeCard';
import type { RecipeCardRecipe } from './RecipeCard';

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface RecipeGridProps {
  recipes: (Recipe & {
    averageRating?: number;
    totalRatings?: number;
    isFavorite?: boolean;
  })[];
  onFavoriteToggle?: (recipeId: string) => void;
  isLoading?: boolean;
}

export function RecipeGrid({ recipes, onFavoriteToggle, isLoading }: RecipeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-200" />
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="flex gap-2">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🍳</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No recipes found
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters or create your first recipe!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => {
        const nutritionInfo =
          recipe.nutrition_per_serving &&
          typeof recipe.nutrition_per_serving === 'object' &&
          !Array.isArray(recipe.nutrition_per_serving)
            ? (recipe.nutrition_per_serving as {
                calories?: number;
                protein?: number;
                carbs?: number;
                fat?: number;
              })
            : undefined;

        const ingredients = Array.isArray(recipe.ingredients)
          ? recipe.ingredients.map((ing: any) => ({
              name: ing.name ?? ing.ingredient ?? '',
              quantity: Number(ing.quantity ?? ing.amount ?? 0),
              unit: ing.unit ?? '',
            }))
          : [];

        const instructions = Array.isArray(recipe.instructions)
          ? recipe.instructions.map((step: any) =>
              typeof step === 'string' ? step : step.text ?? step.instruction ?? ''
            )
          : [];

        const normalizeDifficulty = (value?: string | null): RecipeCardRecipe['difficulty'] => {
          switch (value?.toLowerCase()) {
            case 'easy':
            case 'facil':
              return 'fácil';
            case 'medium':
            case 'intermedio':
              return 'intermedio';
            case 'hard':
            case 'dificil':
              return 'difícil';
            default:
              return 'intermedio';
          }
        };

        const cardRecipe: RecipeCardRecipe = {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description ?? '',
          image: recipe.image_url ?? undefined,
          prepTime: recipe.prep_time ?? 0,
          cookTime: recipe.cook_time ?? 0,
          servings: recipe.servings ?? 0,
          difficulty: normalizeDifficulty(recipe.difficulty),
          rating: recipe.averageRating ?? recipe.rating_average ?? 0,
          reviewCount: recipe.totalRatings ?? recipe.rating_count ?? 0,
          category: recipe.tags?.[0] ?? 'general',
          cuisine: recipe.cuisine_types?.[0] ?? 'otros',
          tags: recipe.tags ?? [],
          isFavorite: recipe.isFavorite ?? false,
          isBookmarked: false,
          author: recipe.created_by ?? 'Chef',
          calories: nutritionInfo?.calories,
          ingredients,
          instructions,
          nutritionInfo:
            nutritionInfo && nutritionInfo.calories !== undefined
              ? {
                  calories: nutritionInfo.calories ?? 0,
                  protein: nutritionInfo.protein ?? 0,
                  carbs: nutritionInfo.carbs ?? 0,
                  fat: nutritionInfo.fat ?? 0,
                }
              : undefined,
          createdAt: new Date(recipe.created_at),
        };

        return (
          <RecipeCard
            key={recipe.id}
            recipe={cardRecipe}
            onToggleFavorite={
              onFavoriteToggle
                ? (selectedRecipe) => onFavoriteToggle(selectedRecipe.id)
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
