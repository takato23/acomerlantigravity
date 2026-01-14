'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { RecipeDetail } from '@/features/recipes/components/RecipeDetail';
import { Recipe } from '@/features/recipes/types';
import { Loader2 } from 'lucide-react';

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipe() {
      const id = params?.id as string;
      if (!id) {
        setError('No recipe ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('recipes')
          .select(`
            *,
            recipe_ingredients (
              id,
              quantity,
              unit,
              notes,
              ingredient:ingredients (*)
            ),
            nutrition_info (*)
          `)
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Error fetching recipe:', fetchError);
          setError('Recipe not found');
          setLoading(false);
          return;
        }

        // Transform to Recipe type
        const transformedRecipe: Recipe = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          image_url: data.image_url,
          prep_time: data.prep_time || 0,
          cook_time: data.cook_time || 0,
          total_time: data.total_time || (data.prep_time || 0) + (data.cook_time || 0),
          servings: data.servings || 4,
          difficulty: data.difficulty || 'medium',
          cuisine_type: data.cuisine_type || 'other',
          meal_types: data.meal_types || [],
          dietary_tags: data.dietary_tags || [],
          ingredients: (data.recipe_ingredients || []).map((ri: any) => ({
            name: ri.ingredient?.name || 'Unknown',
            quantity: ri.quantity || 1,
            unit: ri.unit || '',
            notes: ri.notes,
            optional: false,
          })),
          instructions: (data.instructions || []).map((text: string, index: number) => ({
            step_number: index + 1,
            text: text,
          })),
          nutritional_info: data.nutrition_info ? {
            calories: data.nutrition_info.calories || 0,
            protein: data.nutrition_info.protein || 0,
            carbs: data.nutrition_info.carbs || 0,
            fat: data.nutrition_info.fat || 0,
            fiber: data.nutrition_info.fiber || 0,
            sodium: data.nutrition_info.sodium || 0,
          } : undefined,
          ai_generated: data.source === 'ai',
          rating: data.rating,
          times_cooked: data.times_cooked || 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
          user_id: data.user_id,
        };

        setRecipe(transformedRecipe);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Cargando receta...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Receta no encontrada</h1>
          <p className="text-gray-600 mb-4">{error || 'La receta que buscas no existe.'}</p>
          <button
            onClick={() => router.push('/recetas')}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Volver a Recetas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <RecipeDetail recipe={recipe} displayMode="page" />
    </div>
  );
}