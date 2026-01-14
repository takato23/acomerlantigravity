'use client';

import React from 'react';
import { Bell, Mail, Smartphone, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Heading, Text } from '@/components/design-system/Typography';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export default function SettingsPage() {
  const {
    preferences,
    isLoading,
    isSaving,
    error,
    pushPermission,
    togglePreference,
    updateReminderTime,
    requestPushPermission,
    disablePushNotifications,
    reload,
  } = useNotificationPreferences();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Error al cargar</h2>
            <p className="text-slate-600">{error}</p>
          </div>
          <button
            onClick={reload}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const handlePushToggle = async () => {
    if (preferences.push_enabled) {
      await disablePushNotifications();
    } else {
      await requestPushPermission();
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="text-center">
        <Heading size="3xl" weight="bold">
          Configuración
        </Heading>
        <Text size="lg" color="muted" className="mt-2">
          Personaliza tus notificaciones
        </Text>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        {/* Email Notifications Section */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Notificaciones por Email</h2>
              <p className="text-sm text-slate-500">Recibí actualizaciones en tu correo</p>
            </div>
            <div className="ml-auto">
              <ToggleSwitch
                enabled={preferences.email_enabled}
                onChange={() => togglePreference('email_enabled')}
                disabled={isSaving}
              />
            </div>
          </div>

          {preferences.email_enabled && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <PreferenceRow
                label="Plan semanal listo"
                description="Cuando se genera un nuevo plan"
                enabled={preferences.plan_ready}
                onChange={() => togglePreference('plan_ready')}
                disabled={isSaving}
              />
              <PreferenceRow
                label="Recordatorios diarios"
                description="Qué cocinar cada día"
                enabled={preferences.daily_reminders}
                onChange={() => togglePreference('daily_reminders')}
                disabled={isSaving}
              />
              <PreferenceRow
                label="Lista de compras"
                description="Recordatorio de ingredientes"
                enabled={preferences.shopping_reminders}
                onChange={() => togglePreference('shopping_reminders')}
                disabled={isSaving}
              />
            </div>
          )}
        </section>

        {/* Push Notifications Section */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-100">
              <Smartphone className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Notificaciones Push</h2>
              <p className="text-sm text-slate-500">Alertas en tu navegador o celular</p>
            </div>
            <div className="ml-auto">
              {pushPermission === 'denied' ? (
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                  Bloqueado
                </span>
              ) : (
                <ToggleSwitch
                  enabled={preferences.push_enabled}
                  onChange={handlePushToggle}
                  disabled={isSaving}
                />
              )}
            </div>
          </div>

          {pushPermission === 'denied' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-medium">Permisos denegados</p>
              <p className="text-amber-700 mt-1">
                Para activar las notificaciones push, habilitá los permisos desde la configuración de tu navegador.
              </p>
            </div>
          )}

          {preferences.push_enabled && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <PreferenceRow
                label="Recordatorios de cocina"
                description="Cuándo empezar a preparar"
                enabled={true}
                onChange={() => { }}
                disabled={true}
              />
              <PreferenceRow
                label="Nuevas recetas"
                description="Sugerencias personalizadas"
                enabled={true}
                onChange={() => { }}
                disabled={true}
              />
            </div>
          )}
        </section>

        {/* Reminder Time */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">Hora de recordatorios</h2>
              <p className="text-sm text-slate-500">Cuándo recibir las alertas diarias</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={preferences.reminder_time}
                onChange={(e) => updateReminderTime(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={isSaving}
              />
            </div>
          </div>
        </section>

        {/* Other Settings Placeholder */}
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold text-slate-900 mb-4">Otras configuraciones</h2>

          <div className="space-y-2">
            <SettingsLink label="Preferencias alimentarias" href="/perfil" />
            <SettingsLink label="Cuenta y seguridad" href="/profile" />
            <SettingsLink label="Tema y apariencia" href="#" disabled />
            <SettingsLink label="Idioma" href="#" disabled />
          </div>
        </section>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Guardando...</span>
        </div>
      )}
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// Preference Row Component
function PreferenceRow({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// Settings Link Component
function SettingsLink({
  label,
  href,
  disabled = false,
}: {
  label: string;
  href: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 text-slate-400">
        <span className="text-sm">{label}</span>
        <span className="text-xs bg-slate-200 px-2 py-1 rounded">Próximamente</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors"
    >
      <span className="text-sm text-slate-700">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </a>
  );
}