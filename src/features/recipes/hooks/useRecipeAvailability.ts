'use client';

import { useMemo } from 'react';
import { usePantryStore } from '@/features/pantry/store/pantryStore';

interface Recipe {
    id: string;
    name: string;
    ingredients: Array<{
        id?: string;
        name: string;
        amount?: number;
        unit?: string;
    }>;
    [key: string]: any;
}

interface RecipeAvailability {
    recipe: Recipe;
    matchedIngredients: number;
    totalIngredients: number;
    matchPercentage: number;
    missingIngredients: string[];
}

/**
 * Hook to calculate pantry availability for recipes
 * Returns recipes sorted by what you can cook with available ingredients
 */
export function useRecipeAvailability(recipes: Recipe[]) {
    const { items: pantryItems } = usePantryStore();

    // Create a normalized set of pantry ingredient names for fast lookup
    const pantryIngredientNames = useMemo(() => {
        const names = new Set<string>();
        pantryItems.forEach(item => {
            if (item.name) {
                // Add lowercase version for case-insensitive matching
                names.add(item.name.toLowerCase().trim());

                // Also add common variations
                const normalized = item.name
                    .toLowerCase()
                    .replace(/s$/, '') // Remove trailing 's' for singular form
                    .trim();
                names.add(normalized);
            }
        });
        return names;
    }, [pantryItems]);

    // Check if an ingredient is available in pantry
    const checkIngredientAvailability = (ingredientName: string): boolean => {
        const normalizedName = ingredientName.toLowerCase().trim();
        const singularName = normalizedName.replace(/s$/, '');

        // Direct match
        if (pantryIngredientNames.has(normalizedName)) return true;
        if (pantryIngredientNames.has(singularName)) return true;

        // Partial match (ingredient contains pantry item or vice versa)
        for (const pantryName of pantryIngredientNames) {
            if (normalizedName.includes(pantryName) || pantryName.includes(normalizedName)) {
                return true;
            }
        }

        return false;
    };

    // Calculate availability for all recipes
    const recipesWithAvailability = useMemo((): RecipeAvailability[] => {
        return recipes.map(recipe => {
            const ingredients = recipe.ingredients || [];
            const totalIngredients = ingredients.length;

            if (totalIngredients === 0) {
                return {
                    recipe,
                    matchedIngredients: 0,
                    totalIngredients: 0,
                    matchPercentage: 0,
                    missingIngredients: []
                };
            }

            let matchedCount = 0;
            const missingIngredients: string[] = [];

            ingredients.forEach(ing => {
                const ingredientName = ing.name || '';
                if (checkIngredientAvailability(ingredientName)) {
                    matchedCount++;
                } else {
                    missingIngredients.push(ingredientName);
                }
            });

            return {
                recipe,
                matchedIngredients: matchedCount,
                totalIngredients,
                matchPercentage: Math.round((matchedCount / totalIngredients) * 100),
                missingIngredients
            };
        });
    }, [recipes, pantryIngredientNames]);

    // Filter to only recipes you can cook (80%+ match)
    const canCookNow = useMemo(() => {
        return recipesWithAvailability
            .filter(r => r.matchPercentage >= 80)
            .sort((a, b) => b.matchPercentage - a.matchPercentage);
    }, [recipesWithAvailability]);

    // Sort all recipes by availability
    const sortedByAvailability = useMemo(() => {
        return [...recipesWithAvailability].sort((a, b) => b.matchPercentage - a.matchPercentage);
    }, [recipesWithAvailability]);

    // Get availability info for a specific recipe
    const getRecipeAvailability = (recipeId: string): RecipeAvailability | undefined => {
        return recipesWithAvailability.find(r => r.recipe.id === recipeId);
    };

    return {
        recipesWithAvailability,
        canCookNow,
        sortedByAvailability,
        getRecipeAvailability,
        pantryItemCount: pantryItems.length,
        hasAnyPantryItems: pantryItems.length > 0
    };
}
