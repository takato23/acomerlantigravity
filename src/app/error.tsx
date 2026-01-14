'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('App Router Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        ¡Algo salió mal!
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Ha ocurrido un error inesperado en la aplicación.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            onClick={() => reset()}
                            variant="default"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reintentar
                        </Button>

                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Ir al inicio
                        </Button>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left overflow-auto max-h-40">
                            <p className="text-xs font-mono text-red-600">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-[10px] text-gray-500 mt-1 font-mono">
                                    Digest: {error.digest}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
