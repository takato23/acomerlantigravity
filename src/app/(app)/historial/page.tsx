'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    History,
    Star,
    Calendar,
    Flame,
    ChefHat,
    Copy,
    Trash2,
    MessageSquare,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { useMealPlanHistory, MealPlanHistoryEntry } from '@/hooks/useMealPlanHistory';
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';

export default function HistorialPage() {
    const { history, isLoading, error, ratePlan, deletePlan, duplicatePlan, addNotes } = useMealPlanHistory();
    const { loadWeekPlan } = useMealPlanningStore();
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [notesInput, setNotesInput] = useState<Record<string, string>>({});
    const [editingNotes, setEditingNotes] = useState<string | null>(null);

    const handleDuplicate = async (entry: MealPlanHistoryEntry) => {
        const plan = await duplicatePlan(entry.id);
        if (plan) {
            // Load the plan into the current planner
            toast.success('Plan cargado en el planificador');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar este plan del historial?')) {
            await deletePlan(id);
        }
    };

    const handleSaveNotes = async (id: string) => {
        const notes = notesInput[id] || '';
        await addNotes(id, notes);
        setEditingNotes(null);
    };

    const renderStars = (entry: MealPlanHistoryEntry) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => ratePlan(entry.id, star)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            size={18}
                            className={star <= (entry.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }
                        />
                    </button>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Error: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen pb-32 bg-white dark:bg-transparent">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <History className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                    Historial de Planes
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {history.length} {history.length === 1 ? 'plan guardado' : 'planes guardados'}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/planificador"
                            className="px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        >
                            <Sparkles size={16} />
                            Nuevo Plan
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {history.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-6">
                            <History className="text-gray-400" size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            No hay planes guardados
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Cuando generes planes semanales, se guardarán aquí automáticamente para que puedas consultarlos o reutilizarlos.
                        </p>
                        <Link
                            href="/planificador"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                        >
                            <Sparkles size={18} />
                            Crear mi primer plan
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {history.map((entry, index) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-black/20 overflow-hidden"
                                >
                                    {/* Card Header */}
                                    <div
                                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        onClick={() => setExpandedPlan(expandedPlan === entry.id ? null : entry.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-500/20 dark:to-pink-500/20 flex items-center justify-center">
                                                    <Calendar className="text-orange-500" size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                                        Semana del {format(parseISO(entry.week_start), 'd MMM', { locale: es })}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {format(parseISO(entry.week_start), 'd MMM', { locale: es })} - {format(parseISO(entry.week_end), 'd MMM yyyy', { locale: es })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Stats */}
                                                <div className="hidden sm:flex items-center gap-4 text-sm">
                                                    {entry.total_meals && (
                                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                            <ChefHat size={16} />
                                                            <span>{entry.total_meals} comidas</span>
                                                        </div>
                                                    )}
                                                    {entry.total_calories && (
                                                        <div className="flex items-center gap-1.5 text-orange-500">
                                                            <Flame size={16} />
                                                            <span>{entry.total_calories.toLocaleString()} kcal</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Rating */}
                                                <div className="hidden sm:block">
                                                    {renderStars(entry)}
                                                </div>

                                                <ChevronRight
                                                    size={20}
                                                    className={`text-gray-400 transition-transform ${expandedPlan === entry.id ? 'rotate-90' : ''}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Mobile stats */}
                                        <div className="sm:hidden flex items-center gap-4 mt-3 text-sm">
                                            {entry.total_meals && (
                                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                    <ChefHat size={14} />
                                                    <span>{entry.total_meals}</span>
                                                </div>
                                            )}
                                            {entry.total_calories && (
                                                <div className="flex items-center gap-1.5 text-orange-500">
                                                    <Flame size={14} />
                                                    <span>{entry.total_calories.toLocaleString()} kcal</span>
                                                </div>
                                            )}
                                            {renderStars(entry)}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {expandedPlan === entry.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-gray-100 dark:border-white/10"
                                            >
                                                <div className="p-4 space-y-4">
                                                    {/* Nutrition summary */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-3 text-center">
                                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                                {entry.total_calories?.toLocaleString() || '-'}
                                                            </p>
                                                            <p className="text-xs text-orange-600/70 dark:text-orange-400/70">Calorías</p>
                                                        </div>
                                                        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-center">
                                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                                {entry.total_protein?.toFixed(0) || '-'}g
                                                            </p>
                                                            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Proteína</p>
                                                        </div>
                                                        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 text-center">
                                                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                                {entry.total_carbs?.toFixed(0) || '-'}g
                                                            </p>
                                                            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Carbos</p>
                                                        </div>
                                                        <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-3 text-center">
                                                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                                {entry.total_fat?.toFixed(0) || '-'}g
                                                            </p>
                                                            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Grasas</p>
                                                        </div>
                                                    </div>

                                                    {/* Notes */}
                                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                                <MessageSquare size={14} />
                                                                <span>Notas</span>
                                                            </div>
                                                            {!editingNotes || editingNotes !== entry.id ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingNotes(entry.id);
                                                                        setNotesInput({ ...notesInput, [entry.id]: entry.notes || '' });
                                                                    }}
                                                                    className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                                                                >
                                                                    {entry.notes ? 'Editar' : 'Agregar'}
                                                                </button>
                                                            ) : null}
                                                        </div>

                                                        {editingNotes === entry.id ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={notesInput[entry.id] || ''}
                                                                    onChange={(e) => setNotesInput({ ...notesInput, [entry.id]: e.target.value })}
                                                                    placeholder="Agrega notas sobre este plan..."
                                                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                    rows={3}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleSaveNotes(entry.id)}
                                                                        className="flex-1 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                                                    >
                                                                        Guardar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingNotes(null)}
                                                                        className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : entry.notes ? (
                                                            <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{entry.notes}</p>
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic">Sin notas</p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <button
                                                            onClick={() => handleDuplicate(entry)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                                                        >
                                                            <Copy size={18} />
                                                            Usar este plan
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry.id)}
                                                            className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>

                                                    {/* Created date */}
                                                    <p className="text-xs text-gray-400 text-center">
                                                        Guardado el {format(parseISO(entry.created_at), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
    );
}
