'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    TrendingDown,
    ExternalLink,
    ChevronDown,
    Loader2,
    Store
} from 'lucide-react';

import {
    type ComparacionPrecios,
    type Supermercado,
    SUPERMERCADO_INFO,
    getSupermercadoShoppingUrl
} from '@/hooks/usePrices';

interface PriceDisplayProps {
    productName: string;
    comparacion: ComparacionPrecios | null;
    isLoading?: boolean;
    compact?: boolean;
    showAlternatives?: boolean;
}

export function PriceDisplay({
    productName,
    comparacion,
    isLoading = false,
    compact = false,
    showAlternatives = true
}: PriceDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" size={14} />
                <span className="text-xs">Buscando precios...</span>
            </div>
        );
    }

    if (!comparacion || !comparacion.mejorPrecio) {
        return null;
    }

    const { mejorPrecio, ahorroMaximo, precios, promedioMercado } = comparacion;
    const superInfo = SUPERMERCADO_INFO[mejorPrecio.supermercado];

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: superInfo.color }}
                >
                    ${mejorPrecio.precio.toLocaleString('es-AR')}
                </span>
                {ahorroMaximo > 0 && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5">
                        <TrendingDown size={12} />
                        Ahorrás ${ahorroMaximo.toLocaleString('es-AR')}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Best Price */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: superInfo.color }}
                    >
                        {superInfo.nombre.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            ${mejorPrecio.precio.toLocaleString('es-AR')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {superInfo.nombre}
                            {mejorPrecio.esOferta && (
                                <span className="ml-1 text-green-500">• Oferta</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {ahorroMaximo > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-bold">
                            Ahorrás ${ahorroMaximo.toLocaleString('es-AR')}
                        </span>
                    )}

                    <a
                        href={getSupermercadoShoppingUrl(mejorPrecio.supermercado, productName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                        title={`Ver en ${superInfo.nombre}`}
                    >
                        <ExternalLink size={14} className="text-gray-600 dark:text-gray-400" />
                    </a>
                </div>
            </div>

            {/* Toggle Alternatives */}
            {showAlternatives && precios.length > 1 && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                    <Store size={12} />
                    Ver en {precios.length - 1} supermercados más
                    <ChevronDown
                        size={14}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </button>
            )}

            {/* Alternatives List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-white/10">
                            {precios
                                .filter(p => p.supermercado !== mejorPrecio.supermercado)
                                .sort((a, b) => a.precio - b.precio)
                                .map(precio => {
                                    const info = SUPERMERCADO_INFO[precio.supermercado];
                                    return (
                                        <div
                                            key={precio.supermercado}
                                            className="flex items-center justify-between py-1"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: info.color }}
                                                />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {info.nombre}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-900 dark:text-white font-medium">
                                                    ${precio.precio.toLocaleString('es-AR')}
                                                </span>
                                                <a
                                                    href={getSupermercadoShoppingUrl(precio.supermercado, productName)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface PriceSummaryProps {
    totalOptimizado: number;
    totalPromedio: number;
    ahorroTotal: number;
    mejorSupermercado: Supermercado | null;
    itemCount: number;
}

export function PriceSummary({
    totalOptimizado,
    totalPromedio,
    ahorroTotal,
    mejorSupermercado,
    itemCount
}: PriceSummaryProps) {
    if (itemCount === 0) return null;

    return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/80 text-sm">Costo Estimado Optimizado</p>
                    <p className="text-3xl font-bold">
                        ${totalOptimizado.toLocaleString('es-AR')}
                    </p>
                    {ahorroTotal > 0 && (
                        <p className="text-sm flex items-center gap-1 mt-1">
                            <TrendingDown size={14} />
                            Ahorrás ${ahorroTotal.toLocaleString('es-AR')} vs promedio
                        </p>
                    )}
                </div>

                {mejorSupermercado && (
                    <div className="text-right">
                        <p className="text-white/80 text-xs">Mejor opción</p>
                        <p className="font-bold">
                            {SUPERMERCADO_INFO[mejorSupermercado]?.nombre}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-sm">
                <span className="text-white/80">{itemCount} productos analizados</span>
                <span className="text-white/80">
                    Promedio mercado: ${totalPromedio.toLocaleString('es-AR')}
                </span>
            </div>
        </div>
    );
}
