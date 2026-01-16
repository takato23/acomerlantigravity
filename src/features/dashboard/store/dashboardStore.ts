import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, isAfter, isBefore, differenceInDays } from 'date-fns';

// Import other stores for real data
import { useAppStore } from '@/store';
import { usePantryStore } from '@/features/pantry/store/pantryStore';

interface DashboardMetrics {
  mealsPlannedThisWeek: number;
  mealsPlannedThisMonth: number;
  recipesTriedThisMonth: number;
  pantryItemsExpiringSoon: number;
  upcomingMeals: Array<{
    id: string;
    date: string;
    mealType: string;
    recipeName: string;
    isToday: boolean;
    isTomorrow: boolean;
    calories: number;
    isCompleted: boolean;
    servings: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'meal_planned' | 'recipe_added' | 'shopping_completed' | 'pantry_updated';
    message: string;
    timestamp: string;
    relativeTime: string;
  }>;
  weeklyNutrition: {
    calories: { current: number; goal: number };
    protein: { current: number; goal: number };
    carbs: { current: number; goal: number };
    fat: { current: number; goal: number };
  } | null;
  pantryStatus: {
    totalItems: number;
    expiringSoon: number;
    lowStock: number;
  };
}

interface DashboardState {
  // Data
  metrics: DashboardMetrics;
  isLoading: boolean;
  lastUpdated: string | null;
  error: string | null;

  // Actions
  loadDashboardData: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  setError: (error: string | null) => void;

  // Real-time updates
  addRecentActivity: (activity: Omit<DashboardMetrics['recentActivity'][0], 'id' | 'relativeTime'>) => void;
  updateMetric: (key: keyof DashboardMetrics, value: any) => void;
}

const initialMetrics: DashboardMetrics = {
  mealsPlannedThisWeek: 0,
  mealsPlannedThisMonth: 0,
  recipesTriedThisMonth: 0,
  pantryItemsExpiringSoon: 0,
  upcomingMeals: [],
  recentActivity: [],
  weeklyNutrition: null,
  pantryStatus: {
    totalItems: 0,
    expiringSoon: 0,
    lowStock: 0
  }
};

// Helper function to calculate relative time
function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'justo ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays} días`;
  return format(date, 'dd/MM');
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      metrics: initialMetrics,
      isLoading: false,
      lastUpdated: null,
      error: null,

      loadDashboardData: async () => {
        set({ isLoading: true, error: null });

        try {
          const now = new Date();
          const todayStr = format(now, 'yyyy-MM-dd');
          const tomorrowStr = format(addDays(now, 1), 'yyyy-MM-dd');
          const weekStart = startOfWeek(now, { weekStartsOn: 1 });
          const weekStartStr = format(weekStart, 'yyyy-MM-dd');

          // Get data from meal planning store
          const appState = useAppStore.getState();
          const mealPlanningState = appState.mealPlan;

          // Ensure week plan is loaded
          if (!mealPlanningState.currentWeekPlan || mealPlanningState.currentWeekPlan.startDate !== weekStartStr) {
            console.log('[Dashboard] Loading week plan for:', weekStartStr);
            await appState.loadWeekPlan(weekStartStr);
          }

          const currentWeekPlan = useAppStore.getState().mealPlan.currentWeekPlan;

          // Get data from pantry store
          const pantryState = usePantryStore.getState();
          // Ensure items are loaded if empty (basic check)
          if (pantryState.items.length === 0) {
            await pantryState.fetchItems();
          }
          const pantryItems = usePantryStore.getState().items || [];

          // Calculate meals planned this week
          const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

          let mealsPlannedThisWeek = 0;
          let mealsPlannedThisMonth = 0;
          const upcomingMeals: DashboardMetrics['upcomingMeals'] = [];
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;

          if (currentWeekPlan?.slots) {
            // Count meals with recipes this week
            currentWeekPlan.slots.forEach(slot => {
              if (slot.recipe && slot.recipeId) {
                const slotDate = new Date(slot.date + 'T00:00:00');

                // Count for this week
                if (slotDate >= weekStart && slotDate <= weekEnd) {
                  mealsPlannedThisWeek++;

                  // Add nutrition data
                  if (slot.recipe.nutrition) {
                    totalCalories += (slot.recipe.nutrition.calories || 0) * (slot.servings || 1);
                    totalProtein += (slot.recipe.nutrition.protein || 0) * (slot.servings || 1);
                    totalCarbs += (slot.recipe.nutrition.carbs || 0) * (slot.servings || 1);
                    totalFat += (slot.recipe.nutrition.fat || 0) * (slot.servings || 1);
                  }
                }

                // Add to upcoming meals (today and next 2 days)
                const isToday = slot.date === todayStr;
                const isTomorrow = slot.date === tomorrowStr;

                if (isToday || isTomorrow || slotDate <= addDays(now, 2)) {
                  upcomingMeals.push({
                    id: slot.id,
                    date: slot.date,
                    mealType: slot.mealType,
                    recipeName: slot.recipe.name || 'Receta sin nombre',
                    isToday,
                    isTomorrow,
                    calories: slot.recipe.nutrition?.calories || 0,
                    isCompleted: slot.isCompleted || false,
                    servings: slot.servings || 2
                  });
                }
              }
            });
          }

          // Sort upcoming meals by date
          upcomingMeals.sort((a, b) => a.date.localeCompare(b.date));

          // Calculate pantry metrics
          let pantryItemsExpiringSoon = 0;
          let pantryLowStock = 0;

          pantryItems.forEach(item => {
            if (item.expiration_date) {
              const expDate = new Date(item.expiration_date);
              const daysUntilExpiry = differenceInDays(expDate, now);

              // Items expiring in next 3 days
              if (daysUntilExpiry >= 0 && daysUntilExpiry <= 3) {
                pantryItemsExpiringSoon++;
              }
            }

            // Low stock check (you might want to customize this logic)
            if (item.quantity !== undefined && item.quantity <= 1) {
              pantryLowStock++;
            }
          });

          // Calculate weekly nutrition goals (assuming 2000 kcal/day goal)
          const calorieGoal = 2000 * 7;
          const proteinGoal = 50 * 7; // 50g per day
          const carbsGoal = 250 * 7; // 250g per day
          const fatGoal = 65 * 7; // 65g per day

          const realMetrics: DashboardMetrics = {
            mealsPlannedThisWeek,
            mealsPlannedThisMonth: mealsPlannedThisWeek, // For now, same as week (could expand later)
            recipesTriedThisMonth: 0, // Would need to track completed meals
            pantryItemsExpiringSoon,
            upcomingMeals: upcomingMeals.slice(0, 5), // Top 5 upcoming
            recentActivity: get().metrics.recentActivity, // Keep existing activities
            weeklyNutrition: mealsPlannedThisWeek > 0 ? {
              calories: { current: totalCalories, goal: calorieGoal },
              protein: { current: totalProtein, goal: proteinGoal },
              carbs: { current: totalCarbs, goal: carbsGoal },
              fat: { current: totalFat, goal: fatGoal }
            } : null,
            pantryStatus: {
              totalItems: pantryItems.length,
              expiringSoon: pantryItemsExpiringSoon,
              lowStock: pantryLowStock
            }
          };

          set({
            metrics: realMetrics,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });

        } catch (error: unknown) {
          console.error('[DashboardStore] Error loading data:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load dashboard data',
            isLoading: false
          });
        }
      },

      refreshMetrics: async () => {
        const state = get();
        await state.loadDashboardData();
      },

      setError: (error) => set({ error }),

      addRecentActivity: (activity) => {
        const newActivity = {
          ...activity,
          id: Date.now().toString(),
          relativeTime: 'justo ahora'
        };

        set((state) => ({
          metrics: {
            ...state.metrics,
            recentActivity: [newActivity, ...state.metrics.recentActivity].slice(0, 10)
          }
        }));
      },

      updateMetric: (key, value) => {
        set((state) => ({
          metrics: {
            ...state.metrics,
            [key]: value
          }
        }));
      }
    }),
    {
      name: 'dashboard-store'
    }
  )
);
