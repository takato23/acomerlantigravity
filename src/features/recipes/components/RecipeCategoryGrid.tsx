'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Categories with consistent emoji icons
const defaultCategories = [
    {
        id: 'breakfast',
        name: 'Desayuno',
        emoji: '🍳',
        gradient: 'from-amber-400 to-orange-500',
        darkGradient: 'dark:from-amber-500/80 dark:to-orange-600/80',
    },
    {
        id: 'lunch',
        name: 'Almuerzo',
        emoji: '🥗',
        gradient: 'from-emerald-400 to-teal-500',
        darkGradient: 'dark:from-emerald-500/80 dark:to-teal-600/80',
    },
    {
        id: 'dinner',
        name: 'Cena',
        emoji: '🍝',
        gradient: 'from-indigo-400 to-purple-500',
        darkGradient: 'dark:from-indigo-500/80 dark:to-purple-600/80',
    },
    {
        id: 'snack',
        name: 'Snacks',
        emoji: '🍿',
        gradient: 'from-rose-400 to-pink-500',
        darkGradient: 'dark:from-rose-500/80 dark:to-pink-600/80',
    },
    {
        id: 'dessert',
        name: 'Postres',
        emoji: '🧁',
        gradient: 'from-fuchsia-400 to-purple-500',
        darkGradient: 'dark:from-fuchsia-500/80 dark:to-purple-600/80',
    },
    {
        id: 'vegetarian',
        name: 'Vegetariano',
        emoji: '🥬',
        gradient: 'from-lime-400 to-green-500',
        darkGradient: 'dark:from-lime-500/80 dark:to-green-600/80',
    },
    {
        id: 'vegan',
        name: 'Vegano',
        emoji: '🌱',
        gradient: 'from-green-400 to-emerald-500',
        darkGradient: 'dark:from-green-500/80 dark:to-emerald-600/80',
    },
    {
        id: 'gluten-free',
        name: 'Sin Gluten',
        emoji: '🌾',
        gradient: 'from-cyan-400 to-blue-500',
        darkGradient: 'dark:from-cyan-500/80 dark:to-blue-600/80',
    },
];

interface RecipeCategoryGridProps {
    onSelectCategory?: (categoryId: string) => void;
    selectedCategory?: string;
}

export function RecipeCategoryGrid({ onSelectCategory, selectedCategory }: RecipeCategoryGridProps) {
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Categorías
            </h2>

            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {defaultCategories.map((category, index) => {
                    const isSelected = selectedCategory === category.id;

                    return (
                        <motion.button
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03, duration: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelectCategory?.(category.id)}
                            className={`
                                flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl
                                aspect-square transition-all duration-200
                                ${isSelected
                                    ? `bg-gradient-to-br ${category.gradient} ${category.darkGradient} text-white shadow-lg`
                                    : 'bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200/50 dark:border-white/10'
                                }
                            `}
                        >
                            {/* Emoji Icon */}
                            <span className="text-2xl sm:text-3xl">{category.emoji}</span>

                            {/* Label */}
                            <span className={`
                                text-[10px] sm:text-xs font-medium text-center leading-tight
                                ${isSelected
                                    ? 'text-white'
                                    : 'text-slate-600 dark:text-slate-300'
                                }
                            `}>
                                {category.name}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

