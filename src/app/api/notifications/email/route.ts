/**
 * Email Notifications API
 * POST /api/notifications/email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emailService } from '@/services/email';
import type {
    PlanReadyEmailData,
    DailyReminderEmailData,
    ShoppingReminderEmailData
} from '@/services/email';

interface EmailNotificationRequest {
    type: 'plan_ready' | 'daily_reminder' | 'shopping_reminder';
    userId?: string;
    data: PlanReadyEmailData | DailyReminderEmailData | ShoppingReminderEmailData;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: EmailNotificationRequest = await request.json();
        const { type, data } = body;
        const targetUserId = body.userId || user.id;

        // Get user profile and email preferences
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('notification_preferences')
            .eq('user_id', targetUserId)
            .single();

        if (profileError) {
            console.error('Failed to get user profile:', profileError);
        }

        // Check if email notifications are enabled for this type
        const preferences = profile?.notification_preferences || {
            email_enabled: true,
            plan_ready: true,
            daily_reminders: true,
            shopping_reminders: true,
        };

        // Type-specific preference checks
        const typePreferences: Record<string, string> = {
            plan_ready: 'plan_ready',
            daily_reminder: 'daily_reminders',
            shopping_reminder: 'shopping_reminders',
        };

        if (!preferences.email_enabled || !preferences[typePreferences[type]]) {
            return NextResponse.json({
                success: false,
                message: 'Email notifications disabled for this type',
            });
        }

        // Get user email
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', targetUserId)
            .single();

        if (userError || !userData?.email) {
            return NextResponse.json(
                { error: 'User email not found' },
                { status: 404 }
            );
        }

        // Send email based on type
        let result;
        switch (type) {
            case 'plan_ready':
                result = await emailService.sendPlanReadyEmail(
                    userData.email,
                    data as PlanReadyEmailData
                );
                break;

            case 'daily_reminder':
                result = await emailService.sendDailyReminderEmail(
                    userData.email,
                    data as DailyReminderEmailData
                );
                break;

            case 'shopping_reminder':
                result = await emailService.sendShoppingReminderEmail(
                    userData.email,
                    data as ShoppingReminderEmailData
                );
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid notification type' },
                    { status: 400 }
                );
        }

        // Log notification to database
        if (result.success) {
            await supabase.from('notifications').insert({
                user_id: targetUserId,
                type: `email_${type}`,
                title: getNotificationTitle(type, data),
                message: getNotificationMessage(type, data),
                data: { emailId: result.id, type, ...data },
                is_read: false,
            });
        }

        return NextResponse.json({
            success: result.success,
            emailId: result.id,
            error: result.error,
        });

    } catch (error) {
        console.error('Email notification error:', error);
        return NextResponse.json(
            { error: 'Failed to send email notification' },
            { status: 500 }
        );
    }
}

function getNotificationTitle(type: string, data: any): string {
    switch (type) {
        case 'plan_ready':
            return '¡Tu plan semanal está listo!';
        case 'daily_reminder':
            return `Hoy cocinas: ${data.meal?.name || 'tu receta'}`;
        case 'shopping_reminder':
            return `${data.totalItems || 0} ingredientes en tu lista`;
        default:
            return 'Notificación';
    }
}

function getNotificationMessage(type: string, data: any): string {
    switch (type) {
        case 'plan_ready':
            return `Plan del ${data.planSummary?.weekStart} al ${data.planSummary?.weekEnd}`;
        case 'daily_reminder':
            return `${data.meal?.mealType}: ${data.meal?.name}`;
        case 'shopping_reminder':
            return `Recordatorio de lista de compras`;
        default:
            return '';
    }
}
