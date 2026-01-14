import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Grid3X3,
    List,
    Filter,
    ChevronDown,
    X
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { categories, locations } from './pantry-constants';

interface PantryFiltersProps {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    selectedLocation: string;
    onLocationChange: (location: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function PantryFilters({
    selectedCategory,
    onCategoryChange,
    selectedLocation,
    onLocationChange,
    sortBy,
    onSortChange,
    viewMode,
    onViewModeChange
}: PantryFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);

    const selectedCategoryData = categories.find(c => c.id === selectedCategory);
    const selectedLocationData = locations.find(l => l.id === selectedLocation);

    const hasActiveFilters = selectedCategory !== 'all' || selectedLocation !== 'all';
    const activeFilterCount = [
        selectedCategory !== 'all',
        selectedLocation !== 'all',
    ].filter(Boolean).length;

    const clearFilters = () => {
        onCategoryChange('all');
        onLocationChange('all');
    };

    return (
        <div className="space-y-3">
            {/* Controls row */}
            <div className="flex items-center gap-2">
                {/* Filter toggle button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                        showFilters || hasActiveFilters
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white dark:bg-white/10 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20"
                    )}
                >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filtros</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-slate-700 dark:text-gray-300 cursor-pointer"
                    >
                        <option value="name" className="dark:bg-slate-800">Nombre</option>
                        <option value="expiry" className="dark:bg-slate-800">Vencimiento</option>
                        <option value="quantity" className="dark:bg-slate-800">Cantidad</option>
                        <option value="added" className="dark:bg-slate-800">Reciente</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* View mode toggle */}
                <div className="flex p-1 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl">
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={cn(
                            "p-1.5 rounded-lg transition-all",
                            viewMode === 'grid'
                                ? "bg-slate-900 dark:bg-orange-500 text-white"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
                        )}
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={cn(
                            "p-1.5 rounded-lg transition-all",
                            viewMode === 'list'
                                ? "bg-slate-900 dark:bg-orange-500 text-white"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
                        )}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Expandable filters panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl space-y-4">
                            {/* Location filters */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                                    Ubicación
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {locations.map((location) => {
                                        const Icon = location.icon;
                                        const isSelected = selectedLocation === location.id;
                                        return (
                                            <button
                                                key={location.id}
                                                onClick={() => onLocationChange(location.id)}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                                    isSelected
                                                        ? 'bg-slate-900 dark:bg-orange-500 text-white'
                                                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/20'
                                                )}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {location.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Category filters */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                                    Categoría
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category) => {
                                        const Icon = category.icon;
                                        const isSelected = selectedCategory === category.id;
                                        return (
                                            <button
                                                key={category.id}
                                                onClick={() => onCategoryChange(category.id)}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                                    isSelected
                                                        ? 'bg-slate-900 dark:bg-orange-500 text-white'
                                                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/20'
                                                )}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {category.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Clear filters button */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active filter pills (when panel is closed) */}
            {!showFilters && hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {selectedLocation !== 'all' && selectedLocationData && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                            {React.createElement(selectedLocationData.icon, { className: "w-3 h-3" })}
                            {selectedLocationData.name}
                            <button onClick={() => onLocationChange('all')} className="ml-0.5 hover:text-orange-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedCategory !== 'all' && selectedCategoryData && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                            {React.createElement(selectedCategoryData.icon, { className: "w-3 h-3" })}
                            {selectedCategoryData.name}
                            <button onClick={() => onCategoryChange('all')} className="ml-0.5 hover:text-orange-900">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
