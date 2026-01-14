'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Smartphone, Check, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { Heading, Text } from '@/components/design-system/Typography';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        clearTimeout(timeout);
        setIsLoading(false);
        setError('Usuario no autenticado');
        return;
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50)
        .abortSignal(controller.signal);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error: queryError } = await query;
      clearTimeout(timeout);

      if (queryError) {
        console.error('Error loading notifications:', queryError);
        setError('Error al cargar notificaciones');
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tiempo de espera agotado. Intenta de nuevo.');
      } else {
        setError('Error al cargar notificaciones');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    );
  };

  const dismissNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_dismissed: true })
      .eq('id', id);

    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_dismissed: true })
      .eq('user_id', user.id);

    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading size="3xl" weight="bold">
            Notificaciones
          </Heading>
          <Text size="sm" color="muted" className="mt-1">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
          </Text>
        </div>
        <button
          onClick={loadNotifications}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`h-5 w-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            Todas
          </FilterButton>
          <FilterButton
            active={filter === 'unread'}
            onClick={() => setFilter('unread')}
          >
            Sin leer {unreadCount > 0 && `(${unreadCount})`}
          </FilterButton>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Marcar todo leído
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Limpiar todo
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-red-200">
          <div className="text-red-500 mb-4">
            <Bell className="h-12 w-12 mx-auto" />
          </div>
          <Text size="lg" weight="medium" className="text-slate-900 mb-2">
            {error}
          </Text>
          <button
            onClick={loadNotifications}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <Text size="lg" weight="medium" className="text-slate-600">
            No hay notificaciones
          </Text>
          <Text size="sm" color="muted" className="mt-1">
            {filter === 'unread'
              ? 'No tenés notificaciones sin leer'
              : 'Vas a ver tus notificaciones acá'}
          </Text>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDismiss={dismissNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-xl text-sm font-medium transition-colors
        ${active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
      `}
    >
      {children}
    </button>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDismiss,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const getIcon = () => {
    if (notification.type.includes('email')) {
      return <Mail className="h-5 w-5 text-blue-500" />;
    }
    if (notification.type.includes('push')) {
      return <Smartphone className="h-5 w-5 text-emerald-500" />;
    }
    return <Bell className="h-5 w-5 text-purple-500" />;
  };

  const getTypeLabel = () => {
    if (notification.type.includes('plan_ready')) return 'Plan listo';
    if (notification.type.includes('daily_reminder')) return 'Recordatorio';
    if (notification.type.includes('shopping')) return 'Compras';
    return 'Notificación';
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div
      className={`
        relative rounded-2xl border p-4 transition-all
        ${notification.is_read
          ? 'bg-white border-slate-200'
          : 'bg-emerald-50 border-emerald-200'}
      `}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={`
          p-2 rounded-xl shrink-0
          ${notification.is_read ? 'bg-slate-100' : 'bg-white'}
        `}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-500">
              {getTypeLabel()}
            </span>
            <span className="text-xs text-slate-400">
              {timeAgo}
            </span>
          </div>

          <h3 className="font-medium text-slate-900 truncate">
            {notification.title}
          </h3>

          {notification.message && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        {!notification.is_read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <Check className="h-3 w-3" />
            Marcar como leída
          </button>
        )}
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 font-medium ml-auto"
        >
          <Trash2 className="h-3 w-3" />
          Eliminar
        </button>
      </div>
    </div>
  );
}