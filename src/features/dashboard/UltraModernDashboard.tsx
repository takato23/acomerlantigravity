'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Settings2, RotateCcw } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';

// Widgets
// Widgets (Dynamic imports)
import dynamic from 'next/dynamic';

const StatsWidget = dynamic(() => import('./components/widgets/StatsWidget').then(mod => mod.StatsWidget));
const ActionGridWidget = dynamic(() => import('./components/widgets/ActionGridWidget').then(mod => mod.ActionGridWidget));
const TodayPlanWidget = dynamic(() => import('./components/widgets/TodayPlanWidget').then(mod => mod.TodayPlanWidget));
const TrendingRecipesWidget = dynamic(() => import('./components/widgets/TrendingRecipesWidget').then(mod => mod.TrendingRecipesWidget));
const PantryStatusWidget = dynamic(() => import('./components/widgets/PantryStatusWidget').then(mod => mod.PantryStatusWidget));
const ShoppingListWidget = dynamic(() => import('./components/widgets/ShoppingListWidget').then(mod => mod.ShoppingListWidget));
const SortableWidget = dynamic(() => import('./components/widgets/SortableWidget').then(mod => mod.SortableWidget));

// Store
import { useDashboardStore } from './store/dashboardStore';
import { usePantryStore } from '../pantry/store/pantryStore';
import { useRecipeStore } from '../recipes/store/recipeStore';
import { useMealPlanningStore } from '../meal-planning/store/useMealPlanningStore';
import { useRecipeAvailability } from '../recipes/hooks/useRecipeAvailability';

// DnD
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';


const UltraModernDashboard: React.FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [currentDate] = useState(new Date());

  // Customization Mode
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Widget Order State
  const [items, setItems] = useState([
    'stats',
    'actions',
    'plan',
    'trending',
    'pantry',
    'shopping'
  ]);

  const { metrics, loadDashboardData, isLoading } = useDashboardStore();
  const { items: pantryItems } = usePantryStore();
  const { recipes } = useRecipeStore();
  const { currentWeekPlan } = useMealPlanningStore();

  // Use recipe availability to get suggested recipes (can cook now)
  const { canCookNow, sortedByAvailability } = useRecipeAvailability(recipes);

  // Transform recipes to trending widget format
  const trendingRecipes = useMemo(() => {
    const recipesToShow = canCookNow.length > 0
      ? canCookNow.slice(0, 4) // Prioritize recipes you can cook
      : sortedByAvailability.slice(0, 4); // Fallback to sorted by availability

    return recipesToShow.map(r => ({
      id: r.recipe.id,
      name: r.recipe.name || 'Receta',
      image: r.recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      time: `${(r.recipe.prep_time || 0) + (r.recipe.cook_time || 0)} min`,
      rating: r.recipe.avg_rating || 4.5
    }));
  }, [canCookNow, sortedByAvailability]);

  // Extract shopping items from current week plan
  const shoppingItems = useMemo(() => {
    if (!currentWeekPlan?.slots) return [];

    const ingredientSet = new Set<string>();
    currentWeekPlan.slots.forEach(slot => {
      if (slot.recipe?.ingredients) {
        slot.recipe.ingredients.forEach((ing: any) => {
          if (typeof ing === 'string') {
            ingredientSet.add(ing);
          } else if (ing.name) {
            ingredientSet.add(ing.name);
          }
        });
      }
    });

    return Array.from(ingredientSet).slice(0, 10); // Top 10 ingredients
  }, [currentWeekPlan]);

  // Load data on mount
  useEffect(() => {
    const init = async () => {
      await loadDashboardData();
      import('sonner').then(({ toast }) => {
        toast.success("Dashboard sincronizado con tu plan de comidas");
      });
    };
    init();
  }, []);

  // Map upcoming meals to widget format
  const mappedMeals = metrics.upcomingMeals
    .filter(m => m.isToday)
    .map(m => ({
      id: m.id,
      meal: m.mealType, // Already capitalized/translated? Need to check
      time: m.mealType === 'desayuno' ? '8:00' :
        m.mealType === 'almuerzo' ? '13:00' :
          m.mealType === 'merienda' ? '17:00' : '21:00', // Basic time mapping
      name: m.recipeName,
      cals: m.calories,
      done: m.isCompleted,
      current: false // Logic to determine current meal could be added
    }));

  // Interactive Meal State - NOW DRIVEN BY STORE (mock for toggle for now to avoid errors)
  const toggleMeal = (id: string | number) => {
    console.log("Toggle meal", id);
    // TODO: Implement toggle in store
  };

  // Interactive Shopping List State - connected to meal plan
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  // Sync shopping list with meal plan ingredients
  useEffect(() => {
    if (shoppingItems.length > 0) {
      setShoppingList(shoppingItems);
    }
  }, [shoppingItems]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

    // Load saved order from localStorage
    const savedOrder = localStorage.getItem('dashboard-order');
    if (savedOrder) {
      try {
        setItems(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Failed to parse saved order", e);
      }
    }
  }, []);



  const addShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      setShoppingList([...shoppingList, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeShoppingItem = (index: number) => {
    setShoppingList(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('dashboard-order', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const resetLayout = () => {
    const defaultOrder = ['stats', 'actions', 'plan', 'trending', 'pantry', 'shopping'];
    setItems(defaultOrder);
    localStorage.setItem('dashboard-order', JSON.stringify(defaultOrder));
    setIsCustomizing(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const renderWidget = (id: string) => {
    switch (id) {
      case 'stats':
        return (
          <StatsWidget
            greeting={greeting}
            currentDate={currentDate}
            stats={{
              completedMeals: metrics.mealsPlannedThisWeek,
              totalCalories: Math.round(metrics.weeklyNutrition?.calories.current || 0),
              protein: Math.round(metrics.weeklyNutrition?.protein.current || 0),
              carbs: Math.round(metrics.weeklyNutrition?.carbs.current || 0),
              fat: Math.round(metrics.weeklyNutrition?.fat.current || 0),
              streak: 12 // Keeping hardcoded streak for now as backend doesn't support it yet
            }}
          />
        );
      case 'actions':
        return <ActionGridWidget />;
      case 'plan':
        return (
          <TodayPlanWidget
            meals={mappedMeals}
            onToggleMeal={toggleMeal}
          />
        );
      case 'trending':
        return <TrendingRecipesWidget recipes={trendingRecipes} />;
      case 'pantry':
        return (
          <PantryStatusWidget
            totalItems={metrics.pantryStatus.totalItems}
            expiringSoon={metrics.pantryStatus.expiringSoon}
            items={pantryItems
              .filter(item => item.expiration_date)
              .sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime())
              .slice(0, 3)
              .map(item => ({
                name: item.ingredient_name,
                daysUntilExpiry: Math.ceil((new Date(item.expiration_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              }))
            }
          />
        );
      case 'shopping':
        return (
          <ShoppingListWidget
            items={shoppingList}
            newItemValue={newItem}
            onNewItemChange={setNewItem}
            onAddItem={addShoppingItem}
            onRemoveItem={removeShoppingItem}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans pb-20 relative">
      <div className="absolute inset-0 bg-pattern opacity-[0.03] pointer-events-none"></div>
      <div className="relative z-10 text-slate-900 dark:text-white">

        {/* Dashboard Toolbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={isCustomizing ? "text-orange-500 bg-orange-50 dark:bg-orange-500/20" : "text-gray-500 dark:text-gray-400"}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Personalizar</span>
              </Button>
            </div>
          </div>
        </div>

        {isCustomizing && (
          <div className="bg-slate-900 dark:bg-white text-white dark:text-black p-2 text-center text-sm font-bold sticky top-16 z-30 flex items-center justify-center gap-4">
            <span>Personalizando tu vista</span>
            <Button variant="secondary" size="sm" onClick={resetLayout} className="h-7 text-xs">
              <RotateCcw className="w-3 h-3 mr-1" /> Resetear
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsCustomizing(false)} className="h-7 text-xs">
              Listo
            </Button>
          </div>
        )}

        <main className="max-w-7xl mx-auto py-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 max-w-3xl mx-auto">
                {items.map((id) => (
                  <SortableWidget key={id} id={id} isCustomizing={isCustomizing}>
                    {renderWidget(id)}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </main>

      </div>
    </div>
  );
};

export default UltraModernDashboard;