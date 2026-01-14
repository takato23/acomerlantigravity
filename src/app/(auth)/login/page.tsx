'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MagicLinkAuth } from '@/components/auth/MagicLinkAuth';

// Componente separado para manejar los search params
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mostrar error si viene de la URL (ej: desde callback)
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  const handleAuthSuccess = () => {
    // Redirigir al dashboard después de enviar el magic link
    // El usuario será redirigido automáticamente después de hacer clic en el link
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            KeCarajoComer
          </h1>
          <p className="text-slate-600">
            Planifica tu semana y compra inteligente
          </p>
        </div>

        {/* Error global de URL */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Componente de Magic Link Auth */}
        <MagicLinkAuth
          onSuccess={handleAuthSuccess}
          redirectTo={searchParams.get('redirect') || '/'}
        />

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Primera vez aqui? No te preocupes, creamos tu cuenta automaticamente
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-300 rounded mb-4"></div>
            <div className="h-4 bg-slate-200 rounded mb-8"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}