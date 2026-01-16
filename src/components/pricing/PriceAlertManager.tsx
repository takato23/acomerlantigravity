/**
 * Price Alert Manager Component
 * Manage price alerts and notifications
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  DollarSign,
  TrendingDown,
  Target,
  Clock,
  Check
} from 'lucide-react';

import { PriceAlert } from '@/services/pricing';
import { IOS26LiquidCard, IOS26LiquidButton, IOS26LiquidInput } from '@/components/ios26';
import { cn } from '@/lib/utils';

interface PriceAlertManagerProps {
  alerts: PriceAlert[];
  onCreateAlert?: (productId: string, targetPrice: number) => void;
  onDeleteAlert?: (alertId: string) => void;
  onToggleAlert?: (alertId: string, enabled: boolean) => void;
  className?: string;
}

interface NewAlertForm {
  productName: string;
  targetPrice: string;
  isValid: boolean;
}

export const PriceAlertManager: React.FC<PriceAlertManagerProps> = ({
  alerts,
  onCreateAlert,
  onDeleteAlert,
  onToggleAlert,
  className
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState<NewAlertForm>({
    productName: '',
    targetPrice: '',
    isValid: false
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const validateForm = (form: NewAlertForm) => {
    const price = parseFloat(form.targetPrice);
    return form.productName.trim().length > 0 &&
      !isNaN(price) &&
      price > 0;
  };

  const handleInputChange = (field: keyof NewAlertForm, value: string) => {
    const updated = { ...newAlert, [field]: value };
    updated.isValid = validateForm(updated);
    setNewAlert(updated);
  };

  const handleCreateAlert = () => {
    if (newAlert.isValid && onCreateAlert) {
      onCreateAlert('product-id', parseFloat(newAlert.targetPrice));
      setNewAlert({ productName: '', targetPrice: '', isValid: false });
      setShowCreateForm(false);
    }
  };

  const getAlertStatus = (alert: PriceAlert) => {
    if (alert.triggered) {
      return {
        icon: <Check className="w-4 h-4" />,
        color: "text-green-600",
        bg: "bg-green-50",
        text: "Precio alcanzado!"
      };
    }

    const percentage = ((alert.targetPrice - alert.currentPrice) / alert.currentPrice) * 100;
    if (percentage > -10) {
      return {
        icon: <Target className="w-4 h-4" />,
        color: "text-amber-600",
        bg: "bg-amber-50",
        text: "Cerca del objetivo"
      };
    }

    return {
      icon: <Clock className="w-4 h-4" />,
      color: "text-slate-600",
      bg: "bg-slate-100",
      text: "Monitoreando"
    };
  };

  const activeAlerts = alerts.filter(alert => !alert.triggered);
  const triggeredAlerts = alerts.filter(alert => alert.triggered);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Alertas de Precio
        </h2>
        <IOS26LiquidButton
          variant="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
          icon={<Plus className="w-4 h-4" />}
          glow
        >
          Nueva Alerta
        </IOS26LiquidButton>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IOS26LiquidCard variant="subtle" className="p-4">
          <div className="text-center">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-700">
              {activeAlerts.length}
            </p>
            <p className="text-sm text-slate-600">Alertas activas</p>
          </div>
        </IOS26LiquidCard>

        <IOS26LiquidCard variant="subtle" className="p-4">
          <div className="text-center">
            <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">
              {triggeredAlerts.length}
            </p>
            <p className="text-sm text-green-600">Alertas cumplidas</p>
          </div>
        </IOS26LiquidCard>

        <IOS26LiquidCard variant="subtle" className="p-4">
          <div className="text-center">
            <TrendingDown className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-700">
              {triggeredAlerts.reduce((sum, alert) => sum + (alert.currentPrice - alert.targetPrice), 0).toFixed(0)}
            </p>
            <p className="text-sm text-slate-600">Ahorro total</p>
          </div>
        </IOS26LiquidCard>
      </div>

      {/* Create Alert Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <IOS26LiquidCard variant="medium" className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-900">
                Crear Nueva Alerta
              </h3>

              <div className="space-y-4">
                <IOS26LiquidInput
                  label="Nombre del producto"
                  value={newAlert.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  placeholder="Ej: Aceite de oliva"
                />

                <IOS26LiquidInput
                  label="Precio objetivo (ARS)"
                  type="number"
                  value={newAlert.targetPrice}
                  onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                  placeholder="Ej: 1500"
                  icon={<DollarSign className="w-4 h-4" />}
                />

                <div className="flex gap-2">
                  <IOS26LiquidButton
                    variant="primary"
                    onClick={handleCreateAlert}
                    disabled={!newAlert.isValid}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Crear Alerta
                  </IOS26LiquidButton>

                  <IOS26LiquidButton
                    variant="ghost"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </IOS26LiquidButton>
                </div>
              </div>
            </IOS26LiquidCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            Alertas Cumplidas
          </h3>

          {triggeredAlerts.map((alert, index) => {
            const status = getAlertStatus(alert);
            const savings = alert.currentPrice - alert.targetPrice;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <IOS26LiquidCard variant="medium" glow className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", status.bg)}>
                        <span className={status.color}>
                          {status.icon}
                        </span>
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          Producto #{alert.productId}
                        </p>
                        <p className="text-sm text-slate-600">
                          Objetivo: {formatPrice(alert.targetPrice)}
                        </p>
                        <p className="text-sm text-green-600">
                          Actual: {formatPrice(alert.currentPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(Math.abs(savings))} ahorrado
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </IOS26LiquidCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-600" />
            Alertas Activas
          </h3>

          {activeAlerts.map((alert, index) => {
            const status = getAlertStatus(alert);
            const percentage = ((alert.targetPrice - alert.currentPrice) / alert.currentPrice) * 100;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <IOS26LiquidCard variant="subtle" className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", status.bg)}>
                        <span className={status.color}>
                          {status.icon}
                        </span>
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          Producto #{alert.productId}
                        </p>
                        <p className="text-sm text-slate-600">
                          Objetivo: {formatPrice(alert.targetPrice)}
                        </p>
                        <p className="text-sm text-slate-600">
                          Actual: {formatPrice(alert.currentPrice)}
                        </p>
                        <p className={cn(
                          "text-xs font-medium",
                          percentage > 0 ? "text-red-600" : "text-green-600"
                        )}>
                          {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}% del objetivo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right mr-3">
                        <p className={cn("text-sm font-medium", status.color)}>
                          {status.text}
                        </p>
                        <p className="text-xs text-slate-500">
                          Creado {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <IOS26LiquidButton
                        variant="danger"
                        size="sm"
                        onClick={() => onDeleteAlert?.(alert.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        Eliminar
                      </IOS26LiquidButton>
                    </div>
                  </div>
                </IOS26LiquidCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <IOS26LiquidCard variant="subtle" className="p-12 text-center">
          <BellOff className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            No tienes alertas de precio
          </h3>
          <p className="text-slate-500 mb-4">
            Crea alertas para ser notificado cuando los precios bajen
          </p>
          <IOS26LiquidButton
            variant="primary"
            onClick={() => setShowCreateForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Crear Primera Alerta
          </IOS26LiquidButton>
        </IOS26LiquidCard>
      )}
    </div>
  );
};
