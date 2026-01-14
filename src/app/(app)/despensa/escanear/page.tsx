'use client';

import { Camera, Zap, QrCode, Package, Smartphone, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DespensaEscanearPage() {
  const router = useRouter();
  const scanMethods = [
    {
      id: 'barcode',
      icon: QrCode,
      title: 'Codigo de barras',
      description: 'Escanea el codigo EAN/UPC del producto',
      color: 'bg-slate-100 text-slate-600',
      accuracy: '95%'
    },
    {
      id: 'receipt',
      icon: Camera,
      title: 'Ticket de compra',
      description: 'Fotografia tu ticket y agregamos todos los productos',
      color: 'bg-green-100 text-green-600',
      accuracy: '85%',
      new: true
    },
    {
      id: 'product',
      icon: Package,
      title: 'Foto del producto',
      description: 'Toma una foto del producto y lo reconocemos',
      color: 'bg-slate-100 text-slate-600',
      accuracy: '78%'
    }
  ];

  const recentScans = [
    {
      id: 1,
      product: 'Leche La Serenisima Entera 1L',
      barcode: '7790170003456',
      status: 'success',
      timestamp: '2024-01-22 14:30',
      confidence: 98
    },
    {
      id: 2,
      product: 'Pan Lactal Bimbo',
      barcode: '7791234567890',
      status: 'success',
      timestamp: '2024-01-22 14:28',
      confidence: 95
    },
    {
      id: 3,
      product: 'Producto no reconocido',
      barcode: '1234567890123',
      status: 'failed',
      timestamp: '2024-01-22 14:25',
      confidence: 0
    }
  ];

  const tips = [
    'Asegurate de que el codigo este bien iluminado',
    'Manten la camara estable y a 10-15cm del codigo',
    'Si el producto no se reconoce, puedes agregarlo manualmente',
    'Los tickets funcionan mejor si estan extendidos y sin arrugas'
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-slate-100 rounded-xl">
            <Camera className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Escanear Items
            </h1>
            <p className="text-slate-500">
              Agrega productos a tu despensa escaneando codigos o fotos
            </p>
          </div>
        </div>
      </div>

      {/* Scan Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scanMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer group relative"
            >
              {method.new && (
                <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  Nuevo
                </span>
              )}

              <div className="text-center">
                <div className={`inline-flex p-4 rounded-2xl ${method.color} mb-4`}>
                  <IconComponent className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  {method.title}
                </h3>

                <p className="text-slate-500 mb-4">
                  {method.description}
                </p>

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-slate-500">Precision:</span>
                  <span className="font-medium text-green-600">
                    {method.accuracy}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (method.id === 'receipt') {
                      router.push('/pantry/scan');
                    } else {
                      // Por ahora, los otros metodos tambien van a la misma pagina
                      router.push('/pantry/scan');
                    }
                  }}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
                >
                  Iniciar escaneo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scanner Interface Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-slate-100 rounded-2xl mb-4">
              <Camera className="w-16 h-16 text-slate-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Camara lista para escanear
            </h2>
            <p className="text-slate-500">
              Selecciona un metodo de escaneo arriba para comenzar
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 bg-slate-50">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-slate-500">
                <Smartphone className="w-5 h-5" />
                <span>La camara se activara aqui</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  onClick={() => router.push('/pantry/scan')}
                  className="flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  Codigo de barras
                </button>
                <button
                  onClick={() => router.push('/pantry/scan')}
                  className="flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Foto producto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Escaneos recientes
          </h2>
          <button className="text-slate-600 hover:underline text-sm">
            Ver todos
          </button>
        </div>

        <div className="space-y-3">
          {recentScans.map((scan) => (
            <div
              key={scan.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  scan.status === 'success'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  {scan.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <div>
                  <p className="font-medium text-slate-900">
                    {scan.product}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{scan.barcode}</span>
                    <span>-</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {scan.timestamp}
                    </div>
                    {scan.confidence > 0 && (
                      <>
                        <span>-</span>
                        <span>{scan.confidence}% confianza</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {scan.status === 'success' ? (
                  <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors">
                    Agregado
                  </button>
                ) : (
                  <button className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm transition-colors">
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8 text-slate-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">127</p>
              <p className="text-sm text-slate-500">Productos escaneados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900">94%</p>
              <p className="text-sm text-slate-500">Tasa de exito</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-slate-900">2.3s</p>
              <p className="text-sm text-slate-500">Tiempo promedio</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-slate-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">15</p>
              <p className="text-sm text-slate-500">Esta semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Camera className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Consejos para mejores escaneos
            </h3>
            <ul className="space-y-2 text-slate-600">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-slate-500 mt-1">-</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
