'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { MealCard, MealSlotType } from './MealCard';

interface DesktopWeekViewProps {
    currentDate: Date;
    mealsData: Record<string, Record<MealSlotType, any>>; // dateKey -> meals
    onAddMeal: (date: Date, type: MealSlotType) => void;
    onRemoveMeal: (date: Date, type: MealSlotType) => void;
    onRegenerateMeal: (date: Date, type: MealSlotType) => void;
    onViewMeal: (date: Date, type: MealSlotType) => void;
}

export function DesktopWeekView({
    currentDate,
    mealsData,
    onAddMeal,
    onRemoveMeal,
    onRegenerateMeal,
    onViewMeal
}: DesktopWeekViewProps) {
    // Always show the week containing the currentDate
    // Note: WeekStrip might be showing a different range, but usually desktop calendar locks to weeks.
    // Let's align to Monday of the current date's week.
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const slots: MealSlotType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

    return (
        <div className="w-full h-full overflow-hidden flex flex-col">
            {/* Header Row: Days */}
            <div className="grid grid-cols-7 gap-4 mb-4">
                {days.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, currentDate);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`
                text-center p-3 rounded-xl transition-colors
                ${isToday ? 'bg-slate-100 text-slate-900' : 'bg-white/80 text-gray-600'}
                ${isSelected ? 'ring-2 ring-slate-700' : ''}
              `}
                        >
                            <div className="text-xs font-medium uppercase opacity-70 mb-1">
                                {format(day, 'EEEE', { locale: es })}
                            </div>
                            <div className="text-xl font-bold">
                                {format(day, 'd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid: Meals */}
            <div className="grid grid-cols-7 gap-4 flex-1 overflow-y-auto pb-20">
                {days.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayMeals = mealsData[dateKey] || {};

                    return (
                        <div key={day.toISOString()} className="flex flex-col gap-3 min-h-[600px]">
                            {slots.map((slot) => {
                                const meal = dayMeals[slot];
                                return (
                                    <div key={`${dateKey}-${slot}`} className="flex-1 min-h-[140px]">
                                        <div className="h-full">
                                            {/* We pass a modified version or wrapper to MealCard if needed, 
                               but MealCard is designed to be somewhat self-contained. 
                               For desktop, we might want a more compact variant?
                               Actually, let's use the same card but let it fill width.
                           */}
                                            <MealCard
                                                type={slot}
                                                title={meal?.title}
                                                image={meal?.image}
                                                prepTime={meal?.prepTime}
                                                calories={meal?.calories}
                                                onAdd={() => onAddMeal(day, slot)}
                                                onRemove={() => onRemoveMeal(day, slot)}
                                                onRegenerate={() => onRegenerateMeal(day, slot)}
                                                onView={() => onViewMeal(day, slot)}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
