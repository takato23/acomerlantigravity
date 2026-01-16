'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Clock,
    Users,
    ChefHat,
    Flame,
    ShoppingCart,
    RefreshCw
} from 'lucide-react';
import { IOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';
import { IOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';

interface RecipeQuickViewProps {
    recipe: {
        id?: string;
        title: string;
        description?: string;
        prep_time?: number;
        cook_time?: number;
        servings?: number;
        difficulty?: string;
        ingredients?: string[] | { name: string; amount?: string; unit?: string }[];
        instructions?: string[];
        calories?: number;
    } | null;
    onClose: () => void;
    onReplace?: () => void;
    onAddToShoppingList?: () => void;
}

export function RecipeQuickViewModal({
    recipe,
    onClose,
    onReplace,
    onAddToShoppingList
}: RecipeQuickViewProps) {
    if (!recipe) return null;

    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

    // Normalize ingredients
    const ingredients = recipe.ingredients?.map(ing => {
        if (typeof ing === 'string') return ing;
        return `${ing.amount || ''} ${ing.unit || ''} ${ing.name}`.trim();
    }) || [];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md"
                >
                    <IOS26EnhancedCard
                        variant="aurora"
                        elevation="floating"
                        className="max-h-[85vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative">
                            {/* Gradient header */}
                            <div className="h-24 bg-slate-800" />

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>

                            {/* Title overlay */}
                            <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
                                <h2 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">
                                    {recipe.title}
                                </h2>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                            <div className="flex items-center justify-between text-sm">
                                {totalTime > 0 && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span>{totalTime} min</span>
                                    </div>
                                )}
                                {recipe.servings && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Users className="w-4 h-4" />
                                        <span>{recipe.servings} porciones</span>
                                    </div>
                                )}
                                {recipe.difficulty && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <ChefHat className="w-4 h-4" />
                                        <span className="capitalize">{recipe.difficulty}</span>
                                    </div>
                                )}
                                {recipe.calories && (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <Flame className="w-4 h-4" />
                                        <span>{recipe.calories} kcal</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4 max-h-[45vh] overflow-y-auto space-y-4">
                            {/* Description */}
                            {recipe.description && (
                                <p className="text-gray-600 text-sm">
                                    {recipe.description}
                                </p>
                            )}

                            {/* Ingredients */}
                            {ingredients.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                        🥗 Ingredientes
                                        <span className="text-xs font-normal text-gray-500">
                                            ({ingredients.length})
                                        </span>
                                    </h3>
                                    <ul className="space-y-1">
                                        {ingredients.slice(0, 8).map((ing, idx) => (
                                            <li
                                                key={idx}
                                                className="text-sm text-gray-600 flex items-center gap-2"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                {ing}
                                            </li>
                                        ))}
                                        {ingredients.length > 8 && (
                                            <li className="text-sm text-gray-500 italic">
                                                +{ingredients.length - 8} más...
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Instructions preview */}
                            {recipe.instructions && recipe.instructions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                        👨‍🍳 Pasos
                                        <span className="text-xs font-normal text-gray-500">
                                            ({recipe.instructions.length})
                                        </span>
                                    </h3>
                                    <ol className="space-y-2">
                                        {recipe.instructions.slice(0, 3).map((step, idx) => (
                                            <li
                                                key={idx}
                                                className="text-sm text-gray-600 flex gap-2"
                                            >
                                                <span className="font-semibold text-orange-500 flex-shrink-0">
                                                    {idx + 1}.
                                                </span>
                                                <span className="line-clamp-2">{step}</span>
                                            </li>
                                        ))}
                                        {recipe.instructions.length > 3 && (
                                            <li className="text-sm text-gray-500 italic pl-5">
                                                +{recipe.instructions.length - 3} pasos más...
                                            </li>
                                        )}
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/10 flex gap-2">
                            {onReplace && (
                                <IOS26LiquidButton
                                    variant="ghost"
                                    icon={<RefreshCw className="w-4 h-4" />}
                                    iconPosition="left"
                                    onClick={onReplace}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Cambiar
                                </IOS26LiquidButton>
                            )}
                            {onAddToShoppingList && (
                                <IOS26LiquidButton
                                    variant="ghost"
                                    icon={<ShoppingCart className="w-4 h-4" />}
                                    iconPosition="left"
                                    onClick={onAddToShoppingList}
                                    size="sm"
                                    className="flex-1"
                                >
                                    A la lista
                                </IOS26LiquidButton>
                            )}
                            <IOS26LiquidButton
                                variant="primary"
                                onClick={onClose}
                                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500"
                            >
                                Cerrar
                            </IOS26LiquidButton>
                        </div>
                    </IOS26EnhancedCard>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
