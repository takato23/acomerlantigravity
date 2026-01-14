/**
 * Notification Triggers
 * Utility functions to trigger notifications throughout the app
 */

import { getNotificationManager } from '@/services/notifications/NotificationManager';

export interface PlanReadyNotificationData {
    planId?: string;
    weekStart: string;
    weekEnd: string;
    totalMeals: number;
    highlights: string[];
}

export interface DailyReminderNotificationData {
    mealName: string;
    mealType: string;
    cookingTime?: number;
    date: string;
}

export interface ShoppingReminderNotificationData {
    items: Array<{ name: string; quantity: number; unit: string }>;
    totalItems: number;
}

/**
 * Trigger "Plan Ready" notification
 * Called after meal plan generation completes
 */
export async function triggerPlanReadyNotification(data: PlanReadyNotificationData) {
    const notificationManager = getNotificationManager();

    // Show in-app toast notification (if tab is open)
    await notificationManager.success('¡Tu plan semanal está listo!', {
        metadata: {
            description: `${data.totalMeals} comidas planificadas del ${data.weekStart} al ${data.weekEnd}`,
        },
        channels: ['toast'],
        priority: 'high',
    });

    // Trigger email and push notifications via API
    try {
        const payload = {
            weekStart: data.weekStart,
            weekEnd: data.weekEnd,
            totalMeals: data.totalMeals,
            highlights: data.highlights,
        };

        // Email
        fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'plan_ready',
                data: {
                    userName: 'Usuario',
                    planSummary: payload,
                },
            }),
        }).catch(e => console.error('Email trigger failed:', e));

        // Push
        fetch('/api/notifications/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: '', // Optional, currently will use the authenticated user on server if possible, or we need to pass it
                title: '¡Tu plan semanal está listo!',
                body: `${data.totalMeals} comidas del ${data.weekStart} al ${data.weekEnd}`,
                url: '/planificador',
                type: 'plan_ready',
            }),
        }).catch(e => console.error('Push trigger failed:', e));

    } catch (error) {
        console.error('Failed to trigger notifications:', error);
    }
}

/**
 * Trigger daily cooking reminder
 * Called by scheduled job or cron
 */
export async function triggerDailyReminderNotification(data: DailyReminderNotificationData) {
    const notificationManager = getNotificationManager();

    // Show in-app notification
    await notificationManager.info(`Hoy cocinas: ${data.mealName}`, {
        metadata: {
            description: `${getMealTypeLabel(data.mealType)} • ${data.cookingTime ? `${data.cookingTime} min` : ''}`,
        },
        channels: ['toast'],
        priority: 'medium',
    });

    // Trigger email and push notification
    try {
        const payload = {
            userName: 'Usuario',
            meal: {
                name: data.mealName,
                mealType: data.mealType,
                cookingTime: data.cookingTime,
            },
            date: data.date,
        };

        // Email
        fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'daily_reminder',
                data: payload,
            }),
        }).catch(e => console.error('Email trigger failed:', e));

        // Push
        fetch('/api/notifications/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Hoy cocinas: ${data.mealName}`,
                body: `${getMealTypeLabel(data.mealType)} • ${data.cookingTime ? `${data.cookingTime} min` : ''}`,
                url: '/planificador',
                type: 'daily_reminder',
            }),
        }).catch(e => console.error('Push trigger failed:', e));

    } catch (error) {
        console.error('Failed to trigger notifications:', error);
    }
}

/**
 * Trigger shopping list reminder
 */
export async function triggerShoppingReminderNotification(data: ShoppingReminderNotificationData) {
    const notificationManager = getNotificationManager();

    await notificationManager.info(`${data.totalItems} ingredientes en tu lista`, {
        metadata: {
            description: 'Recordatorio de compras para tus recetas',
        },
        channels: ['toast'],
        priority: 'low',
    });

    // Trigger email and push notification
    try {
        // Email
        fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'shopping_reminder',
                data: {
                    userName: 'Usuario',
                    items: data.items,
                    totalItems: data.totalItems,
                },
            }),
        }).catch(e => console.error('Email trigger failed:', e));

        // Push
        fetch('/api/notifications/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Recordatorio de compras',
                body: `${data.totalItems} ingredientes pendientes en tu lista`,
                url: '/lista-compras',
                type: 'shopping',
            }),
        }).catch(e => console.error('Push trigger failed:', e));

    } catch (error) {
        console.error('Failed to trigger notifications:', error);
    }
}

function getMealTypeLabel(mealType: string): string {
    const labels: Record<string, string> = {
        breakfast: '🌅 Desayuno',
        lunch: '☀️ Almuerzo',
        snack: '🍪 Merienda',
        dinner: '🌙 Cena',
        desayuno: '🌅 Desayuno',
        almuerzo: '☀️ Almuerzo',
        merienda: '🍪 Merienda',
        cena: '🌙 Cena',
    };
    return labels[mealType.toLowerCase()] || mealType;
}

