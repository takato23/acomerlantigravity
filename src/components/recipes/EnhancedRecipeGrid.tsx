'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Clock,
  Users,
  Sparkles,
  Heart,
  BookOpen,
  Flame,
  Zap,
  Star,
  Grid3X3,
  List,
  SlidersHorizontal,
  Mic,
  Volume2
} from 'lucide-react';
import { logger } from '@/services/logger';
import { useNotifications } from '@/services/notifications';
import { getVoiceService } from '@/services/voice/UnifiedVoiceService';

import { GlassCard, GlassRecipeCard, GlassButton, GlassInput } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import type { Recipe as RecipeModel, CuisineType } from '@/features/recipes/types';
import { useRecipeAvailability } from '@/features/recipes/hooks/useRecipeAvailability'; // Import hook

type RecipeListItem = RecipeModel & {
  isFavorite?: boolean;
};

interface EnhancedRecipeGridProps {
  recipes: RecipeListItem[];
  onRecipeClick?: (recipe: RecipeListItem) => void;
  onFavoriteToggle?: (recipeId: string) => void;
  className?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const filterCategories = [
  { id: 'all', label: 'Todas', icon: Grid3X3 },
  { id: 'favorites', label: 'Favoritas', icon: Heart },
  { id: 'quick', label: 'Rápidas', icon: Zap },
  { id: 'ai', label: 'IA', icon: Sparkles },
  { id: 'healthy', label: 'Saludables', icon: Flame }
];

const sortOptions = [
  { value: 'rating', label: 'Mejor Valoradas' },
  { value: 'recent', label: 'Más Recientes' },
  { value: 'time', label: 'Tiempo de Preparación' },
  { value: 'difficulty', label: 'Dificultad' },
  { value: 'name', label: 'Nombre A-Z' }
];

const cuisineTypes: Array<{ value: CuisineType; label: string }> = [
  { value: 'mexican', label: 'Mexicana' },
  { value: 'italian', label: 'Italiana' },
  { value: 'chinese', label: 'China' },
  { value: 'japanese', label: 'Japonesa' },
  { value: 'indian', label: 'India' },
  { value: 'french', label: 'Francesa' },
  { value: 'mediterranean', label: 'Mediterranea' },
  { value: 'american', label: 'Americana' },
  { value: 'thai', label: 'Tailandesa' },
  { value: 'spanish', label: 'Espanola' },
  { value: 'other', label: 'Otra' },
];

const difficultyLevels = ['easy', 'medium', 'hard'];

export const EnhancedRecipeGrid: React.FC<EnhancedRecipeGridProps> = ({
  recipes = [],
  onRecipeClick,
  onFavoriteToggle,
  className,
  searchQuery: propSearchQuery,
  onSearchChange
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : internalSearchQuery;
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchQuery(value);
    }
  };

  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { notify } = useNotifications();
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [maxPrepTime, setMaxPrepTime] = useState(120);
  const [showCookNowOnly, setShowCookNowOnly] = useState(false); // New state

  // Use availability hook
  const { canCookNow, getRecipeAvailability } = useRecipeAvailability(recipes);
  const canCookNowCount = canCookNow.length;

  // Mock recipes for demonstration
  const mockRecipes: RecipeListItem[] = [
    {
      id: 'fallback-1',
      user_id: 'system',
      title: 'Tacos de Pollo con Aguacate',
      description: 'Deliciosos tacos con pollo marinado, aguacate fresco y salsa casera',
      image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      prep_time: 15,
      cook_time: 20,
      total_time: 35,
      servings: 4,
      difficulty: 'easy',
      cuisine_type: 'mexican',
      meal_types: ['lunch', 'dinner'],
      dietary_tags: ['gluten-free'],
      ai_generated: false,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rating: 4.8,
      isFavorite: true,
      ingredients: [
        { ingredient_id: 'chicken', name: 'Pollo', quantity: 300, unit: 'g', optional: false },
        { ingredient_id: 'avocado', name: 'Aguacate', quantity: 2, unit: 'ud', optional: false },
      ],
      instructions: [
        { step_number: 1, text: 'Marina el pollo con especias.' },
        { step_number: 2, text: 'Cocina el pollo y arma los tacos.' },
      ],
      nutritional_info: { calories: 350, protein: 28, carbs: 32, fat: 15, fiber: 4, sugar: 4, sodium: 480 }
    },
    {
      id: 'fallback-2',
      user_id: 'system',
      title: 'Pasta Primavera con Vegetales',
      description: 'Pasta fresca con una mezcla colorida de vegetales de temporada',
      image_url: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400',
      prep_time: 10,
      cook_time: 25,
      total_time: 35,
      servings: 3,
      difficulty: 'medium',
      cuisine_type: 'italian',
      meal_types: ['lunch', 'dinner'],
      dietary_tags: ['vegetarian'],
      ai_generated: true,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rating: 4.5,
      ingredients: [
        { ingredient_id: 'pasta', name: 'Pasta', quantity: 300, unit: 'g', optional: false },
        { ingredient_id: 'zucchini', name: 'Zucchini', quantity: 1, unit: 'ud', optional: false },
      ],
      instructions: [
        { step_number: 1, text: 'Cocina la pasta al dente.' },
        { step_number: 2, text: 'Saltea los vegetales y mezcla.' },
      ],
      nutritional_info: { calories: 420, protein: 12, carbs: 68, fat: 8, fiber: 6, sugar: 6, sodium: 420 }
    },
    {
      id: 'fallback-3',
      user_id: 'system',
      title: 'Salmon a la Plancha con Quinoa',
      description: 'Salmon perfectamente cocinado sobre una cama de quinoa con especias',
      image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
      prep_time: 8,
      cook_time: 15,
      total_time: 23,
      servings: 2,
      difficulty: 'easy',
      cuisine_type: 'mediterranean',
      meal_types: ['dinner'],
      dietary_tags: ['high-protein'],
      ai_generated: false,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rating: 4.9,
      ingredients: [
        { ingredient_id: 'salmon', name: 'Salmon', quantity: 2, unit: 'filetes', optional: false },
        { ingredient_id: 'quinoa', name: 'Quinoa', quantity: 150, unit: 'g', optional: false },
      ],
      instructions: [
        { step_number: 1, text: 'Sella el salmon a la plancha.' },
        { step_number: 2, text: 'Sirve con quinoa y especias.' },
      ],
      nutritional_info: { calories: 380, protein: 35, carbs: 22, fat: 18, fiber: 5, sugar: 2, sodium: 380 }
    },
    {
      id: 'fallback-4',
      user_id: 'system',
      title: 'Curry de Lentejas Rojas',
      description: 'Curry aromatico y cremoso con lentejas rojas y especias tradicionales',
      image_url: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=400',
      prep_time: 12,
      cook_time: 30,
      total_time: 42,
      servings: 6,
      difficulty: 'medium',
      cuisine_type: 'indian',
      meal_types: ['lunch', 'dinner'],
      dietary_tags: ['vegan', 'high-protein'],
      ai_generated: true,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rating: 4.6,
      isFavorite: true,
      ingredients: [
        { ingredient_id: 'lentils', name: 'Lentejas rojas', quantity: 300, unit: 'g', optional: false },
        { ingredient_id: 'onion', name: 'Cebolla', quantity: 1, unit: 'ud', optional: false },
      ],
      instructions: [
        { step_number: 1, text: 'Dora las especias y la cebolla.' },
        { step_number: 2, text: 'Cocina las lentejas hasta espesar.' },
      ],
      nutritional_info: { calories: 280, protein: 18, carbs: 45, fat: 6, fiber: 8, sugar: 4, sodium: 360 }
    }
  ];

  const displayRecipes = recipes.length > 0 ? recipes : mockRecipes;

  const getRecipeTags = (recipe: RecipeListItem) => {
    const tags = new Set<string>();
    recipe.dietary_tags?.forEach((tag) => tags.add(tag));
    recipe.meal_types?.forEach((mealType) => tags.add(mealType));
    if (recipe.cuisine_type) {
      tags.add(recipe.cuisine_type);
    }
    return Array.from(tags);
  };

  const filteredAndSortedRecipes = useMemo(() => {
    const filtered = displayRecipes.filter(recipe => {
      const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
      const tags = getRecipeTags(recipe);
      // Search query filter
      const matchesSearch = recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        recipe.ingredients?.some((ingredient) =>
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

      if (!matchesSearch) return false;

      // Category filter
      switch (activeFilter) {
        case 'favorites':
          if (!recipe.isFavorite) return false;
          break;
        case 'quick':
          if (totalTime > 30) return false;
          break;
        case 'ai':
          if (!recipe.ai_generated) return false;
          break;
        case 'healthy':
          if (!recipe.nutritional_info || recipe.nutritional_info.calories > 400) return false;
          break;
      }

      // Cuisine filter
      if (selectedCuisines.length > 0 && (!recipe.cuisine_type || !selectedCuisines.includes(recipe.cuisine_type))) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(recipe.difficulty)) {
        return false;
      }

      // Prep time filter
      if (totalTime > maxPrepTime) {
        return false;
      }

      // Cook Now Filter
      if (showCookNowOnly) {
        const availability = getRecipeAvailability(recipe.id);
        if (!availability || availability.matchPercentage < 80) {
          return false;
        }
      }

      return true;
    });

    // Sort recipes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'time':
          return (a.prep_time + a.cook_time) - (b.prep_time + b.cook_time);
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'name':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return 0; // Keep original order for "recent"
      }
    });

    return filtered;
  }, [displayRecipes, searchQuery, activeFilter, selectedCuisines, selectedDifficulties, maxPrepTime, sortBy]);

  const handleCuisineToggle = (cuisine: CuisineType) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Search and Controls */}
      <GlassCard variant="medium" className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 lg:max-w-md">
            <GlassInput
              placeholder="Buscar recetas, ingredientes o etiquetas..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              className="w-full pr-12"
            />
            <button
              onClick={async () => {
                if (isListening) return;
                try {
                  setIsListening(true);
                  const voiceService = getVoiceService();
                  const command = await voiceService.startListening({
                    language: 'es-MX',
                    continuous: false
                  });
                  if (command.transcript) {
                    handleSearchChange(command.transcript);
                    await voiceService.speak(`Buscando: ${command.transcript}`);
                  }
                } catch (error: unknown) {
                  logger.error('Voice search error:', 'EnhancedRecipeGrid', error);
                  notify('Error de Búsqueda', {
                    type: 'error',
                    message: 'No se pudo activar la búsqueda por voz'
                  });
                } finally {
                  setIsListening(false);
                }
              }}
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors",
                isListening
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              disabled={isListening}
            >
              {isListening ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Cook Now Button (Moved to be prominent) */}
            <button
              onClick={() => setShowCookNowOnly(!showCookNowOnly)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border",
                showCookNowOnly
                  ? "bg-green-500 text-white border-green-600 shadow-md"
                  : "bg-white/50 text-slate-700 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
              )}
            >
              <span>🍳</span>
              <span className="hidden sm:inline">Puedo Cocinar</span>
              {canCookNowCount > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  showCookNowOnly ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                )}>
                  {canCookNowCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass-input text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex items-center bg-white/10 rounded-lg p-1">
              <GlassButton
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid3X3 className="w-4 h-4" />
              </GlassButton>
              <GlassButton
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </GlassButton>
            </div>

            {/* Filters Toggle */}
            <GlassButton
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<SlidersHorizontal className="w-4 h-4" />}
            >
              Filtros
            </GlassButton>
          </div>
        </div>

        {/* Filter Categories */}
        {/* Filter Categories - REMOVED to avoid duplication with RecipeCategoryGrid */}

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-white/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cuisines */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Tipo de Cocina
                  </h4>
                  <div className="space-y-2">
                    {cuisineTypes.map((cuisine) => (
                      <label key={cuisine.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCuisines.includes(cuisine.value)}
                          onChange={() => handleCuisineToggle(cuisine.value)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">
                          {cuisine.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Dificultad
                  </h4>
                  <div className="space-y-2">
                    {difficultyLevels.map(difficulty => (
                      <label key={difficulty} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedDifficulties.includes(difficulty)}
                          onChange={() => handleDifficultyToggle(difficulty)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Medio' : 'Difícil'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Prep Time */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Tiempo de Preparación (máx. {maxPrepTime} min)
                  </h4>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={maxPrepTime}
                    onChange={(e) => setMaxPrepTime(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filteredAndSortedRecipes.length} de {displayRecipes.length} recetas
        </p>
      </div>

      {/* Recipe Grid/List */}
      <AnimatePresence mode="wait">
        {filteredAndSortedRecipes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            )}
          >
            {filteredAndSortedRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {viewMode === 'grid' ? (
                  <GlassRecipeCard
                    title={recipe.title}
                    description={recipe.description}
                    imageUrl={recipe.image_url}
                    prepTime={(recipe.prep_time || 0) + (recipe.cook_time || 0)}
                    difficulty={recipe.difficulty}
                    rating={recipe.rating}
                    matchPercentage={getRecipeAvailability(recipe.id)?.matchPercentage}
                    tags={getRecipeTags(recipe)}
                    onClick={() => onRecipeClick?.(recipe)}
                  />
                ) : (
                  <GlassCard variant="subtle" className="p-4" interactive>
                    <div className="flex items-center space-x-4">
                      <img
                        src={recipe.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'}
                        alt={recipe.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {recipe.title}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">
                              {(recipe.rating || 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {recipe.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{recipe.servings} personas</span>
                          </span>
                          <span className="capitalize">{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <GlassCard variant="subtle" className="p-8 max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron recetas
              </h3>
              <p className="text-gray-600">
                Intenta ajustar tus filtros o buscar con otros términos.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
