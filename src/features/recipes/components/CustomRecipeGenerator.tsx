'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Plus,
    X,
    ChefHat,
    Clock,
    Users,
    Flame,
    Leaf,
    Loader2,
    Check
} from 'lucide-react';
import { toast } from 'sonner';

import type { Recipe, Ingredient, NutritionInfo } from '@/features/meal-planning/types';

interface GeneratedRecipe extends Omit<Recipe, 'id'> {
    id: string;
    tips?: string[];
    isAiGenerated: boolean;
}

interface CustomRecipeGeneratorProps {
    onRecipeGenerated?: (recipe: Recipe) => void;
    onAddToPlan?: (recipe: Recipe) => void;
    className?: string;
}

const DIFFICULTY_OPTIONS = [
    { key: 'easy', label: 'Fácil', color: 'bg-green-500' },
    { key: 'medium', label: 'Media', color: 'bg-yellow-500' },
    { key: 'hard', label: 'Difícil', color: 'bg-red-500' }
] as const;

const CUISINE_OPTIONS = [
    'argentina', 'italiana', 'mexicana', 'asiatica', 'mediterranea', 'americana'
];

export function CustomRecipeGenerator({
    onRecipeGenerated,
    onAddToPlan,
    className
}: CustomRecipeGeneratorProps) {
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [cuisine, setCuisine] = useState('argentina');
    const [servings, setServings] = useState(4);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);

    const handleAddIngredient = () => {
        const trimmed = inputValue.trim().toLowerCase();
        if (trimmed && !ingredients.includes(trimmed)) {
            setIngredients([...ingredients, trimmed]);
            setInputValue('');
        }
    };

    const handleRemoveIngredient = (ingredient: string) => {
        setIngredients(ingredients.filter(i => i !== ingredient));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddIngredient();
        }
    };

    const handleGenerate = async () => {
        if (ingredients.length === 0) {
            toast.error('Agrega al menos un ingrediente');
            return;
        }

        setIsGenerating(true);
        setGeneratedRecipe(null);

        try {
            const response = await fetch('/api/recipes/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredients,
                    cuisine,
                    difficulty,
                    servings
                })
            });

            if (!response.ok) {
                throw new Error('Error al generar la receta');
            }

            const data = await response.json();

            if (data.recipe || data.success) {
                const recipe = data.recipe || data;
                setGeneratedRecipe(recipe);
                onRecipeGenerated?.(recipe);
                toast.success('¡Receta generada!');
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (err) {
            console.error('Error generating recipe:', err);
            toast.error('Error al generar la receta. Intenta de nuevo.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddToPlan = () => {
        if (generatedRecipe && onAddToPlan) {
            onAddToPlan(generatedRecipe as Recipe);
            toast.success('Receta agregada al plan');
        }
    };

    return (
        <div className={`bg-white dark:bg-slate-900/50 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Crear Receta Custom</h2>
                        <p className="text-white/80 text-sm">Genera una receta original con IA</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Ingredients Input */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                        ¿Qué ingredientes tenés?
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ej: pollo, tomate, cebolla..."
                            className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border-0 focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white placeholder:text-gray-500"
                        />
                        <button
                            onClick={handleAddIngredient}
                            className="p-3 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Ingredient Tags */}
                    {ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            <AnimatePresence>
                                {ingredients.map(ingredient => (
                                    <motion.span
                                        key={ingredient}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-sm font-medium"
                                    >
                                        {ingredient}
                                        <button
                                            onClick={() => handleRemoveIngredient(ingredient)}
                                            className="hover:text-purple-900 dark:hover:text-white"
                                        >
                                            <X size={14} />
                                        </button>
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Difficulty */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                            Dificultad
                        </label>
                        <div className="flex gap-2">
                            {DIFFICULTY_OPTIONS.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setDifficulty(opt.key)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${difficulty === opt.key
                                            ? `${opt.color} text-white border-transparent`
                                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Servings */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                            Porciones
                        </label>
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/10 rounded-lg p-2">
                            <button
                                onClick={() => setServings(Math.max(1, servings - 1))}
                                className="w-8 h-8 rounded-full bg-white dark:bg-black flex items-center justify-center font-bold"
                            >
                                -
                            </button>
                            <span className="flex-1 text-center font-bold text-slate-900 dark:text-white">
                                {servings}
                            </span>
                            <button
                                onClick={() => setServings(Math.min(12, servings + 1))}
                                className="w-8 h-8 rounded-full bg-white dark:bg-black flex items-center justify-center font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cuisine */}
                <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                        Estilo
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {CUISINE_OPTIONS.map(c => (
                            <button
                                key={c}
                                onClick={() => setCuisine(c)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${cuisine === c
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-transparent'
                                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20'
                                    }`}
                            >
                                {c.charAt(0).toUpperCase() + c.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || ingredients.length === 0}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generando receta...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generar Receta
                        </>
                    )}
                </button>
            </div>

            {/* Generated Recipe */}
            <AnimatePresence>
                {generatedRecipe && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-200 dark:border-white/10"
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {generatedRecipe.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                        {generatedRecipe.description}
                                    </p>
                                </div>
                                <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-medium flex items-center gap-1">
                                    <Sparkles size={12} />
                                    IA
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-3 text-sm">
                                {generatedRecipe.prepTime && (
                                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                        <Clock size={14} /> {generatedRecipe.prepTime} min prep
                                    </span>
                                )}
                                {generatedRecipe.cookTime && (
                                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                        <ChefHat size={14} /> {generatedRecipe.cookTime} min cocción
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Users size={14} /> {generatedRecipe.servings} porciones
                                </span>
                                {generatedRecipe.nutrition?.calories && (
                                    <span className="flex items-center gap-1 text-orange-500">
                                        <Flame size={14} /> {generatedRecipe.nutrition.calories} kcal
                                    </span>
                                )}
                            </div>

                            {/* Ingredients Preview */}
                            {generatedRecipe.ingredients && (
                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Ingredientes</h4>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        {generatedRecipe.ingredients.slice(0, 5).map((ing, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <Check size={14} className="text-green-500" />
                                                {typeof ing === 'string' ? ing : `${ing.amount} ${ing.unit} ${ing.name}`}
                                            </li>
                                        ))}
                                        {generatedRecipe.ingredients.length > 5 && (
                                            <li className="text-purple-500">
                                                + {generatedRecipe.ingredients.length - 5} más...
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Action Button */}
                            {onAddToPlan && (
                                <button
                                    onClick={handleAddToPlan}
                                    className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    Agregar al Plan
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
