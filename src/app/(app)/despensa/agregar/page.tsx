import { Metadata } from 'next';
import { Plus, Package, Calendar, MapPin, Camera, Mic, Barcode, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agregar Items | KeCarajoComer',
  description: 'Agrega nuevos items a tu despensa de forma rapida y sencilla'
};

export default function DespensaAgregarPage() {
  const categories = [
    'Lacteos', 'Carnes', 'Pescados', 'Verduras', 'Frutas',
    'Cereales', 'Legumbres', 'Condimentos', 'Bebidas',
    'Congelados', 'Enlatados', 'Panaderia', 'Otro'
  ];

  const locations = [
    'Refrigerador', 'Congelador', 'Despensa', 'Alacena',
    'Frutero', 'Heladera puerta', 'Cajon verduras', 'Otro'
  ];

  const quickAddMethods = [
    {
      id: 'manual',
      icon: Plus,
      title: 'Agregar manualmente',
      description: 'Escribe los detalles del producto',
      color: 'bg-slate-100 text-slate-600'
    },
    {
      id: 'barcode',
      icon: Barcode,
      title: 'Escanear codigo',
      description: 'Usa la camara para escanear el codigo de barras',
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'voice',
      icon: Mic,
      title: 'Agregar por voz',
      description: 'Di que quieres agregar',
      color: 'bg-slate-100 text-slate-600'
    },
    {
      id: 'photo',
      icon: Camera,
      title: 'Foto del producto',
      description: 'Toma una foto y lo reconocemos automaticamente',
      color: 'bg-orange-100 text-orange-600'
    }
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
              Agregar a Despensa
            </h1>
            <p className="text-slate-500">
              Manten tu inventario actualizado facilmente
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {quickAddMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${method.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-green-600 transition-colors">
                    {method.title}
                  </h3>
                  <p className="text-slate-500">
                    {method.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Add Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-semibold text-slate-900">
            Agregar producto manualmente
          </h2>
        </div>

        <form className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre del producto *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: Leche entera, Tomates, Pan integral..."
                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Buscaremos automaticamente informacion nutricional
            </p>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="1"
                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unidad
              </label>
              <select className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option>unidades</option>
                <option>gramos</option>
                <option>kilogramos</option>
                <option>litros</option>
                <option>mililitros</option>
                <option>paquetes</option>
                <option>latas</option>
                <option>botellas</option>
              </select>
            </div>
          </div>

          {/* Category and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Categoria
              </label>
              <select className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ubicacion
              </label>
              <select className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiration Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha de vencimiento
              </label>
              <input
                type="date"
                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de compra
              </label>
              <input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Brand and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Marca (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: La Serenisima, Marolio..."
                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Precio (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              placeholder="Ej: Comprado en oferta, para la cena del domingo..."
              className="w-full h-20 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Agregar a despensa
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
            >
              Agregar y crear otro
            </button>
          </div>
        </form>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Package className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Consejos para organizar tu despensa
            </h3>
            <ul className="space-y-1 text-slate-600 text-sm">
              <li>- Agregar fechas de vencimiento te ayudara a recibir alertas</li>
              <li>- Especifica la ubicacion para encontrar productos mas rapido</li>
              <li>- El precio te permitira hacer seguimiento de gastos</li>
              <li>- Usa el escaner de codigos para agregar productos mas rapido</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
