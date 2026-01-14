/**
 * Push Notification Subscription API
 * POST /api/notifications/push/subscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PushSubscriptionRequest {
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
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

        const body: PushSubscriptionRequest = await request.json();
        const { subscription } = body;

        if (!subscription?.endpoint || !subscription?.keys) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        // Save subscription to user profile
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                push_subscription: subscription,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Failed to save push subscription:', updateError);
            return NextResponse.json(
                { error: 'Failed to save subscription' },
                { status: 500 }
            );
        }

        // Update notification preferences to enable push
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('notification_preferences')
            .eq('user_id', user.id)
            .single();

        const preferences = profile?.notification_preferences || {};
        preferences.push_enabled = true;

        await supabase
            .from('user_profiles')
            .update({
                notification_preferences: preferences,
            })
            .eq('user_id', user.id);

        return NextResponse.json({
            success: true,
            message: 'Push subscription saved',
        });

    } catch (error) {
        console.error('Push subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to save push subscription' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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

        // Remove push subscription
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                push_subscription: null,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Failed to remove push subscription:', updateError);
            return NextResponse.json(
                { error: 'Failed to remove subscription' },
                { status: 500 }
            );
        }

        // Update notification preferences
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('notification_preferences')
            .eq('user_id', user.id)
            .single();

        const preferences = profile?.notification_preferences || {};
        preferences.push_enabled = false;

        await supabase
            .from('user_profiles')
            .update({
                notification_preferences: preferences,
            })
            .eq('user_id', user.id);

        return NextResponse.json({
            success: true,
            message: 'Push subscription removed',
        });

    } catch (error) {
        console.error('Push unsubscribe error:', error);
        return NextResponse.json(
            { error: 'Failed to remove push subscription' },
            { status: 500 }
        );
    }
}
