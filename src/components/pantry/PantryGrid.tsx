'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Carrot, Apple, Beef, Milk, Wheat, Coffee, Cookie, TrendingDown, Sparkles } from 'lucide-react';
import { differenceInDays, format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { IngredientCategory } from '@/types/pantry';
import { locations, categoryIconMap } from './pantry-constants';

interface PantryItemType {
    id: string;
    quantity: number;
    unit: string;
    location: string;
    expiration_date?: string | Date;
    created_at: string;
    photo_url?: string;
    notes?: string;
    ingredient?: {
        name: string;
        category?: IngredientCategory;
    };
}

interface PantryGridProps {
    items: PantryItemType[];
    viewMode: 'grid' | 'list';
    onItemClick: (item: PantryItemType) => void;
}

const getDaysUntilExpiry = (expiryDate: Date | string) => {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    return differenceInDays(expiry, new Date());
};

const getExpiryColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 0) return 'text-red-600 bg-red-100';
    if (daysUntilExpiry <= 3) return 'text-orange-600 bg-orange-100';
    if (daysUntilExpiry <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
};

// Check if item was added today (for "Nuevo" badge)
const isAddedToday = (createdAt: string): boolean => {
    try {
        const date = parseISO(createdAt);
        return isToday(date);
    } catch {
        return false;
    }
};

export function PantryGrid({ items, viewMode, onItemClick }: PantryGridProps) {
    if (viewMode === 'grid') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20"
            >
                {items.map((item, index) => {
                    const daysUntilExpiry = item.expiration_date ? getDaysUntilExpiry(item.expiration_date) : null;
                    const CategoryIcon = categoryIconMap[item.ingredient?.category || 'otros'] || Package;
                    const isNew = isAddedToday(item.created_at);

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -8 }}
                            onClick={() => onItemClick(item)}
                            className="group cursor-pointer"
                        >
                            <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gray-500/10 transition-all duration-300 border border-gray-100">
                                {/* Image Area */}
                                <div className="relative h-48 overflow-hidden">
                                    {item.photo_url ? (
                                        <img
                                            src={item.photo_url}
                                            alt={item.ingredient?.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                                            <CategoryIcon className="w-16 h-16 text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                                    {/* Top Badges */}
                                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-sm">
                                                <CategoryIcon className="w-5 h-5 text-gray-700" />
                                            </div>

                                            {/* Nuevo Badge */}
                                            {isNew && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -10 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    NUEVO
                                                </motion.div>
                                            )}
                                        </div>

                                        {daysUntilExpiry !== null && (
                                            <div className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-sm border border-white/10",
                                                getExpiryColor(daysUntilExpiry)
                                            )}>
                                                {daysUntilExpiry <= 0 ? 'VENCE HOY' :
                                                    daysUntilExpiry === 1 ? '1 DÍA' :
                                                        `${daysUntilExpiry} DÍAS`}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-5">
                                    <h3 className="font-bold text-xl text-gray-900 mb-1 group-hover:text-slate-900 transition-colors line-clamp-1">
                                        {item.ingredient?.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl font-black text-gray-900">
                                            {item.quantity}
                                        </span>
                                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                            {item.unit}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            {locations.find(l => l.id === item.location)?.name || item.location}
                                        </span>
                                        <span className="text-xs font-medium text-gray-400">
                                            {format(new Date(item.created_at), 'd MMM', { locale: es })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        );
    }

    // List view
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 pb-20"
        >
            {items.map((item, index) => {
                const daysUntilExpiry = item.expiration_date ? getDaysUntilExpiry(item.expiration_date) : null;
                const CategoryIcon = categoryIconMap[item.ingredient?.category || 'otros'] || Package;
                const isNew = isAddedToday(item.created_at);

                return (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onItemClick(item)}
                        className="group cursor-pointer"
                    >
                        <div className="bg-white/60 backdrop-blur-xl border border-white/20 p-4 rounded-3xl hover:bg-white/80 transition-all shadow-sm hover:shadow-lg flex items-center gap-5">
                            {/* Icon/Image */}
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                {item.photo_url ? (
                                    <img
                                        src={item.photo_url}
                                        alt={item.ingredient?.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <CategoryIcon className="w-8 h-8 text-gray-400" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-gray-900 truncate">
                                        {item.ingredient?.name}
                                    </h3>
                                    {/* Nuevo Badge - List View */}
                                    {isNew && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold">
                                            <Sparkles className="w-3 h-3" />
                                            Nuevo
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className="font-semibold text-gray-900">
                                        {item.quantity} {item.unit}
                                    </span>
                                    <span>•</span>
                                    <span>{locations.find(l => l.id === item.location)?.name}</span>
                                </div>
                            </div>

                            {/* Expiry Badge */}
                            {daysUntilExpiry !== null && (
                                <div className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap hidden sm:block",
                                    getExpiryColor(daysUntilExpiry)
                                )}>
                                    {daysUntilExpiry <= 0 ? 'VENCIDO' : `${daysUntilExpiry} DÍAS`}
                                </div>
                            )}

                            {/* Chevron */}
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}


