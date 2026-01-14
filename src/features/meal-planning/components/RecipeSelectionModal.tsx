'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Filter,
  Sparkles,
  Clock,
  Users,
  Star,
  ChefHat,
  Plus,
  Loader2,
  Heart,
  Utensils,
  Flame,
  Leaf,
  LayoutGrid,
  List,
  ArrowUpDown,
  Timer,
  Zap,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

import { useMealPlanningStore } from '../store/useMealPlanningStore';
import { useRecipeStore } from '@/features/recipes/store/recipeStore';
import type { Recipe, MealSlot, DietaryPreference, MealType } from '../types';

interface RecipeSelectionModalProps {
  slot: {
    dayOfWeek: number;
    mealType: MealType;
    date: string; // Ensure date is string as per standardized type
  } | MealSlot;
  onClose: () => void;
  onSelect?: (recipe: Recipe) => void;
}

// ... existing icons and filters ...

export function RecipeSelectionModal({ slot, onClose, onSelect }: RecipeSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<DietaryPreference[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'ai'>('all');
  const [prepTimeFilter, setPrepTimeFilter] = useState<PrepTimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { recipes: mealPlanningRecipes, addMealToSlot, currentWeekPlan } = useMealPlanningStore();
  const mealSlots = currentWeekPlan?.slots || [];
  const {
    recipes: recipeStoreRecipes,
    favoriteRecipes,
    isLoading,
    searchRecipes,
    generateAIRecipe
  } = useRecipeStore();

  // Combine recipes from both stores using unified format
  const allRecipes = useMemo(() => {
    const combinedMap = new Map<string, Recipe>();

    // Add meal planning recipes
    Object.values(mealPlanningRecipes || {}).forEach(recipe => {
      combinedMap.set(recipe.id, recipe);
    });

    // Add recipe store recipes (convert to meal planning format)
    recipeStoreRecipes.forEach(storeRecipe => {
      // Map recipe store format to unified Recipe structure leveraging aliases
      const convertedRecipe: Recipe = {
        ...storeRecipe as any, // Most fields align or have aliases
        id: storeRecipe.id,
        name: storeRecipe.title,
        title: storeRecipe.title,
        description: storeRecipe.description,
        image: storeRecipe.image_url,
        prepTime: storeRecipe.prep_time || 0,
        cookTime: storeRecipe.cook_time || 0,
        servings: storeRecipe.servings || 4,
        difficulty: (storeRecipe.difficulty as any) || 'medium',
        ingredients: (storeRecipe.ingredients || []).map(ing => ({
          id: ing.ingredient_id,
          name: ing.name,
          amount: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          isOptional: ing.optional
        })),
        instructions: (storeRecipe.instructions || []).map(inst => inst.text),
        nutrition: storeRecipe.nutritional_info ? {
          calories: storeRecipe.nutritional_info.calories || 0,
          protein: storeRecipe.nutritional_info.protein || 0,
          carbs: storeRecipe.nutritional_info.carbs || 0,
          fat: storeRecipe.nutritional_info.fat || 0,
          fiber: storeRecipe.nutritional_info.fiber,
          sugar: storeRecipe.nutritional_info.sugar,
          sodium: storeRecipe.nutritional_info.sodium
        } : undefined,
        dietaryLabels: (storeRecipe.dietary_tags || []).map(tag => {
          const tagMap: Record<string, DietaryPreference> = {
            'vegetarian': 'vegetarian',
            'vegan': 'vegan',
            'gluten-free': 'glutenFree',
            'dairy-free': 'dairyFree',
            'keto': 'keto',
            'paleo': 'paleo'
          };
          return tagMap[tag];
        }).filter((tag): tag is DietaryPreference => tag !== undefined),
        cuisine: storeRecipe.cuisine_type,
        tags: storeRecipe.meal_types || [],
        rating: storeRecipe.rating,
        isAiGenerated: storeRecipe.ai_generated,
        isFavorite: favoriteRecipes.some(fav => fav.id === storeRecipe.id)
      };
      combinedMap.set(storeRecipe.id, convertedRecipe);
    });

    return Array.from(combinedMap.values());
  }, [mealPlanningRecipes, recipeStoreRecipes, favoriteRecipes]);

  // Calculate daily nutrition from meals already planned for this day
  const dailyNutrition = useMemo(() => {
    const daySlots = mealSlots.filter((s: MealSlot) => s.date === slot.date && s.mealType !== slot.mealType);
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    daySlots.forEach((s: MealSlot) => {
      if (s.recipe?.nutrition) {
        totals.calories += s.recipe.nutrition.calories || 0;
        totals.protein += s.recipe.nutrition.protein || 0;
        totals.carbs += s.recipe.nutrition.carbs || 0;
        totals.fat += s.recipe.nutrition.fat || 0;
      }
    });

    return totals;
  }, [mealSlots, slot.date, slot.mealType]);

  // Calculate remaining nutrition for the day
  const remainingNutrition = useMemo(() => ({
    calories: Math.max(0, DAILY_GOALS.calories - dailyNutrition.calories),
    protein: Math.max(0, DAILY_GOALS.protein - dailyNutrition.protein),
    carbs: Math.max(0, DAILY_GOALS.carbs - dailyNutrition.carbs),
    fat: Math.max(0, DAILY_GOALS.fat - dailyNutrition.fat),
  }), [dailyNutrition]);

  // Filter recipes based on search and filters
  const filteredRecipes = useMemo(() => {
    let filtered = allRecipes;

    // Filter by tab
    if (activeTab === 'favorites') {
      filtered = filtered.filter(recipe => recipe.isFavorite);
    } else if (activeTab === 'ai') {
      filtered = filtered.filter(recipe => recipe.isAiGenerated);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        (recipe.name || '').toLowerCase().includes(query) ||
        (recipe.description || '').toLowerCase().includes(query) ||
        (recipe.tags || []).some(tag => (tag || '').toLowerCase().includes(query)) ||
        (recipe.ingredients || []).some(ing => (ing?.name || '').toLowerCase().includes(query))
      );
    }

    // Filter by dietary preferences
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedFilters.every(filter => recipe.dietaryLabels.includes(filter))
      );
    }

    // Filter by prep time
    if (prepTimeFilter !== 'all') {
      const option = prepTimeOptions.find(o => o.value === prepTimeFilter);
      filtered = filtered.filter(recipe => {
        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
        if (prepTimeFilter === 'quick') return totalTime <= 15;
        if (prepTimeFilter === 'medium') return totalTime <= 30;
        if (prepTimeFilter === 'elaborate') return totalTime > 30;
        return true;
      });
    }

    // Sort recipes
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'prepTime':
          return ((a.prepTime || 0) + (a.cookTime || 0)) - ((b.prepTime || 0) + (b.cookTime || 0));
        case 'calories':
          return (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allRecipes, searchQuery, selectedFilters, activeTab, prepTimeFilter, sortBy]);

  // Handle recipe selection
  const handleSelectRecipe = useCallback(async (recipe: Recipe) => {
    if (onSelect) {
      onSelect(recipe);
    } else {
      await addMealToSlot(slot, recipe);
    }
    toast.success(`${recipe.name} agregado al planificador`);
    onClose();
  }, [addMealToSlot, slot, onClose, onSelect]);

  // Handle AI generation
  const handleGenerateAI = useCallback(async () => {
    setIsGenerating(true);
    try {
      const mealTypePrompts = {
        desayuno: 'un desayuno saludable y nutritivo',
        almuerzo: 'un almuerzo equilibrado y satisfactorio',
        merienda: 'una merienda ligera y energética',
        cena: 'una cena reconfortante pero ligera'
      };

      await generateAIRecipe({
        prompt: `Genera ${mealTypePrompts[slot.mealType]} típico de Argentina`,
        dietary_tags: selectedFilters.map(f => {
          const tagMap: Record<string, string> = {
            'vegetarian': 'vegetariano',
            'vegan': 'vegano',
            'glutenFree': 'sin-gluten',
            'dairyFree': 'sin-lacteos',
            'keto': 'keto',
            'paleo': 'paleo'
          };
          return tagMap[f] || f;
        }) as any,
        cuisine_type: 'mediterranean',
        servings: 2,
        difficulty: 'medium',
        max_cook_time: 45,
        provider: 'gemini'
      });

      toast.success('Receta generada con IA exitosamente');
      setActiveTab('ai');
    } catch (error) {
      toast.error('Error al generar la receta con IA');
    } finally {
      setIsGenerating(false);
    }
  }, [generateAIRecipe, slot.mealType, selectedFilters]);

  // Toggle dietary filter
  const toggleFilter = useCallback((filter: DietaryPreference) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Seleccionar Receta</h2>
                {slot.date && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {slot.mealType} • {new Date(slot.date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${activeTab === 'all'
                  ? 'bg-black dark:bg-white text-white dark:text-slate-900 shadow-lg'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10'
                  }`}
              >
                Todas las Recetas
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'favorites'
                  ? 'bg-slate-700 dark:bg-rose-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10'
                  }`}
              >
                <Heart className="w-4 h-4" />
                Favoritas
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'ai'
                  ? 'bg-slate-600 dark:bg-violet-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10'
                  }`}
              >
                <Sparkles className="w-4 h-4" />
                Generadas por IA
              </button>
            </div>

            {/* Daily Nutrition Summary */}
            {dailyNutrition.calories > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Resumen nutricional del día</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-emerald-700 dark:text-emerald-300">{dailyNutrition.calories}</div>
                    <div className="text-emerald-600/70 dark:text-emerald-400/70">/{DAILY_GOALS.calories} cal</div>
                    <div className="mt-1 h-1 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, (dailyNutrition.calories / DAILY_GOALS.calories) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-700 dark:text-blue-300">{dailyNutrition.protein}g</div>
                    <div className="text-blue-600/70 dark:text-blue-400/70">/{DAILY_GOALS.protein}g prot</div>
                    <div className="mt-1 h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all" style={{ width: `${Math.min(100, (dailyNutrition.protein / DAILY_GOALS.protein) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-amber-700 dark:text-amber-300">{dailyNutrition.carbs}g</div>
                    <div className="text-amber-600/70 dark:text-amber-400/70">/{DAILY_GOALS.carbs}g carb</div>
                    <div className="mt-1 h-1 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(100, (dailyNutrition.carbs / DAILY_GOALS.carbs) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-rose-700 dark:text-rose-300">{dailyNutrition.fat}g</div>
                    <div className="text-rose-600/70 dark:text-rose-400/70">/{DAILY_GOALS.fat}g grasa</div>
                    <div className="mt-1 h-1 bg-rose-200 dark:bg-rose-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 dark:bg-rose-400 rounded-full transition-all" style={{ width: `${Math.min(100, (dailyNutrition.fat / DAILY_GOALS.fat) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-white/10">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar recetas..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20 transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1 border border-gray-200 dark:border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/20 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-white/10'}`}
                  title="Vista de grilla"
                >
                  <LayoutGrid className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/20 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-white/10'}`}
                  title="Vista de lista"
                >
                  <List className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="px-4 py-3 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                >
                  <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{sortOptions.find(o => o.value === sortBy)?.label}</span>
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-white/10 z-10 overflow-hidden">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setSortBy(option.value); setShowSortMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${sortBy === option.value ? 'bg-gray-50 dark:bg-white/5 text-black dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate AI Button */}
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="px-6 py-3 bg-black dark:bg-orange-500 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-orange-600 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generar con IA
                  </>
                )}
              </button>
            </div>

            {/* Prep Time Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              {prepTimeOptions.map(option => {
                const Icon = option.icon;
                const isSelected = prepTimeFilter === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setPrepTimeFilter(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${isSelected
                      ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-500/30'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Dietary Filters */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(['vegetarian', 'vegan', 'glutenFree', 'dairyFree', 'keto', 'paleo'] as DietaryPreference[]).map(filter => {
                const Icon = dietaryIcons[filter];
                const isSelected = selectedFilters.includes(filter);

                return (
                  <button
                    key={filter}
                    onClick={() => toggleFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${isSelected
                      ? 'bg-slate-100 dark:bg-emerald-500/20 text-slate-700 dark:text-emerald-300 border border-slate-300 dark:border-emerald-500/30'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipe Grid/List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-380px)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="text-center py-16">
                <ChefHat className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No se encontraron recetas</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Prueba con otros filtros o genera una nueva con IA
                </p>
              </div>
            ) : viewMode === 'list' ? (
              /* List View */
              <div className="flex flex-col gap-3">
                {filteredRecipes.map(recipe => (
                  <motion.button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-xl hover:border-slate-400 dark:hover:border-white/30 transition-all text-left"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      {recipe.image ? (
                        <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">{recipe.name}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {recipe.isAiGenerated && <Sparkles className="w-4 h-4 text-violet-500" />}
                          {recipe.isFavorite && <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{recipe.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {recipe.servings}
                        </span>
                        {recipe.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                            {recipe.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Nutrition */}
                    {recipe.nutrition && (
                      <div className="hidden sm:flex flex-col gap-1 text-xs text-right flex-shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300">{recipe.nutrition.calories} cal</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">{recipe.nutrition.protein}g prot</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map(recipe => (
                  <motion.button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group bg-gray-50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-slate-400 dark:hover:border-white/30 transition-all text-left"
                  >
                    {/* Image */}
                    <div className="aspect-video relative overflow-hidden bg-gray-800">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-gray-600" />
                        </div>
                      )}

                      {/* Overlay Info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white/90 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {recipe.prepTime + recipe.cookTime} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {recipe.servings}
                            </span>
                          </div>
                          {recipe.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                              {recipe.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                        <div className="flex flex-wrap gap-1">
                          {recipe.isAiGenerated && (
                            <span className="px-2 py-1 bg-slate-700/90 backdrop-blur-sm text-white text-xs rounded-lg flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              IA
                            </span>
                          )}
                          {recipe.dietaryLabels.slice(0, 2).map(label => {
                            const Icon = dietaryIcons[label];
                            return (
                              <span key={label} className="px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs rounded-lg flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {label}
                              </span>
                            );
                          })}
                        </div>
                        {recipe.isFavorite && (
                          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">{recipe.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{recipe.description}</p>

                      {/* Nutrition Preview */}
                      {recipe.nutrition && (
                        <div className="mt-3 flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300">{recipe.nutrition.calories} cal</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">{recipe.nutrition.protein}g prot</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">{recipe.nutrition.carbs}g carb</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}