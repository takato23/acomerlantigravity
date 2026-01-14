'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/SupabaseAuthProvider';
import { toast } from 'sonner';
import type { WeekPlan, NutritionInfo } from '@/features/meal-planning/types';

export interface MealPlanHistoryEntry {
    id: string;
    user_id: string;
    plan_data: WeekPlan;
    week_start: string;
    week_end: string;
    total_calories: number | null;
    total_protein: number | null;
    total_carbs: number | null;
    total_fat: number | null;
    total_cost: number | null;
    total_meals: number | null;
    rating: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface UseMealPlanHistoryReturn {
    history: MealPlanHistoryEntry[];
    isLoading: boolean;
    error: string | null;
    saveToHistory: (weekPlan: WeekPlan) => Promise<string | null>;
    loadHistory: (limit?: number) => Promise<void>;
    ratePlan: (historyId: string, rating: number) => Promise<void>;
    addNotes: (historyId: string, notes: string) => Promise<void>;
    deletePlan: (historyId: string) => Promise<void>;
    duplicatePlan: (historyId: string) => Promise<WeekPlan | null>;
}

/**
 * Calculate total nutrition from a week plan
 */
function calculateTotalNutrition(weekPlan: WeekPlan): NutritionInfo & { mealCount: number } {
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        mealCount: 0
    };

    if (!weekPlan.slots) return totals;

    for (const slot of weekPlan.slots) {
        if (slot.recipe?.nutrition) {
            totals.calories += slot.recipe.nutrition.calories || 0;
            totals.protein += slot.recipe.nutrition.protein || 0;
            totals.carbs += slot.recipe.nutrition.carbs || 0;
            totals.fat += slot.recipe.nutrition.fat || 0;
            totals.mealCount++;
        }
    }

    return totals;
}

export function useMealPlanHistory(): UseMealPlanHistoryReturn {
    const { user } = useAuth();
    const [history, setHistory] = useState<MealPlanHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load plan history from database
     * Includes 5s timeout to prevent page hanging (BUG #1 & #5 fix)
     */
    const loadHistory = useCallback(async (limit: number = 20) => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        // Create AbortController with 5 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[Historial] Query timeout after 5s, aborting...');
            controller.abort();
        }, 5000);

        try {
            const { data, error: fetchError } = await supabase
                .from('meal_plan_history')
                .select('id, user_id, week_start, week_end, total_calories, total_protein, total_carbs, total_fat, total_meals, rating, notes, created_at')
                .eq('user_id', user.id)
                .order('week_start', { ascending: false })
                .limit(limit)
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (fetchError) throw fetchError;

            setHistory(data || []);
        } catch (err) {
            clearTimeout(timeoutId);

            // Check if it's an abort/timeout error
            const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));

            if (isTimeout) {
                console.log('[Historial] Query timed out, showing empty state');
                setHistory([]); // Graceful fallback - don't set error for timeouts
            } else {
                const message = err instanceof Error ? err.message : 'Error loading history';
                setError(message);
                console.error('[Historial] Error loading meal plan history:', err);
            }
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    /**
     * Save current week plan to history
     */
    const saveToHistory = useCallback(async (weekPlan: WeekPlan): Promise<string | null> => {
        if (!user) {
            toast.error('Debes iniciar sesión para guardar el historial');
            return null;
        }

        if (!weekPlan.slots || weekPlan.slots.length === 0) {
            return null; // Don't save empty plans
        }

        try {
            const nutrition = calculateTotalNutrition(weekPlan);

            const { data, error: insertError } = await supabase
                .from('meal_plan_history')
                .insert({
                    user_id: user.id,
                    plan_data: weekPlan,
                    week_start: weekPlan.startDate,
                    week_end: weekPlan.endDate,
                    total_calories: nutrition.calories,
                    total_protein: nutrition.protein,
                    total_carbs: nutrition.carbs,
                    total_fat: nutrition.fat,
                    total_meals: nutrition.mealCount
                })
                .select('id')
                .single();

            if (insertError) throw insertError;

            return data?.id || null;
        } catch (err) {
            console.error('Error saving to history:', err);
            return null;
        }
    }, [user]);

    /**
     * Rate a historical plan
     */
    const ratePlan = useCallback(async (historyId: string, rating: number) => {
        if (!user) return;

        try {
            const { error: updateError } = await supabase
                .from('meal_plan_history')
                .update({ rating })
                .eq('id', historyId)
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // Update local state
            setHistory(prev =>
                prev.map(h => h.id === historyId ? { ...h, rating } : h)
            );

            toast.success('Calificación guardada');
        } catch (err) {
            console.error('Error rating plan:', err);
            toast.error('Error al guardar la calificación');
        }
    }, [user]);

    /**
     * Add notes to a historical plan
     */
    const addNotes = useCallback(async (historyId: string, notes: string) => {
        if (!user) return;

        try {
            const { error: updateError } = await supabase
                .from('meal_plan_history')
                .update({ notes })
                .eq('id', historyId)
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // Update local state
            setHistory(prev =>
                prev.map(h => h.id === historyId ? { ...h, notes } : h)
            );

            toast.success('Notas guardadas');
        } catch (err) {
            console.error('Error adding notes:', err);
            toast.error('Error al guardar las notas');
        }
    }, [user]);

    /**
     * Delete a historical plan
     */
    const deletePlan = useCallback(async (historyId: string) => {
        if (!user) return;

        try {
            const { error: deleteError } = await supabase
                .from('meal_plan_history')
                .delete()
                .eq('id', historyId)
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;

            // Update local state
            setHistory(prev => prev.filter(h => h.id !== historyId));

            toast.success('Plan eliminado del historial');
        } catch (err) {
            console.error('Error deleting plan:', err);
            toast.error('Error al eliminar el plan');
        }
    }, [user]);

    /**
     * Duplicate a historical plan (returns the plan data to be loaded into current planner)
     */
    const duplicatePlan = useCallback(async (historyId: string): Promise<WeekPlan | null> => {
        try {
            const { data, error } = await supabase
                .from('meal_plan_history')
                .select('plan_data')
                .eq('id', historyId)
                .single();

            if (error) throw error;
            if (!data) throw new Error('Plan no encontrado');

            toast.success('Plan cargado. Ajusta las fechas según necesites.');
            return data.plan_data;
        } catch (err) {
            console.error('Error fetching full plan:', err);
            toast.error('Error al cargar el plan completo');
            return null;
        }
    }, []);

    // Load history on mount
    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user, loadHistory]);

    return {
        history,
        isLoading,
        error,
        saveToHistory,
        loadHistory,
        ratePlan,
        addNotes,
        deletePlan,
        duplicatePlan
    };
}
