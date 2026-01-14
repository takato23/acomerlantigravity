'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { Sparkles, ChevronLeft, ChevronRight, Plus, Eye, Trash2, Wand2, ChefHat, RefreshCw, Coffee, Sandwich, Apple, MoonStar, Clock, Users, Download, Share2 } from 'lucide-react';

// Code-split heavy modals for better initial load
const PlanGenerationModal = dynamic(
  () => import('./components/PlanGenerationModal').then(mod => ({ default: mod.PlanGenerationModal })),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-96 w-full" /> }
);
const MealDetailModal = dynamic(
  () => import('./components/MealDetailModal').then(mod => ({ default: mod.MealDetailModal })),
  { ssr: false }
);
const RecipeSelectionModal = dynamic(
  () => import('@/features/meal-planning/components/RecipeSelectionModal').then(mod => ({ default: mod.RecipeSelectionModal })),
  { ssr: false }
);
const ChefAIChat = dynamic(
  () => import('@/features/chef-ai/components/ChefAIChat').then(mod => ({ default: mod.ChefAIChat })),
  { ssr: false }
);
const ChefAIChatButton = dynamic(
  () => import('@/features/chef-ai/components/ChefAIChat').then(mod => ({ default: mod.ChefAIChatButton })),
  { ssr: false }
);

// Store & Hooks
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';
import { useGeminiMealPlanner } from '@/features/meal-planning/hooks/useGeminiMealPlanner';
import { MealSlot, Recipe, MealType } from '@/features/meal-planning/types';
import { generateMealPlanPDF } from '@/features/meal-planning/components/ExportPlanPDF';
import { useSharePlan } from '@/features/sharing/hooks/useSharePlan';
import { useAuth } from '@/providers/SupabaseAuthProvider';

// Analytics
import { useAppAnalytics } from '@/providers/AnalyticsProvider';

// -- CONSTANTS --
const MEALS = [
  { key: "desayuno", label: "Desayuno", short: "Des", color: "bg-slate-900", icon: Coffee },
  { key: "almuerzo", label: "Almuerzo", short: "Alm", color: "bg-slate-700", icon: Sandwich },
  { key: "merienda", label: "Merienda", short: "Mer", color: "bg-slate-500", icon: Apple },
  { key: "cena", label: "Cena", short: "Cena", color: "bg-slate-800", icon: MoonStar },
] as const;

export default function UnifiedPlannerPage() {
  // Store
  const {
    currentWeekPlan,
    loadWeekPlan,
    removeMealFromSlot,
    isLoading
  } = useMealPlanningStore();

  const { generateSingleMeal } = useGeminiMealPlanner();
  const { createShareLink, isSharing } = useSharePlan();
  const { user } = useAuth();
  const router = useRouter();
  const { trackPlanGenerated, trackPlanShared, trackPdfDownloaded } = useAppAnalytics();

  // Local UI State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mobileViewDate, setMobileViewDate] = useState<Date>(new Date());
  const [openPopover, setOpenPopover] = useState<{ dayIndex: number; mealKey: MealType; slotId?: string } | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{ recipe: Recipe; day: Date; type: string } | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeModalSlot, setRecipeModalSlot] = useState<{ dayOfWeek: number; mealType: MealType; date: string } | null>(null);
  const [showChefChat, setShowChefChat] = useState(false);

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Derived
  const currentWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => addDays(currentWeekStart, idx));
  }, [currentWeekStart]);

  // Load plan on week change
  useEffect(() => {
    loadWeekPlan(format(currentWeekStart, 'yyyy-MM-dd'));
  }, [currentWeekStart, loadWeekPlan]);

  // Click Outside Popover
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (openPopover && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [openPopover]);

  // Handle post-login share intent
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const intentAction = sessionStorage.getItem('intent_action');
      const intentPlan = sessionStorage.getItem('intent_plan');

      if (intentAction === 'share_plan' && intentPlan) {
        try {
          const plan = JSON.parse(intentPlan);
          // Small delay to ensure UI is ready
          setTimeout(() => {
            createShareLink(plan);
            toast.success('¡Plan compartido exitosamente!');
          }, 500);
        } catch (e) {
          console.error('Failed to parse intent plan', e);
          toast.error('Error al restaurar tu plan');
        } finally {
          sessionStorage.removeItem('intent_action');
          sessionStorage.removeItem('intent_plan');
        }
      }
    }
  }, [user, createShareLink]);

  // Navigation Handlers
  const handleNavPrev = () => setCurrentDate(addDays(currentDate, -7));
  const handleNavNext = () => setCurrentDate(addDays(currentDate, 7));
  const isToday = (d: Date) => isSameDay(d, new Date());

  // Slot Logic
  const getSlot = (dayIndex: number, mealKey: MealType) => {
    if (!currentWeekPlan) return null;
    const targetDate = weekDays[dayIndex];
    // Use 'T00:00:00' suffix to force local timezone interpretation
    // Without it, new Date("2024-12-31") is parsed as UTC midnight,
    // which becomes Dec 30 21:00 in Argentina (UTC-3), causing off-by-one errors
    return currentWeekPlan.slots.find(
      s => isSameDay(new Date(s.date + 'T00:00:00'), targetDate) && s.mealType === mealKey
    );
  };

  const onCellOpen = (dayIndex: number, mealKey: MealType, slotId?: string) => {
    setOpenPopover({ dayIndex, mealKey, slotId });
  };

  const handleRemoveSlot = (slotId?: string) => {
    if (slotId) {
      removeMealFromSlot(slotId);
      setOpenPopover(null);
    }
  };

  const handleOpenDetail = (recipe: Recipe, day: Date, type: string) => {
    setSelectedMeal({ recipe, day, type });
    setOpenPopover(null);
  };

  const handleQuickGenerate = async (dayIndex: number, mealKey: MealType) => {
    setOpenPopover(null);
    await generateSingleMeal(dayIndex + 1, mealKey as any); // dayIndex 0 is Monday (1)
    // Removed loadWeekPlan: generateSingleMeal now updates store directly
  };

  const handleOpenRecipeModal = (dayIndex: number, mealKey: MealType) => {
    const targetDate = weekDays[dayIndex];
    setRecipeModalSlot({
      dayOfWeek: dayIndex,
      mealType: mealKey,
      date: format(targetDate, 'yyyy-MM-dd')
    });
    setShowRecipeModal(true);
    setOpenPopover(null);
  };

  return (
    <main className="min-h-screen pb-32 bg-white dark:bg-transparent">

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                Planificador
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 hidden md:block">
                {format(weekDays[0], 'd MMM', { locale: es })} - {format(weekDays[6], 'd MMM', { locale: es })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[11px] uppercase tracking-wider font-semibold text-gray-600 dark:text-gray-400">
                Semana activa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">Generar Plan</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                generateMealPlanPDF(currentWeekPlan, currentDate);
                trackPdfDownloaded('meal_plan');
              }}
              disabled={!currentWeekPlan?.slots?.length}
              title="Descargar PDF"
              className="p-2 rounded-full font-medium text-sm flex items-center justify-center bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!user) {
                  // Store intent to share after login
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('intent_action', 'share_plan');
                    if (currentWeekPlan) {
                      sessionStorage.setItem('intent_plan', JSON.stringify(currentWeekPlan));
                    }
                  }
                  router.push('/login?redirect=/planificador&action=share');
                  return;
                }

                if (currentWeekPlan) {
                  createShareLink(currentWeekPlan);
                  trackPlanShared('link');
                }
              }}
              disabled={!currentWeekPlan?.slots?.length || isSharing}
              title={!user ? "Inicia sesión para compartir tu plan" : "Compartir plan"}
              className="p-2 rounded-full font-medium text-sm flex items-center justify-center bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSharing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <Share2 size={16} />
              )}
            </motion.button>

            <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10 mx-2" />

            <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-white/10">
              <button onClick={handleNavPrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 text-sm font-semibold hover:text-orange-500 transition-colors text-gray-700 dark:text-gray-300">
                Hoy
              </button>
              <button onClick={handleNavNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE STRIP */}
        <div className="md:hidden py-2 px-4 overflow-x-auto hide-scrollbar flex gap-2 snap-x">
          {Array.from({ length: 14 }).map((_, i) => {
            const d = addDays(startOfWeek(mobileViewDate), i - 3);
            const selected = isSameDay(d, mobileViewDate);
            const today = isToday(d);
            return (
              <button
                key={i}
                onClick={() => setMobileViewDate(d)}
                className={clsx(
                  "flex-shrink-0 w-[56px] h-[72px] rounded-[18px] flex flex-col items-center justify-center snap-center transition-all border",
                  selected
                    ? "bg-orange-500 text-white border-transparent shadow-lg shadow-orange-500/30"
                    : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                )}
              >
                <span className={clsx("text-[11px] font-medium uppercase mb-1", selected ? "text-white/80" : "text-gray-500 dark:text-gray-400")}>
                  {format(d, 'EEE', { locale: es }).slice(0, 3)}
                </span>
                <span className={clsx("text-xl font-bold", selected ? "text-white" : "text-slate-900 dark:text-white")}>
                  {format(d, 'd')}
                </span>
                {today && !selected && <div className="mt-1 w-1 h-1 bg-orange-500 rounded-full" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">

        {/* LOADING STATE */}
        {isLoading && !currentWeekPlan && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        )}

        {/* DESKTOP GRID */}
        {!isLoading && (
          <div className="hidden md:block rounded-[28px] overflow-hidden shadow-xl dark:shadow-black/30 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
            {/* Header */}
            <div className="grid border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5" style={{ gridTemplateColumns: `220px repeat(7, 1fr)` }}>
              <div className="p-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center">Comidas</div>
              {weekDays.map((d, idx) => (
                <div key={idx} className="p-3 border-l border-gray-100 dark:border-white/10">
                  <div className={clsx(
                    "rounded-2xl px-3 py-2 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between gap-3",
                    isToday(d) && "ring-1 ring-orange-500/30 bg-orange-50 dark:bg-orange-500/10"
                  )}>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {format(d, 'EEE', { locale: es })}
                      </div>
                      <div className="text-lg font-semibold leading-none text-slate-900 dark:text-white">{format(d, 'd')}</div>
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-400">{format(d, 'MMM', { locale: es })}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="grid" style={{ gridTemplateColumns: `220px repeat(7, 1fr)` }}>
              {MEALS.map((meal, rIdx) => (
                <React.Fragment key={meal.key}>
                  {/* Label */}
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 font-bold text-sm flex items-center bg-gray-50/50 dark:bg-white/5 relative">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${meal.color}`} />
                    <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 px-3 py-3 shadow-sm w-full">
                      <div className={`w-9 h-9 rounded-2xl ${meal.color} flex items-center justify-center text-white shadow-md`}>
                        <meal.icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{meal.label}</div>
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{meal.short}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cells */}
                  {weekDays.map((d, cIdx) => {
                    const dayIndex = cIdx;
                    const slot = getSlot(dayIndex, meal.key);
                    const hasReference = !!slot?.recipe;
                    const recipe = slot?.recipe;

                    const isOpen = openPopover?.dayIndex === dayIndex && openPopover?.mealKey === meal.key;

                    return (
                      <div key={`${rIdx}-${cIdx}`} className={clsx("relative border-l border-b border-gray-100 dark:border-white/10 p-2 min-h-[160px] transition-colors hover:bg-gray-50 dark:hover:bg-white/5", isToday(d) && "bg-orange-50/50 dark:bg-orange-500/10")}>
                        {hasReference && recipe ? (
                          <motion.div
                            layoutId={`meal-${slot.id}`}
                            onClick={() => onCellOpen(dayIndex, meal.key, slot.id)}
                            className="h-full rounded-[18px] bg-white dark:bg-slate-800/80 p-3 shadow-lg dark:shadow-black/20 border border-gray-200 dark:border-white/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group relative overflow-hidden"
                          >
                            {/* Image Background (Subtle) */}
                            {recipe.image && (
                              <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15] bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${recipe.image})` }} />
                            )}

                            <div className="relative z-10">
                              <div className="font-semibold text-sm line-clamp-2 leading-tight mb-2 text-slate-900 dark:text-white">{recipe.name}</div>

                              {/* Nutrition Info */}
                              <div className="flex flex-wrap gap-1 mb-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-medium">
                                  {recipe.nutrition?.calories || '-'} kcal
                                </span>
                                {recipe.nutrition?.protein && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium">
                                    {recipe.nutrition.protein}g prot
                                  </span>
                                )}
                                {recipe.nutrition?.carbs && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
                                    {recipe.nutrition.carbs}g carb
                                  </span>
                                )}
                              </div>

                              {/* Time */}
                              <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-2">
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  {recipe.prepTime}m
                                </span>
                                {recipe.servings && (
                                  <span className="flex items-center gap-1">
                                    <Users size={10} />
                                    {recipe.servings}
                                  </span>
                                )}
                              </div>

                              {/* Tags */}
                              <div className="flex gap-1 flex-wrap">
                                {(recipe.dietaryLabels || []).slice(0, 2).map((tag: string) => (
                                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => onCellOpen(dayIndex, meal.key)}
                            className="w-full h-full rounded-[18px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center opacity-60 hover:opacity-100 hover:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all group"
                          >
                            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                              <Plus size={16} className="text-gray-500 dark:text-gray-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Agregar</span>
                          </button>
                        )}

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              ref={popoverRef}
                              className="absolute z-50 top-[80%] left-4 min-w-[220px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-black/40 rounded-xl p-1.5 flex flex-col gap-1"
                            >
                              {hasReference && recipe ? (
                                <>
                                  <button
                                    onClick={() => handleOpenDetail(recipe, d, meal.label)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium transition-colors text-slate-900 dark:text-white"
                                  >
                                    <Eye size={16} className="text-orange-500" /> Ver Detalles
                                  </button>
                                  <button onClick={() => { }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium transition-colors text-slate-900 dark:text-white">
                                    <RefreshCw size={16} className="text-gray-500 dark:text-gray-400" /> Regenerar
                                  </button>
                                  <div className="h-[1px] bg-gray-100 dark:bg-white/10 my-1" />
                                  <button onClick={() => handleRemoveSlot(slot?.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 flex items-center gap-2 text-sm font-medium transition-colors">
                                    <Trash2 size={16} /> Quitar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleOpenRecipeModal(dayIndex, meal.key)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium transition-colors text-slate-900 dark:text-white"
                                  >
                                    <ChefHat size={16} className="text-gray-500 dark:text-gray-400" /> Mis Recetas
                                  </button>
                                  <button
                                    onClick={() => handleQuickGenerate(dayIndex, meal.key)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium transition-colors text-slate-900 dark:text-white"
                                  >
                                    <Wand2 size={16} className="text-orange-500" /> Sugerencia IA
                                  </button>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* MOBILE VIEWS */}
        <div className="md:hidden space-y-4">
          {(() => {
            const dayIndex = weekDays.findIndex(d => isSameDay(d, mobileViewDate));
            const indexToUse = dayIndex >= 0 ? dayIndex : 0;

            return MEALS.map((meal) => {
              const slot = getSlot(indexToUse, meal.key);
              const recipe = slot?.recipe;

              return (
                <div key={meal.key} className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-sm rounded-[24px] p-5 relative overflow-hidden shadow-lg dark:shadow-black/20 border border-gray-200 dark:border-white/10">
                  {/* Decorative accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${meal.color}`} />

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${meal.color} flex items-center justify-center text-white`}>
                        <meal.icon size={14} />
                      </div>
                      <span className="font-bold text-lg text-slate-900 dark:text-white">{meal.label}</span>
                    </div>
                    {recipe && (
                      <button onClick={() => handleRemoveSlot(slot?.id)} className="text-red-500 opacity-50 hover:opacity-100 p-1">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {recipe ? (
                    <div className="flex gap-4 relative z-10">
                      <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-white/10 flex-shrink-0 bg-cover bg-center shadow-inner" style={{ backgroundImage: recipe.image ? `url(${recipe.image})` : undefined }} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight mb-2 truncate text-slate-900 dark:text-white">{recipe.name}</h3>

                        {/* Nutrition Badges */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-medium">
                            {recipe.nutrition?.calories || '-'} kcal
                          </span>
                          {recipe.nutrition?.protein && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium">
                              {recipe.nutrition.protein}g prot
                            </span>
                          )}
                        </div>

                        {/* Time & Servings */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {recipe.prepTime} min
                          </span>
                          {recipe.servings && (
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {recipe.servings} porc
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenDetail(recipe, mobileViewDate, meal.label)}
                          className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenRecipeModal(indexToUse, meal.key)}
                      className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/30 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                        <Plus size={20} />
                      </div>
                      <span className="font-bold text-sm tracking-wide">Agregar {meal.label}</span>
                    </button>
                  )}
                </div>
              );
            });
          })()}
        </div>

      </div>

      <PlanGenerationModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSuccess={() => loadWeekPlan(format(currentWeekStart, 'yyyy-MM-dd'))} // Refresh on success
      />

      {selectedMeal && (
        <MealDetailModal
          isOpen={!!selectedMeal}
          onClose={() => setSelectedMeal(null)}
          recipe={selectedMeal.recipe}
          day={selectedMeal.day}
          mealType={selectedMeal.type}
        />
      )}

      {showRecipeModal && recipeModalSlot && (
        <RecipeSelectionModal
          slot={recipeModalSlot}
          onClose={() => {
            setShowRecipeModal(false);
            setRecipeModalSlot(null);
            // Don't reload here as it overwrites optimistic updates before debounced save completes
          }}
        />
      )}

      {/* Chef AI Chat */}
      {!showChefChat && (
        <ChefAIChatButton onClick={() => setShowChefChat(true)} />
      )}

      {showChefChat && (
        <div className="fixed bottom-4 right-4 w-[400px] max-w-[90vw] z-50 shadow-2xl">
          <ChefAIChat onClose={() => setShowChefChat(false)} isOpen={showChefChat} />
        </div>
      )}

    </main>
  );
}
