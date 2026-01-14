import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

// MercadoPago IPN (Instant Payment Notification) webhook
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('[MercadoPago Webhook] Received:', JSON.stringify(body, null, 2));

        // Verify it's a payment notification
        if (body.type !== 'payment') {
            return NextResponse.json({ received: true });
        }

        const paymentId = body.data?.id;
        if (!paymentId) {
            return NextResponse.json({ error: 'No payment ID' }, { status: 400 });
        }

        // Get payment details from MercadoPago
        const paymentResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                },
            }
        );

        if (!paymentResponse.ok) {
            console.error('[MercadoPago Webhook] Error fetching payment:', await paymentResponse.text());
            return NextResponse.json({ error: 'Error fetching payment' }, { status: 500 });
        }

        const payment = await paymentResponse.json();

        console.log('[MercadoPago Webhook] Payment details:', {
            status: payment.status,
            external_reference: payment.external_reference,
            amount: payment.transaction_amount,
        });

        // Only process approved payments
        if (payment.status !== 'approved') {
            console.log('[MercadoPago Webhook] Payment not approved, status:', payment.status);
            return NextResponse.json({ received: true, status: payment.status });
        }

        const userId = payment.external_reference;
        if (!userId) {
            console.error('[MercadoPago Webhook] No user ID in external_reference');
            return NextResponse.json({ error: 'No user ID' }, { status: 400 });
        }

        // Update subscription in Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Calculate subscription period (1 month)
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const { error: updateError } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: userId,
                plan_type: 'pro',
                status: 'active',
                mp_subscription_id: paymentId.toString(),
                mp_payer_id: payment.payer?.id?.toString(),
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString(),
            }, {
                onConflict: 'user_id',
            });

        if (updateError) {
            console.error('[MercadoPago Webhook] Error updating subscription:', updateError);
            return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
        }

        console.log('[MercadoPago Webhook] Subscription activated for user:', userId);

        return NextResponse.json({
            received: true,
            status: 'subscription_activated',
            user_id: userId,
        });

    } catch (error) {
        console.error('[MercadoPago Webhook] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// MercadoPago sends a GET request to verify the endpoint
export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'mercadopago-webhook' });
}
