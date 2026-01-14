import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
    try {
        // Get user from Supabase auth
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        if (!MERCADOPAGO_ACCESS_TOKEN) {
            // Development fallback - simulate payment
            console.log('[MercadoPago] No access token configured, using simulation mode');
            return NextResponse.json({
                init_point: `/perfil?status=approved&simulation=true`,
                sandbox_init_point: `/perfil?status=approved&simulation=true`,
                simulation: true,
            });
        }

        // Create MercadoPago preference
        const preference = {
            items: [
                {
                    id: 'kecarajocomer-pro',
                    title: 'KeCarajoComer PRO - Plan Mensual',
                    description: 'Planes ilimitados, Chef IA ilimitado, recetas ilimitadas',
                    quantity: 1,
                    currency_id: 'ARS',
                    unit_price: 4500,
                },
            ],
            payer: {
                email: user.email,
            },
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?status=approved`,
                failure: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?status=rejected`,
                pending: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?status=pending`,
            },
            auto_return: 'approved',
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
            external_reference: user.id, // Store user ID for webhook
            statement_descriptor: 'KECARAJOCOMER',
        };

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preference),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[MercadoPago] Error creating preference:', error);
            return NextResponse.json(
                { error: 'Error al crear preferencia de pago' },
                { status: 500 }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            init_point: data.init_point,
            sandbox_init_point: data.sandbox_init_point,
            preference_id: data.id,
        });

    } catch (error) {
        console.error('[MercadoPago] Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
