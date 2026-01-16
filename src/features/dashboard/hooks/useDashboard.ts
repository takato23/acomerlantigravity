import { useEffect } from 'react';

import { usePantry } from '@/store';
import { formatRelativeTime } from '@/lib/utils';

import { useDashboardStore } from '../store/dashboardStore';
import { useMealPlanningStore } from '../../meal-planning/store/useMealPlanningStore';

export function useDashboard() {
  const {
    metrics,
    isLoading,
    lastUpdated,
    error,
    loadDashboardData,
    refreshMetrics,
    setError,
    addRecentActivity,
    updateMetric
  } = useDashboardStore();

  // Subscribe to planner/pantry changes for real-time updates
  const { currentWeekPlan } = useMealPlanningStore();
  const pantry = usePantry();
  const pantryItems = pantry.items;

  // Initialize dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Update relative times for recent activity
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedActivity = metrics.recentActivity.map(activity => ({
        ...activity,
        relativeTime: formatRelativeTime(activity.timestamp)
      }));
      
      updateMetric('recentActivity', updatedActivity);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [metrics.recentActivity, updateMetric]);

  // React to meal planner changes
  useEffect(() => {
    const plannedMeals = currentWeekPlan?.slots?.filter(slot => slot.recipeId || slot.recipe) || [];
    updateMetric('mealsPlannedThisWeek', plannedMeals.length);
  }, [currentWeekPlan, updateMetric]);

  // React to pantry changes
  useEffect(() => {
    if (pantryItems.length > 0) {
      const expiringSoon = pantryItems.filter(item => {
        if (!item.expirationDate) return false;
        const expirationDate = new Date(item.expirationDate);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return expirationDate <= threeDaysFromNow;
      });

      updateMetric('pantryItemsExpiringSoon', expiringSoon.length);
      updateMetric('pantryStatus', {
        totalItems: pantryItems.length,
        expiringSoon: expiringSoon.length,
        lowStock: pantryItems.filter(item => item.currentStock < 1).length
      });
    }
  }, [pantryItems, updateMetric]);

  // Helper functions
  const addActivity = (type: 'meal_planned' | 'recipe_added' | 'shopping_completed' | 'pantry_updated', message: string) => {
    addRecentActivity({
      type,
      message,
      timestamp: new Date().toISOString()
    });
  };

  const getProgressPercentage = (current: number, goal: number): number => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  return {
    // Data
    metrics,
    isLoading,
    lastUpdated,
    error,
    
    // Actions
    refresh: refreshMetrics,
    setError,
    addActivity,
    
    // Computed values
    weeklyNutritionProgress: metrics.weeklyNutrition ? {
      calories: getProgressPercentage(metrics.weeklyNutrition.calories.current, metrics.weeklyNutrition.calories.goal),
      protein: getProgressPercentage(metrics.weeklyNutrition.protein.current, metrics.weeklyNutrition.protein.goal),
      carbs: getProgressPercentage(metrics.weeklyNutrition.carbs.current, metrics.weeklyNutrition.carbs.goal),
      fat: getProgressPercentage(metrics.weeklyNutrition.fat.current, metrics.weeklyNutrition.fat.goal)
    } : null,
    
    hasUpcomingMeals: metrics.upcomingMeals.length > 0,
    hasPantryAlerts: metrics.pantryStatus.expiringSoon > 0 || metrics.pantryStatus.lowStock > 0,
    totalPantryAlerts: metrics.pantryStatus.expiringSoon + metrics.pantryStatus.lowStock
  };
}
