'use client';

import React, { useState } from 'react';
import {
  ChefHat, Search, Heart, Star, Clock, Utensils, Download, Settings,
  User, Target, Sparkles, Eye, Gauge, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { GlassCard, GlassButton, GlassInput, GlassModal } from '@/components/ui/GlassCard';
import { EnhancedRecipeGrid } from '@/components/recipes/EnhancedRecipeGrid';
import { EnhancedProfileSettings } from '@/components/profile/EnhancedProfileSettings';

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState('glassmorphism');
  const [searchValue, setSearchValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const tabs = [
    { id: 'glassmorphism', label: 'Glassmorphism', icon: Layers },
    { id: 'components', label: 'Components', icon: Sparkles },
    { id: 'recipes', label: 'Recipe Grid', icon: ChefHat },
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'performance', label: 'Performance', icon: Gauge }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="container mx-auto p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 py-16"
          >
            <GlassCard variant="strong" className="p-12 mx-auto max-w-4xl" spotlight>
              <h1 className="text-5xl lg:text-7xl font-bold text-slate-700 mb-6">
                Glassmorphism Design System
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
                Implementacion completa de glassmorphism inspirada en A COMERLA con efectos avanzados, componentes personalizados y optimizaciones de rendimiento
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <GlassButton
                  variant="primary"
                  size="lg"
                  icon={<Eye className="w-5 h-5" />}
                  onClick={() => setShowModal(true)}
                >
                  Ver Demo Interactivo
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  size="lg"
                  icon={<Download className="w-5 h-5" />}
                >
                  Documentacion
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Navigation Tabs */}
          <GlassCard variant="medium" className="p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <GlassButton
                    key={tab.id}
                    variant={activeTab === tab.id ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab(tab.id)}
                    icon={<Icon className="w-4 h-4" />}
                    className="flex-1 min-w-fit"
                  >
                    {tab.label}
                  </GlassButton>
                );
              })}
            </div>
          </GlassCard>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'glassmorphism' && (
                <div className="space-y-8">
                  <GlassCard variant="medium" className="p-6">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">
                      Sistema de Glassmorphism
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <GlassCard variant="subtle" className="p-6">
                        <h3 className="text-lg font-semibold mb-3">Subtle Glass</h3>
                        <p className="text-slate-600 text-sm">
                          Efecto sutil con 8% de opacidad y blur de 12px
                        </p>
                      </GlassCard>
                      <GlassCard variant="medium" className="p-6">
                        <h3 className="text-lg font-semibold mb-3">Medium Glass</h3>
                        <p className="text-slate-600 text-sm">
                          Efecto medio con 15% de opacidad y blur de 24px
                        </p>
                      </GlassCard>
                      <GlassCard variant="strong" className="p-6">
                        <h3 className="text-lg font-semibold mb-3">Strong Glass</h3>
                        <p className="text-slate-600 text-sm">
                          Efecto fuerte con 20% de opacidad y blur de 32px
                        </p>
                      </GlassCard>
                    </div>
                  </GlassCard>
                </div>
              )}

              {activeTab === 'components' && (
                <div className="space-y-8">
                  {/* Buttons Section */}
                  <GlassCard variant="medium" className="p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">
                      Glass Buttons
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-700">Variants</h3>
                        <GlassButton variant="primary" icon={<Heart className="w-4 h-4" />}>
                          Primary
                        </GlassButton>
                        <GlassButton variant="secondary" icon={<Star className="w-4 h-4" />}>
                          Secondary
                        </GlassButton>
                        <GlassButton variant="ghost" icon={<Sparkles className="w-4 h-4" />}>
                          Ghost
                        </GlassButton>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-700">Sizes</h3>
                        <GlassButton size="sm" variant="primary">Small</GlassButton>
                        <GlassButton size="md" variant="primary">Medium</GlassButton>
                        <GlassButton size="lg" variant="primary">Large</GlassButton>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-700">States</h3>
                        <GlassButton variant="primary" loading>
                          Loading
                        </GlassButton>
                        <GlassButton variant="secondary" disabled>
                          Disabled
                        </GlassButton>
                        <GlassButton variant="primary" iconPosition="right" icon={<Download className="w-4 h-4" />}>
                          Icon Right
                        </GlassButton>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Inputs Section */}
                  <GlassCard variant="medium" className="p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">
                      Glass Inputs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <GlassInput
                          label="Search Recipes"
                          placeholder="Que te gustaria cocinar?"
                          icon={<Search className="h-5 w-5" />}
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                        />

                        <GlassInput
                          label="Email Address"
                          type="email"
                          placeholder="tu@email.com"
                        />

                        <GlassInput
                          label="With Error"
                          error="Este campo es requerido"
                          placeholder="Campo con error"
                        />
                      </div>

                      <div className="space-y-4">
                        <GlassInput
                          label="Cooking Time"
                          icon={<Clock className="h-5 w-5" />}
                          placeholder="ej., 30 minutos"
                        />

                        <GlassInput
                          label="Servings"
                          type="number"
                          icon={<Utensils className="h-5 w-5" />}
                          placeholder="4"
                        />

                        <GlassInput
                          label="Password"
                          type="password"
                          placeholder="Tu contrasena"
                        />
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {activeTab === 'recipes' && (
                <div className="space-y-6">
                  <GlassCard variant="medium" className="p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                      Enhanced Recipe Grid
                    </h2>
                    <p className="text-slate-600 mb-6">
                      Grid de recetas con filtros avanzados, busqueda inteligente y efectos glassmorphism
                    </p>
                  </GlassCard>
                  <EnhancedRecipeGrid recipes={[]} />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <GlassCard variant="medium" className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          Enhanced Profile Settings
                        </h2>
                        <p className="text-slate-600">
                          Sistema de configuracion avanzado inspirado en A COMERLA
                        </p>
                      </div>
                      <GlassButton
                        variant="primary"
                        icon={<Settings className="w-4 h-4" />}
                        onClick={() => setShowProfileModal(true)}
                      >
                        Abrir Configuracion
                      </GlassButton>
                    </div>
                  </GlassCard>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        title: 'Preferencias Dieteticas',
                        description: 'Restricciones, alergias y preferencias alimentarias',
                        icon: Utensils,
                        items: ['Vegetariano', 'Sin Gluten', 'Bajo en Sodio']
                      },
                      {
                        title: 'Objetivos Nutricionales',
                        description: 'Metas de calorias y macronutrientes',
                        icon: Target,
                        items: ['2000 cal/dia', '25% Proteina', '50% Carbohidratos']
                      },
                      {
                        title: 'Equipamiento de Cocina',
                        description: 'Electrodomesticos disponibles',
                        icon: ChefHat,
                        items: ['Horno', 'Microondas', 'Licuadora']
                      }
                    ].map((section, index) => (
                      <GlassCard key={section.title} variant="subtle" className="p-6" interactive>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 rounded-lg bg-orange-500/20">
                            <section.icon className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {section.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {section.description}
                        </p>
                        <div className="space-y-1">
                          {section.items.map((item) => (
                            <div key={item} className="text-xs text-slate-500">
                              {item}
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <GlassCard variant="medium" className="p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">
                      Performance Metrics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { label: 'Bundle Size Reduction', value: '35%', description: 'Optimizacion de componentes', color: 'text-green-500' },
                        { label: 'Render Performance', value: '60fps', description: 'Animaciones fluidas', color: 'text-slate-700' },
                        { label: 'Accessibility Score', value: '98%', description: 'WCAG 2.1 AA compliance', color: 'text-slate-700' },
                      ].map((metric) => (
                        <GlassCard key={metric.label} variant="subtle" className="p-6 text-center">
                          <div className={`text-3xl font-bold ${metric.color} mb-2`}>
                            {metric.value}
                          </div>
                          <div className="font-semibold text-slate-900 mb-1">
                            {metric.label}
                          </div>
                          <div className="text-sm text-slate-600">
                            {metric.description}
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard variant="medium" className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">
                      Optimizaciones Implementadas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        'GPU acceleration con transform3d',
                        'Reduced motion support',
                        'Mobile optimizations',
                        'High DPI display support',
                        'Backdrop-filter fallbacks',
                        'Lazy loading de imagenes',
                        'Efficient CSS variables',
                        'Performance budgets'
                      ].map((optimization) => (
                        <div key={optimization} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-slate-700">
                            {optimization}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Demo Modal */}
          <GlassModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Demo Interactivo"
            size="lg"
          >
            <div className="space-y-6">
              <p className="text-slate-600">
                Explora todas las funcionalidades del sistema glassmorphism en accion.
              </p>

              <div className="space-y-4">
                <GlassInput
                  label="Prueba el input glass"
                  placeholder="Escribe algo aqui..."
                  icon={<Search className="w-4 h-4" />}
                />

                <div className="flex gap-3">
                  <GlassButton variant="primary" size="sm">
                    Primary
                  </GlassButton>
                  <GlassButton variant="secondary" size="sm">
                    Secondary
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm">
                    Ghost
                  </GlassButton>
                </div>
              </div>

              <GlassCard variant="subtle" className="p-4">
                <h4 className="font-semibold mb-2">Nested Glass Card</h4>
                <p className="text-sm text-slate-600">
                  Los componentes glass pueden anidarse para crear efectos de profundidad.
                </p>
              </GlassCard>
            </div>
          </GlassModal>

          {/* Profile Modal */}
          <GlassModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            title="Profile Settings Preview"
            size="xl"
          >
            <div className="h-96 overflow-y-auto">
              <EnhancedProfileSettings />
            </div>
          </GlassModal>
        </div>
      </main>
    </div>
  );
}