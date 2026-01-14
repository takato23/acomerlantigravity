'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Clock,
  Sparkles,
  Star,
  Heart,
  ChefHat,
  Flame,
  Plus,
  Camera,
  Download,
  Share2,
  Users,
} from 'lucide-react';

import { GlassCard, GlassButton, GlassModal } from '@/components/ui/GlassCard';
import { EnhancedRecipeGrid } from '@/components/recipes/EnhancedRecipeGrid';
import { EnhancedRecipeCreationModal } from '@/features/recipes/components/EnhancedRecipeCreationModal';
import { CustomRecipeGenerator } from '@/features/recipes/components/CustomRecipeGenerator';
import { useNotifications } from '@/services/notifications';
import { useAnalytics } from '@/services/analytics';
import { getVoiceService } from '@/services/voice/UnifiedVoiceService';
import { cn } from '@/lib/utils';
import { useUser } from '@/store';
import { RecipeCategoryGrid } from '@/features/recipes/components/RecipeCategoryGrid';
import { RecipeDetail } from '@/features/recipes/components/RecipeDetail';
import { Recipe } from '@/features/recipes/types';

// Mock data mejorado
const initialRecipes: Recipe[] = [
  {
    id: '1',
    user_id: '1',
    title: 'Paella Valenciana Tradicional',
    description: 'La auténtica paella con ingredientes frescos del Mediterráneo',
    image_url: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600',
    prep_time: 30,
    cook_time: 45,
    total_time: 75,
    servings: 6,
    difficulty: 'hard',
    rating: 4.9,
    cuisine_type: 'spanish',
    meal_types: ['lunch', 'dinner'],
    dietary_tags: ['gluten-free'],
    ai_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingredients: [
      { ingredient_id: 'arroz-bomba', name: 'Arroz Bomba', quantity: 500, unit: 'g', optional: false },
      { ingredient_id: 'azafran', name: 'Azafran', quantity: 1, unit: 'g', notes: 'En hebras', optional: false },
      { ingredient_id: 'pollo', name: 'Pollo', quantity: 500, unit: 'g', notes: 'Troceado', optional: false },
      { ingredient_id: 'judias-verdes', name: 'Judias Verdes', quantity: 200, unit: 'g', optional: false }
    ],
    instructions: [
      { step_number: 1, text: 'Sofreír el pollo hasta que esté dorado.', time_minutes: 10 },
      { step_number: 2, text: 'Añadir las judías verdes y el tomate rallado.', time_minutes: 5 },
      { step_number: 3, text: 'Incorporar el arroz y el azafrán.', time_minutes: 2 },
      { step_number: 4, text: 'Añadir el caldo y cocinar a fuego fuerte.', time_minutes: 18 }
    ],
    nutritional_info: { calories: 420, protein: 28, carbs: 52, fat: 12, fiber: 4, sugar: 2, sodium: 300 },
    times_cooked: 125,
    is_public: true
  },
  {
    id: '2',
    user_id: 'ai',
    title: 'Bowl de Quinoa y Vegetales Asados',
    description: 'Bowl nutritivo con quinoa orgánica y vegetales de temporada',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
    prep_time: 15,
    cook_time: 25,
    total_time: 40,
    servings: 2,
    difficulty: 'easy',
    rating: 4.7,
    cuisine_type: 'mediterranean',
    meal_types: ['lunch'],
    dietary_tags: ['vegan', 'gluten-free'],
    ai_generated: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingredients: [
      { ingredient_id: 'quinoa', name: 'Quinoa', quantity: 200, unit: 'g', optional: false },
      { ingredient_id: 'batata', name: 'Batata', quantity: 1, unit: 'ud', optional: false },
      { ingredient_id: 'aguacate', name: 'Aguacate', quantity: 1, unit: 'ud', optional: false }
    ],
    instructions: [
      { step_number: 1, text: 'Cocinar la quinoa según instrucciones.' },
      { step_number: 2, text: 'Asar los vegetales en el horno.' },
      { step_number: 3, text: 'Montar el bowl y aderezar.' }
    ],
    nutritional_info: { calories: 320, protein: 12, carbs: 48, fat: 8, fiber: 10, sugar: 5, sodium: 150 },
    times_cooked: 89,
    is_public: true
  }
];

export default function RecetasPage() {
  const router = useRouter();
  const { profile } = useUser();
  const { notify } = useNotifications();
  const { track } = useAnalytics();

  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showCustomGenerator, setShowCustomGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // States related to search/filter moved to EnhancedRecipeGrid

  // const featuredCategories = [
  //   { name: 'Desayunos', icon: '🌅', color: 'from-orange-400 to-amber-400', count: 32 },
  //   { name: 'Comida Rápida', icon: '⚡', color: 'from-blue-400 to-cyan-400', count: 45 },
  //   { name: 'Postres', icon: '🍰', color: 'from-pink-400 to-rose-400', count: 28 },
  //   { name: 'Vegetariano', icon: '🥗', color: 'from-green-400 to-emerald-400', count: 64 },
  //   { name: 'Sin Gluten', icon: '🌾', color: 'from-purple-400 to-indigo-400', count: 37 },
  //   { name: 'Bajo en Calorías', icon: '🥤', color: 'from-teal-400 to-cyan-400', count: 51 }
  // ];

  const normalizeRecipe = (recipe: Recipe) => {
    const legacyMealType = (recipe as Recipe & { meal_type?: string }).meal_type;
    return {
      ...recipe,
      id: recipe.id || crypto.randomUUID(),
      user_id: recipe.user_id || profile?.id || 'guest',
      prep_time: recipe.prep_time || 0,
      cook_time: recipe.cook_time || 0,
      total_time: recipe.total_time ?? (recipe.prep_time || 0) + (recipe.cook_time || 0),
      servings: recipe.servings || 2,
      meal_types: recipe.meal_types && recipe.meal_types.length > 0
        ? recipe.meal_types
        : legacyMealType
          ? [legacyMealType]
          : ['lunch'],
      dietary_tags: recipe.dietary_tags || [],
      nutritional_info: recipe.nutritional_info || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
      is_public: recipe.is_public ?? true,
      created_at: recipe.created_at || new Date().toISOString(),
      updated_at: recipe.updated_at || new Date().toISOString(),
    };
  };

  const featuredRecipe = useMemo(() => {
    if (recipes.length === 0) return null;
    return [...recipes].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  }, [recipes]);

  const averageTotalTime = useMemo(() => {
    if (recipes.length === 0) return 0;
    const total = recipes.reduce((acc, recipe) => {
      const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
      return acc + totalTime;
    }, 0);
    return Math.round(total / recipes.length);
  }, [recipes]);

  const aiRecipeCount = useMemo(() => {
    return recipes.filter((recipe) => recipe.ai_generated).length;
  }, [recipes]);

  const userRecipeCount = useMemo(() => {
    return recipes.filter((recipe) => recipe.user_id === profile?.id).length;
  }, [recipes, profile?.id]);

  const offerings = [
    {
      title: 'IA Gemini',
      description: 'Genera recetas personalizadas con tu despensa y preferencias.',
      icon: Sparkles,
      cta: 'Generar',
      onClick: () => setShowCreationModal(true),
      accent: 'from-amber-400 to-orange-500'
    },
    {
      title: 'Receta Custom',
      description: 'Crea recetas desde cero especificando tus ingredientes exactos.',
      icon: Plus,
      cta: 'Crear Custom',
      onClick: () => setShowCustomGenerator(true),
      accent: 'from-purple-400 to-pink-500'
    },
    {
      title: 'Despensa Inteligente',
      description: 'Filtra por lo que puedes cocinar ahora mismo.',
      icon: Flame,
      cta: 'Ver despensa',
      onClick: () => router.push('/despensa'),
      accent: 'from-emerald-400 to-lime-500'
    },
    {
      title: 'Planificador Semanal',
      description: 'Lleva recetas directo al calendario de comidas.',
      icon: ChefHat,
      cta: 'Planificar',
      onClick: () => router.push('/planificador'),
      accent: 'from-sky-400 to-indigo-500'
    },
    {
      title: 'Escaneo e Importacion',
      description: 'Convierte fotos o PDFs en recetas listas.',
      icon: Camera,
      cta: 'Escanear',
      onClick: () => router.push('/scanner'),
      accent: 'from-pink-400 to-rose-500'
    }
  ];

  const stats = [
    { label: 'Recetas Guardadas', value: recipes.length, icon: Heart, color: 'text-slate-900 dark:text-white' },
    {
      label: 'Creadas por Ti',
      value: userRecipeCount,
      icon: ChefHat,
      color: 'text-orange-500'
    },
    {
      label: 'Generadas por IA',
      value: aiRecipeCount,
      icon: Sparkles,
      color: 'text-slate-900 dark:text-white'
    },
    { label: 'Compartidas', value: 7, icon: Share2, color: 'text-slate-900 dark:text-white' }
  ];

  const quickFilters = [
    { label: 'Desayuno', query: 'breakfast' },
    { label: 'Almuerzo', query: 'lunch' },
    { label: 'Cena', query: 'dinner' },
    { label: 'Postres', query: 'dessert' },
    { label: 'Vegetariano', query: 'vegetarian' },
    { label: 'Vegano', query: 'vegan' },
    { label: 'Sin gluten', query: 'gluten-free' }
  ];

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-orange-300/50 to-amber-200/30 dark:from-orange-500/20 dark:to-amber-500/10 blur-3xl" />
          <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-rose-300/40 to-pink-200/30 dark:from-purple-500/15 dark:to-pink-500/10 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 dark:from-emerald-500/10 dark:to-teal-500/5 blur-3xl" />

          {/* Decorative Geometric Shapes - Light Mode */}
          <svg className="absolute top-20 right-10 w-32 h-32 text-orange-200/60 dark:text-orange-500/10" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="40" opacity="0.5" />
            <circle cx="50" cy="50" r="25" opacity="0.3" />
          </svg>

          <svg className="absolute top-1/3 left-10 w-24 h-24 text-rose-200/50 dark:text-purple-500/10 rotate-45" viewBox="0 0 100 100" fill="currentColor">
            <rect x="20" y="20" width="60" height="60" rx="8" opacity="0.4" />
          </svg>

          <svg className="absolute bottom-40 right-20 w-20 h-20 text-emerald-200/40 dark:text-emerald-500/10" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="50,10 90,90 10,90" opacity="0.5" />
          </svg>

          {/* Decorative Lines */}
          <div className="absolute top-60 left-1/4 w-px h-40 bg-gradient-to-b from-transparent via-orange-300/30 to-transparent dark:via-orange-500/10" />
          <div className="absolute top-80 right-1/3 w-px h-32 bg-gradient-to-b from-transparent via-purple-300/30 to-transparent dark:via-purple-500/10" />

          {/* Floating Dots Pattern */}
          <div className="absolute inset-0 opacity-30 dark:opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
        </div>
        {/* Content */}
        <div className="relative container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch">
              <GlassCard variant="medium" className="relative overflow-hidden p-6 lg:p-8">
                <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/3 rounded-full bg-gradient-to-br from-orange-300/50 to-amber-200/20 blur-3xl" />
                <div className="relative space-y-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    <span className="rounded-full bg-orange-100/80 dark:bg-orange-500/20 px-3 py-1 text-orange-700 dark:text-orange-200">
                      Coleccion viva
                    </span>
                    <span>IA + despensa + favoritos</span>
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl text-slate-900 dark:text-white font-black tracking-tighter mb-2">
                      Explora Recetas
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                      Descubre {recipes.length}+ recetas adaptadas a tus ingredientes y preferencias
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {quickFilters.map((filter) => {
                      const isActive = searchQuery === filter.query;
                      return (
                        <button
                          key={filter.label}
                          onClick={() => setSearchQuery(isActive ? '' : filter.query)}
                          aria-pressed={isActive}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                            isActive
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                              : 'bg-white/80 dark:bg-white/10 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-white hover:text-slate-900 dark:hover:bg-white/20'
                          )}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <GlassButton
                      variant="accent"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setShowCreationModal(true)}
                    >
                      Crear Receta
                    </GlassButton>
                    <GlassButton
                      variant="secondary"
                      icon={<ChefHat className="w-4 h-4" />}
                      onClick={() => router.push('/planificador')}
                    >
                      Planificar
                    </GlassButton>
                    <GlassButton
                      variant="secondary"
                      icon={<Camera className="w-4 h-4" />}
                      onClick={() => router.push('/scanner')}
                    >
                      Escanear
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() => notify('Exportar recetas: La exportación estará disponible pronto.', {
                        type: 'info'
                      })}
                    >
                      Exportar
                    </GlassButton>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      {averageTotalTime || 0} min promedio
                    </span>
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                      {aiRecipeCount} IA
                    </span>
                    <span className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                      {userRecipeCount} creadas por ti
                    </span>
                  </div>
                </div>
              </GlassCard>

              {featuredRecipe && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="h-full"
                >
                  <GlassCard variant="subtle" className="relative h-full min-h-[320px] overflow-hidden p-0">
                    <img
                      src={featuredRecipe.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'}
                      alt={featuredRecipe.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
                    <div className="relative flex h-full flex-col justify-between p-6 text-white">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                        <span className="rounded-full bg-white/20 px-3 py-1">
                          Receta destacada
                        </span>
                        {featuredRecipe.rating ? (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-300" />
                            {featuredRecipe.rating.toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold">{featuredRecipe.title}</h2>
                        <p className="mt-2 text-sm text-white/80 line-clamp-2">
                          {featuredRecipe.description}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/80">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {(featuredRecipe.prep_time || 0) + (featuredRecipe.cook_time || 0)} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {featuredRecipe.servings} porciones
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            {featuredRecipe.ai_generated ? 'IA' : 'Curada'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <GlassButton
                          variant="accent"
                          size="sm"
                          icon={<ArrowRight className="w-4 h-4" />}
                          iconPosition="right"
                          onClick={() => handleRecipeClick(featuredRecipe)}
                          className="bg-white/20 text-white hover:bg-white/30 border border-white/30"
                        >
                          Ver receta
                        </GlassButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Offerings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Acciones inteligentes
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Atajos para crear, planificar y aprovechar tu ecosistema de recetas.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {offerings.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative group"
                >
                  <div className={cn(
                    'relative p-5 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
                    'bg-white/70 dark:bg-slate-800/50',
                    'border border-gray-200/50 dark:border-white/10',
                    'hover:shadow-lg dark:hover:shadow-black/30',
                    'backdrop-blur-sm'
                  )} onClick={item.onClick}>
                    {/* Gradient accent line at top */}
                    <div className={cn(
                      'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                      item.accent
                    )} />

                    {/* Hover gradient overlay */}
                    <div className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br',
                      item.accent
                    )} />

                    <div className="relative flex items-start gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
                          item.accent
                        )}
                      >
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
                        </div>
                        <button className={cn(
                          'px-3 py-1.5 text-sm font-semibold rounded-lg transition-all',
                          'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white',
                          'hover:bg-slate-200 dark:hover:bg-white/20',
                          'border border-slate-200 dark:border-white/10'
                        )}>
                          {item.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Featured Categories - Now using RecipeCategoryGrid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <GlassCard variant="subtle" className="p-4">
              <RecipeCategoryGrid
                selectedCategory={searchQuery}
                onSelectCategory={(id) => {
                  const query = id.toLowerCase();
                  const isActive = searchQuery === query;
                  setSearchQuery(isActive ? '' : query);
                  notify(isActive ? 'Filtros limpiados' : `Filtrando por ${id}`, { type: 'info' });
                }}
              />
            </GlassCard>
          </motion.div>

          {/* Enhanced Recipe Grid Component */}
          <EnhancedRecipeGrid
            recipes={recipes}
            onRecipeClick={handleRecipeClick}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <GlassCard key={stat.label} variant="subtle" className="p-4 text-center">
                <stat.icon className={cn("w-8 h-8 mx-auto mb-2", stat.color)} />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </GlassCard>
            ))}
          </motion.div>
        </div>

        {/* Recipe Detail Modal */}
        <GlassModal
          isOpen={showRecipeModal}
          onClose={() => setShowRecipeModal(false)}
          title={null} // Title handled by RecipeDetail
          size="2xl"
          className="p-0 overflow-hidden max-h-[80vh]"
          contentClassName="p-0"
        >
          {selectedRecipe && (
            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
              <RecipeDetail
                recipe={selectedRecipe}
                onClose={() => setShowRecipeModal(false)}
                displayMode="modal"
                onEdit={() => { }} // Placeholder
              />
            </div>
          )}
        </GlassModal>

        {/* Enhanced Recipe Creation Modal */}
        <EnhancedRecipeCreationModal
          isOpen={showCreationModal}
          onClose={() => setShowCreationModal(false)}
          onRecipeCreated={(recipe) => {
            const normalized = normalizeRecipe({
              ...recipe,
              image_url: recipe.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600'
            });

            setRecipes((prev) => [normalized, ...prev]);

            // Close modal
            setShowCreationModal(false);

            // Show success notification
            notify(`Receta Creada: ${recipe.title} se ha guardado exitosamente`, {
              type: 'success',
              priority: 'medium'
            });

            // Track analytics
            track('recipe_created', {
              method: recipe.ai_generated ? 'ai' : 'manual',
              cuisine: recipe.cuisine_type,
              difficulty: recipe.difficulty
            });

            // Voice feedback
            getVoiceService().speak(`Receta ${recipe.title} creada exitosamente`);
          }}
          userId={profile?.id || 'guest'}
          isAdmin={false}
        />

        {/* Custom Recipe Generator Modal */}
        {showCustomGenerator && (
          <GlassModal
            isOpen={showCustomGenerator}
            onClose={() => setShowCustomGenerator(false)}
            size="large"
          >
            <CustomRecipeGenerator
              onRecipeGenerated={(recipe) => {
                const normalized = normalizeRecipe({
                  ...recipe,
                  image_url: recipe.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
                  ai_generated: true
                });

                setRecipes((prev) => [normalized, ...prev]);

                notify(`Receta Custom Creada: ${recipe.name} generada con IA`, {
                  type: 'success',
                  priority: 'medium'
                });

                track('custom_recipe_generated', {
                  ingredients_count: recipe.ingredients?.length || 0,
                  difficulty: recipe.difficulty,
                  cuisine: recipe.cuisine
                });
              }}
            />
          </GlassModal>
        )}
      </div>
    </div>
  );
}
