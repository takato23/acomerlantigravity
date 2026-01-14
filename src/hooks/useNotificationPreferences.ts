/**
 * useNotificationPreferences Hook
 * Manage user notification preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { pwaService } from '@/lib/pwa';
import { toast } from 'sonner';

export interface NotificationPreferences {
    email_enabled: boolean;
    push_enabled: boolean;
    plan_ready: boolean;
    daily_reminders: boolean;
    shopping_reminders: boolean;
    reminder_time: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    email_enabled: true,
    push_enabled: false,
    plan_ready: true,
    daily_reminders: true,
    shopping_reminders: true,
    reminder_time: '08:00',
};

export function useNotificationPreferences() {
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [error, setError] = useState<string | null>(null);

    // Load preferences
    useEffect(() => {
        loadPreferences();
        checkPushPermission();
    }, []);

    const loadPreferences = useCallback(async () => {
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
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('notification_preferences')
                .eq('user_id', user.id)
                .abortSignal(controller.signal)
                .single();

            clearTimeout(timeout);

            if (profileError) {
                console.error('Failed to load preferences:', profileError);
                setError('No se pudieron cargar las preferencias');
                return;
            }

            if (profile?.notification_preferences) {
                setPreferences({
                    ...DEFAULT_PREFERENCES,
                    ...profile.notification_preferences,
                });
            }
        } catch (err) {
            console.error('Error loading preferences:', err);
            setError('Error al cargar preferencias');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const checkPushPermission = useCallback(() => {
        if ('Notification' in window) {
            setPushPermission(Notification.permission);
        }
    }, []);

    // Save preferences
    const savePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
        setIsSaving(true);
        setError(null);

        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                clearTimeout(timeout);
                setError('Usuario no autenticado');
                return false;
            }

            const updatedPreferences = { ...preferences, ...newPreferences };

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    notification_preferences: updatedPreferences,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .abortSignal(controller.signal);

            clearTimeout(timeout);

            if (updateError) {
                console.error('Failed to save preferences:', updateError);
                setError('No se pudieron guardar las preferencias');
                toast.error('Error al guardar preferencias');
                return false;
            }

            setPreferences(updatedPreferences);
            toast.success('Preferencias guardadas');
            return true;
        } catch (err) {
            console.error('Error saving preferences:', err);
            setError('Error al guardar preferencias');
            toast.error('Error al guardar preferencias');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [preferences]);

    // Request push notification permission
    const requestPushPermission = useCallback(async () => {
        try {
            const permission = await pwaService.requestNotificationPermission();
            setPushPermission(permission);

            if (permission === 'granted') {
                // Register push subscription
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                });

                // Save subscription to server
                const response = await fetch('/api/notifications/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: subscription.toJSON() }),
                });

                if (response.ok) {
                    await savePreferences({ push_enabled: true });
                    toast.success('Notificaciones push activadas');
                } else {
                    throw new Error('Failed to save subscription');
                }
            } else if (permission === 'denied') {
                toast.error('Permiso de notificaciones denegado');
            }

            return permission;
        } catch (err) {
            console.error('Error requesting push permission:', err);
            toast.error('Error al activar notificaciones push');
            return 'denied' as NotificationPermission;
        }
    }, [savePreferences]);

    // Disable push notifications
    const disablePushNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/push/subscribe', {
                method: 'DELETE',
            });

            if (response.ok) {
                await savePreferences({ push_enabled: false });
                toast.success('Notificaciones push desactivadas');
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error disabling push:', err);
            toast.error('Error al desactivar notificaciones');
            return false;
        }
    }, [savePreferences]);

    // Toggle individual preference
    const togglePreference = useCallback(async (key: keyof NotificationPreferences) => {
        const currentValue = preferences[key];
        if (typeof currentValue === 'boolean') {
            return savePreferences({ [key]: !currentValue });
        }
        return false;
    }, [preferences, savePreferences]);

    // Update reminder time
    const updateReminderTime = useCallback(async (time: string) => {
        return savePreferences({ reminder_time: time });
    }, [savePreferences]);

    return {
        preferences,
        isLoading,
        isSaving,
        error,
        pushPermission,
        savePreferences,
        togglePreference,
        updateReminderTime,
        requestPushPermission,
        disablePushNotifications,
        reload: loadPreferences,
    };
}
