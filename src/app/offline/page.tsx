'use client';

import { Wifi, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.refresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">

          {/* Icon */}
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wifi className="w-10 h-10 text-orange-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Sin conexion
          </h1>

          {/* Description */}
          <p className="text-slate-600 mb-6">
            No te preocupes, podes seguir usando KeCarajoComer en modo offline.
            Tus datos se sincronizaran cuando vuelvas a tener conexion.
          </p>

          {/* Offline Features */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">
              Disponible sin conexion:
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>Ver tu plan semanal</li>
              <li>Usar lista de compras</li>
              <li>Consultar tu despensa</li>
              <li>Marcar items comprados</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ir al inicio
            </Button>
          </div>

          {/* Connection Status */}
          <div className="mt-6 text-xs text-slate-500">
            Estado: {typeof navigator !== 'undefined' && navigator.onLine ? 'Conectado' : 'Sin conexion'}
          </div>
        </div>
      </div>
    </div>
  );
}