import { Metadata } from 'next';
import { Search, Filter, Clock, BookOpen, Package, Calendar, Users, Sparkles, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Buscar | KeCarajoComer',
  description: 'Busca recetas, ingredientes, planes de comida y mas en toda la aplicacion'
};

export default function BuscarPage() {
  const searchCategories = [
    {
      id: 'all',
      label: 'Todo',
      icon: Search,
      count: '2,847',
      color: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'recipes',
      label: 'Recetas',
      icon: BookOpen,
      count: '1,234',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'ingredients',
      label: 'Ingredientes',
      icon: Package,
      count: '856',
      color: 'bg-slate-200 text-slate-800'
    },
    {
      id: 'meal-plans',
      label: 'Planes de comida',
      icon: Calendar,
      count: '324',
      color: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      count: '189',
      color: 'bg-slate-50 text-slate-600'
    }
  ];

  const trendingSearches = [
    'Pasta carbonara',
    'Recetas sin gluten',
    'Comida vegetariana',
    'Postres faciles',
    'Cenas rapidas',
    'Smoothies saludables',
    'Recetas con pollo',
    'Comida italiana'
  ];

  const recentSearches = [
    { query: 'empanadas argentinas', category: 'Recetas', time: 'Hace 2 horas' },
    { query: 'quinoa', category: 'Ingredientes', time: 'Ayer' },
    { query: 'plan semanal vegetariano', category: 'Planes', time: 'Hace 3 dias' },
    { query: 'chef martinez', category: 'Usuarios', time: 'Hace 1 semana' }
  ];

  const quickFilters = [
    'Tiempo < 30min',
    'Vegetariano',
    'Sin gluten',
    'Bajas calorias',
    'Para ninos',
    'Facil',
    'Postres',
    'Bebidas'
  ];

  const searchResults = [
    {
      id: 1,
      type: 'recipe',
      title: 'Pasta Carbonara Autentica',
      description: 'La receta tradicional italiana con huevos, queso pecorino y panceta',
      author: 'Chef Maria Gonzalez',
      rating: 4.8,
      time: '25 min',
      image: '/api/placeholder/200/150',
      tags: ['Italiana', 'Pasta', 'Rapida']
    },
    {
      id: 2,
      type: 'ingredient',
      title: 'Panceta',
      description: 'Corte de cerdo ideal para carbonara y otros platos italianos',
      inStock: true,
      location: 'Refrigerador',
      expiresIn: '5 dias',
      recipes: 23
    },
    {
      id: 3,
      type: 'meal-plan',
      title: 'Plan Semanal Mediterraneo',
      description: 'Dieta mediterranea balanceada para toda la semana',
      author: 'Nutricionista Ana Lopez',
      meals: 21,
      followers: 145,
      difficulty: 'Intermedio'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-4">
            Buscar en KeCarajoComer
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Encuentra recetas, ingredientes, planes de comida y mas
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
          <input
            type="text"
            placeholder="Buscar recetas, ingredientes, planes..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
            Buscar
          </button>
        </div>

        {/* Search Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {searchCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-80 ${category.color}`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{category.label}</span>
                <span className="text-sm opacity-75">({category.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Filtros
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Filtros rapidos</h4>
                <div className="space-y-2">
                  {quickFilters.map((filter) => (
                    <label key={filter} className="flex items-center">
                      <input type="checkbox" className="rounded mr-2 accent-orange-500" />
                      <span className="text-sm text-slate-700">{filter}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-2">Tiempo de preparacion</h4>
                <select className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm">
                  <option>Cualquier tiempo</option>
                  <option>Menos de 15 min</option>
                  <option>15-30 min</option>
                  <option>30-60 min</option>
                  <option>Mas de 1 hora</option>
                </select>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-2">Calificacion</h4>
                <select className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm">
                  <option>Cualquier calificacion</option>
                  <option>4+ estrellas</option>
                  <option>3+ estrellas</option>
                  <option>2+ estrellas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trending Searches */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-slate-900">
                Tendencias
              </h3>
            </div>

            <div className="space-y-2">
              {trendingSearches.map((search, index) => (
                <button
                  key={index}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Busquedas recientes
              </h3>
            </div>

            <div className="space-y-3">
              {recentSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {search.query}
                    </p>
                    <p className="text-xs text-slate-500">
                      {search.category} - {search.time}
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Resultados de busqueda
              </h2>
              <p className="text-slate-600">
                Encontrados 245 resultados
              </p>
            </div>

            <select className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900">
              <option>Mas relevantes</option>
              <option>Mas recientes</option>
              <option>Mejor valorados</option>
              <option>Alfabetico</option>
            </select>
          </div>

          {/* Search Results */}
          <div className="space-y-6">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
              >
                <div className="flex gap-4">
                  {result.type === 'recipe' && (
                    <div className="w-24 h-24 bg-slate-200 rounded-lg flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center">
                        <span className="text-slate-500 text-xs">Imagen</span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {result.title}
                        </h3>
                        <p className="text-slate-600 mb-2">
                          {result.description}
                        </p>
                      </div>

                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.type === 'recipe'
                          ? 'bg-orange-100 text-orange-800'
                          : result.type === 'ingredient'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {result.type === 'recipe' ? 'Receta' :
                         result.type === 'ingredient' ? 'Ingrediente' : 'Plan'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      {result.type === 'recipe' && (
                        <>
                          <span>Por {result.author}</span>
                          <span>{result.rating}</span>
                          <span>{result.time}</span>
                        </>
                      )}

                      {result.type === 'ingredient' && (
                        <>
                          <span className={result.inStock ? 'text-green-600' : 'text-red-600'}>
                            {result.inStock ? 'En stock' : 'Sin stock'}
                          </span>
                          {result.location && <span>{result.location}</span>}
                          {result.expiresIn && <span>Vence en {result.expiresIn}</span>}
                        </>
                      )}

                      {result.type === 'meal-plan' && (
                        <>
                          <span>Por {result.author}</span>
                          <span>{result.meals} comidas</span>
                          <span>{result.followers} seguidores</span>
                        </>
                      )}
                    </div>

                    {result.tags && (
                      <div className="flex gap-2 mb-3">
                        {result.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-8">
            <button className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              Cargar mas resultados
            </button>
          </div>
        </div>
      </div>

      {/* AI Search Assistant */}
      <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Sparkles className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Busqueda inteligente con IA
            </h3>
            <p className="text-slate-600">
              Prueba busquedas como &quot;algo rapido con pollo&quot; o &quot;postre sin gluten para diabeticos&quot; y nuestro asistente IA encontrara exactamente lo que necesitas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
