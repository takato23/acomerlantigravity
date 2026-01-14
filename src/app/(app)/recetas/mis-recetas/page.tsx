import { Metadata } from 'next';
import { User, Plus, Search, Filter, Clock, Users, Star, Edit, Trash2, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mis Recetas | KeCarajoComér',
  description: 'Gestiona y organiza tus recetas creadas'
};

export default function MisRecetasPage() {
  const myRecipes = [
    {
      id: 1,
      title: 'Mi Pasta Carbonara Especial',
      description: 'Versión familiar con un toque secreto de hierbas',
      image: '/api/placeholder/300/200',
      status: 'published',
      rating: 4.8,
      views: 234,
      likes: 45,
      prepTime: '25 min',
      servings: 4,
      createdAt: '2024-01-20',
      updatedAt: '2024-01-22',
      category: 'Pasta',
      difficulty: 'Intermedio'
    },
    {
      id: 2,
      title: 'Empanadas de la Abuela',
      description: 'Receta tradicional familiar transmitida por generaciones',
      image: '/api/placeholder/300/200',
      status: 'draft',
      rating: 0,
      views: 0,
      likes: 0,
      prepTime: '2 horas',
      servings: 12,
      createdAt: '2024-01-18',
      updatedAt: '2024-01-18',
      category: 'Tradicional',
      difficulty: 'Difícil'
    },
    {
      id: 3,
      title: 'Smoothie Verde Energizante',
      description: 'Perfecto para empezar el día con energía',
      image: '/api/placeholder/300/200',
      status: 'published',
      rating: 4.5,
      views: 89,
      likes: 23,
      prepTime: '5 min',
      servings: 2,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-16',
      category: 'Bebidas',
      difficulty: 'Fácil'
    }
  ];

  const stats = {
    total: myRecipes.length,
    published: myRecipes.filter(r => r.status === 'published').length,
    drafts: myRecipes.filter(r => r.status === 'draft').length,
    totalViews: myRecipes.reduce((sum, r) => sum + r.views, 0),
    averageRating: myRecipes.filter(r => r.rating > 0).reduce((sum, r, _, arr) => sum + r.rating / arr.length, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicada';
      case 'draft': return 'Borrador';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl">
              <User className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Mis Recetas
              </h1>
              <p className="text-slate-600">
                Gestiona y organiza tus creaciones culinarias
              </p>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
            <Plus className="w-5 h-5" />
            Nueva receta
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-600">Total recetas</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-sm text-slate-600">Publicadas</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-amber-600">{stats.drafts}</p>
            <p className="text-sm text-slate-600">Borradores</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-slate-700">{stats.totalViews}</p>
            <p className="text-sm text-slate-600">Visualizaciones</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-slate-700">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
            </p>
            <p className="text-sm text-slate-600">Rating promedio</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar en mis recetas..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filtrar
            </button>

            <select className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900">
              <option>Todas</option>
              <option>Publicadas</option>
              <option>Borradores</option>
            </select>

            <select className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900">
              <option>Más recientes</option>
              <option>Más antiguas</option>
              <option>Más vistas</option>
              <option>Mejor valoradas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"
          >
            {/* Recipe Image */}
            <div className="relative h-48 bg-slate-200">
              <div className="absolute top-3 right-3 z-10">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recipe.status)}`}>
                  {getStatusText(recipe.status)}
                </span>
              </div>

              {recipe.status === 'published' && (
                <div className="absolute bottom-3 left-3 z-10 flex gap-2 text-white text-xs">
                  <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full">
                    <Eye className="w-3 h-3" />
                    {recipe.views}
                  </span>
                  <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3" />
                    {recipe.rating}
                  </span>
                </div>
              )}

              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <span className="text-slate-500 text-sm">Imagen</span>
              </div>
            </div>

            {/* Recipe Info */}
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                {recipe.title}
              </h3>

              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {recipe.description}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recipe.prepTime}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {recipe.servings}
                </div>
              </div>

              {/* Category and Difficulty */}
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                  {recipe.category}
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                  {recipe.difficulty}
                </span>
              </div>

              {/* Dates */}
              <div className="text-xs text-slate-500 mb-4">
                <p>Creada: {new Date(recipe.createdAt).toLocaleDateString()}</p>
                {recipe.createdAt !== recipe.updatedAt && (
                  <p>Actualizada: {new Date(recipe.updatedAt).toLocaleDateString()}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                <button className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {myRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Aún no has creado recetas
          </h3>
          <p className="text-slate-600 mb-6">
            ¡Empieza a compartir tus creaciones culinarias con la comunidad!
          </p>
          <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
            Crear mi primera receta
          </button>
        </div>
      )}
    </div>
  );
}