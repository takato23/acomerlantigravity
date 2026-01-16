'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, Check, Filter } from 'lucide-react';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import { IOS26EnhancedCard } from '@/components/ios26/iOS26EnhancedCard';
import { IOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';
import type { PantryItem } from '@/features/pantry/types';
import { toast } from 'sonner';

interface PantrySelectionModalProps {
    onClose: () => void;
    onSelect: (item: PantryItem) => void;
}

export function PantrySelectionModal({ onClose, onSelect }: PantrySelectionModalProps) {
    const { items, fetchItems, isLoading } = usePantryStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const categories = useMemo(() => {
        const cats = new Set(items.map(i => i.category || 'Otros').filter(Boolean));
        return ['all', ...Array.from(cats)];
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || (item.category || 'Otros') === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, selectedCategory]);

    const handleSelect = (item: PantryItem) => {
        onSelect(item);
        toast.success(`${item.ingredient_name} seleccionado`);
        onClose();
    };

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
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg"
                >
                    <IOS26EnhancedCard
                        variant="aurora"
                        elevation="floating"
                        className="max-h-[85vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                        <Package className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Mi Despensa
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            Selecciona un ingrediente para usar
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar en despensa..."
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-800 placeholder-slate-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Categories */}
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-white/5 text-slate-600 hover:bg-white/10'
                                            }`}
                                    >
                                        {cat === 'all' ? 'Todos' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500">
                                    Cargando items...
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="text-center py-8 space-y-2">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto" />
                                    <p className="text-gray-500">No se encontraron ingredientes</p>
                                </div>
                            ) : (
                                filteredItems.map(item => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                <span className="text-lg">📦</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {item.ingredient_name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {item.quantity} {item.unit} • {item.location || 'Sin ubicación'}
                                                </p>
                                            </div>
                                        </div>

                                        {item.expiration_date && (
                                            <div className={`text-xs px-2 py-1 rounded-md ${new Date(item.expiration_date) < new Date()
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-green-500/10 text-green-500'
                                                }`}>
                                                {new Date(item.expiration_date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </motion.button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/10 shrink-0">
                            <IOS26LiquidButton
                                variant="ghost"
                                onClick={onClose}
                                className="w-full"
                            >
                                Cancelar
                            </IOS26LiquidButton>
                        </div>
                    </IOS26EnhancedCard>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
