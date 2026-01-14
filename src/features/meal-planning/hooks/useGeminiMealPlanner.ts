'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { fetchJsonWithErrorHandling } from '@/lib/error/ApiErrorHandler';
import { useErrorReporting } from '@/components/error/FeatureErrorBoundary';
import { triggerPlanReadyNotification } from '@/lib/notifications';
import {
  UserPreferences,
  PlanningConstraints,
  WeeklyPlan,
  MealPlanningResult
} from '@/lib/types/mealPlanning';
import {
  GeminiPlannerOptions,
  GeminiPlanResult
} from '@/lib/services/geminiPlannerService';

import { useMonetization } from '@/features/monetization/MonetizationProvider';
import { useMealPlanningStore } from '../store/useMealPlanningStore';
import type { MealType as PlannerMealType } from '../types';

interface UseGeminiMealPlannerResult {
  // ... existing interface ...
  // (Omitting for brevity in prompt, but in real editing I will just target the imports section and the success block separately if possible, or use multi_replace. Let's use multi_replace actually to be cleaner)

  // State
  isGenerating: boolean;
  error: string | null;
  lastGeneratedPlan: WeeklyPlan | null;
  confidence: number;

  // Actions
  generateWeeklyPlan: (
    preferences?: Partial<UserPreferences>,
    constraints?: Partial<PlanningConstraints>,
    options?: Partial<GeminiPlannerOptions>
  ) => Promise<MealPlanningResult<WeeklyPlan>>;

  optimizeDailyPlan: (
    date: Date,
    preferences?: Partial<UserPreferences>
  ) => Promise<MealPlanningResult<WeeklyPlan>>;

  regenerateWithFeedback: (
    feedback: string,
    currentPlan: WeeklyPlan
  ) => Promise<MealPlanningResult<WeeklyPlan>>;

  applyGeneratedPlan: (
    plan?: WeeklyPlan,
    options?: {
      excludedDates?: string[];
      allowedMealTypes?: PlannerMealType[];
    }
  ) => Promise<void>;

  generateSingleMeal: (
    dayOfWeek: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'desayuno' | 'almuerzo' | 'cena',
    preferences?: Partial<UserPreferences>
  ) => Promise<MealPlanningResult<any>>;

  clearError: () => void;
}

export function useGeminiMealPlanner(): UseGeminiMealPlannerResult {
  const { user } = useAuth();
  const { reportError } = useErrorReporting('MealPlanner');
  const { checkAccess, trackAction } = useMonetization();
  const {
    userPreferences,
    currentWeekPlan,
    loadWeekPlan,
    saveWeekPlan,
    currentDate,
    addMealToSlot
  } = useMealPlanningStore();

  // Helper to map AI recipe to store recipe
  const mapAIRecipeToStoreRecipe = (aiRecipe: any, confidence?: number) => ({
    id: aiRecipe.id,
    name: aiRecipe.title,
    description: aiRecipe.description || '',
    prepTime: aiRecipe.prepTimeMinutes,
    cookTime: aiRecipe.cookTimeMinutes,
    servings: aiRecipe.servings,
    difficulty: aiRecipe.difficulty,
    ingredients: aiRecipe.ingredients.map((ing: any) => ({
      id: Math.random().toString(),
      name: ing.name,
      amount: ing.quantity,
      unit: ing.unit,
      category: ing.category || 'other'
    })),
    instructions: aiRecipe.instructions || [],
    nutrition: aiRecipe.nutrition,
    dietaryLabels: aiRecipe.dietaryRestrictions || [],
    tags: aiRecipe.tags || [],
    cuisine: aiRecipe.cuisine || 'Internacional',
    rating: confidence || 0,
    isAiGenerated: true,
    isFavorite: false,
    image: aiRecipe.imageUrl
  });

  // Helper function to get request options with credentials
  const getRequestOptions = (body: any): RequestInit => {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This ensures cookies are sent
      body: JSON.stringify(body)
    };
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedPlan, setLastGeneratedPlan] = useState<WeeklyPlan | null>(null);
  const [confidence, setConfidence] = useState(0);

  const generateWeeklyPlan = useCallback(async (
    customPreferences?: Partial<UserPreferences>,
    customConstraints?: Partial<PlanningConstraints>,
    options: Partial<GeminiPlannerOptions> = {}
  ): Promise<MealPlanningResult<WeeklyPlan>> => {
    // Check quota
    const hasAccess = await checkAccess('weekly_plan');
    if (!hasAccess) {
      return {
        success: false,
        error: 'Quota exceeded',
        code: 'QUOTA_EXCEEDED'
      };
    }

    // Temporarily bypass authentication check
    const mockUserId = 'mock-user-' + Date.now();

    setIsGenerating(true);
    setError(null);

    try {
      // Merge preferences
      const finalPreferences: UserPreferences = {
        ...userPreferences,
        ...customPreferences,
        userId: user?.id || mockUserId
      };

      // Create constraints based on current week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const finalConstraints: PlanningConstraints = {
        startDate: startOfWeek,
        endDate: endOfWeek,
        mealTypes: ['breakfast', 'lunch', 'dinner'],
        servings: finalPreferences.householdSize || 2,
        maxPrepTime: 60,
        ...customConstraints
      };

      // Call the API with credentials and error handling
      const requestBody = {
        preferences: finalPreferences,
        constraints: finalConstraints,
        options: {
          useHolisticAnalysis: true,
          includeExternalFactors: true,
          optimizeResources: true,
          enableLearning: true,
          analysisDepth: 'comprehensive',
          ...options
        }
      };

      // Updated to use simple endpoint for testing
      const response = await fetchJsonWithErrorHandling<any>('/api/meal-planning/generate-simple', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        context: {
          feature: 'meal-planning',
          action: 'generate-weekly-plan',
          userId: user?.id || mockUserId,
          preferences: finalPreferences,
        },
        customRetry: {
          maxAttempts: 2, // Reduced for AI calls
          baseDelay: 2000, // Longer delay for AI processing
        }
      });

      const result: GeminiPlanResult = response;

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to generate meal plan');
      }

      setLastGeneratedPlan(result.plan);
      setConfidence(result.metadata.confidenceScore);

      // Track usage
      await trackAction('weekly_plan');

      toast.success('Plan de comidas generado exitosamente', {
        description: `Confianza: ${Math.round(result.metadata.confidenceScore * 100)}%`
      });

      return {
        success: true,
        data: result.plan
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);

      toast.error('Error al generar el plan', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        code: 'GENERATION_ERROR'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user, userPreferences, currentDate]);

  const optimizeDailyPlan = useCallback(async (
    date: Date,
    customPreferences?: Partial<UserPreferences>
  ): Promise<MealPlanningResult<WeeklyPlan>> => {
    if (!user || !currentWeekPlan) {
      return {
        success: false,
        error: 'No hay plan de semana actual para optimizar',
        code: 'NO_CURRENT_PLAN'
      };
    }

    setIsGenerating(true);
    setError(null);

    try {
      const finalPreferences: UserPreferences = {
        ...userPreferences,
        ...customPreferences,
        userId: user.id
      };

      const requestBody = {
        preferences: finalPreferences,
        currentPlan: currentWeekPlan,
        focusDay: date.toISOString()
      };
      const response = await fetch('/api/meal-planning/optimize-daily', getRequestOptions(requestBody));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: GeminiPlanResult = await response.json();

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to optimize daily plan');
      }

      setLastGeneratedPlan(result.plan);
      setConfidence(result.metadata.confidenceScore);

      toast.success('Plan diario optimizado', {
        description: `Mejoras aplicadas para ${date.toLocaleDateString('es-ES')}`
      });

      return {
        success: true,
        data: result.plan
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);

      toast.error('Error al optimizar el plan diario', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        code: 'OPTIMIZATION_ERROR'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user, userPreferences, currentWeekPlan]);

  const regenerateWithFeedback = useCallback(async (
    feedback: string,
    currentPlan: WeeklyPlan
  ): Promise<MealPlanningResult<WeeklyPlan>> => {
    // Temporarily bypass authentication check
    const mockUserId = 'mock-user-' + Date.now();

    setIsGenerating(true);
    setError(null);

    try {
      const requestBody = {
        feedback,
        currentPlan,
        userId: user?.id || mockUserId
      };
      const response = await fetch('/api/meal-planning/regenerate', getRequestOptions(requestBody));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: GeminiPlanResult = await response.json();

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to regenerate plan');
      }

      setLastGeneratedPlan(result.plan);
      setConfidence(result.metadata.confidenceScore);

      toast.success('Plan regenerado con éxito', {
        description: 'Se aplicaron tus sugerencias al nuevo plan'
      });

      return {
        success: true,
        data: result.plan
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);

      toast.error('Error al regenerar el plan', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        code: 'REGENERATION_ERROR'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const applyGeneratedPlan = useCallback(async (
    plan?: WeeklyPlan,
    options?: {
      excludedDates?: string[];
      allowedMealTypes?: PlannerMealType[];
    }
  ) => {
    const planToApply = plan || lastGeneratedPlan;
    if (!planToApply || !planToApply.meals || planToApply.meals.length === 0) {
      toast.error('Plan inválido', {
        description: 'El plan no contiene comidas válidas'
      });
      return;
    }

    try {
      // Convert the WeeklyPlan format to the store's WeekPlan format
      const weekStartDate = planToApply.weekStartDate;
      const weekStartDateStr = weekStartDate instanceof Date
        ? format(weekStartDate, 'yyyy-MM-dd')
        : weekStartDate;

      // Load the week plan for the target date
      await loadWeekPlan(weekStartDateStr);
      const { currentWeekPlan: loadedWeekPlan } = useMealPlanningStore.getState();

      // Apply meals to slots
      if (loadedWeekPlan) {
        const excludedDates = new Set(options?.excludedDates || []);
        const allowedMealTypes = options?.allowedMealTypes;

        const updatedSlots = loadedWeekPlan.slots.map(slot => {
          if (excludedDates.has(slot.date)) {
            return {
              ...slot,
              recipeId: undefined,
              recipe: undefined,
              customMealName: undefined,
              isCompleted: false,
              updatedAt: new Date().toISOString()
            };
          }

          if (allowedMealTypes && !allowedMealTypes.includes(slot.mealType)) {
            return {
              ...slot,
              recipeId: undefined,
              recipe: undefined,
              customMealName: undefined,
              isCompleted: false,
              updatedAt: new Date().toISOString()
            };
          }

          // Find matching meal from the generated plan
          // Use 'T00:00:00' suffix to force local timezone interpretation
          const dayMeal = planToApply.meals.find(m => {
            const mealDate = new Date(m.date + 'T00:00:00');
            const slotDate = new Date(slot.date + 'T00:00:00');
            return mealDate.toDateString() === slotDate.toDateString();
          });

          if (!dayMeal) return slot;

          // Map meal types
          let meal = null;
          if (slot.mealType === 'desayuno' && dayMeal.breakfast) {
            meal = dayMeal.breakfast;
          } else if (slot.mealType === 'almuerzo' && dayMeal.lunch) {
            meal = dayMeal.lunch;
          } else if (slot.mealType === 'merienda' && dayMeal.snacks?.length) {
            meal = dayMeal.snacks[0];
          } else if (slot.mealType === 'cena' && dayMeal.dinner) {
            meal = dayMeal.dinner;
          }

          if (!meal || !meal.recipe) return slot;

          return {
            ...slot,
            recipeId: meal.recipe.id,
            recipe: mapAIRecipeToStoreRecipe(meal.recipe, meal.confidence),
            updatedAt: new Date().toISOString()
          };
        });

        const updatedWeekPlan = {
          ...loadedWeekPlan,
          slots: updatedSlots,
          updatedAt: new Date().toISOString()
        };

        // Log the meals being applied for debugging
        const mealsApplied = updatedSlots.filter(s => s.recipeId).length;
        console.log('[applyGeneratedPlan] Applying plan:', {
          weekStartDate: weekStartDateStr,
          totalSlots: updatedSlots.length,
          mealsApplied,
          sampleMeals: updatedSlots.filter(s => s.recipe).slice(0, 3).map(s => ({
            date: s.date,
            mealType: s.mealType,
            recipeName: s.recipe?.name
          }))
        });

        await saveWeekPlan(updatedWeekPlan);

        // Force reload to ensure UI updates with fresh data
        await loadWeekPlan(weekStartDateStr);

        // Trigger notification for plan ready
        const weekEndDate = new Date(weekStartDateStr);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        const weekEndDateStr = format(weekEndDate, 'dd/MM');
        const weekStartFormatted = format(new Date(weekStartDateStr), 'dd/MM');

        // Get top 3 recipes as highlights
        const highlights = updatedSlots
          .filter(s => s.recipe?.name)
          .slice(0, 3)
          .map(s => s.recipe!.name);

        try {
          await triggerPlanReadyNotification({
            weekStart: weekStartFormatted,
            weekEnd: weekEndDateStr,
            totalMeals: mealsApplied,
            highlights,
          });
        } catch (err) {
          console.error('Failed to send notification:', err);
        }

        toast.success('Plan aplicado exitosamente', {
          description: `${mealsApplied} comidas agregadas a tu calendario`
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[applyGeneratedPlan] Error:', errorMessage);
      toast.error('Error al aplicar el plan', {
        description: errorMessage
      });
    }
  }, [lastGeneratedPlan, loadWeekPlan, saveWeekPlan]);

  const generateSingleMeal = useCallback(async (
    dayOfWeek: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'desayuno' | 'almuerzo' | 'merienda' | 'cena',
    customPreferences?: Partial<UserPreferences>
  ): Promise<MealPlanningResult<any>> => {
    // Check quota
    const hasAccess = await checkAccess('recipe_gen');
    if (!hasAccess) {
      return {
        success: false,
        error: 'Quota exceeded',
        code: 'QUOTA_EXCEEDED'
      };
    }

    // Temporarily bypass authentication check
    const mockUserId = 'mock-user-' + Date.now();

    setIsGenerating(true);
    setError(null);

    try {
      // Map Spanish meal types to English
      const mealTypeMap: Record<string, string> = {
        desayuno: 'breakfast',
        almuerzo: 'lunch',
        merienda: 'snack',
        cena: 'dinner',
        breakfast: 'breakfast',
        lunch: 'lunch',
        snack: 'snack',
        dinner: 'dinner'
      };

      const englishMealType = mealTypeMap[mealType] || mealType;

      // For now, we'll generate a full weekly plan and extract just the requested meal
      // In the future, this could be optimized to generate just a single meal
      const preferences: UserPreferences = {
        ...userPreferences,
        ...customPreferences,
        userId: user?.id || mockUserId
      };

      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - currentDate.getDay() + dayOfWeek);

      const constraints: PlanningConstraints = {
        startDate: targetDate,
        endDate: targetDate,
        mealTypes: [englishMealType as any],
        servings: preferences.householdSize || 2,
        maxPrepTime: 60
      };

      const result = await generateWeeklyPlan(preferences, constraints);

      if (result.success && result.data) {
        // Extract the specific meal from the generated plan
        const dailyMeal = result.data.meals.find(m => {
          // Compare dates as YYYY-MM-DD strings to avoid timezone issues
          const targetDateStr = format(targetDate, 'yyyy-MM-dd');
          // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDT...' formats from AI
          const mealDateStr = m.date.split('T')[0];
          return mealDateStr === targetDateStr;
        });

        if (dailyMeal) {
          const meal = englishMealType === 'snack'
            ? dailyMeal.snacks?.[0]
            : dailyMeal[englishMealType as keyof typeof dailyMeal];

          if (meal && meal.recipe) {
            // Map and Apply to Store
            const storeRecipe = mapAIRecipeToStoreRecipe(meal.recipe, meal.confidence);

            // Map mealType back to Spanish for the store
            const spanishMealTypeMap: Record<string, PlannerMealType> = {
              breakfast: 'desayuno',
              lunch: 'almuerzo',
              snack: 'merienda',
              dinner: 'cena'
            };

            const targetMealType = spanishMealTypeMap[englishMealType] || mealType as PlannerMealType;

            await addMealToSlot({
              dayOfWeek: dayOfWeek,
              mealType: targetMealType,
              date: format(targetDate, 'yyyy-MM-dd')
            }, storeRecipe);

            // Track usage
            await trackAction('recipe_gen');

            toast.success('Comida generada con IA', {
              description: `${meal.recipe?.title} agregada a tu ${targetMealType}`
            });

            return {
              success: true,
              data: meal
            };
          }
        }
      }

      throw new Error('No se pudo generar la comida específica');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);

      toast.error('Error al generar la comida', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        code: 'SINGLE_MEAL_ERROR'
      };
    } finally {
      setIsGenerating(false);
    }
  }, [user, userPreferences, currentDate, generateWeeklyPlan, addMealToSlot]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    lastGeneratedPlan,
    confidence,
    generateWeeklyPlan,
    optimizeDailyPlan,
    regenerateWithFeedback,
    applyGeneratedPlan,
    generateSingleMeal,
    clearError
  };
}
