import { Metadata } from 'next';
import { Plus, Link, Upload, Camera, Clipboard, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Importar Recetas | KeCarajoComér',
  description: 'Importa recetas desde diferentes fuentes: URLs, archivos, fotos y más'
};

export default function RecetasImportPage() {
  const importMethods = [
    {
      id: 'url',
      icon: Link,
      title: 'Desde URL',
      description: 'Importa recetas desde cualquier sitio web pegando el enlace',
      color: 'bg-slate-100 text-slate-600',
      popular: true
    },
    {
      id: 'photo',
      icon: Camera,
      title: 'Foto de receta',
      description: 'Toma una foto de una receta en libro o revista',
      color: 'bg-green-100 text-green-600',
      new: true
    },
    {
      id: 'file',
      icon: Upload,
      title: 'Subir archivo',
      description: 'Importa desde archivos PDF, Word o imágenes',
      color: 'bg-slate-100 text-slate-600'
    },
    {
      id: 'text',
      icon: Clipboard,
      title: 'Pegar texto',
      description: 'Copia y pega recetas desde cualquier fuente',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  const popularSites = [
    { name: 'YouTube', icon: '📺', supported: true },
    { name: 'Instagram', icon: '📷', supported: true },
    { name: 'AllRecipes', icon: '🍳', supported: true },
    { name: 'Food Network', icon: '🥘', supported: true },
    { name: 'Bon Appétit', icon: '👨‍🍳', supported: true },
    { name: 'Tasty', icon: '🎬', supported: true },
    { name: 'BBC Good Food', icon: '🇬🇧', supported: true },
    { name: 'Recetas Gratis', icon: '🇪🇸', supported: true }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-100 rounded-2xl">
            <Plus className="w-12 h-12 text-slate-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Importar Recetas
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Agrega recetas a tu colección desde múltiples fuentes de forma rápida y sencilla
        </p>
      </div>

      {/* Import Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {importMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="relative">
                {method.popular && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                    Popular
                  </span>
                )}
                {method.new && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    Nuevo
                  </span>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${method.color}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                      {method.title}
                    </h3>
                    <p className="text-slate-600">
                      {method.description}
                    </p>
                  </div>
                </div>

                <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-medium transition-colors">
                  Seleccionar método
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* URL Import Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Link className="w-6 h-6 text-slate-600" />
          <h2 className="text-2xl font-semibold text-slate-900">
            Importar desde URL
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pega el enlace de la receta
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://ejemplo.com/receta-deliciosa"
                className="flex-1 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-transparent"
              />
              <button className="px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors">
                Importar
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Funciona con la mayoría de sitios web de recetas populares
          </p>
        </div>
      </div>

      {/* Supported Sites */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">
          Sitios compatibles
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularSites.map((site) => (
              <div
                key={site.name}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  site.supported
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <span className="text-2xl">{site.icon}</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    {site.name}
                  </p>
                  <p className={`text-xs ${
                    site.supported
                      ? 'text-green-600'
                      : 'text-slate-500'
                  }`}>
                    {site.supported ? 'Compatible' : 'Próximamente'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Imports */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Importaciones recientes
        </h2>

        <div className="space-y-3">
          {[
            { title: 'Pasta Carbonara Perfecta', source: 'tasty.co', date: 'Hace 2 horas', status: 'success' },
            { title: 'Tarta de Chocolate', source: 'youtube.com', date: 'Ayer', status: 'success' },
            { title: 'Paella Valenciana', source: 'instagram.com', date: 'Hace 3 días', status: 'processing' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  item.status === 'success' ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                <div>
                  <p className="font-medium text-slate-900">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-600">
                    Desde {item.source} • {item.date}
                  </p>
                </div>
              </div>
              <button className="text-slate-700 hover:underline text-sm">
                Ver receta
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <FileText className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Consejos para mejores importaciones
            </h3>
            <ul className="space-y-1 text-slate-600 text-sm">
              <li>• Usa URLs directas de recetas, no de búsquedas o listas</li>
              <li>• Para fotos, asegúrate de que el texto sea claro y legible</li>
              <li>• Los archivos PDF funcionan mejor si tienen texto seleccionable</li>
              <li>• Revisa siempre la receta importada antes de guardarla</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}