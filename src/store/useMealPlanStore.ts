/**
 * Meal Plan Store (Central Delegator)
 * This store redirects all calls to the central useAppStore.
 * PART OF THE "NUCLEAR UNIFICATION" STRATEGY.
 */

import { useAppStore, useMealPlan, useMealPlanActions } from './index';

export const useMealPlanStore = () => {
  const mealPlan = useMealPlan();
  const actions = useMealPlanActions();

  // Return a combined object that matches the legacy StoreState interface
  return {
    ...mealPlan,
    ...actions,

    // Legacy support for specific properties that might be accessed directly
    weeklyPlan: mealPlan.currentWeekPlan,
    resetState: actions.resetMealPlanState,

    // Mocking collections for legacy compatibility if needed
    pantry: [], // Legacy store had a flat pantry list, now in pantrySlice
  };
};

export default useMealPlanStore;