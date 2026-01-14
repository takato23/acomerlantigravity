'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search } from 'lucide-react';

interface IngredientInputProps {
    onIngredientsChange: (ingredients: string[]) => void;
}

export function IngredientInput({ onIngredientsChange }: IngredientInputProps) {
    const [input, setInput] = useState('');
    const [ingredients, setIngredients] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            addIngredient(input.trim());
        } else if (e.key === 'Backspace' && !input && ingredients.length > 0) {
            removeIngredient(ingredients.length - 1);
        }
    };

    const addIngredient = (val: string) => {
        if (!ingredients.includes(val)) {
            const newIngredients = [...ingredients, val];
            setIngredients(newIngredients);
            onIngredientsChange(newIngredients);
        }
        setInput('');
    };

    const removeIngredient = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
        onIngredientsChange(newIngredients);
    };

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                className="relative flex flex-wrap items-center gap-2 p-4 bg-white rounded-2xl shadow-2xl border-2 border-transparent focus-within:border-orange-500 transition-all cursor-text min-h-[80px]"
                onClick={() => inputRef.current?.focus()}
            >
                <Search className="w-6 h-6 text-gray-400 absolute top-7 left-4" />

                <div className="flex flex-wrap gap-2 pl-10 w-full">
                    <AnimatePresence>
                        {ingredients.map((ing, i) => (
                            <motion.span
                                key={ing}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold text-sm"
                            >
                                {ing}
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeIngredient(i); }}
                                    className="hover:text-orange-900"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.span>
                        ))}
                    </AnimatePresence>

                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={ingredients.length === 0 ? "Ej: Tomate, Huevo, Queso..." : ""}
                        className="flex-1 min-w-[150px] bg-transparent outline-none text-xl font-medium text-gray-800 placeholder:text-gray-300 h-10"
                    />
                </div>

                {input && (
                    <button
                        onClick={() => addIngredient(input)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-100 rounded-full hover:bg-orange-500 hover:text-white transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>
            <p className="mt-4 text-center text-gray-400 text-sm font-medium">
                Presioná <span className="px-2 py-0.5 border border-gray-300 rounded text-xs mx-1 font-bold">Enter</span> para agregar
            </p>
        </div>
    );
}
