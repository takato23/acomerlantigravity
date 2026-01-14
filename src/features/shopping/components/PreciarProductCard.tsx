'use client';

import React from 'react';
import {
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Trophy,
    Store,
    Calendar,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface PreciarProductPrice {
    supermercado: string;
    precio: number;
    url?: string;
    enStock: boolean;
    esReal?: boolean;
    ultimaActualizacion?: Date;
    variacion?: number; // % variation
}

export interface PreciarProductCardProps {
    productName: string;
    prices: PreciarProductPrice[];
    onClose?: () => void;
    className?: string;
}

const SUPERMERCADO_CONFIG: Record<string, { name: string; color: string; logo?: string }> = {
    coto: { name: 'Coto', color: 'text-red-700' },
    dia: { name: 'Día', color: 'text-red-600' },
    jumbo: { name: 'Jumbo', color: 'text-green-700' },
    carrefour: { name: 'Carrefour', color: 'text-blue-700' },
    masonline: { name: 'Más Online', color: 'text-orange-700' },
    supermami: { name: 'Super Mami', color: 'text-pink-700' },
    laAnonima: { name: 'La Anónima', color: 'text-blue-600' },
    vea: { name: 'Vea', color: 'text-green-600' },
    disco: { name: 'Disco', color: 'text-red-500' },
};

export function PreciarProductCard({ productName, prices, className = '' }: PreciarProductCardProps) {
    // Sort prices
    const sortedPrices = [...prices].sort((a, b) => a.precio - b.precio);
    const bestPrice = sortedPrices[0];
    const worstPrice = sortedPrices[sortedPrices.length - 1];

    // Calculations
    const averagePrice = prices.reduce((acc, curr) => acc + curr.precio, 0) / prices.length;
    const maxSaving = worstPrice.precio - bestPrice.precio;
    const maxSavingPercent = (maxSaving / worstPrice.precio) * 100;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(price);
    };

    const getStoreName = (key: string) => SUPERMERCADO_CONFIG[key]?.name || key;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header / Title */}
            <div>
                <h3 className="text-2xl font-bold text-gray-900 capitalize mb-1">{productName}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Store className="w-4 h-4" />
                    Comparando {prices.length} tiendas
                </p>
            </div>

            {/* Top Metrics Cards (Preciar Style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Best Price Card */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Trophy className="w-16 h-16 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Mejor precio</p>
                        <div className="text-3xl font-bold text-emerald-700 tracking-tight">
                            {formatPrice(bestPrice.precio)}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 z-10">
                        <span className="text-sm font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            {getStoreName(bestPrice.supermercado)}
                        </span>
                        <Trophy className="w-4 h-4 text-emerald-600" />
                    </div>
                </div>

                {/* Average Price Card */}
                <div className="bg-secondary/20 border border-secondary/40 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Precio Promedio</p>
                        <div className="text-3xl font-bold text-gray-700 tracking-tight">
                            {formatPrice(averagePrice)}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">En el mercado</span>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Savings Card */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <TrendingDown className="w-16 h-16 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Ahorro Potencial</p>
                        <div className="text-3xl font-bold text-blue-700 tracking-tight">
                            {formatPrice(maxSaving)}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 z-10">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                            -{maxSavingPercent.toFixed(0)}% vs más caro
                        </Badge>
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Store List (Preciar Style) */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-1">Listado de Tiendas</h4>

                <div className="space-y-3">
                    {sortedPrices.map((item, index) => {
                        const isBest = index === 0;
                        const config = SUPERMERCADO_CONFIG[item.supermercado] || { name: item.supermercado, color: 'text-gray-700' };

                        return (
                            <div
                                key={item.supermercado}
                                className={`
                                    group flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                                    ${isBest
                                        ? 'bg-white border-emerald-200 shadow-sm ring-1 ring-emerald-100'
                                        : 'bg-white border-border hover:border-gray-300 hover:shadow-sm'
                                    }
                                `}
                            >
                                {/* Left: Logo/Icon + Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg border bg-gray-50 flex items-center justify-center flex-shrink-0">
                                        <Store className={`w-6 h-6 ${config.color}`} />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{config.name}</span>
                                            {isBest && (
                                                <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 h-5">Mejor</Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-0.5">
                                            {item.esReal ? (
                                                <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                                                    Precio Real
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                    Estimado
                                                </span>
                                            )}

                                            {!item.enStock && (
                                                <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                                                    Sin Stock
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Price + Action */}
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className={`text-xl font-bold ${isBest ? 'text-emerald-700' : 'text-gray-900'}`}>
                                            {formatPrice(item.precio)}
                                        </div>
                                        {/* Optional: Diff from best */}
                                        {!isBest && (
                                            <div className="text-xs text-gray-400 font-medium">
                                                +{formatPrice(item.precio - bestPrice.precio)}
                                            </div>
                                        )}
                                    </div>

                                    {item.url && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                                            asChild
                                        >
                                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default PreciarProductCard;
