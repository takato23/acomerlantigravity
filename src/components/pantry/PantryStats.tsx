'use client';

import React from 'react';
import { Package, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';

interface PantryStatsProps {
    totalItems: number;
    expiringSoon: number;
    lowStock: number;
    categories: number;
}

export function PantryStats({ totalItems, expiringSoon, lowStock, categories }: PantryStatsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Total Items */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/10 rounded-full">
                <Package className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {totalItems} items
                </span>
            </div>

            {/* Por Vencer - only show if > 0 */}
            {expiringSoon > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-500/20 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        {expiringSoon} por vencer
                    </span>
                </div>
            )}

            {/* Stock Bajo - only show if > 0 */}
            {lowStock > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-500/20 rounded-full">
                    <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-300">
                        {lowStock} stock bajo
                    </span>
                </div>
            )}

            {/* Categorías */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/10 rounded-full">
                <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {categories} categorías
                </span>
            </div>
        </div>
    );
}
