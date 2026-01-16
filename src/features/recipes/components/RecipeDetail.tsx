'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Heart,
  Share2,
  Check,
  Sparkles,
  Plus,
  Minus,
  Printer,
  CalendarPlus,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Recipe, CookingSession } from '../types';
import { useRecipeStore } from '../store/recipeStore';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import { useShoppingList } from '@/hooks/useShoppingList';
import { toast } from 'sonner';

interface RecipeDetailProps {
  recipe: Recipe;
  onEdit?: () => void;
  onClose?: () => void;
  displayMode?: 'page' | 'modal';
}

const CUISINE_LABELS: Record<string, string> = {
  mexican: 'Mexicana',
  italian: 'Italiana',
  chinese: 'China',
  japanese: 'Japonesa',
  indian: 'India',
  french: 'Francesa',
  mediterranean: 'Mediterranea',
  american: 'Americana',
  thai: 'Tailandesa',
  spanish: 'Espanola',
  other: 'Internacional',
};

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
  dessert: 'Postre',
  appetizer: 'Entrada',
};

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: 'Vegetariana',
  vegan: 'Vegana',
  'gluten-free': 'Sin gluten',
  'dairy-free': 'Sin lacteos',
  'nut-free': 'Sin frutos secos',
  'low-carb': 'Baja en carbos',
  keto: 'Keto',
  paleo: 'Paleo',
  whole30: 'Whole30',
  'sugar-free': 'Sin azucar',
  'low-sodium': 'Baja en sodio',
  'high-protein': 'Alta en proteina',
};

const RecipePlaceholder = () => (
  <svg
    viewBox="0 0 200 140"
    className="h-20 w-20 text-slate-300"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M70 34c0-10 12-10 12-20" />
    <path d="M100 34c0-10 12-10 12-20" />
    <path d="M130 34c0-10 12-10 12-20" />
    <circle cx="100" cy="86" r="34" />
    <circle cx="100" cy="86" r="20" />
    <path d="M40 118h120" />
  </svg>
);

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onEdit,
  onClose,
  displayMode = 'page',
}) => {
  const router = useRouter();
  const {
    recipes: storedRecipes,
    addRecipe,
    startCookingSession,
    completeCookingSession,
    rateRecipe,
    addToFavorites
  } = useRecipeStore();

  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [cookingSession, setCookingSession] = useState<CookingSession | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [userRating, setUserRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeSection, setActiveSection] = useState<'ingredients' | 'steps' | 'nutrition'>('ingredients');

  const isModal = displayMode === 'modal';
  const { items: pantryItems } = usePantryStore();
  const { addItem: addShoppingItem } = useShoppingList();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const checkPantryStock = (ingredientName: string) => {
    if (!ingredientName) return false;
    return pantryItems.some(item =>
      (item.ingredient_name && item.ingredient_name.toLowerCase().includes(ingredientName.toLowerCase())) ||
      (item.ingredient_name && ingredientName.toLowerCase().includes(item.ingredient_name.toLowerCase()))
    );
  };

  const handleAddToShoppingList = async () => {
    if (selectedIngredients.length === 0) {
      toast.error('Seleccioná ingredientes primero');
      return;
    }
    let addedCount = 0;
    for (const name of selectedIngredients) {
      const ingredient = recipe.ingredients.find(i => i.name === name);
      if (ingredient) {
        try {
          await addShoppingItem({
            custom_name: ingredient.name,
            quantity: ingredient.quantity * servingsMultiplier,
            unit: ingredient.unit,
            category: 'otros',
            is_purchased: false,
          });
          addedCount++;
        } catch (error) {
          console.error('Failed to add item', error);
        }
      }
    }
    if (addedCount > 0) {
      toast.success(`${addedCount} items agregados a la lista`);
      setSelectedIngredients([]);
    }
  };

  const toggleIngredientSelection = (name: string) => {
    setSelectedIngredients(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const adjustedServings = recipe.servings * servingsMultiplier;
  const totalTime = recipe.total_time || (recipe.prep_time + recipe.cook_time);

  const handleStartCooking = async () => {
    const session = await startCookingSession(recipe.id);
    setCookingSession(session);
    toast.success('¡A cocinar!');
  };

  const handleCompleteCooking = async () => {
    if (!cookingSession) return;
    await completeCookingSession(cookingSession.id, {
      completed_at: new Date().toISOString(),
      recipe_id: recipe.id,
    });
    setCookingSession(null);
    setCompletedSteps(new Set());
    setShowRatingModal(true);
  };

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const handleRate = async (rating: number) => {
    setUserRating(rating);
    await rateRecipe(recipe.id, rating);
    setShowRatingModal(false);
    toast.success('¡Gracias por tu valoración!');
  };

  const handleFavorite = () => {
    if (!storedRecipes.find((storedRecipe) => storedRecipe.id === recipe.id)) {
      addRecipe(recipe);
    }
    addToFavorites(recipe.id);
    setIsFavorite(true);
    toast.success('Guardada en favoritos');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado');
    }
  };

  const getDifficultyLabel = (diff: string) => {
    const labels: Record<string, string> = {
      easy: 'Fácil',
      medium: 'Media',
      hard: 'Difícil'
    };
    return labels[diff] || diff;
  };

  const getCuisineLabel = (cuisine: string) => CUISINE_LABELS[cuisine] || cuisine;
  const getMealTypeLabel = (mealType: string) => MEAL_TYPE_LABELS[mealType] || mealType;
  const getDietaryLabel = (tag: string) => DIETARY_LABELS[tag] || tag;

  const mealTypeList = recipe.meal_types?.map(getMealTypeLabel) ?? [];
  const dietaryList = recipe.dietary_tags?.map(getDietaryLabel) ?? [];
  const visibleMealTypes = mealTypeList.slice(0, 2);
  const extraMealTypes = mealTypeList.length - visibleMealTypes.length;
  const visibleDietaryTags = dietaryList.slice(0, 2);
  const extraDietaryTags = dietaryList.length - visibleDietaryTags.length;
  const pantryMatchCount = recipe.ingredients.filter((ingredient) => checkPantryStock(ingredient.name)).length;
  const pantryMissingCount = recipe.ingredients.length - pantryMatchCount;
  const missingIngredients = recipe.ingredients.filter(
    (ingredient) => !checkPantryStock(ingredient.name)
  );
  const missingNames = missingIngredients.map((ingredient) => ingredient.name);
  const visibleMissing = missingNames.slice(0, 6);
  const extraMissing = missingNames.length - visibleMissing.length;
  const cookingProgress = recipe.instructions.length > 0
    ? Math.round((completedSteps.size / recipe.instructions.length) * 100)
    : 0;
  const nutritionExtras = recipe.nutritional_info ? [
    { label: 'Fibra', value: recipe.nutritional_info.fiber, unit: 'g' },
    { label: 'Sodio', value: recipe.nutritional_info.sodium, unit: 'mg' },
    { label: 'Azucar', value: recipe.nutritional_info.sugar, unit: 'g' },
    { label: 'Calcio', value: recipe.nutritional_info.calcium, unit: 'mg' },
    { label: 'Hierro', value: recipe.nutritional_info.iron, unit: 'mg' },
  ].filter((item) => item.value && item.value > 0) : [];
  const ingredientCount = recipe.ingredients.length;
  const timeDetail = totalTime > 0 && (recipe.prep_time || recipe.cook_time)
    ? `Prep ${recipe.prep_time}m · Coccion ${recipe.cook_time}m`
    : totalTime > 0
      ? 'Tiempo estimado'
      : 'Sin datos';
  const timeValue = totalTime > 0 ? `${totalTime} min` : 'Sin datos';
  const pantrySummary = ingredientCount > 0 ? `${pantryMatchCount}/${ingredientCount}` : 'Sin datos';
  const pantryDetail = ingredientCount > 0
    ? (pantryMissingCount > 0 ? `Faltan ${pantryMissingCount}` : 'Todo listo')
    : 'Sin ingredientes';
  const summaryStats = [
    { label: 'Tiempo', value: timeValue, detail: timeDetail },
    { label: 'Porciones', value: `${adjustedServings}`, detail: 'Ajustable' },
    { label: 'Dificultad', value: getDifficultyLabel(recipe.difficulty), detail: 'Nivel' },
    { label: 'Despensa', value: pantrySummary, detail: pantryDetail },
  ];
  const sectionTabs = [
    { key: 'ingredients', label: 'Ingredientes' },
    { key: 'steps', label: 'Como hacer' },
    { key: 'nutrition', label: 'Nutricion' },
  ] as const;

  const sectionVisibility = (key: 'ingredients' | 'steps' | 'nutrition') => {
    if (isModal) {
      return activeSection === key ? '' : 'hidden';
    }
    return activeSection === key ? '' : 'hidden md:block';
  };

  return (
    <div className={cn(
      "bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white",
      isModal ? "h-full" : "min-h-screen"
    )}>
      {isModal && onClose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-white/10"
        >
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Detalle de receta</span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/20 transition-all"
          >
            Cerrar
          </button>
        </motion.div>
      )}
      {!isModal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 z-50"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </motion.div>
      )}

      <div className={cn(
        "mx-auto px-4",
        isModal ? "max-w-none pb-6" : "max-w-5xl pb-12"
      )}>
        <div className={cn(
          "mt-3",
          isModal ? "grid gap-5 md:grid-cols-[300px_1fr] md:items-start" : ""
        )}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "relative overflow-hidden bg-slate-100",
              isModal ? "rounded-xl h-52 md:h-[280px]" : "rounded-2xl aspect-[16/10] sm:aspect-[21/9]"
            )}
          >
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
                <div className="flex flex-col items-center gap-3">
                  <RecipePlaceholder />
                  <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Sin imagen</span>
                </div>
              </div>
            )}
          </motion.div>

          <div className={cn(isModal ? "mt-0" : "mt-5")}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {recipe.ai_generated && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 font-semibold text-orange-700">
                <Sparkles className="w-3 h-3" />
                IA
              </span>
            )}
            {recipe.rating && recipe.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {recipe.rating.toFixed(1)}
              </span>
            )}
            {recipe.times_cooked && recipe.times_cooked > 0 && (
              <span className="text-slate-400">{recipe.times_cooked} veces cocinada</span>
            )}
          </div>

          <h1 className={cn(
            "mt-2 font-bold tracking-tight text-slate-900 dark:text-white",
            isModal ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"
          )}>
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className={cn(
              "mt-2 text-slate-600 dark:text-slate-300",
              isModal ? "text-sm line-clamp-2" : "text-sm md:text-base line-clamp-2"
            )}>
              {recipe.description}
            </p>
          )}

          <ul className={cn(
            "flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300",
            isModal ? "mt-3" : "mt-4"
          )}>
            {summaryStats.map((stat) => (
              <li key={stat.label} className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-semibold">
                  {stat.label}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{stat.value}</span>
                <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">{stat.detail}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-3 py-1 font-semibold">
              {getCuisineLabel(recipe.cuisine_type)}
            </span>
            {visibleMealTypes.map((type) => (
              <span key={type} className="rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-3 py-1 font-semibold">
                {type}
              </span>
            ))}
            {extraMealTypes > 0 && (
              <span className="rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-3 py-1 font-semibold">
                +{extraMealTypes}
              </span>
            )}
            {visibleDietaryTags.map((tag) => (
              <span key={tag} className="rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 font-semibold">
                {tag}
              </span>
            ))}
            {extraDietaryTags > 0 && (
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 font-semibold">
                +{extraDietaryTags}
              </span>
            )}
          </div>

          <div className={cn(
            "flex flex-wrap gap-2",
            isModal ? "mt-3" : "mt-4"
          )}>
            <button
              onClick={handleFavorite}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                isFavorite
                  ? "border-red-500 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                  : "border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
              {isFavorite ? 'Guardada' : 'Favorito'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartir
            </button>
            {!isModal && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
            )}
            <button
              onClick={() => router.push('/planificador')}
              className="flex items-center gap-1.5 rounded-full bg-slate-900 dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Planificar
            </button>
          </div>
          </div>
        </div>

        <div className={cn(
          "mt-5 flex flex-wrap gap-2",
          !isModal && "md:hidden"
        )}>
          {sectionTabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                activeSection === item.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={cn(
          "grid gap-5",
          isModal ? "mt-5 md:grid-cols-2" : "mt-6 md:grid-cols-3"
        )}>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              !isModal && "md:col-span-1",
              sectionVisibility('ingredients')
            )}
          >
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Ingredientes</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{ingredientCount} items</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 px-2 py-1">
                  <button
                    onClick={() => setServingsMultiplier(Math.max(0.5, servingsMultiplier - 0.5))}
                    className="h-7 w-7 rounded-full border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-3 h-3 mx-auto" />
                  </button>
                  <span className="text-sm font-semibold w-8 text-center text-slate-900 dark:text-white">{adjustedServings}</span>
                  <button
                    onClick={() => setServingsMultiplier(servingsMultiplier + 0.5)}
                    className="h-7 w-7 rounded-full border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-3 h-3 mx-auto" />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Despensa: {pantrySummary} {pantryDetail !== 'Sin ingredientes' ? `· ${pantryDetail}` : ''}
              </p>

              {ingredientCount > 0 ? (
                <div className="mt-3 divide-y divide-slate-100 dark:divide-white/10">
                  {recipe.ingredients.map((ingredient, index) => (
                    <label key={index} className="flex items-start gap-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIngredients.includes(ingredient.name)}
                        onChange={() => toggleIngredientSelection(ingredient.name)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-white/30 accent-slate-900 dark:accent-white"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {(ingredient.quantity * servingsMultiplier).toFixed(ingredient.quantity % 1 === 0 ? 0 : 1)} {ingredient.unit}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">{ingredient.name}</span>
                          {checkPantryStock(ingredient.name) && (
                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                              En despensa
                            </span>
                          )}
                        </div>
                        {ingredient.notes && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">{ingredient.notes}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No hay ingredientes cargados.</p>
              )}

              <div className="mt-4 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Faltantes:</span>{' '}
                {missingIngredients.length > 0
                  ? `${visibleMissing.join(', ')}${extraMissing > 0 ? ` +${extraMissing}` : ''}`
                  : 'Tenes todo.'}
              </div>

              {!cookingSession ? (
                <>
                  <button
                    onClick={handleStartCooking}
                    className="mt-4 w-full rounded-xl bg-slate-900 dark:bg-white py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                  >
                    Empezar a cocinar
                  </button>
                  {selectedIngredients.length > 0 && (
                    <button
                      onClick={handleAddToShoppingList}
                      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
                    >
                      Agregar {selectedIngredients.length} a la lista
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleCompleteCooking}
                  disabled={completedSteps.size !== recipe.instructions.length}
                  className={cn(
                    "mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all",
                    completedSteps.size === recipe.instructions.length
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  )}
                >
                  Finalizar ({completedSteps.size}/{recipe.instructions.length})
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              !isModal && "md:col-span-2",
              sectionVisibility('steps')
            )}
          >
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Como hacer</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{recipe.instructions.length} pasos</p>
                </div>
                {cookingSession && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{cookingProgress}%</span>
                )}
              </div>

              {cookingSession && (
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${cookingProgress}%` }}
                  />
                </div>
              )}

              <div className="mt-3 divide-y divide-slate-100 dark:divide-white/10">
                {recipe.instructions.map((instruction, index) => (
                  <div
                    key={index}
                    onClick={() => cookingSession && handleStepComplete(instruction.step_number)}
                    className={cn(
                      "flex gap-3 py-4",
                      cookingSession && "cursor-pointer",
                      completedSteps.has(instruction.step_number) && "opacity-70"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full border text-xs font-semibold flex items-center justify-center shrink-0",
                        completedSteps.has(instruction.step_number)
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {completedSteps.has(instruction.step_number) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        instruction.step_number
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{instruction.text}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                        {instruction.time_minutes && <span>{instruction.time_minutes} min</span>}
                        {instruction.temperature && (
                          <span>
                            {instruction.temperature.value}°{instruction.temperature.unit === 'celsius' ? 'C' : 'F'}
                          </span>
                        )}
                      </div>
                      {instruction.tips && instruction.tips.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Tip: {instruction.tips.join(' | ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "mt-8",
            sectionVisibility('nutrition')
          )}
        >
          {recipe.nutritional_info ? (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Nutricion</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Por porcion</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-semibold">Calorias</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{recipe.nutritional_info.calories}</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-semibold">Proteinas</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{recipe.nutritional_info.protein}g</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-semibold">Carbos</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{recipe.nutritional_info.carbs}g</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-semibold">Grasas</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{recipe.nutritional_info.fat}g</p>
                </div>
              </div>

              {nutritionExtras.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Ver nutrientes extra
                  </summary>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {nutritionExtras.map((item) => (
                      <div key={item.label} className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm">
                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.label}</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.value}{item.unit}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No hay informacion nutricional disponible
            </div>
          )}
        </motion.div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl p-8 text-center"
          >
            <h3 className="text-2xl font-black text-slate-900 mb-2">¿Qué te pareció?</h3>
            <p className="text-gray-500 mb-6">{recipe.title}</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-10 h-10 transition-colors',
                      star <= userRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200 hover:text-amber-300'
                    )}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRatingModal(false)}
              className="text-gray-500 font-semibold hover:text-gray-700 transition-colors"
            >
              Ahora no
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
