'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ChefHat, Clock, Flame, Check, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { useShoppingList } from '@/hooks/useShoppingList';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';
import { checkPantryAvailability, consumeIngredientsFromPantry } from '@/features/pantry/utils/mealPlanIntegration';
import type { PantryItem, RecipeIngredient } from '@/features/pantry/types';
import type { Recipe } from '@/features/meal-planning/types';

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  day: Date;
  mealType: string;
}

const APPROX_UNITS = new Set([
  'pizca',
  'pizcas',
  'cdita',
  'cucharadita',
  'cucharaditas',
  'cda',
  'cucharada',
  'cucharadas',
  'chorrito',
  'chorritos',
  'al gusto',
  'a gusto'
]);

const APPROX_MARKERS = ['al gusto', 'a gusto', 'pizca', 'chorrito'];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isApproxIngredient = (unit?: string, name?: string) => {
  const normalizedUnit = unit ? normalizeText(unit) : '';
  const normalizedName = name ? normalizeText(name) : '';

  if (normalizedUnit && APPROX_UNITS.has(normalizedUnit)) {
    return true;
  }

  return APPROX_MARKERS.some((marker) => normalizedName.includes(marker));
};

const isStapleIngredient = (name: string, staples: string[]) => {
  const normalizedName = normalizeText(name);
  return staples.some((staple) => normalizedName.includes(normalizeText(staple)));
};

export function MealDetailModal({ isOpen, onClose, recipe, day, mealType }: MealDetailModalProps) {
  const { addItem, activeList, createList } = useShoppingList();
  const { items: pantryItems, consumeItem, fetchItems } = usePantryStore();
  const { staples: staplesRaw } = useMealPlanningStore();
  // staples can be Recipe[] or string[], normalize to string[]
  const staples: string[] = Array.isArray(staplesRaw)
    ? staplesRaw.map((s: any) => (typeof s === 'string' ? s : s?.name || ''))
    : [];

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const [pendingAction, setPendingAction] = useState<'pantry-only' | 'pantry-plus' | null>(null);
  const [requireConfirmation, setRequireConfirmation] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('meal-planner:confirm-use-ingredients');
    return stored ? stored === 'true' : true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('meal-planner:confirm-use-ingredients', String(requireConfirmation));
  }, [requireConfirmation]);

  useEffect(() => {
    if (isOpen && pantryItems.length === 0) {
      fetchItems();
    }
  }, [isOpen, pantryItems.length, fetchItems]);

  const recipeIngredients: RecipeIngredient[] = useMemo(() => {
    const rawIngredients = (recipe.ingredients || []) as Array<any>;
    return rawIngredients.map((ingredient, index) => {
      if (typeof ingredient === 'string') {
        return {
          id: `${recipe.id}-${index}`,
          ingredient_id: `${recipe.id}-${index}`,
          ingredient_name: ingredient,
          quantity: 1,
          unit: 'unidad',
          optional: false
        };
      }

      return {
        id: ingredient.id || `${recipe.id}-${index}`,
        ingredient_id: ingredient.id || `${recipe.id}-${index}`,
        ingredient_name: ingredient.name,
        quantity: ingredient.amount ?? 1,
        unit: ingredient.unit || 'unidad',
        optional: ingredient.isOptional ?? false
      };
    });
  }, [recipe]);

  const pantryAvailability = useMemo(() => {
    return checkPantryAvailability(recipeIngredients, pantryItems as PantryItem[]);
  }, [recipeIngredients, pantryItems]);

  const ingredientRows = useMemo(() => {
    return recipeIngredients.map((ingredient, index) => {
      const availability = pantryAvailability[index];
      const approx = isApproxIngredient(ingredient.unit, ingredient.ingredient_name);
      const staple = isStapleIngredient(ingredient.ingredient_name, staples);
      const sufficient = staple ? true : availability?.sufficient ?? false;
      const missingQuantity = availability
        ? Math.max(0, availability.required_quantity - availability.available_quantity)
        : 0;

      return {
        ...ingredient,
        isApprox: approx,
        isStaple: staple,
        sufficient,
        missingQuantity
      };
    });
  }, [recipeIngredients, pantryAvailability, staples]);

  const missingItems = ingredientRows.filter(
    (ingredient) => !ingredient.isApprox && !ingredient.isStaple && !ingredient.sufficient
  );

  const summary = useMemo(() => {
    const approxCount = ingredientRows.filter((ingredient) => ingredient.isApprox).length;
    const stapleCount = ingredientRows.filter((ingredient) => ingredient.isStaple).length;
    return {
      missingCount: missingItems.length,
      approxCount,
      stapleCount
    };
  }, [ingredientRows, missingItems]);

  const handleUseIngredients = async (mode: 'pantry-only' | 'pantry-plus') => {
    const consumableIngredients = recipeIngredients.filter((ingredient) => {
      const row = ingredientRows.find((entry) => entry.ingredient_id === ingredient.ingredient_id);
      return row && !row.isApprox && !row.isStaple;
    });

    setIsProcessing(true);

    try {
      const consumption = consumeIngredientsFromPantry(consumableIngredients, pantryItems as PantryItem[]);
      await Promise.all(
        consumption.consumed.map((entry) => consumeItem(entry.pantryItemId, entry.consumedQuantity))
      );

      if (mode === 'pantry-plus' && missingItems.length > 0) {
        let targetListId = activeList?.id;
        if (!targetListId) {
          const newList = await createList('Mi Lista de Compras', true);
          if (newList) targetListId = newList.id;
        }

        if (!targetListId) {
          toast.error('No se pudo crear una lista de compras');
        } else {
          await Promise.all(
            missingItems.map((item) =>
              addItem(
                {
                  name: item.ingredient_name,
                  quantity: item.missingQuantity > 0 ? Math.ceil(item.missingQuantity) : item.quantity,
                  unit: item.unit || 'unidad',
                  category: 'otros',
                  checked: false
                },
                targetListId
              )
            )
          );
        }
      }

      setActionComplete(true);
      toast.success(
        mode === 'pantry-only'
          ? 'Ingredientes consumidos de la despensa'
          : 'Despensa actualizada y faltantes agregados'
      );

      setTimeout(() => setActionComplete(false), 2500);
    } catch (error) {
      console.error('Error using ingredients:', error);
      toast.error('No se pudo actualizar la despensa');
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  const requestAction = (mode: 'pantry-only' | 'pantry-plus') => {
    if (requireConfirmation) {
      setPendingAction(mode);
      return;
    }

    handleUseIngredients(mode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            style={{
              ['--accent' as any]: '#0A84FF',
              ['--mint' as any]: '#34C759',
              ['--warm' as any]: '#FF9F0A'
            }}
            className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[32px] shadow-2xl dark:shadow-black/40 relative bg-white dark:bg-slate-900 flex flex-col md:flex-row"
          >
            {/* IMAGE SIDE / HEADER */}
            <div className="w-full md:w-2/5 h-52 md:h-auto bg-slate-100 dark:bg-slate-800 relative">
              {recipe.image ? (
                <img src={recipe.image} className="w-full h-full object-cover" alt={recipe.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                  <ChefHat size={48} className="text-slate-400 dark:text-slate-500 opacity-50" />
                </div>
              )}

              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 md:hidden"
              >
                <X size={20} />
              </button>

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 block">
                  {format(day, 'EEEE', { locale: es })} • {mealType}
                </span>
                <h2 className="text-white text-xl font-bold leading-tight">{recipe.name}</h2>
              </div>
            </div>

            {/* CONTENT SIDE */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-900">
              <button
                onClick={onClose}
                className="hidden md:block absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 z-10"
              >
                <X size={20} className="opacity-50 dark:text-white" />
              </button>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Stats */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-full bg-slate-100 dark:bg-white/10 dark:text-white">
                    <Flame size={16} className="text-orange-500" />
                    {recipe.nutrition?.calories || 0} kcal
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-full bg-slate-100 dark:bg-white/10 dark:text-white">
                    <Clock size={16} className="text-slate-600 dark:text-gray-400" />
                    {recipe.prepTime || 0} min
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
                    <div className="text-xs uppercase tracking-wide opacity-60 dark:text-gray-400">Faltantes</div>
                    <div className="text-2xl font-bold text-orange-500 mt-1">{summary.missingCount}</div>
                  </div>
                  <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <div className="text-xs uppercase tracking-wide opacity-60 dark:text-gray-400">Basicos</div>
                    <div className="text-2xl font-bold text-slate-700 dark:text-white mt-1">{summary.stapleCount}</div>
                  </div>
                  <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <div className="text-xs uppercase tracking-wide opacity-60 dark:text-gray-400">Aprox</div>
                    <div className="text-2xl font-bold text-slate-600 dark:text-gray-300 mt-1">{summary.approxCount}</div>
                  </div>
                </div>

                {/* Ingredients Section */}
                <div>
                  <h3 className="text-base font-bold mb-3 dark:text-white">Ingredientes</h3>
                  <div className="space-y-2">
                    {ingredientRows.map((ingredient) => {
                      const quantityLabel = ingredient.quantity ? `${ingredient.quantity} ${ingredient.unit}` : ingredient.unit;

                      let statusLabel = 'Comprar';
                      let statusStyle = 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400';
                      let rowStyle = 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20';

                      if (ingredient.isApprox || ingredient.isStaple) {
                        statusLabel = ingredient.isApprox ? 'Aprox' : 'Basico';
                        statusStyle = 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-400';
                        rowStyle = 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10';
                      } else if (ingredient.sufficient) {
                        statusLabel = 'En despensa';
                        statusStyle = 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400';
                        rowStyle = 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
                      }

                      return (
                        <div
                          key={ingredient.id}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${rowStyle}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm dark:text-white">{ingredient.ingredient_name}</div>
                            <div className="text-[11px] opacity-60 dark:text-gray-400">
                              {quantityLabel || 'Cantidad no especificada'}
                            </div>
                            {!ingredient.isApprox && !ingredient.isStaple && !ingredient.sufficient && ingredient.missingQuantity > 0 && (
                              <div className="text-[11px] text-orange-600 dark:text-orange-400 mt-1">
                                Falta: {Math.ceil(ingredient.missingQuantity)} {ingredient.unit}
                              </div>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {summary.approxCount > 0 && (
                    <p className="text-xs opacity-50 mt-3 dark:text-gray-400">
                      Ingredientes "aprox" no se descuentan ni se agregan a compras.
                    </p>
                  )}
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-base font-bold mb-3 dark:text-white">Pasos</h3>
                  {recipe.instructions?.length ? (
                    <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed dark:text-gray-300">
                      {recipe.instructions.map((step, index) => (
                        <li key={`${recipe.id}-step-${index}`} className="opacity-80">
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm opacity-60 dark:text-gray-400">No hay instrucciones disponibles.</p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t border-gray-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between text-xs opacity-70 dark:text-gray-400">
                  <span>Confirmar siempre antes de usar ingredientes</span>
                  <button
                    onClick={() => setRequireConfirmation((prev) => !prev)}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors ${requireConfirmation ? 'bg-slate-700 dark:bg-white' : 'bg-gray-300 dark:bg-white/20'}`}
                  >
                    <span className={`h-4 w-4 rounded-full bg-white dark:bg-slate-900 shadow-sm transform transition-transform ${requireConfirmation ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                {pendingAction && (
                  <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 text-xs">
                    <div className="font-semibold mb-1 dark:text-white">Confirmar accion</div>
                    <div className="opacity-70 dark:text-gray-400">
                      {pendingAction === 'pantry-only'
                        ? 'Se descontaran ingredientes disponibles en la despensa.'
                        : `Se descontara la despensa y se agregaran ${missingItems.length} faltantes.`}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleUseIngredients(pendingAction)}
                        className="flex-1 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-gray-800 dark:hover:bg-gray-200"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setPendingAction(null)}
                        className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => requestAction('pantry-only')}
                    disabled={isProcessing || actionComplete}
                    className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 hover:scale-[1.01] transition-all"
                  >
                    <ShoppingBag size={18} />
                    Usar despensa
                  </button>
                  <button
                    onClick={() => requestAction('pantry-plus')}
                    disabled={isProcessing || actionComplete || missingItems.length === 0}
                    className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.01] transition-all disabled:opacity-60"
                  >
                    <Sparkles size={18} />
                    Despensa + faltantes
                  </button>
                </div>

                {actionComplete && (
                  <p className="text-center text-xs opacity-60 dark:text-gray-400">
                    Accion completada correctamente.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
