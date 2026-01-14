'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, TrendingUp, ChefHat, Package, Calendar, ShoppingCart } from 'lucide-react';

import { GlassCard, GlassInput } from '@/components/ui/GlassCard';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const recentSearches = [
    'Pasta carbonara',
    'Ensalada cesar',
    'Pollo al curry',
    'Brownies de chocolate'
  ];

  const popularSearches = [
    'Recetas veganas',
    'Comidas rapidas',
    'Postres sin azucar',
    'Platos mediterraneos'
  ];

  return (
    <div className="container mx-auto px-4 py-8 bg-white min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-slate-900 mb-8 text-center">
          Buscar en KeCarajoComer
        </h1>

        {/* Search Input */}
        <GlassCard variant="medium" className="p-6 mb-8 bg-slate-50 border border-slate-200">
          <GlassInput
            placeholder="Buscar recetas, ingredientes, planificaciones..."
            icon={<Search className="w-5 h-5 text-slate-500" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-lg"
          />
        </GlassCard>

        {/* Recent Searches */}
        <GlassCard variant="subtle" className="p-6 mb-6 bg-white border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Busquedas Recientes</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search) => (
              <button
                key={search}
                onClick={() => setSearchQuery(search)}
                className="px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Popular Searches */}
        <GlassCard variant="subtle" className="p-6 mb-6 bg-white border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-slate-900">Busquedas Populares</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search) => (
              <button
                key={search}
                onClick={() => setSearchQuery(search)}
                className="px-4 py-2 bg-orange-50 rounded-full text-sm text-orange-700 hover:bg-orange-100 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Search Categories */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ChefHat, label: 'Recetas', color: 'bg-slate-800' },
            { icon: Package, label: 'Despensa', color: 'bg-slate-700' },
            { icon: Calendar, label: 'Planes', color: 'bg-slate-600' },
            { icon: ShoppingCart, label: 'Compras', color: 'bg-orange-500' }
          ].map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <GlassCard variant="medium" className="p-6 text-center bg-white border border-slate-200 hover:border-slate-300" interactive>
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${category.color} flex items-center justify-center text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-slate-900">{category.label}</p>
                </GlassCard>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
