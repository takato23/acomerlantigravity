'use client';

import { motion } from 'framer-motion';
import { Star, Clock, Flame, ArrowRight, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstantRecipeCardProps {
    ingredients: string[];
    onViewRecipe: () => void;
}

export function InstantRecipeCard({ ingredients, onViewRecipe }: InstantRecipeCardProps) {
    // Smart(ish) mock logic
    const getRecipe = (ingredients: string[]) => {
        const lowerIngs = ingredients.map(i => i.toLowerCase());

        if (lowerIngs.some(i => i.includes('tomate') || i.includes('pasta') || i.includes('queso'))) {
            return {
                title: "Pasta 'Alla What's Left'",
                image: "🍝",
                desc: "Tu clásico salvador italiano.",
                time: "15 min",
                cals: "450",
                matchStats: "Great use of Tomato"
            };
        }
        if (lowerIngs.some(i => i.includes('huevo') || i.includes('papa') || i.includes('cebolla'))) {
            return {
                title: "Tortilla Express",
                image: "🍳",
                desc: "Rápido, proteico y feliz.",
                time: "10 min",
                cals: "250",
                matchStats: "Perfect for Eggs"
            };
        }
        if (lowerIngs.some(i => i.includes('lechuga') || i.includes('pollo') || i.includes('palta'))) {
            return {
                title: "Ensalada Power",
                image: "🥗",
                desc: "Fresco, ligero y nutritivo.",
                time: "8 min",
                cals: "180",
                matchStats: "Clean eating match"
            };
        }
        if (lowerIngs.some(i => i.includes('pan') || i.includes('carne') || i.includes('queso'))) {
            return {
                title: "Sándwich Gourmet",
                image: "🥪",
                desc: "No es un sándwich cualquiera.",
                time: "5 min",
                cals: "350",
                matchStats: "Carb lover's dream"
            };
        }

        // Default fallback
        return {
            title: "Salteado Mágico",
            image: "🥘",
            desc: "Todo a la sartén y a rezar. Queda rico.",
            time: "12 min",
            cals: "320",
            matchStats: "Uses everything nicely"
        };
    };

    const recipe = getRecipe(ingredients);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-sm mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/10 border border-gray-100 ring-1 ring-black/5"
        >
            <div className="h-48 bg-gray-50 flex items-center justify-center text-9xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-100/40 to-gray-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.span
                    className="relative z-10 cursor-default inline-block"
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                >
                    {recipe.image}
                </motion.span>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">{recipe.title}</h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                        <Star className="w-3 h-3 fill-current" /> 98% Match
                    </span>
                </div>

                <p className="text-gray-500 mb-6 font-medium text-sm">{recipe.desc}</p>

                <div className="flex justify-between items-center text-xs text-gray-400 mb-8 font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-900" /> {recipe.time}</span>
                    <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> {recipe.cals} kcal</span>
                    <span className="flex items-center gap-1.5"><ChefHat className="w-4 h-4 text-gray-600" /> Easy</span>
                </div>

                <Button
                    onClick={onViewRecipe}
                    className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800 font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    Ver Receta Completa <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}
