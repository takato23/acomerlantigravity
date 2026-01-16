/**
 * Push Notification Send API
 * POST /api/notifications/push/send
 * This internal endpoint is used to send push notifications via Web Push API
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        `mailto:admin@${new URL(appUrl).hostname}`,
        vapidPublicKey,
        vapidPrivateKey
    );
}

interface PushNotificationRequest {
    userId: string;
    title: string;
    body: string;
    url?: string;
    type?: string;
}

export async function POST(request: NextRequest) {
    try {
        if (!vapidPublicKey || !vapidPrivateKey) {
            return NextResponse.json(
                { error: 'VAPID keys not configured' },
                { status: 500 }
            );
        }

        const body: PushNotificationRequest = await request.json();
        const { title, body: message, url, type } = body;

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Get current user if userId is not provided
        let targetUserId = body.userId;
        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json(
                    { error: 'User ID required or unauthorized' },
                    { status: 401 }
                );
            }
            targetUserId = user.id;
        }

        // Get user's push subscription
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('push_subscription, notification_preferences')
            .eq('user_id', targetUserId)
            .single();

        if (profileError || !profile?.push_subscription) {
            return NextResponse.json(
                { error: 'Push subscription not found' },
                { status: 404 }
            );
        }

        // Check user preferences
        const preferences = profile.notification_preferences || {};
        if (preferences.push_enabled === false) {
            return NextResponse.json({
                success: false,
                message: 'Push notifications disabled by user',
            });
        }

        // Send push notification
        const payload = JSON.stringify({
            title,
            body: message,
            url: url || '/',
            type: type || 'general',
        });

        try {
            await webpush.sendNotification(
                profile.push_subscription as any,
                payload
            );

            // Log notification to history
            await supabase.from('notifications').insert({
                user_id: targetUserId,
                type: `push_${type || 'general'}`,
                title,
                message,
                data: { url, type, ...body },
                is_read: false,
            });

            return NextResponse.json({ success: true });
        } catch (pushError: any) {
            console.error('Web Push error:', pushError);

            // If subscription is expired or invalid, remove it
            if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                await supabase
                    .from('user_profiles')
                    .update({ push_subscription: null })
                    .eq('user_id', targetUserId);
            }

            return NextResponse.json(
                { error: 'Failed to send push notification', details: pushError.message },
                { status: pushError.statusCode || 500 }
            );
        }

    } catch (error) {
        console.error('Push notification API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
