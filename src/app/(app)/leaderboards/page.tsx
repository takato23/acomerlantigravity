'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, ArrowLeft, Clock, Users, Star } from 'lucide-react';

export default function LeaderboardsPage() {
    return (
        <main className="min-h-screen pb-32 bg-white dark:bg-transparent">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/planificador"
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                            <Trophy className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Leaderboards
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Competí con otros usuarios
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                >
                    {/* Icon */}
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-500/20 dark:to-orange-500/20 flex items-center justify-center mb-6">
                        <Trophy className="text-yellow-500" size={48} />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                        Próximamente
                    </h2>

                    {/* Description */}
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        Estamos trabajando en los leaderboards para que puedas competir
                        con otros usuarios y ver quién planifica mejor sus comidas.
                    </p>

                    {/* Coming Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <Star className="mx-auto mb-2 text-yellow-500" size={24} />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Ranking Semanal</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <Users className="mx-auto mb-2 text-blue-500" size={24} />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Desafíos Grupales</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <Clock className="mx-auto mb-2 text-green-500" size={24} />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Logros</p>
                        </div>
                    </div>

                    {/* CTA */}
                    <Link
                        href="/planificador"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Volver al Planificador
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
