import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Meal {
    id: string | number;
    meal: string;
    time: string;
    name: string;
    cals: number;
    done: boolean;
    current: boolean;
}

interface TodayPlanWidgetProps {
    meals: Meal[];
    onToggleMeal: (id: string | number) => void;
}

export const TodayPlanWidget: React.FC<TodayPlanWidgetProps> = ({ meals, onToggleMeal }) => {
    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl text-slate-900 dark:text-white font-black tracking-tighter flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Plan de Hoy
                </h2>
                <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white">Ver semana completa</Button>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden">
                {meals.map((meal) => (
                    <div
                        key={meal.id}
                        onClick={() => onToggleMeal(meal.id)}
                        className={cn(
                            "p-6 flex items-center gap-4 border-b border-gray-200 dark:border-white/10 last:border-0 transition-all cursor-pointer select-none",
                            meal.current ? "bg-orange-50/50 dark:bg-orange-500/10" : "hover:bg-white dark:hover:bg-white/5",
                            meal.done && "opacity-60 grayscale-[0.5]"
                        )}
                    >
                        <div className="w-16 text-center shrink-0">
                            <span className="block text-xs font-bold text-gray-400 mb-2">{meal.time}</span>
                            <div className={cn(
                                "mx-auto w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                meal.done
                                    ? "bg-orange-500 border-orange-500 text-white scale-110"
                                    : "bg-white dark:bg-slate-800 border-gray-300 dark:border-white/20 text-transparent hover:border-gray-400 dark:hover:border-white/40"
                            )}>
                                <Check className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{meal.meal}</p>
                            <h4 className={cn(
                                "font-bold text-lg text-slate-900 dark:text-white transition-all",
                                meal.done && "line-through text-gray-400 dark:text-gray-500"
                            )}>{meal.name}</h4>
                        </div>

                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
                            {meal.cals} cal
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
