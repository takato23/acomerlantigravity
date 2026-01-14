import React from 'react';
import { Flame, Star, Zap, TrendingUp, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StatsWidgetProps {
    greeting: string;
    currentDate: Date;
    stats: {
        completedMeals: number;
        totalCalories: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        streak?: number;
    };
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ greeting, currentDate, stats }) => {
    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div>
                <h1 className="text-3xl text-slate-900 dark:text-white font-black tracking-tighter mb-1">
                    {greeting}, Chef.
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Calories */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-500/5 rounded-xl border border-orange-200 dark:border-orange-500/20">
                    <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="block text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">Calorías</span>
                        <span className="font-bold text-sm text-orange-700 dark:text-orange-300">{stats.totalCalories.toLocaleString()}</span>
                    </div>
                </div>

                {/* Protein */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-500/10 dark:to-red-500/5 rounded-xl border border-red-200 dark:border-red-500/20">
                    <Zap className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="block text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Proteína</span>
                        <span className="font-bold text-sm text-red-700 dark:text-red-300">{stats.protein || 0}g</span>
                    </div>
                </div>

                {/* Carbs */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 rounded-xl border border-blue-200 dark:border-blue-500/20">
                    <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Carbs</span>
                        <span className="font-bold text-sm text-blue-700 dark:text-blue-300">{stats.carbs || 0}g</span>
                    </div>
                </div>

                {/* Fat */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-500/10 dark:to-yellow-500/5 rounded-xl border border-yellow-200 dark:border-yellow-500/20">
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <span className="block text-[10px] text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider">Grasas</span>
                        <span className="font-bold text-sm text-yellow-700 dark:text-yellow-300">{stats.fat || 0}g</span>
                    </div>
                </div>

                {/* Streak */}
                {stats.streak !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/10 dark:to-purple-500/5 rounded-xl border border-purple-200 dark:border-purple-500/20">
                        <Trophy className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <div className="min-w-0">
                            <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Racha</span>
                            <span className="font-bold text-sm text-purple-700 dark:text-purple-300">{stats.streak} días</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
