'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, ChefHat, Sparkles } from 'lucide-react';

export type MealSlotType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

interface MealCardProps {
    type: MealSlotType;
    title?: string;
    image?: string;
    calories?: number;
    prepTime?: number;
    isCompleted?: boolean;
    onAdd: () => void;
    onRemove: () => void;
    onRegenerate: () => void;
    onView: () => void;
}

const MEAL_CONFIG: Record<MealSlotType, { label: string; icon: string; gradient: string }> = {
    breakfast: { label: 'Desayuno', icon: '☕', gradient: 'bg-amber-50' },
    lunch: { label: 'Almuerzo', icon: '🥗', gradient: 'bg-green-50' },
    snack: { label: 'Merienda', icon: '🍎', gradient: 'bg-slate-50' },
    dinner: { label: 'Cena', icon: '🌙', gradient: 'bg-slate-100' },
};

export function MealCard({
    type,
    title,
    image,
    calories,
    prepTime,
    onAdd,
    onRemove,
    onRegenerate,
    onView
}: MealCardProps) {
    const config = MEAL_CONFIG[type];

    // If no title, it's an empty slot
    const isEmpty = !title;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
        relative overflow-hidden rounded-3xl p-1
        transition-all duration-300
        ${isEmpty ? 'border-2 border-dashed border-gray-300' : 'shadow-lg shadow-neutral-200/50'}
      `}
        >
            <div className={`
        relative h-full w-full rounded-[20px] overflow-hidden
        ${isEmpty
                    ? 'bg-white/80 backdrop-blur-sm flex items-center justify-center py-8'
                    : `${config.gradient} border border-gray-200`
                }
      `}>

                {/* Empty State */}
                {isEmpty && (
                    <div className="flex flex-col items-center gap-3 text-center w-full px-6">
                        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-2xl shadow-sm">
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700">{config.label}</h3>
                            <p className="text-xs text-gray-500 mt-1">Sin planificar</p>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onAdd}
                            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white font-medium text-sm hover:bg-gray-800 transition-colors"
                        >
                            <Plus size={16} />
                            Agregar
                        </motion.button>
                    </div>
                )}

                {/* Filled State */}
                {!isEmpty && (
                    <div className="relative p-0 flex flex-col h-full bg-white/80 backdrop-blur-md">
                        {/* Header / Actions - Top Right */}
                        <div className="absolute top-3 right-3 flex gap-2 z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                                className="p-2 rounded-full bg-white/80 text-gray-500 hover:text-slate-900 hover:rotate-180 transition-all shadow-sm backdrop-blur-md"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {/* Content Container */}
                        <div className="flex flex-row items-stretch" onClick={onView}>
                            {/* Left Image Section */}
                            <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative">
                                {image ? (
                                    <img src={image} alt={title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${config.gradient}`}>
                                        <span className="text-3xl">{config.icon}</span>
                                    </div>
                                )}
                                {/* Meal Badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                                    {config.label}
                                </div>
                            </div>

                            {/* Right Info Section */}
                            <div className="flex-1 p-4 flex flex-col justify-center gap-1.5">
                                <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">
                                    {title}
                                </h3>

                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    {prepTime && (
                                        <span className="flex items-center gap-1 bg-amber-100/50 px-2 py-1 rounded-md text-amber-700 font-medium">
                                            <span className="text-[10px]">⏱️</span> {prepTime}m
                                        </span>
                                    )}
                                    {calories && (
                                        <span className="flex items-center gap-1 bg-green-100/50 px-2 py-1 rounded-md text-green-700 font-medium">
                                            <span className="text-[10px]">🔥</span> {calories}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Actions Bar (appears on swipe or just visible? Let's make it visible for now, or swipeable later) */}
                        {/* For MVP, let's keep it clean. Swipe logic will be handled by parent or a wrapper. */}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
