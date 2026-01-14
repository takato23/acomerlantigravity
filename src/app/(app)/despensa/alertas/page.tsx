import { Metadata } from 'next';
import { Bell, AlertTriangle, Clock, Package, Trash2, ShoppingCart, Settings, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Alertas de Despensa | KeCarajoComer',
  description: 'Gestiona alertas de vencimiento y stock bajo en tu despensa'
};

export default function DespensaAlertasPage() {
  const alerts = [
    {
      id: 1,
      type: 'expiring_soon',
      priority: 'high',
      product: 'Yogur Griego La Serenisima',
      message: 'Vence en 2 dias',
      daysLeft: 2,
      quantity: '2 unidades',
      location: 'Refrigerador',
      date: '2024-01-24',
      suggestions: ['Usar en smoothie', 'Hacer salsa tzatziki']
    },
    {
      id: 2,
      type: 'expiring_today',
      priority: 'critical',
      product: 'Pan Lactal',
      message: 'Vence hoy',
      daysLeft: 0,
      quantity: '1 paquete',
      location: 'Alacena',
      date: '2024-01-22',
      suggestions: ['Hacer tostadas francesas', 'Congelar rebanadas']
    },
    {
      id: 3,
      type: 'low_stock',
      priority: 'medium',
      product: 'Leche Entera',
      message: 'Stock bajo',
      quantity: '0.5 litros restantes',
      location: 'Refrigerador',
      threshold: '1 litro',
      suggestions: ['Agregar a lista de compras']
    },
    {
      id: 4,
      type: 'expired',
      priority: 'critical',
      product: 'Tomates Cherry',
      message: 'Vencio hace 1 dia',
      daysLeft: -1,
      quantity: '300g',
      location: 'Cajon verduras',
      date: '2024-01-21',
      suggestions: ['Revisar estado', 'Desechar si es necesario']
    },
    {
      id: 5,
      type: 'expiring_week',
      priority: 'low',
      product: 'Queso Cremoso',
      message: 'Vence en 5 dias',
      daysLeft: 5,
      quantity: '200g',
      location: 'Refrigerador',
      date: '2024-01-27',
      suggestions: ['Usar en pasta', 'Hacer empanadas']
    }
  ];

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter(a => a.priority === 'critical').length,
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    low: alerts.filter(a => a.priority === 'low').length
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-amber-500 bg-amber-50';
      case 'low': return 'border-slate-500 bg-slate-50';
      default: return 'border-slate-300 bg-slate-50';
    }
  };

  const getPriorityIcon = (type: string, priority: string) => {
    if (type === 'expired' || priority === 'critical') {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
    if (type === 'low_stock') {
      return <Package className="w-5 h-5 text-amber-600" />;
    }
    return <Clock className="w-5 h-5 text-orange-600" />;
  };

  const getPriorityText = (priority: string) => {
    const map = {
      critical: 'Critica',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };
    return map[priority as keyof typeof map] || priority;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <Bell className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Alertas de Despensa
              </h1>
              <p className="text-slate-500">
                Manten control sobre vencimientos y stock bajo
              </p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Settings className="w-5 h-5" />
            Configurar alertas
          </button>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-2xl font-bold text-slate-900">{alertStats.total}</p>
            <p className="text-sm text-slate-500">Total alertas</p>
          </div>

          <div className="bg-white rounded-xl p-4 border-l-4 border-l-red-500">
            <p className="text-2xl font-bold text-red-600">{alertStats.critical}</p>
            <p className="text-sm text-slate-500">Criticas</p>
          </div>

          <div className="bg-white rounded-xl p-4 border-l-4 border-l-orange-500">
            <p className="text-2xl font-bold text-orange-600">{alertStats.high}</p>
            <p className="text-sm text-slate-500">Altas</p>
          </div>

          <div className="bg-white rounded-xl p-4 border-l-4 border-l-amber-500">
            <p className="text-2xl font-bold text-amber-600">{alertStats.medium}</p>
            <p className="text-sm text-slate-500">Medias</p>
          </div>

          <div className="bg-white rounded-xl p-4 border-l-4 border-l-slate-500">
            <p className="text-2xl font-bold text-slate-600">{alertStats.low}</p>
            <p className="text-sm text-slate-500">Bajas</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all">
          <ShoppingCart className="w-6 h-6 text-slate-600" />
          <div className="text-left">
            <p className="font-medium text-slate-900">Agregar a compras</p>
            <p className="text-sm text-slate-500">Stock bajo automatico</p>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all">
          <Calendar className="w-6 h-6 text-green-600" />
          <div className="text-left">
            <p className="font-medium text-slate-900">Planificar comidas</p>
            <p className="text-sm text-slate-500">Usar productos proximos</p>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all">
          <Trash2 className="w-6 h-6 text-red-600" />
          <div className="text-left">
            <p className="font-medium text-slate-900">Marcar como consumido</p>
            <p className="text-sm text-slate-500">Productos usados</p>
          </div>
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 rounded-lg p-6 ${getPriorityColor(alert.priority)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                {getPriorityIcon(alert.type, alert.priority)}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {alert.product}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.priority === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : alert.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : alert.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {getPriorityText(alert.priority)}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium mb-2">
                    {alert.message}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>Cantidad: {alert.quantity}</span>
                    <span>Ubicacion: {alert.location}</span>
                    {alert.date && (
                      <span>Fecha: {new Date(alert.date).toLocaleDateString()}</span>
                    )}
                    {alert.threshold && (
                      <span>Umbral: {alert.threshold}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-500 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suggestions */}
            {alert.suggestions && alert.suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Sugerencias:
                </p>
                <div className="flex flex-wrap gap-2">
                  {alert.suggestions.map((suggestion, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-full text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {alert.type === 'low_stock' ? (
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors">
                  Agregar a lista de compras
                </button>
              ) : alert.type === 'expired' ? (
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                  Marcar como desechado
                </button>
              ) : (
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                  Marcar como usado
                </button>
              )}

              <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                Ver recetas sugeridas
              </button>

              <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                Extender fecha
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Settings */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Settings className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Configuracion de alertas inteligentes
            </h3>
            <p className="text-slate-500 mb-4">
              Personaliza cuando y como recibir notificaciones sobre tu despensa
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded mr-2" />
                  <span>Alertas de vencimiento (3 dias antes)</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded mr-2" />
                  <span>Alertas de stock bajo</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded mr-2" />
                  <span>Sugerencias de recetas automaticas</span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded mr-2" />
                  <span>Notificaciones push</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded mr-2" />
                  <span>Resumen diario por email</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded mr-2" />
                  <span>Alertas de fin de semana</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
