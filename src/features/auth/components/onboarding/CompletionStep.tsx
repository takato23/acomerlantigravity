'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Sparkles, Calendar, Book, ShoppingCart, ArrowRight, Zap, Trophy, Star, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { logger } from '@/services/logger';

import { useOnboardingStore } from '../../store/onboardingStore';
import { GlassCard, GlassButton } from './shared/GlassCard';

export function CompletionStep() {
  const router = useRouter();
  const { completeOnboarding, isLoading } = useOnboardingStore();

  useEffect(() => {
    const handleCompletion = async () => {
      try {
        await completeOnboarding();
        
        // Fire confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Redirect after a short delay to show the completion animation
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (error: unknown) {
        logger.error('Failed to complete onboarding:', 'CompletionStep', error);
      }
    };

    handleCompletion();
  }, [completeOnboarding, router]);

  const nextSteps = [
    {
      icon: Calendar,
      title: 'Crea tu Primer Plan',
      description: 'Genera un plan semanal personalizado con IA',
      action: 'Planificar Semana',
      color: 'bg-slate-700',
      href: '/meal-planning'
    },
    {
      icon: Book,
      title: 'Explora Recetas',
      description: 'Descubre miles de recetas adaptadas a tus gustos',
      action: 'Ver Recetas',
      color: 'bg-green-600',
      href: '/recetas'
    },
    {
      icon: ShoppingCart,
      title: 'Lista de Compras',
      description: 'Obtén listas optimizadas basadas en tus planes',
      action: 'Crear Lista',
      color: 'bg-slate-600',
      href: '/lista-compras'
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="relative w-16 h-16 mx-auto mb-6"
        >
          <div className="absolute inset-0 rounded-full border-3 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-3 border-slate-700 border-t-transparent"></div>
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Completando tu configuración...
        </h2>
        <p className="text-gray-500">
          Estamos finalizando tu experiencia personalizada
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* Success Animation */}
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <Trophy className="h-12 w-12 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black tracking-tighter text-slate-900 mb-4"
        >
          ¡Bienvenido a Ke Carajo Comer! 🎉
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-600 mb-6"
        >
          Tu viaje culinario personalizado comienza ahora
        </motion.p>
      </motion.div>

      {/* Completion Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard className="p-8 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-amber-500 mr-2" />
            <h2 className="text-2xl font-bold text-slate-900">
              ¡Todo listo!
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
            Hemos configurado tu cuenta con tus preferencias, necesidades dietéticas y despensa. 
            Nuestra IA está lista para crear planes de comidas personalizados para ti.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200"
            >
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-slate-900 mb-1">Perfil Completo</div>
              <div className="text-gray-500">Preferencias y dieta guardadas</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200"
            >
              <Package className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <div className="font-semibold text-slate-900 mb-1">Despensa Lista</div>
              <div className="text-gray-500">Tus ingredientes están registrados</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200"
            >
              <Zap className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <div className="font-semibold text-slate-900 mb-1">IA Activada</div>
              <div className="text-gray-500">Sugerencias personalizadas listas</div>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Next Steps */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mb-8"
      >
        <h3 className="text-xl font-semibold text-slate-900 mb-6">
          Aquí está lo que puedes hacer ahora:
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {nextSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => router.push(step.href)}
                className="cursor-pointer"
              >
                <GlassCard className="p-6 h-full hover:bg-slate-50 transition-all">
                  <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-gray-500 text-sm mb-4">{step.description}</p>
                  <button className="text-slate-700 hover:text-slate-900 font-medium text-sm flex items-center gap-1 mx-auto transition-colors">
                    {step.action} <ArrowRight className="w-4 h-4" />
                  </button>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Tips & Encouragement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        <GlassCard variant="highlight" className="p-6 mb-8">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Tips Pro para Empezar
          </h4>
          <div className="text-left space-y-2 text-sm text-gray-600">
            <p>• Comienza con un plan semanal simple para familiarizarte</p>
            <p>• Califica las comidas para mejorar las sugerencias de la IA</p>
            <p>• Actualiza tu despensa regularmente para recomendaciones precisas</p>
            <p>• Explora diferentes cocinas para expandir tus horizontes culinarios</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Auto-redirect notice */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center"
      >
        <p className="text-gray-500 text-sm mb-4">
          Te llevaremos a tu dashboard en un momento...
        </p>
        <GlassButton
          onClick={() => router.push('/dashboard')}
          variant="primary"
          className="inline-flex items-center gap-2"
        >
          Ir al Dashboard Ahora
          <ArrowRight className="w-4 h-4" />
        </GlassButton>
      </motion.div>
    </div>
  );
}