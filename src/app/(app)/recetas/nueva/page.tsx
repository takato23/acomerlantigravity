import { Metadata } from 'next';
import { Plus, Clock, Users, ChefHat, Camera, Utensils, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nueva Receta | KeCarajoComér',
  description: 'Crea y guarda tu propia receta personalizada'
};

export default function RecetaNuevaPage() {
  const difficultyLevels = [
    { id: 'easy', label: 'Fácil', description: 'Perfecto para principiantes' },
    { id: 'medium', label: 'Intermedio', description: 'Requiere algo de experiencia' },
    { id: 'hard', label: 'Difícil', description: 'Para cocineros experimentados' }
  ];

  const categories = [
    'Desayuno', 'Almuerzo', 'Cena', 'Aperitivos', 'Postres', 
    'Sopas', 'Ensaladas', 'Pasta', 'Carnes', 'Pescados', 
    'Vegetariano', 'Vegano', 'Sin gluten', 'Bebidas'
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <Plus className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Crear Nueva Receta
            </h1>
            <p className="text-slate-600">
              Comparte tu receta favorita con la comunidad
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Información básica
          </h2>

          <div className="space-y-6">
            {/* Recipe Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre de la receta *
              </label>
              <input
                type="text"
                placeholder="Ej: Pasta Carbonara Casera"
                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción
              </label>
              <textarea
                placeholder="Describe brevemente tu receta, qué la hace especial..."
                className="w-full h-24 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent resize-none"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Foto de la receta
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors cursor-pointer">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">
                  Arrastra una imagen o haz clic para subir
                </p>
                <p className="text-sm text-slate-500">
                  PNG, JPG hasta 10MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Detalles de la receta
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Prep Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Tiempo de preparación
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="30"
                  className="flex-1 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                />
                <select className="p-3 border border-slate-300 rounded-lg bg-white text-slate-900">
                  <option>min</option>
                  <option>horas</option>
                </select>
              </div>
            </div>

            {/* Servings */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Porciones
              </label>
              <input
                type="number"
                placeholder="4"
                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dificultad
              </label>
              <select className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent">
                {difficultyLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {categories.map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-green-600 focus:ring-slate-300 mr-2"
                  />
                  <span className="text-sm text-slate-700">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Ingredientes
          </h2>

          <div className="space-y-3">
            {[1, 2, 3].map((index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Cantidad"
                  className="w-24 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Unidad (ej: tazas, gramos)"
                  className="w-32 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Ingrediente"
                  className="flex-1 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-4 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            + Agregar ingrediente
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Instrucciones
          </h2>

          <div className="space-y-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex gap-3">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-1">
                  {step}
                </div>
                <textarea
                  placeholder={`Paso ${step}: Describe qué hacer en este paso...`}
                  className="flex-1 h-20 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent resize-none"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-4 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            + Agregar paso
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Guardar como borrador
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            Publicar receta
          </button>
        </div>
      </form>
    </div>
  );
}