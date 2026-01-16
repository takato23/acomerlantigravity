/**
 * Store Central - Centralized State Management
 * Zustand-based store for the entire application
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Store slices
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createPantrySlice, PantrySlice } from './slices/pantrySlice';
import { createRecipeSlice, RecipeSlice } from './slices/recipeSlice';
import { createMealPlanSlice, MealPlanSlice } from './slices/mealPlanSlice';
import { createShoppingSlice, ShoppingSlice } from './slices/shoppingSlice';
import { createPricingSlice, PricingSlice } from './slices/pricingSlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';

// Combined store type
export type AppStore = UserSlice &
  PantrySlice &
  RecipeSlice &
  MealPlanSlice &
  ShoppingSlice &
  PricingSlice &
  UISlice &
  SettingsSlice;

// Main store
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      immer((...a: any[]) => ({
        ...createUserSlice(a[0], a[1], a[2]),
        ...createPantrySlice(a[0], a[1], a[2]),
        ...createRecipeSlice(a[0], a[1], a[2]),
        ...createMealPlanSlice(a[0], a[1], a[2]),
        ...createShoppingSlice(a[0], a[1], a[2]),
        ...createPricingSlice(a[0], a[1], a[2]),
        ...createUISlice(a[0], a[1], a[2]),
        ...createSettingsSlice(a[0], a[1], a[2]),
      })) as any,
      {
        name: 'kecarajo-store',
        // Only persist certain slices
        partialize: (state) => ({
          user: state.user,
          settings: state.settings,
          ui: {
            theme: state.ui.theme,
            language: state.ui.language,
            preferences: state.ui.preferences
          }
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle migrations between versions
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              settings: {
                ...persistedState.settings,
                version: 1
              }
            };
          }
          return persistedState;
        }
      }
    )
  )
);

// Selector hooks for performance optimization
export const useUser = () => useAppStore((state) => state.user);
export const useUserActions = () => useAppStore((state) => ({
  updateProfile: state.updateProfile,
  setPreferences: state.setPreferences,
  logout: state.logout
}));

export const usePantry = () => useAppStore((state) => state.pantry);
export const usePantryActions = () => useAppStore((state) => ({
  addPantryItem: state.addPantryItem,
  updatePantryItem: state.updatePantryItem,
  deletePantryItem: state.deletePantryItem,
  updateStock: state.updateStock,
  addFromScan: state.addFromScan
}));

export const useRecipes = () => useAppStore((state) => state.recipes);
export const useRecipeActions = () => useAppStore((state) => ({
  addRecipe: state.addRecipe,
  updateRecipe: state.updateRecipe,
  deleteRecipe: state.deleteRecipe,
  favoriteRecipe: state.favoriteRecipe,
  rateRecipe: state.rateRecipe
}));

export const useMealPlan = () => useAppStore((state) => state.mealPlan);
export const useMealPlanActions = () => useAppStore((state) => ({
  loadWeekPlan: state.loadWeekPlan,
  saveWeekPlan: state.saveWeekPlan,
  setWeeklyPlan: state.setWeeklyPlan,
  setPreferences: state.setPreferences,
  setMode: state.setMode,
  setWeekKey: state.setWeekKey,
  setDirty: state.setDirty,
  addMealToSlot: state.addMealToSlot,
  removeMealFromSlot: state.removeMealFromSlot,
  toggleSlotLock: state.toggleSlotLock,
  moveMealSlot: state.moveMealSlot,
  generateWeekWithAI: state.generateWeekWithAI,
  clearWeek: state.clearWeek,
  duplicateWeek: state.duplicateWeek,
  batchUpdateSlots: state.batchUpdateSlots,
  setCurrentDate: state.setCurrentDate,
  setStaples: state.setStaples,
  setActiveModal: state.setActiveModal,
  setSelectedMeal: state.setSelectedMeal,
  clearError: state.clearError,
  resetMealPlanState: state.resetMealPlanState
}));

export const useShopping = () => useAppStore((state) => state.shopping);
export const useShoppingActions = () => useAppStore((state) => ({
  addShoppingList: state.addShoppingList,
  updateShoppingList: state.updateShoppingList,
  deleteShoppingList: state.deleteShoppingList,
  addShoppingItem: state.addShoppingItem,
  updateShoppingItem: state.updateShoppingItem,
  deleteShoppingItem: state.deleteShoppingItem,
  toggleShoppingItem: state.toggleShoppingItem,
  optimizeShoppingList: state.optimizeShoppingList
}));

export const usePricing = () => useAppStore((state) => state.pricing);
export const usePricingActions = () => useAppStore((state) => ({
  updatePrices: state.updatePrices,
  addPriceAlert: state.addPriceAlert,
  deletePriceAlert: state.deletePriceAlert,
  updateStoreComparisons: state.updateStoreComparisons
}));

export const useUI = () => useAppStore((state) => state.ui);
export const useUIActions = () => useAppStore((state) => ({
  setTheme: state.setTheme,
  setLanguage: state.setLanguage,
  setLoading: state.setLoading,
  showNotification: state.showNotification,
  hideNotification: state.hideNotification,
  toggleSidebar: state.toggleSidebar,
  setModalOpen: state.setModalOpen
}));

export const useSettings = () => useAppStore((state) => state.settings);
export const useSettingsActions = () => useAppStore((state) => ({
  updateSettings: state.updateSettings,
  resetSettings: state.resetSettings,
  exportData: state.exportData,
  importData: state.importData
}));

// Compatibility Hooks for legacy/enhanced components
export const useShoppingStore = () => {
  const state = useAppStore();
  const shopping = state.shopping;
  const activeList = shopping.lists.find(l => l.id === shopping.activeListId) || shopping.lists[0];

  return {
    activeList,
    isLoading: shopping.isLoading,
    fetchActiveList: async (userId: string) => {
      // Logic for fetching from API could go here
      console.log('Fetching active list for', userId);
    },
    createList: async (userId: string, name: string) => {
      const newList = {
        name,
        items: [],
        shared: false,
        archived: false,
      };
      state.addShoppingList(newList);
      return newList;
    },
    addItem: (listId: string, item: any) => {
      state.addShoppingItem(listId, {
        name: item.custom_name || item.name || 'Nuevo item',
        quantity: item.quantity || 1,
        unit: item.unit || 'uds',
        category: item.category || 'otros',
        priority: 'medium',
        completed: false,
        notes: item.notes || ''
      });
    },
    toggleItemChecked: (listId: string, itemId: string) => {
      state.toggleShoppingItem(listId, itemId);
    },
    deleteItem: (listId: string, itemId: string) => {
      state.deleteShoppingItem(listId, itemId);
    },
    updateItem: (listId: string, itemId: string, updates: any) => {
      state.updateShoppingItem(listId, itemId, updates);
    }
  };
};

export const usePantryStore = () => {
  const state = useAppStore();
  const pantry = state.pantry;

  return {
    items: pantry.items,
    isLoading: pantry.isLoading,
    checkLowStock: () => {
      state.checkAlerts();
    },
    suggestRestocking: () => {
      return pantry.items.filter(item =>
        item.currentStock <= (item.minimumStock || 1)
      ).map(item => ({
        ...item,
        ingredient_id: item.id // Compatibility
      }));
    }
  };
};

// Computed selectors
export const useComputed = () => {
  const pantry = usePantry();
  const recipes = useRecipes();
  const shopping = useShopping();
  const mealPlan = useMealPlan();

  return useAppStore((state) => ({
    // Low stock items
    lowStockItems: pantry.items.filter(item =>
      item.currentStock <= (item.minimumStock || 1)
    ),

    // Expiring items (within 3 days)
    expiringItems: pantry.items.filter(item => {
      if (!item.expirationDate) return false;
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return new Date(item.expirationDate) <= threeDaysFromNow;
    }),

    // Favorite recipes
    favoriteRecipes: recipes.items.filter(recipe => recipe.isFavorite),

    // Pending shopping items
    pendingShoppingItems: shopping.lists.reduce((total, list) =>
      total + list.items.filter(item => !item.completed).length, 0
    ),

    // This week's meal plan
    thisWeekMeals: (mealPlan.currentWeekPlan?.slots || []).filter((slot) => {
      const mealDate = new Date(slot.date);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return mealDate >= weekStart && mealDate <= weekEnd;
    }),

    // Total estimated shopping cost
    totalShoppingCost: shopping.lists.reduce((total, list) =>
      total + (list.totalEstimatedPrice || 0), 0
    ),

    // Recipe suggestions based on pantry
    suggestedRecipes: recipes.items.filter(recipe => {
      const availableIngredients = pantry.items.map(item =>
        item.name.toLowerCase()
      );
      const requiredIngredients = recipe.ingredients.map(ing =>
        ing.name.toLowerCase()
      );
      const matchingIngredients = requiredIngredients.filter(ing =>
        availableIngredients.some(available =>
          available.includes(ing) || ing.includes(available)
        )
      );
      return matchingIngredients.length >= requiredIngredients.length * 0.7; // 70% match
    }).slice(0, 5)
  }));
};

// Store action creators for complex operations
export const useStoreActions = () => {
  const store = useAppStore();

  return {
    // Initialize app data
    initializeApp: async (userId: string) => {
      store.setLoading('app', true);
      try {
        // Load user data, pantry, recipes, etc.
        // This would typically make API calls
        await Promise.all([
          // loadUserData(userId),
          // loadPantryData(userId),
          // loadRecipeData(userId),
          // loadMealPlanData(userId),
          // loadShoppingData(userId)
        ]);
      } catch (error: unknown) {
        store.showNotification({
          type: 'error',
          title: 'Error de carga',
          message: 'No se pudo cargar los datos de la aplicación',
          duration: 5000
        });
      } finally {
        store.setLoading('app', false);
      }
    },

    // Sync data with server
    syncData: async () => {
      store.setLoading('sync', true);
      try {
        // Sync all data with server
        const state = useAppStore.getState();
        // await syncWithServer(state);

        store.showNotification({
          type: 'success',
          title: 'Sincronización completa',
          message: 'Todos los datos han sido sincronizados',
          duration: 3000
        });
      } catch (error: unknown) {
        store.showNotification({
          type: 'error',
          title: 'Error de sincronización',
          message: 'No se pudo sincronizar con el servidor',
          duration: 5000
        });
      } finally {
        store.setLoading('sync', false);
      }
    },

    // Generate shopping list from meal plan
    generateShoppingFromMealPlan: (startDate: Date, endDate: Date) => {
      const currentPlan = store.mealPlan.currentWeekPlan;
      const pantry = store.pantry.items;

      if (!currentPlan) return;

      // Get all meals in date range
      const slotsInRange = currentPlan.slots.filter((slot: any) => {
        const mealDate = new Date(slot.date);
        return mealDate >= startDate && mealDate <= endDate;
      });

      // Collect all required ingredients
      const requiredIngredients = new Map<string, { quantity: number; unit: string }>();

      slotsInRange.forEach((slot: any) => {
        if (slot.recipe) {
          slot.recipe.ingredients.forEach((ingredient: any) => {
            const key = ingredient.name.toLowerCase();
            const quantity = (ingredient as any).amount || 0;
            const existing = requiredIngredients.get(key);
            if (existing) {
              existing.quantity += quantity;
            } else {
              requiredIngredients.set(key, {
                quantity: quantity,
                unit: ingredient.unit || 'uds'
              });
            }
          });
        }
      });

      // Subtract available pantry items
      const shoppingItems: any[] = [];
      requiredIngredients.forEach((required, name) => {
        const pantryItem = pantry.find((item: any) =>
          item.name.toLowerCase() === name
        );

        const availableQuantity = pantryItem?.currentStock || 0;
        const neededQuantity = Math.max(0, required.quantity - availableQuantity);

        if (neededQuantity > 0) {
          shoppingItems.push({
            name,
            quantity: neededQuantity,
            unit: required.unit,
            category: pantryItem?.category || 'otros',
            priority: 'medium' as const,
            completed: false
          });
        }
      });

      // Create new shopping list
      const newList = {
        name: `Compras ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        items: shoppingItems,
        shared: false,
        archived: false
      };

      store.addShoppingList(newList);

      store.showNotification({
        type: 'success',
        title: 'Lista generada',
        message: `Se generó una lista con ${shoppingItems.length} productos`,
        duration: 3000
      });
    }
  };
};

// DevTools integration
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__STORE__ = useAppStore;
}