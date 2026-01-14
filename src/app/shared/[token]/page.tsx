'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar,
    ChefHat,
    Flame,
    Clock,
    Users,
    Sparkles,
    Coffee,
    Sandwich,
    Apple,
    MoonStar,
    Share2,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';

import { useSharePlan } from '@/features/sharing/hooks/useSharePlan';
import type { WeekPlan, MealSlot, MealType } from '@/features/meal-planning/types';

const MEAL_CONFIG: Record<MealType, { label: string; icon: React.ElementType; color: string }> = {
    desayuno: { label: 'Desayuno', icon: Coffee, color: 'bg-amber-500' },
    almuerzo: { label: 'Almuerzo', icon: Sandwich, color: 'bg-blue-500' },
    merienda: { label: 'Merienda', icon: Apple, color: 'bg-green-500' },
    cena: { label: 'Cena', icon: MoonStar, color: 'bg-purple-500' }
};

const MEAL_ORDER: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

interface SharedPlanPageProps {
    params: { token: string };
}

export default function SharedPlanPage({ params }: SharedPlanPageProps) {
    const { getSharedPlan } = useSharePlan();
    const [plan, setPlan] = useState<WeekPlan | null>(null);
    const [planTitle, setPlanTitle] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadPlan() {
            try {
                const sharedPlan = await getSharedPlan(params.token);
                if (!sharedPlan) {
                    setError('Este plan no existe o ya no está disponible');
                    return;
                }
                setPlan(sharedPlan.plan_snapshot);
                setPlanTitle(sharedPlan.title || 'Plan compartido');
            } catch (err) {
                setError('Error al cargar el plan');
            } finally {
                setIsLoading(false);
            }
        }

        loadPlan();
    }, [params.token, getSharedPlan]);

    const getSlotsForDay = (dayIndex: number): MealSlot[] => {
        if (!plan?.slots) return [];
        const startDate = parseISO(plan.startDate);
        const targetDate = format(addDays(startDate, dayIndex), 'yyyy-MM-dd');
        return plan.slots.filter(slot => slot.date === targetDate);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (error || !plan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center max-w-md mx-4">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-6">
                        <AlertCircle className="text-red-500" size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Plan no encontrado
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error || 'El link que seguiste puede haber expirado o ser incorrecto.'}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                    >
                        <Sparkles size={18} />
                        Crear mi propio plan
                    </Link>
                </div>
            </div>
        );
    }

    const startDate = parseISO(plan.startDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 pb-24">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <Share2 className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {planTitle}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Semana del {format(startDate, 'd MMM', { locale: es })} - {format(addDays(startDate, 6), 'd MMM yyyy', { locale: es })}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/planificador"
                            className="px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        >
                            <Sparkles size={16} />
                            <span className="hidden sm:inline">Usar este plan</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Plan Grid */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="space-y-4">
                    {weekDays.map((day, dayIndex) => {
                        const daySlots = getSlotsForDay(dayIndex);

                        return (
                            <motion.div
                                key={dayIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: dayIndex * 0.05 }}
                                className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-black/20 overflow-hidden"
                            >
                                {/* Day Header */}
                                <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-100 dark:border-white/10">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-orange-500" />
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {format(day, 'EEEE', { locale: es })}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {format(day, 'd MMM', { locale: es })}
                                        </span>
                                    </div>
                                </div>

                                {/* Meals */}
                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                    {MEAL_ORDER.map(mealType => {
                                        const slot = daySlots.find(s => s.mealType === mealType);
                                        const config = MEAL_CONFIG[mealType];
                                        const Icon = config.icon;

                                        return (
                                            <div key={mealType} className="flex items-center gap-4 p-4">
                                                <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
                                                    <Icon size={18} className="text-white" />
                                                </div>

                                                {slot?.recipe ? (
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                                            {slot.recipe.name}
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {slot.recipe.nutrition?.calories && (
                                                                <span className="flex items-center gap-1">
                                                                    <Flame size={12} className="text-orange-500" />
                                                                    {slot.recipe.nutrition.calories} kcal
                                                                </span>
                                                            )}
                                                            {slot.recipe.prepTime && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    {slot.recipe.prepTime} min
                                                                </span>
                                                            )}
                                                            {slot.recipe.servings && (
                                                                <span className="flex items-center gap-1">
                                                                    <Users size={12} />
                                                                    {slot.recipe.servings}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1">
                                                        <span className="text-gray-400 dark:text-gray-500 text-sm">
                                                            {config.label} - Sin planificar
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* CTA Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 p-4 safe-area-pb">
                <div className="max-w-6xl mx-auto">
                    <Link
                        href="/planificador"
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                    >
                        <Sparkles size={20} />
                        Crear mi propio plan con IA
                    </Link>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                        ¿Qué carajo como? - Planificación inteligente de comidas
                    </p>
                </div>
            </div>
        </div>
    );
}
