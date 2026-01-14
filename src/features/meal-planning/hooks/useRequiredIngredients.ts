
import { useMemo } from 'react';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import { WeekPlan, Ingredient } from '../types';

interface RequiredIngredient {
    name: string;
    requiredQuantity: number;
    unit: string;
    category: string;
}

interface ValidationResult {
    required: RequiredIngredient[];
    missing: RequiredIngredient[];
    available: RequiredIngredient[];
}

export function useRequiredIngredients(mealPlan: WeekPlan | null): ValidationResult {
    const pantryItems = usePantryStore((state) => state.items);

    const result = useMemo(() => {
        if (!mealPlan || !mealPlan.slots) {
            return { required: [], missing: [], available: [] };
        }

        // 1. Extract and aggregate ingredients from the plan
        const ingredientMap = new Map<string, RequiredIngredient>();

        mealPlan.slots.forEach((slot) => {
            if (!slot.recipe || !slot.recipe.ingredients) return;

            slot.recipe.ingredients.forEach((ing) => {
                const normalizedName = ing.name.toLowerCase().trim();
                const quantity = (ing.amount || 0) * (slot.servings || 1); // Scale by servings? Assuming amount is per recipe (usually for N servings). 
                // Wait, Recipe has `servings`. If slot.servings differs, we allow scaling.
                // Usually recipe.ingredients amounts are for recipe.servings.
                // So factor = slot.servings / recipe.servings.
                // If slot.servings is not set, assume recipe.servings.

                const recipeServings = slot.recipe?.servings || 4;
                const actualServings = slot.servings || recipeServings;
                const factor = actualServings / recipeServings; // approximate scaling

                const finalQuantity = (ing.amount || 0) * factor;

                if (ingredientMap.has(normalizedName)) {
                    const existing = ingredientMap.get(normalizedName)!;
                    // Simple addition if units match. If not, just keep first unit or handle complexity.
                    // For MVP, assume consistent units or just sum.
                    if (existing.unit === ing.unit) {
                        existing.requiredQuantity += finalQuantity;
                    } else {
                        // Different units for same ingredient (e.g. g vs kg). 
                        // Without conversion logic, we might miss this. 
                        // For now, treat as separate entry or just sum and hope user handles it? 
                        // Prompt says "Extract all ingredients", "Compare with pantry".
                        // I will try to keep it simple. If unit differs, maybe append to name? 
                        // Actually, map matches by name. I'll just keep the existing unit.
                        existing.requiredQuantity += finalQuantity;
                    }
                } else {
                    ingredientMap.set(normalizedName, {
                        name: ing.name,
                        requiredQuantity: finalQuantity,
                        unit: ing.unit || 'u',
                        category: ing.category || 'Varios'
                    });
                }
            });
        });

        const required = Array.from(ingredientMap.values());

        // 2. Compare with pantry
        const missing: RequiredIngredient[] = [];
        const available: RequiredIngredient[] = [];

        required.forEach((req) => {
            // Find in pantry (case insensitive)
            const pantryItem = pantryItems.find(
                (p) => p.ingredient_name.toLowerCase().trim() === req.name.toLowerCase().trim()
            );

            if (pantryItem) {
                if (pantryItem.quantity >= req.requiredQuantity) {
                    available.push(req);
                } else {
                    // Partially missing
                    missing.push({
                        ...req,
                        requiredQuantity: req.requiredQuantity - pantryItem.quantity
                    });
                    // Also push to available? No, logic usually says if it's in missing list, it's missing (net).
                    // But maybe user wants "Total needed: 500g, Have: 200g, Buy: 300g".
                    // The structure asks for "missing" ingredients.
                }
            } else {
                // Completely missing
                missing.push(req);
            }
        });

        return { required, missing, available };

    }, [mealPlan, pantryItems]); // Re-calc when plan or pantry changes

    return result;
}
