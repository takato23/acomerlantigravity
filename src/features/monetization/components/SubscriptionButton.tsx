'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export function SubscriptionButton({ className }: { className?: string }) {
    const [loading, setLoading] = useState(false);
    const { session } = useAuth();

    const handleSubscribe = async () => {
        setLoading(true);

        try {
            if (!session?.access_token) {
                toast.error('Necesitás iniciar sesión para suscribirte');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/payments/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear preferencia');
            }

            const data = await response.json();

            // Check if simulation mode
            if (data.simulation) {
                toast.info('Modo de prueba: Simulando pago exitoso...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                window.location.href = data.init_point;
                return;
            }

            // Use sandbox URL in development, production URL otherwise
            const checkoutUrl = process.env.NODE_ENV === 'development'
                ? data.sandbox_init_point
                : data.init_point;

            // Redirect to MercadoPago checkout
            window.location.href = checkoutUrl;

        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error instanceof Error ? error.message : 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleSubscribe}
            className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all transform hover:scale-105 ${className}`}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                </>
            ) : (
                <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Suscribirse al Plan PRO
                </>
            )}
        </Button>
    );
}
