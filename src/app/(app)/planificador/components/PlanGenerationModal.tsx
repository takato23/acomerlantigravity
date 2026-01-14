'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  Leaf,
  X,
  ClipboardList,
  Store
} from 'lucide-react';

import { useGeminiMealPlanner } from '@/features/meal-planning/hooks/useGeminiMealPlanner';
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import { useMealPlanHistory } from '@/hooks/useMealPlanHistory';
import { useMonetization } from '@/features/monetization/MonetizationProvider';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics/mixpanel';
import type { MealType as PlannerMealType } from '@/features/meal-planning/types';
import type { UserPreferences, PlanningConstraints } from '@/lib/types/mealPlanning';

interface PlanGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WEEK_DAYS = [
  { label: 'Lun', index: 0 },
  { label: 'Mar', index: 1 },
  { label: 'Mie', index: 2 },
  { label: 'Jue', index: 3 },
  { label: 'Vie', index: 4 },
  { label: 'Sab', index: 5 },
  { label: 'Dom', index: 6 }
];

const MEAL_TYPE_OPTIONS = [
  { key: 'breakfast', label: 'Desayuno', esKey: 'desayuno' },
  { key: 'lunch', label: 'Almuerzo', esKey: 'almuerzo' },
  { key: 'snack', label: 'Merienda', esKey: 'merienda' },
  { key: 'dinner', label: 'Cena', esKey: 'cena' }
] as const;

type MealTypeOption = typeof MEAL_TYPE_OPTIONS[number]['key'];

type PantryMode = 'pantry-only' | 'allow-missing';

const STAPLE_SUGGESTIONS = [
  'sal',
  'aceite',
  'azucar',
  'harina',
  'pimienta',
  'vinagre',
  'levadura',
  'mate',
  'cafe'
];

export function PlanGenerationModal({ isOpen, onClose, onSuccess }: PlanGenerationModalProps) {
  const { generateWeeklyPlan, applyGeneratedPlan } = useGeminiMealPlanner();
  const { currentDate, currentWeekPlan, staples, setStaples } = useMealPlanningStore();
  const pantryItems = usePantryStore((state) => state.items);
  const { saveToHistory } = useMealPlanHistory();
  const { checkAccess, trackAction, getRemainingQuota } = useMonetization();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'config' | 'generating'>('config');
  const [generationStep, setGenerationStep] = useState(0);

  // -- FORM STATE --
  const [weeks, setWeeks] = useState(1);
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState<string>('');
  const [diet, setDiet] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<boolean[]>(Array(7).fill(true));
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealTypeOption[]>([
    'breakfast',
    'lunch',
    'snack',
    'dinner'
  ]);
  const [pantryMode, setPantryMode] = useState<PantryMode>('allow-missing');
  const [preferredIngredients, setPreferredIngredients] = useState('');
  const [avoidIngredients, setAvoidIngredients] = useState('');
  const [customStaple, setCustomStaple] = useState('');

  const selectedMealTypesEs: PlannerMealType[] = useMemo(() => {
    return MEAL_TYPE_OPTIONS
      .filter(option => selectedMealTypes.includes(option.key))
      .map(option => option.esKey as PlannerMealType);
  }, [selectedMealTypes]);

  const pantryItemNames = useMemo(() => {
    return pantryItems.map((item) => item.ingredient_name);
  }, [pantryItems]);

  const summary = useMemo(() => {
    const activeDays = selectedDays.filter(Boolean).length;
    const mealsPerDay = selectedMealTypes.length;
    const totalMeals = activeDays * mealsPerDay * weeks;

    return {
      activeDays,
      mealsPerDay,
      totalMeals
    };
  }, [selectedDays, selectedMealTypes, weeks]);

  const isValid = selectedMealTypes.length > 0 && selectedDays.some(Boolean);

  const toggleDay = (index: number) => {
    setSelectedDays((prev) => prev.map((value, idx) => (idx === index ? !value : value)));
  };

  const toggleMealType = (mealType: MealTypeOption) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealType) ? prev.filter((type) => type !== mealType) : [...prev, mealType]
    );
  };

  const toggleDiet = (d: string) => {
    setDiet((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const toggleStaple = (name: string) => {
    if (staples.includes(name)) {
      setStaples(staples.filter((item) => item !== name));
      return;
    }
    setStaples([...staples, name]);
  };

  const handleAddCustomStaple = () => {
    const normalized = customStaple.trim().toLowerCase();
    if (!normalized || staples.includes(normalized)) return;
    setStaples([...staples, normalized]);
    setCustomStaple('');
  };

  const buildExcludedDates = (weekStart: Date) => {
    const excluded: string[] = [];
    selectedDays.forEach((enabled, index) => {
      if (!enabled) {
        excluded.push(format(addDays(weekStart, index), 'yyyy-MM-dd'));
      }
    });
    return excluded;
  };

  // -- HANDLERS --
  const handleGenerate = async () => {
    if (!isValid) {
      return;
    }

    // Check quota before generating
    const canGenerate = await checkAccess('weekly_plan');
    if (!canGenerate) {
      return; // UpgradeModal will be shown automatically
    }

    setLoading(true);
    setStep('generating');

    try {
      const preferredIngredientList = preferredIngredients
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const avoidIngredientList = avoidIngredients
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const budgetValue = budget ? Number(budget) : undefined;
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

      for (let weekIndex = 0; weekIndex < weeks; weekIndex += 1) {
        setGenerationStep(weekIndex + 1);

        const startDate = addDays(weekStart, weekIndex * 7);
        const endDate = addDays(startDate, 6);
        const excludedDates = buildExcludedDates(startDate);

        const preferences: Partial<UserPreferences> & { preferredIngredients?: string[]; staples?: string[] } = {
          householdSize: people,
          dietaryRestrictions: diet as any[],
          weeklyBudget: budgetValue,
          preferredMealTypes: selectedMealTypes as any[],
          avoidIngredients: avoidIngredientList,
          planningStrategy: pantryMode === 'pantry-only' ? 'pantry-focused' : 'nutrition-focused'
        };

        if (preferredIngredientList.length > 0) {
          preferences.preferredIngredients = preferredIngredientList;
        }
        preferences.staples = staples;

        const constraints: Partial<PlanningConstraints> = {
          startDate,
          endDate,
          mealTypes: selectedMealTypes as any[],
          servings: people,
          budgetLimit: budgetValue,
          pantryItems: pantryItemNames
        };

        const result = await generateWeeklyPlan(preferences, constraints, {
          analysisDepth: pantryMode === 'pantry-only' ? 'deep_dive' : 'comprehensive'
        });

        if (!result.success || !result.data) {
          setStep('config');
          setLoading(false);
          return;
        }

        await applyGeneratedPlan(result.data, {
          excludedDates,
          allowedMealTypes: selectedMealTypesEs
        });
      }

      // Save to history after successful generation
      // Wait a moment for the store to be updated
      setTimeout(async () => {
        const updatedPlan = useMealPlanningStore.getState().currentWeekPlan;
        if (updatedPlan) {
          await saveToHistory(updatedPlan);
        }
      }, 500);

      // Track plan generation success
      trackEvent(AnalyticsEvents.PLAN_GENERATED, {
        weeks,
        people,
        meal_types: selectedMealTypes,
        diet_preferences: diet,
        pantry_mode: pantryMode,
        total_meals: summary.totalMeals,
      });

      // Increment usage quota
      await trackAction('weekly_plan');

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Generation failed', error);
      setStep('config');
    } finally {
      setLoading(false);
      setGenerationStep(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            style={{
              ['--accent' as any]: '#0A84FF',
              ['--accent-2' as any]: '#111827',
              ['--warm' as any]: '#FF9F0A'
            }}
            className="ios26-card w-full max-w-2xl lg:max-w-4xl relative overflow-hidden z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-t-[32px] md:rounded-[32px] max-h-[90vh]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-20"
            >
              <X size={20} className="opacity-50 dark:text-white" />
            </button>

            {step === 'config' && (
              <div className="relative z-10">
                <div className="px-6 pt-8 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#111827] to-[#0A84FF] flex items-center justify-center shadow-lg shadow-black/30">
                      <Sparkles className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold dark:text-white">Configurar Plan</h2>
                      <p className="text-sm opacity-60 dark:text-gray-400">Planifica la semana a tu manera, con despensa real.</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 max-h-[68vh] overflow-y-auto">
                  <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
                    {/* Left column */}
                    <div className="space-y-5">
                      {/* Weeks & People */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4">
                          <label className="text-xs font-semibold opacity-50 dark:text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            <Calendar size={12} /> Semanas
                          </label>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setWeeks((value) => Math.max(1, value - 1))}
                              className="w-8 h-8 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center font-bold text-lg hover:scale-105 transition-transform dark:text-white"
                            >
                              -
                            </button>
                            <span className="text-2xl font-bold dark:text-white">{weeks}</span>
                            <button
                              onClick={() => setWeeks((value) => Math.min(4, value + 1))}
                              className="w-8 h-8 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center font-bold text-lg hover:scale-105 transition-transform dark:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4">
                          <label className="text-xs font-semibold opacity-50 dark:text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            <Users size={12} /> Personas
                          </label>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setPeople((value) => Math.max(1, value - 1))}
                              className="w-8 h-8 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center font-bold text-lg hover:scale-105 transition-transform dark:text-white"
                            >
                              -
                            </button>
                            <span className="text-2xl font-bold dark:text-white">{people}</span>
                            <button
                              onClick={() => setPeople((value) => Math.min(10, value + 1))}
                              className="w-8 h-8 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center font-bold text-lg hover:scale-105 transition-transform dark:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Day selection */}
                      <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4">
                        <label className="text-xs font-semibold opacity-50 dark:text-gray-400 uppercase tracking-wider mb-3 block flex items-center gap-1">
                          <ClipboardList size={12} /> Dias activos
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {WEEK_DAYS.map((day, index) => {
                            const selected = selectedDays[index];
                            const dateLabel = format(
                              addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), index),
                              'd',
                              { locale: es }
                            );

                            return (
                              <button
                                key={day.label}
                                onClick={() => toggleDay(index)}
                                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold transition-all border ${selected
                                  ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-lg'
                                  : 'bg-transparent border-gray-300 dark:border-white/20 opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white'
                                  }`}
                              >
                                <span className="uppercase tracking-wide">{day.label}</span>
                                <span className="text-sm font-bold">{dateLabel}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Meal types */}
                      <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4">
                        <label className="text-xs font-semibold opacity-50 dark:text-gray-400 uppercase tracking-wider mb-3 block flex items-center gap-1">
                          <Sparkles size={12} /> Comidas por defecto
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {MEAL_TYPE_OPTIONS.map((meal) => {
                            const selected = selectedMealTypes.includes(meal.key);
                            return (
                              <button
                                key={meal.key}
                                onClick={() => toggleMealType(meal.key)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${selected
                                  ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-lg'
                                  : 'bg-transparent border-gray-300 dark:border-white/20 opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white'
                                  }`}
                              >
                                {meal.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4 flex items-center gap-3">
                        <DollarSign className="opacity-50 dark:text-gray-400" />
                        <input
                          type="number"
                          placeholder="Presupuesto semanal (opcional)"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="bg-transparent font-medium w-full outline-none placeholder:opacity-50 dark:text-white dark:placeholder:text-gray-500"
                        />
                      </div>

                      {/* Diet Tags */}
                      <div>
                        <label className="text-xs font-semibold opacity-50 dark:text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                          <Leaf size={12} /> Preferencias
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['vegetarian', 'vegan', 'gluten-free', 'keto', 'low-carb'].map((tag) => (
                            <button
                              key={tag}
                              onClick={() => toggleDiet(tag)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${diet.includes(tag)
                                ? 'bg-green-600 text-white border-transparent shadow-lg'
                                : 'bg-transparent border-gray-300 dark:border-white/20 opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white'
                                }`}
                            >
                              {tag.replace('-', ' ').toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pantry mode */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => setPantryMode('pantry-only')}
                          className={`text-left rounded-2xl p-4 border transition-all ${pantryMode === 'pantry-only'
                            ? 'border-transparent bg-black dark:bg-white text-white dark:text-black shadow-lg'
                            : 'border-gray-300 dark:border-white/20 bg-transparent opacity-70 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Store size={16} /> Solo despensa
                          </div>
                          <p className="text-xs mt-2 opacity-80">
                            Limita el plan a lo que ya tenes disponible.
                          </p>
                        </button>
                        <button
                          onClick={() => setPantryMode('allow-missing')}
                          className={`text-left rounded-2xl p-4 border transition-all ${pantryMode === 'allow-missing'
                            ? 'border-transparent bg-black dark:bg-white text-white dark:text-black shadow-lg'
                            : 'border-gray-300 dark:border-white/20 bg-transparent opacity-70 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white'
                            }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <Store size={16} /> Despensa + faltantes
                          </div>
                          <p className="text-xs mt-2 opacity-80">
                            Permite ingredientes a comprar si faltan.
                          </p>
                        </button>
                      </div>

                      {/* Ingredient preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4">
                          <label className="text-xs font-semibold opacity-50 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                            Ingredientes preferidos
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: pollo, tomate, arroz"
                            value={preferredIngredients}
                            onChange={(e) => setPreferredIngredients(e.target.value)}
                            className="bg-transparent font-medium w-full outline-none placeholder:opacity-50 text-sm dark:text-white dark:placeholder:text-gray-500"
                          />
                        </div>
                        <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4">
                          <label className="text-xs font-semibold opacity-50 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                            Ingredientes a evitar
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: gluten, cerdo"
                            value={avoidIngredients}
                            onChange={(e) => setAvoidIngredients(e.target.value)}
                            className="bg-transparent font-medium w-full outline-none placeholder:opacity-50 text-sm dark:text-white dark:placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      {/* Staples */}
                      <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4">
                        <label className="text-xs font-semibold opacity-50 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                          Basicos disponibles
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {STAPLE_SUGGESTIONS.map((item) => (
                            <button
                              key={item}
                              onClick={() => toggleStaple(item)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${staples.includes(item)
                                ? 'bg-orange-500 text-white border-transparent shadow-lg'
                                : 'bg-transparent border-gray-300 dark:border-white/20 opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white'
                                }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Agregar basico"
                            value={customStaple}
                            onChange={(e) => setCustomStaple(e.target.value)}
                            className="bg-transparent font-medium w-full outline-none placeholder:opacity-50 text-sm dark:text-white dark:placeholder:text-gray-500"
                          />
                          <button
                            onClick={handleAddCustomStaple}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right column summary */}
                    <div className="space-y-4">
                      <div className="rounded-3xl p-5 bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <h3 className="text-sm font-semibold opacity-70 dark:text-gray-300 mb-3">Resumen</h3>
                        <div className="space-y-3 text-sm dark:text-white">
                          <div className="flex items-center justify-between">
                            <span className="opacity-60 dark:text-gray-400">Semanas</span>
                            <span className="font-semibold">{weeks}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="opacity-60 dark:text-gray-400">Dias activos</span>
                            <span className="font-semibold">{summary.activeDays}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="opacity-60 dark:text-gray-400">Comidas por dia</span>
                            <span className="font-semibold">{summary.mealsPerDay}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="opacity-60 dark:text-gray-400">Total comidas</span>
                            <span className="font-semibold">{summary.totalMeals}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl p-5 border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <h3 className="text-sm font-semibold opacity-70 dark:text-gray-300 mb-3">Modo despensa</h3>
                        <div className="text-sm font-semibold dark:text-white">
                          {pantryMode === 'pantry-only' ? 'Solo despensa' : 'Despensa + faltantes'}
                        </div>
                        <p className="text-xs opacity-60 dark:text-gray-400 mt-2">
                          {pantryMode === 'pantry-only'
                            ? 'El plan evita ingredientes fuera de tu inventario.'
                            : 'Se permiten faltantes para sumar a tu lista de compras.'}
                        </p>
                      </div>

                      <div className="rounded-3xl p-5 border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <h3 className="text-sm font-semibold opacity-70 dark:text-gray-300 mb-3">Basicos activos</h3>
                        {staples.length ? (
                          <div className="flex flex-wrap gap-2">
                            {staples.map((item) => (
                              <span
                                key={item}
                                className="px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 dark:text-white"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs opacity-60 dark:text-gray-400">Agrega tus basicos para mejorar el plan.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={handleGenerate}
                    disabled={!isValid || loading}
                    className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles size={20} />
                      Generar Plan
                    </span>
                  </button>
                  {!isValid && (
                    <p className="text-xs opacity-60 dark:text-gray-400 mt-2 text-center">
                      Selecciona al menos un dia y una comida.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 'generating' && (
              <div className="flex flex-col items-center justify-center py-12 relative z-10">
                <div className="w-20 h-20 rounded-full border-4 border-t-slate-700 dark:border-t-white border-r-green-500 border-b-transparent border-l-transparent animate-spin mb-6" />
                <h3 className="text-xl font-bold mb-2 dark:text-white">Consultando al Chef IA...</h3>
                <p className="text-center opacity-60 dark:text-gray-400 max-w-[240px]">
                  Generando semana {generationStep || 1} de {weeks}
                </p>
              </div>
            )}

            {/* Background Gradients */}
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-slate-100/50 dark:bg-purple-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-32 w-72 h-72 bg-orange-100/30 dark:bg-orange-500/10 blur-3xl" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
