'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ArrowRight, Zap, Search, BookOpen } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { IngredientInput } from '@/components/landing/IngredientInput';
import { InstantRecipeCard } from '@/components/landing/InstantRecipeCard';

export function LandingPageClient() {
    const { user } = useAuth();
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [triggerSource, setTriggerSource] = useState<'nav' | 'recipe'>('nav');

    const openAuthModal = (mode: 'signin' | 'signup', source: 'nav' | 'recipe' = 'nav') => {
        setAuthMode(mode);
        setTriggerSource(source);
        setAuthModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-orange-200 selection:text-orange-900">

            {/* Minimal Header */}
            <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full z-10">
                <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                        <ChefHat className="w-5 h-5" />
                    </div>
                    KeCarajoComer
                </div>

                <div className="flex gap-4 items-center">
                    {!user && (
                        <button
                            onClick={() => openAuthModal('signin')}
                            className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-black transition-colors"
                        >
                            Entrar
                        </button>
                    )}
                    <Button
                        onClick={() => user ? window.location.href = '/dashboard' : openAuthModal('signup')}
                        className="rounded-full bg-black text-white hover:bg-gray-800 px-6 font-bold"
                    >
                        {user ? 'Ir al Dashboard' : 'Crear Cuenta'}
                    </Button>
                </div>
            </header>

            {/* Main Content - Centered & Focused */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

                {/* Decorative background gradients - Ultra Subtle */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute inset-0 bg-white/40 z-10"></div> {/* Soft overlay for text readability */}
                    <img
                        src="/images/landing-hero-bg.png"
                        alt=""
                        className="absolute w-full h-full object-cover object-center opacity-90"
                    />
                </div>

                <div className="w-full max-w-4xl mx-auto text-center z-10 flex flex-col items-center">

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-slate-900 leading-[0.9]"
                    >
                        No pienses. <br className="hidden md:block" />
                        <span className="text-gray-300">Solo comé.</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-12 w-full max-w-2xl"
                    >
                        <IngredientInput onIngredientsChange={setIngredients} />
                    </motion.div>

                    {/* Dynamic Result Area */}
                    <div className="min-h-[420px] w-full flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {ingredients.length > 0 ? (
                                <InstantRecipeCard
                                    ingredients={ingredients}
                                    key="result"
                                    onViewRecipe={() => openAuthModal('signup', 'recipe')}
                                />
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                    className="text-gray-400 text-lg font-medium max-w-md mx-auto leading-relaxed"
                                >
                                    <p className="mb-8">
                                        Escribí lo que tenés en la heladera arriba ☝️
                                        <br />
                                        y mirá cómo hacemos magia.
                                    </p>

                                    {/* Subtle How It Works */}
                                    <div className="grid grid-cols-3 gap-8 mt-12 border-t border-gray-100 pt-12 opacity-60">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-200">
                                                <Search className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">1. Tipeá</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-200">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">2. Recibí</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-200">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">3. Cociná</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

            </main>

            {/* Pricing Section */}
            <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-4 tracking-tight">Planes simples</h2>
                    <p className="text-gray-500 text-center mb-12 font-medium">Empezá gratis, upgradeá cuando quieras</p>

                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold mb-2">Gratis</h3>
                            <p className="text-4xl font-black mb-4">$0<span className="text-lg text-gray-400 font-medium">/mes</span></p>
                            <ul className="space-y-3 mb-6 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> 1 plan semanal
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> 5 mensajes al Chef IA/día
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> 3 recetas generadas/día
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> Lista de compras básica
                                </li>
                            </ul>
                            <Button
                                variant="outline"
                                className="w-full rounded-full font-bold"
                                onClick={() => window.location.href = '/login'}
                            >
                                Empezar gratis
                            </Button>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                            <div className="absolute top-4 right-4 bg-orange-500 text-xs font-bold px-3 py-1 rounded-full">
                                POPULAR
                            </div>
                            <h3 className="text-xl font-bold mb-2">Pro</h3>
                            <p className="text-4xl font-black mb-4">$4.500<span className="text-lg text-gray-400 font-medium">/mes</span></p>
                            <ul className="space-y-3 mb-6 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="text-orange-400">✓</span> Planes ilimitados
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-orange-400">✓</span> Chef IA ilimitado
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-orange-400">✓</span> Recetas ilimitadas
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-orange-400">✓</span> Precios de supermercados
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-orange-400">✓</span> Exportar a PDF
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-orange-400">✓</span> Soporte prioritario
                                </li>
                            </ul>
                            <Button
                                className="w-full rounded-full bg-white text-black hover:bg-gray-100 font-bold"
                                onClick={() => openAuthModal('signup')}
                            >
                                Probar Pro gratis
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced Footer */}
            <footer className="py-12 bg-slate-900 text-white">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2 font-black text-xl">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
                                <ChefHat className="w-5 h-5" />
                            </div>
                            KeCarajoComer
                        </div>
                        <div className="flex gap-6 text-sm text-gray-400">
                            <a href="/terminos" className="hover:text-white transition-colors">Términos</a>
                            <a href="/privacidad" className="hover:text-white transition-colors">Privacidad</a>
                            <a href="mailto:soporte@kecarajocomer.com" className="hover:text-white transition-colors">Contacto</a>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10 text-center text-xs text-gray-500">
                        © 2026 KeCarajoComer. Hecho con 🧡 en Argentina.
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
                <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                    <div className="p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-center mb-2 text-slate-900 tracking-tight">
                                {triggerSource === 'recipe' && authMode === 'signup'
                                    ? '¡Guardá esa receta!'
                                    : (authMode === 'signin' ? 'Volver a entrar' : 'Crear cuenta gratis')}
                            </DialogTitle>
                            {triggerSource === 'recipe' && authMode === 'signup' && (
                                <p className="text-center text-gray-500 text-sm font-medium mb-4">
                                    Creá tu cuenta gratis para ver el paso a paso y guardar tus preferencias.
                                </p>
                            )}
                        </DialogHeader>

                        {authMode === 'signin' ? (
                            <>
                                <SignInForm onSuccess={() => setAuthModalOpen(false)} />
                                <div className="text-center mt-6">
                                    <button onClick={() => setAuthMode('signup')} className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
                                        ¿No tenés cuenta? Registrate
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <SignUpForm onSuccess={() => setAuthModalOpen(false)} />
                                <div className="text-center mt-6">
                                    <button onClick={() => setAuthMode('signin')} className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
                                        ¿Ya tenés cuenta? Logueate
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
