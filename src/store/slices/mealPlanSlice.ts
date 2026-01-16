/**
 * Argentine Meal Plan Slice - Unified Zustand store for meal planning
 * Standardized on System C hybrid types for consistency across the app.
 */

import { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase/client';
import { logger } from '../../lib/logger';
import { MealPlanService } from '../../lib/supabase/meal-plans';
import { debounce } from 'lodash';
import { format, startOfWeek, addDays } from 'date-fns';

// Import standardized System C types
import type {
  WeekPlan,
  UserPreferences,
  ModeType,
  MealSlot,
  Recipe,
  MealType,
  AIGeneratedPlan,
  AIPlannerConfig
} from '../../features/meal-planning/types';

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_ENTRIES = 5; // Limit entries to prevent bloating

// Debounced save to prevent excessive database calls
const debouncedSave = debounce(async (weekPlan: WeekPlan) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await MealPlanService.saveWeekPlan(
      user.id,
      weekPlan.startDate,
      weekPlan.endDate,
      weekPlan
    );
  } catch (error) {
    logger.error('Error in debounced save:', 'mealPlanSlice', error);
  }
}, 2000);

// ============================================================================
// STORE STATE & ACTIONS
// ============================================================================

export interface MealPlanState {
  mealPlan: {
    // Core state
    currentWeekPlan: WeekPlan | null;
    preferences: UserPreferences;
    mode: ModeType;
    weekKey: string; // userId:weekStart for uniqueness
    isDirty: boolean; // has unsaved changes

    // UI state
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    currentDate: string;
    staples: Recipe[];
    activeModal: 'add-recipe' | 'edit-slot' | 'recipe-select' | 'preferences' | 'shopping-list' | 'recipe-detail' | 'ai-planner' | null;
    selectedMeal: MealSlot | null;

    // Sync & Cache state
    lastSyncedAt: string | null;
    cacheTimestamps: Record<string, number>; // weekKey -> timestamp
    syncInProgress: boolean;
    offlineChanges: Array<{
      type: string;
      payload: any;
      timestamp: string;
    }>;
  }
}

export interface MealPlanActions {
  // Core actions
  loadWeekPlan: (startDate: string) => Promise<void>;
  saveWeekPlan: (weekPlan: WeekPlan) => Promise<void>;
  setWeeklyPlan: (plan: WeekPlan | null) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setMode: (mode: ModeType) => void;
  setWeekKey: (key: string) => void;
  setDirty: (dirty: boolean) => void;

  // Meal management
  addMealToSlot: (slot: Partial<MealSlot>, recipe: Recipe) => void;
  removeMealFromSlot: (slotId: string) => void;
  toggleSlotLock: (slotId: string) => void;
  moveMealSlot: (fromSlotId: string, toDayOfWeek: number, toMealType: MealType) => void;

  // Batch/AI operations
  generateWeekWithAI: (config: AIPlannerConfig) => Promise<AIGeneratedPlan>;
  clearWeek: () => void;
  duplicateWeek: (targetStartDate: string) => Promise<void>;
  batchUpdateSlots: (updates: Array<{ slotId: string; changes: Partial<MealSlot> }>) => void;

  // UI Actions
  setCurrentDate: (date: string) => void;
  setStaples: (staples: Recipe[]) => void;
  setActiveModal: (modal: 'add-recipe' | 'edit-slot' | 'recipe-select' | 'preferences' | 'shopping-list' | 'recipe-detail' | 'ai-planner' | null) => void;
  setSelectedMeal: (meal: MealSlot | null) => void;

  // Utilities
  clearError: () => void;
  resetMealPlanState: () => void;
}

export type MealPlanSlice = MealPlanState & MealPlanActions;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  dietaryPreferences: ['omnivore'],
  dietProfile: 'balanced',
  cuisinePreferences: ['argentina', 'mediterránea'],
  excludedIngredients: [],
  preferredIngredients: [],
  allergies: [],
  cookingSkill: 'intermediate',
  maxCookingTime: 60,
  mealsPerDay: 4,
  servingsPerMeal: 2,
  budget: 'medium',
  preferVariety: true,
  useSeasonalIngredients: true,
  considerPantryItems: true
};

// ============================================================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================================================

export const createMealPlanSlice: StateCreator<
  MealPlanSlice,
  [['zustand/subscribeWithSelector', never], ['zustand/persist', unknown], ['zustand/immer', never]],
  [],
  MealPlanSlice
> = (set, get) => ({
  // Initial state nested under mealPlan
  mealPlan: {
    currentWeekPlan: null,
    preferences: DEFAULT_PREFERENCES,
    mode: 'normal',
    weekKey: '',
    isDirty: false,
    isLoading: false,
    isSaving: false,
    error: null,
    currentDate: new Date().toISOString(),
    staples: [],
    activeModal: null,
    selectedMeal: null,
    lastSyncedAt: null,
    cacheTimestamps: {},
    syncInProgress: false,
    offlineChanges: [],
  },

  // Core actions
  loadWeekPlan: async (startDate: string) => {
    set((state: any) => { state.mealPlan.isLoading = true; state.mealPlan.error = null; });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const endDate = format(addDays(new Date(startDate + 'T00:00:00'), 6), 'yyyy-MM-dd');

      // Check for cached plan and TTL
      const currentTimestamp = Date.now();
      const cachedTimestamp = get().mealPlan.cacheTimestamps[startDate];

      if (cachedTimestamp && (currentTimestamp - cachedTimestamp < CACHE_TTL)) {
        // Use currentWeekPlan if it matches the date and is not expired
        const current = get().mealPlan.currentWeekPlan;
        if (current && current.startDate === startDate) {
          set((state: any) => { state.mealPlan.isLoading = false; });
          return;
        }
      }

      const { data, error } = await MealPlanService.getWeekPlan(user.id, startDate, endDate);

      if (error) throw error;

      set((state: any) => {
        state.mealPlan.currentWeekPlan = data;
        state.mealPlan.cacheTimestamps[startDate] = Date.now();
        state.mealPlan.isLoading = false;

        // Evict old cache entries if exceeding limit
        const entries = Object.entries(state.mealPlan.cacheTimestamps);
        if (entries.length > MAX_CACHE_ENTRIES) {
          const oldestKey = entries.sort((a: any, b: any) => a[1] - b[1])[0][0];
          delete state.mealPlan.cacheTimestamps[oldestKey];
          // Note: Since we only persist one plan (current), this mainly cleans up the timestamps Record
        }
      });
    } catch (error) {
      logger.error('Failed to load week plan', 'mealPlanSlice', error);
      set((state: any) => {
        state.mealPlan.error = error instanceof Error ? error.message : 'Unknown error';
        state.mealPlan.isLoading = false;
      });
    }
  },

  saveWeekPlan: async (weekPlan: WeekPlan) => {
    set((state: any) => { state.mealPlan.isSaving = true; });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await MealPlanService.saveWeekPlan(user.id, weekPlan.startDate, weekPlan.endDate, weekPlan);
      if (error) throw error;

      set((state: any) => {
        state.mealPlan.isSaving = false;
        state.mealPlan.isDirty = false;
        state.mealPlan.lastSyncedAt = new Date().toISOString();
      });
    } catch (error) {
      logger.error('Failed to save week plan', 'mealPlanSlice', error);
      set((state: any) => {
        state.mealPlan.error = error instanceof Error ? error.message : 'Unknown error';
        state.mealPlan.isSaving = false;
      });
    }
  },

  setWeeklyPlan: (plan) => set((state: any) => {
    state.mealPlan.currentWeekPlan = plan;
    if (plan) {
      state.mealPlan.isDirty = true;
      state.mealPlan.error = null;
    }
  }),

  setPreferences: (preferences) => set((state: any) => {
    state.mealPlan.preferences = { ...state.mealPlan.preferences, ...preferences };
    state.mealPlan.isDirty = true;
  }),

  setMode: (mode) => set((state: any) => {
    state.mealPlan.mode = mode;
    state.mealPlan.isDirty = true;
  }),

  setWeekKey: (key) => set((state: any) => {
    state.mealPlan.weekKey = key;
  }),

  setDirty: (dirty) => set((state: any) => {
    state.mealPlan.isDirty = dirty;
  }),

  // Meal management
  addMealToSlot: (slotData, recipe) => set((state: any) => {
    if (!state.mealPlan.currentWeekPlan) return;

    const slotIndex = state.mealPlan.currentWeekPlan.slots.findIndex(
      (s: any) => (slotData.id && s.id === slotData.id) ||
        (s.date === slotData.date && s.mealType === slotData.mealType)
    );

    if (slotIndex !== -1) {
      const updatedSlot = {
        ...state.mealPlan.currentWeekPlan.slots[slotIndex],
        recipeId: recipe.id,
        recipe: recipe,
        updatedAt: new Date().toISOString()
      };
      state.mealPlan.currentWeekPlan.slots[slotIndex] = updatedSlot;
      state.mealPlan.isDirty = true;

      // Use debounced save if not loading
      if (!state.mealPlan.isLoading) {
        debouncedSave(state.mealPlan.currentWeekPlan);
      }
    }
  }),

  removeMealFromSlot: (slotId) => set((state: any) => {
    if (!state.mealPlan.currentWeekPlan) return;

    const slotIndex = state.mealPlan.currentWeekPlan.slots.findIndex((s: any) => s.id === slotId);
    if (slotIndex !== -1) {
      state.mealPlan.currentWeekPlan.slots[slotIndex].recipeId = undefined;
      state.mealPlan.currentWeekPlan.slots[slotIndex].recipe = undefined;
      state.mealPlan.currentWeekPlan.slots[slotIndex].updatedAt = new Date().toISOString();
      state.mealPlan.isDirty = true;

      debouncedSave(state.mealPlan.currentWeekPlan);
    }
  }),

  moveMealSlot: (fromSlotId, toDayOfWeek, toMealType) => set((state: any) => {
    if (!state.mealPlan.currentWeekPlan) return;

    const sourceIndex = state.mealPlan.currentWeekPlan.slots.findIndex((s: any) => s.id === fromSlotId);
    const targetIndex = state.mealPlan.currentWeekPlan.slots.findIndex(
      (s: any) => s.dayOfWeek === toDayOfWeek && s.mealType === toMealType
    );

    if (sourceIndex === -1 || targetIndex === -1) return;

    const sourceSlot = state.mealPlan.currentWeekPlan.slots[sourceIndex];
    const targetSlot = state.mealPlan.currentWeekPlan.slots[targetIndex];

    // Swap recipe data
    const tempRecipeId = targetSlot.recipeId;
    const tempRecipe = targetSlot.recipe;
    const tempCustom = targetSlot.customMealName;

    state.mealPlan.currentWeekPlan.slots[targetIndex] = {
      ...targetSlot,
      recipeId: sourceSlot.recipeId,
      recipe: sourceSlot.recipe,
      customMealName: sourceSlot.customMealName,
      updatedAt: new Date().toISOString()
    };

    state.mealPlan.currentWeekPlan.slots[sourceIndex] = {
      ...sourceSlot,
      recipeId: tempRecipeId,
      recipe: tempRecipe,
      customMealName: tempCustom,
      updatedAt: new Date().toISOString()
    };

    state.mealPlan.isDirty = true;
    debouncedSave(state.mealPlan.currentWeekPlan);
  }),

  toggleSlotLock: (slotId) => set((state: any) => {
    if (!state.mealPlan.currentWeekPlan) return;

    const slotIndex = state.mealPlan.currentWeekPlan.slots.findIndex((s: any) => s.id === slotId);
    if (slotIndex !== -1) {
      state.mealPlan.currentWeekPlan.slots[slotIndex].isLocked = !state.mealPlan.currentWeekPlan.slots[slotIndex].isLocked;
      state.mealPlan.currentWeekPlan.slots[slotIndex].updatedAt = new Date().toISOString();
      state.mealPlan.isDirty = true;

      debouncedSave(state.mealPlan.currentWeekPlan);
    }
  }),

  // AI Planning
  generateWeekWithAI: async (config: AIPlannerConfig): Promise<AIGeneratedPlan> => {
    set((state: any) => { state.mealPlan.isLoading = true; });
    try {
      // Logic for AI generation usually goes through service
      // Mocking for now to match legacy behavior
      await new Promise(resolve => setTimeout(resolve, 1500));

      const current = get().mealPlan.currentWeekPlan;
      if (!current) throw new Error('No current week plan to generate for');

      // Basic random generation mock
      const state = get() as any; // Cast for accessing other slices in a typed way if possible
      const recipeList = Object.values(state.recipes?.items || []) as Recipe[];
      const updatedSlots = current.slots.map(slot => {
        if (slot.isLocked || !recipeList.length) return slot;
        const randomRecipe = recipeList[Math.floor(Math.random() * recipeList.length)];
        return {
          ...slot,
          recipeId: randomRecipe.id,
          recipe: randomRecipe,
          updatedAt: new Date().toISOString()
        };
      });

      const aiGeneratedPlan: AIGeneratedPlan = {
        id: `ai-plan-${Date.now()}`,
        config,
        weekPlan: { ...current, slots: updatedSlots },
        shoppingList: {
          id: `shopping-${Date.now()}`,
          userId: config.userId,
          weekPlanId: current.id,
          items: [],
          categories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        nutritionSummary: {
          daily: { calories: 2000, protein: 100, carbs: 250, fat: 70 },
          weekly: { calories: 14000, protein: 700, carbs: 1750, fat: 490 }
        },
        generatedAt: new Date().toISOString(),
        suggestions: ['Aumenta el consumo de legumbres', 'Prueba nuevas especias locales']
      };

      set((state: any) => {
        state.mealPlan.currentWeekPlan = aiGeneratedPlan.weekPlan;
        state.mealPlan.isLoading = false;
        state.mealPlan.isDirty = true;
      });

      debouncedSave(aiGeneratedPlan.weekPlan);
      return aiGeneratedPlan;
    } catch (error) {
      set((state: any) => {
        state.mealPlan.error = error instanceof Error ? error.message : 'AI Generation failed';
        state.mealPlan.isLoading = false;
      });
      throw error;
    }
  },

  clearWeek: () => set((state: any) => {
    if (!state.mealPlan.currentWeekPlan) return;

    state.mealPlan.currentWeekPlan.slots = state.mealPlan.currentWeekPlan.slots.map((slot: any) => ({
      ...slot,
      recipeId: undefined,
      recipe: undefined,
      customMealName: undefined,
      updatedAt: new Date().toISOString()
    }));

    state.mealPlan.isDirty = true;
    debouncedSave(state.mealPlan.currentWeekPlan);
  }),

  duplicateWeek: async (targetStartDate: string) => {
    const current = get().mealPlan.currentWeekPlan;
    if (!current) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set((state: any) => { state.mealPlan.isSaving = true; });

    const targetEndDate = format(addDays(new Date(targetStartDate + 'T00:00:00'), 6), 'yyyy-MM-dd');
    const { data: targetPlan, error } = await MealPlanService.duplicateMealPlan(
      current.id,
      user.id,
      targetStartDate,
      targetEndDate
    );

    if (error) {
      set((state: any) => { state.mealPlan.error = error.message; state.mealPlan.isSaving = false; });
      return;
    }

    // After duplicating on server, we might want to load it or just notify
    set((state: any) => { state.mealPlan.isSaving = false; });
  },

  batchUpdateSlots: (updates) => set((state: any) => {
    if (!state.mealPlan.currentWeekPlan) return;

    updates.forEach(({ slotId, changes }) => {
      const index = state.mealPlan.currentWeekPlan!.slots.findIndex((s: any) => s.id === slotId);
      if (index !== -1) {
        state.mealPlan.currentWeekPlan!.slots[index] = {
          ...state.mealPlan.currentWeekPlan!.slots[index],
          ...changes,
          updatedAt: new Date().toISOString()
        };
      }
    });

    state.mealPlan.isDirty = true;
    debouncedSave(state.mealPlan.currentWeekPlan);
  }),

  // Utilities
  clearError: () => set((state: any) => {
    state.mealPlan.error = null;
  }),

  setCurrentDate: (date: string) => set((state: any) => {
    state.mealPlan.currentDate = date;
  }),

  setStaples: (staples: Recipe[]) => set((state: any) => {
    state.mealPlan.staples = staples;
  }),

  setActiveModal: (
    modal:
      | 'add-recipe'
      | 'edit-slot'
      | 'recipe-select'
      | 'preferences'
      | 'shopping-list'
      | 'recipe-detail'
      | 'ai-planner'
      | null
  ) => set((state: any) => {
    state.mealPlan.activeModal = modal;
  }),

  setSelectedMeal: (meal: MealSlot | null) => set((state: any) => {
    state.mealPlan.selectedMeal = meal;
  }),

  resetMealPlanState: () => set((state: any) => {
    state.mealPlan = {
      currentWeekPlan: null,
      preferences: DEFAULT_PREFERENCES,
      mode: 'normal',
      weekKey: '',
      isDirty: false,
      isLoading: false,
      isSaving: false,
      error: null,
      currentDate: new Date().toISOString(),
      staples: [],
      activeModal: null,
      selectedMeal: null,
      lastSyncedAt: null,
      cacheTimestamps: {},
      syncInProgress: false,
      offlineChanges: [],
    };
  })
});

// ============================================================================
// PERSISTENCE CONFIG
// ============================================================================

export const mealPlanPersistConfig = {
  name: 'kecarajocomer-meal-plan',
  version: 2,
  partialize: (state: MealPlanSlice) => ({
    mealPlan: {
      preferences: state.mealPlan.preferences,
      mode: state.mealPlan.mode,
      lastSyncedAt: state.mealPlan.lastSyncedAt,
      cacheTimestamps: state.mealPlan.cacheTimestamps,
    }
  }),
  onRehydrateStorage: () => (state?: MealPlanSlice) => {
    if (state) {
      logger.info('Meal plan state rehydrated from localStorage', 'MealPlanSlice');
    }
  },
};

export type { MealPlanSlice as default };
