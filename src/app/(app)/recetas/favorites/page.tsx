import { Metadata } from 'next';
import { Heart, Clock, Users, Star, Filter, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mis Recetas Favoritas | KeCarajoComér',
  description: 'Colección de tus recetas favoritas guardadas y valoradas'
};

export default function RecetasFavoritasPage() {
  const favoriteRecipes = [
    {
      id: 1,
      title: 'Pasta Carbonara Clásica',
      image: '/api/placeholder/300/200',
      rating: 5,
      prepTime: '20 min',
      servings: 4,
      tags: ['italiana', 'pasta', 'rápida'],
      dateAdded: '2024-01-15',
      timesCooked: 8
    },
    {
      id: 2,
      title: 'Pollo al Curry Tailandés',
      image: '/api/placeholder/300/200',
      rating: 5,
      prepTime: '35 min',
      servings: 6,
      tags: ['tailandesa', 'curry', 'picante'],
      dateAdded: '2024-01-10',
      timesCooked: 5
    },
    {
      id: 3,
      title: 'Ensalada César con Pollo',
      image: '/api/placeholder/300/200',
      rating: 4,
      prepTime: '15 min',
      servings: 2,
      tags: ['ensalada', 'saludable', 'rápida'],
      dateAdded: '2024-01-08',
      timesCooked: 12
    },
    {
      id: 4,
      title: 'Risotto de Hongos',
      image: '/api/placeholder/300/200',
      rating: 5,
      prepTime: '45 min',
      servings: 4,
      tags: ['italiana', 'vegetariano', 'cremoso'],
      dateAdded: '2024-01-05',
      timesCooked: 3
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 rounded-xl">
            <Heart className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Mis Recetas Favoritas
            </h1>
            <p className="text-slate-600">
              Tu colección personal de recetas más queridas
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900">24</p>
              <p className="text-sm text-slate-600">Favoritas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900">4.7</p>
              <p className="text-sm text-slate-600">Rating promedio</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-slate-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900">28min</p>
              <p className="text-sm text-slate-600">Tiempo promedio</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900">127</p>
              <p className="text-sm text-slate-600">Veces cocinadas</p>
            </div>
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
              placeholder="Buscar en favoritas..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filtrar
            </button>

            <select className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900">
              <option>Más recientes</option>
              <option>Mejor valoradas</option>
              <option>Más cocinadas</option>
              <option>Tiempo de preparación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favoriteRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* Recipe Image */}
            <div className="relative h-48 bg-slate-200">
              <div className="absolute top-3 right-3 z-10">
                <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 z-10">
                <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                  Cocinada {recipe.timesCooked} veces
                </span>
              </div>

              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <span className="text-slate-500 text-sm">Imagen</span>
              </div>
            </div>

            {/* Recipe Info */}
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                {recipe.title}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < recipe.rating
                        ? 'text-amber-400 fill-current'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
                <span className="text-sm text-slate-600 ml-1">
                  ({recipe.rating})
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recipe.prepTime}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {recipe.servings}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {recipe.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 2 && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                    +{recipe.tags.length - 2}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors">
                  Ver receta
                </button>
                <button className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (when no favorites) */}
      {favoriteRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Heart className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Aún no tienes favoritas
          </h3>
          <p className="text-slate-600 mb-6">
            Marca como favoritas las recetas que más te gusten para encontrarlas fácilmente
          </p>
          <button className="px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors">
            Explorar recetas
          </button>
        </div>
      )}
    </div>
  );
}