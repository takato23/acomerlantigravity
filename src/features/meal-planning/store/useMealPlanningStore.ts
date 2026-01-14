/**
 * Meal Planning Store (Unified Wrapper)
 * This store now delegates all state to the central AppStore.
 * PART OF THE "NUCLEAR UNIFICATION" STRATEGY.
 */

import { useAppStore, useMealPlan, useMealPlanActions } from '@/store';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import type {
  WeekPlan,
  MealSlot,
  Recipe,
  UserPreferences,
  ModeType,
  AIGeneratedPlan,
  AIPlannerConfig,
  DayPlan,
  WeekSummary,
  ShoppingList,
  MealType
} from '../types';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

export const useMealPlanningStore = () => {
  const mealPlan = useMealPlan();
  const actions = useMealPlanActions();

  // Combine state and actions into the expected legacy interface
  return {
    // State
    currentWeekPlan: mealPlan.currentWeekPlan,
    preferences: mealPlan.preferences,
    mode: mealPlan.mode,
    weekKey: mealPlan.weekKey,
    isDirty: mealPlan.isDirty,
    isLoading: mealPlan.isLoading,
    isSaving: mealPlan.isSaving,
    error: mealPlan.error,
    currentDate: mealPlan.currentDate || new Date().toISOString(),
    staples: mealPlan.staples || [],
    activeModal: mealPlan.activeModal,
    selectedMeal: mealPlan.selectedMeal,
    lastSyncedAt: mealPlan.lastSyncedAt,

    // Core Actions
    loadWeekPlan: actions.loadWeekPlan,
    saveWeekPlan: actions.saveWeekPlan,
    setWeeklyPlan: actions.setWeeklyPlan,
    setPreferences: actions.setPreferences,
    setMode: actions.setMode,
    setWeekKey: actions.setWeekKey,
    setDirty: actions.setDirty,

    // Meal Management
    addMealToSlot: actions.addMealToSlot,
    removeMealFromSlot: actions.removeMealFromSlot,
    toggleSlotLock: actions.toggleSlotLock,
    moveMealSlot: actions.moveMealSlot,

    // Batch/AI
    generateWeekWithAI: actions.generateWeekWithAI,
    clearWeek: actions.clearWeek,
    duplicateWeek: actions.duplicateWeek,
    batchUpdateSlots: actions.batchUpdateSlots,

    // UI Actions
    setCurrentDate: actions.setCurrentDate,
    setStaples: actions.setStaples,
    setActiveModal: actions.setActiveModal,
    setSelectedMeal: actions.setSelectedMeal,

    // Utilities
    clearError: actions.clearError,
    resetMealPlanState: actions.resetMealPlanState,

    // Computed/Helper Methods (Legacy support)
    getSlotForDay: (dayOfWeek: number, mealType: string) => {
      return mealPlan.currentWeekPlan?.slots.find(
        (s: MealSlot) => s.dayOfWeek === dayOfWeek && s.mealType === mealType
      );
    },

    getWeekSummary: (): WeekSummary => {
      const plan = mealPlan.currentWeekPlan;
      if (!plan) return {
        totalMeals: 0,
        completedMeals: 0,
        uniqueRecipes: 0,
        totalServings: 0,
        completionPercentage: 0
      };

      const filledSlots = plan.slots.filter(s => s.recipeId);
      return {
        totalMeals: filledSlots.length,
        completedMeals: plan.slots.filter(s => s.isCompleted).length,
        uniqueRecipes: new Set(filledSlots.map(s => s.recipeId)).size,
        totalServings: filledSlots.reduce((sum, s) => sum + s.servings, 0),
        completionPercentage: Math.round((filledSlots.length / 28) * 100)
      };
    },

    getDayPlan: (dayOfWeek: number): DayPlan => {
      const plan = mealPlan.currentWeekPlan;
      const curDate = mealPlan.currentDate || new Date().toISOString();
      const start = startOfWeek(new Date(curDate), { weekStartsOn: 1 });
      const targetDate = addDays(start, dayOfWeek === 0 ? 6 : dayOfWeek - 1);

      const daySlots = plan?.slots.filter(s => s.dayOfWeek === dayOfWeek) || [];

      return {
        date: format(targetDate, 'yyyy-MM-dd'),
        dayOfWeek,
        meals: {
          desayuno: daySlots.find(s => s.mealType === 'desayuno'),
          almuerzo: daySlots.find(s => s.mealType === 'almuerzo'),
          merienda: daySlots.find(s => s.mealType === 'merienda'),
          cena: daySlots.find(s => s.mealType === 'cena')
        },
        isToday: isSameDay(targetDate, new Date())
      };
    },

    getShoppingList: async (): Promise<ShoppingList> => {
      const plan = mealPlan.currentWeekPlan;
      if (!plan) throw new Error('No current week plan');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/shopping/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, weekPlanId: plan.id })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to generate shopping list');
      return result.data.shoppingList;
    },

    // Export & Download helpers
    exportWeekPlanAsJSON: () => JSON.stringify(mealPlan.currentWeekPlan, null, 2),

    downloadWeekPlan: (format: 'json' | 'csv' | 'pdf') => {
      const plan = mealPlan.currentWeekPlan;
      if (!plan) return;

      logger.info(`Downloading week plan as ${format}`, 'MealPlanningStore');
      // Basic download implementation
      const blob = new Blob([JSON.stringify(plan)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plan-de-comidas-${plan.startDate}.${format === 'json' ? 'json' : 'txt'}`;
      a.click();
    }
  };
};

export default useMealPlanningStore;
