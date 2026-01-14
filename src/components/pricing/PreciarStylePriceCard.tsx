'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingDown,
    TrendingUp,
    Trophy,
    RefreshCw,
    ExternalLink,
    Tag,
    BarChart3,
    Sparkles,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// =============================================================================
// Types
// =============================================================================

interface PrecioSupermercado {
    supermercado: string;
    precio: number;
    precioAnterior?: number;
    variacion?: number; // Porcentaje de cambio
    url?: string;
    enStock: boolean;
    diasEstable?: number;
    logo?: string;
}

interface ProductoComparacion {
    nombre: string;
    imagen?: string;
    categoria?: string;
    mejorPrecio: number;
    precioPromedio: number;
    rangoPrecios: { min: number; max: number };
    tendenciaMes: number; // % de cambio
    precios: PrecioSupermercado[];
    esReal: boolean; // Si vino de API real o es estimado
}

interface Props {
    producto: ProductoComparacion;
    onRefresh?: () => void;
    loading?: boolean;
}

// =============================================================================
// Supermarket Branding with logos
// =============================================================================

const SUPERMERCADO_BRANDING: Record<string, {
    nombre: string;
    color: string;
    bgLight: string;
    logo: string;
}> = {
    coto: {
        nombre: 'Coto',
        color: '#e31837',
        bgLight: 'bg-red-50',
        logo: '', // Use letter fallback - CORS blocks external
    },
    dia: {
        nombre: 'Día',
        color: '#ed1c24',
        bgLight: 'bg-red-50',
        logo: '',
    },
    jumbo: {
        nombre: 'Jumbo',
        color: '#00a651',
        bgLight: 'bg-green-50',
        logo: '',
    },
    carrefour: {
        nombre: 'Carrefour',
        color: '#004b93',
        bgLight: 'bg-blue-50',
        logo: '',
    },
    disco: {
        nombre: 'Disco',
        color: '#e4002b',
        bgLight: 'bg-red-50',
        logo: '',
    },
    vea: {
        nombre: 'Vea',
        color: '#e4002b',
        bgLight: 'bg-red-50',
        logo: '',
    },
    masonline: {
        nombre: 'Más Online',
        color: '#ff6600',
        bgLight: 'bg-orange-50',
        logo: '',
    },
    supermami: {
        nombre: 'Super Mami',
        color: '#ff69b4',
        bgLight: 'bg-pink-50',
        logo: '',
    },
    laanonima: {
        nombre: 'La Anónima',
        color: '#0066cc',
        bgLight: 'bg-blue-50',
        logo: '',
    },
    changomas: {
        nombre: 'Changomás',
        color: '#00a651',
        bgLight: 'bg-green-50',
        logo: '',
    },
};

// =============================================================================
// Utility Functions
// =============================================================================

function formatPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(precio);
}

function getBranding(store: string) {
    const normalized = store.toLowerCase().replace(/\s+/g, '');
    return SUPERMERCADO_BRANDING[normalized] || {
        nombre: store,
        color: '#6b7280',
        bgLight: 'bg-gray-50',
    };
}

// =============================================================================
// Sub-components
// =============================================================================

/** Stat card like Preciar uses in hero section */
const StatCard: React.FC<{
    label: string;
    value: string;
    sublabel?: string;
    icon: React.ReactNode;
    highlight?: boolean;
    trend?: number;
}> = ({ label, value, sublabel, icon, highlight, trend }) => (
    <div className={`
        rounded-xl p-4 border transition-all
        ${highlight
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-sm'
            : 'bg-white border-gray-100'
        }
    `}>
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {label}
            </span>
            <span className={`${highlight ? 'text-emerald-600' : 'text-gray-400'}`}>
                {icon}
            </span>
        </div>
        <div className={`text-2xl font-bold ${highlight ? 'text-emerald-700' : 'text-gray-900'}`}>
            {value}
        </div>
        {sublabel && (
            <div className="text-xs text-gray-500 mt-1">
                {sublabel}
            </div>
        )}
        {trend !== undefined && trend !== 0 && (
            <div className={`flex items-center text-xs mt-2 ${trend > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {trend > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}% este mes
            </div>
        )}
    </div>
);

/** Single store price card like Preciar's list items */
const StorePriceCard: React.FC<{
    precio: PrecioSupermercado;
    esMejor: boolean;
    index: number;
}> = ({ precio, esMejor, index }) => {
    const branding = getBranding(precio.supermercado);

    return (
        <div className={`
            group flex items-center justify-between p-4 rounded-xl border transition-all
            hover:shadow-md hover:border-gray-200
            ${esMejor
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                : 'bg-white border-gray-100'
            }
        `}>
            {/* Left: Store info */}
            <div className="flex items-center space-x-3">
                {/* Ranking badge for top 3 */}
                {index < 3 && (
                    <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                                'bg-orange-100 text-orange-700'}
                    `}>
                        {index + 1}
                    </div>
                )}

                {/* Store logo */}
                <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-100"
                >
                    {branding.logo ? (
                        <img
                            src={branding.logo}
                            alt={branding.nombre}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                                // Fallback to letter if logo fails
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `<span class="text-white font-bold text-sm" style="background: ${branding.color}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 8px;">${branding.nombre.charAt(0)}</span>`;
                            }}
                        />
                    ) : (
                        <span
                            className="w-full h-full flex items-center justify-center text-white font-bold text-sm rounded-lg"
                            style={{ backgroundColor: branding.color }}
                        >
                            {branding.nombre.charAt(0)}
                        </span>
                    )}
                </div>

                <div>
                    <div className="font-medium text-gray-900">
                        {branding.nombre}
                    </div>

                    {/* Variation badge */}
                    {precio.variacion !== undefined && precio.variacion !== 0 && (
                        <span className={`
                            inline-flex items-center text-xs px-2 py-0.5 rounded-full mt-1
                            ${precio.variacion < 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }
                        `}>
                            {precio.variacion > 0 ? '+' : ''}{precio.variacion.toFixed(1)}%
                        </span>
                    )}

                    {/* Stability indicator */}
                    {precio.diasEstable && precio.diasEstable > 0 && (
                        <span className="text-xs text-gray-400 ml-2">
                            Precio estable hace {precio.diasEstable} días
                        </span>
                    )}
                </div>
            </div>

            {/* Right: Price and link */}
            <div className="flex items-center space-x-4">
                {/* Best badge */}
                {esMejor && (
                    <Badge className="bg-emerald-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        Mejor
                    </Badge>
                )}

                {/* Stock indicator */}
                {!precio.enStock && (
                    <Badge variant="outline" className="text-gray-400 border-gray-200">
                        Sin stock
                    </Badge>
                )}

                {/* Price */}
                <div className={`text-xl font-bold ${esMejor ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {formatPrecio(precio.precio)}
                </div>

                {/* External link */}
                {precio.url && (
                    <a
                        href={precio.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title={`Ver en ${branding.nombre}`}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// Main Component
// =============================================================================

export const PreciarStylePriceCard: React.FC<Props> = ({
    producto,
    onRefresh,
    loading = false,
}) => {
    const mejorPrecio = producto.precios.length > 0
        ? Math.min(...producto.precios.map(p => p.precio))
        : 0;

    const mejorSupermercado = producto.precios.find(p => p.precio === mejorPrecio);

    const sortedPrecios = [...producto.precios].sort((a, b) => a.precio - b.precio);

    return (
        <div className="bg-gray-50 rounded-2xl overflow-hidden">
            {/* Header with product info */}
            <div className="bg-white p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        {producto.imagen && (
                            <img
                                src={producto.imagen}
                                alt={producto.nombre}
                                className="w-16 h-16 object-contain rounded-lg bg-gray-50"
                            />
                        )}
                        <div>
                            {producto.categoria && (
                                <span className="text-xs text-gray-400 uppercase tracking-wide">
                                    {producto.categoria}
                                </span>
                            )}
                            <h3 className="text-xl font-bold text-gray-900">
                                {producto.nombre}
                            </h3>

                            {/* Data source indicator */}
                            <div className="flex items-center mt-1">
                                {producto.esReal ? (
                                    <span className="inline-flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Precios en vivo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Precios estimados
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {onRefresh && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRefresh}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats row - Preciar style */}
            <div className="p-6 bg-white border-b border-gray-100">
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        label="Mejor precio"
                        value={formatPrecio(mejorPrecio)}
                        sublabel={mejorSupermercado ? getBranding(mejorSupermercado.supermercado).nombre : undefined}
                        icon={<Trophy className="w-4 h-4" />}
                        highlight
                    />
                    <StatCard
                        label="Precio promedio"
                        value={formatPrecio(producto.precioPromedio)}
                        sublabel={`Rango: ${formatPrecio(producto.rangoPrecios.min)} - ${formatPrecio(producto.rangoPrecios.max)}`}
                        icon={<BarChart3 className="w-4 h-4" />}
                    />
                    <StatCard
                        label="Tendencia (mes)"
                        value={`${producto.tendenciaMes > 0 ? '+' : ''}${producto.tendenciaMes.toFixed(1)}%`}
                        sublabel={producto.tendenciaMes > 0 ? 'En aumento' : producto.tendenciaMes < 0 ? 'En baja' : 'Estable'}
                        icon={producto.tendenciaMes >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        trend={producto.tendenciaMes}
                    />
                </div>
            </div>

            {/* Info banner */}
            <div className="mx-6 mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Los precios se actualizan automáticamente. Verificá el precio final en la web del supermercado.
                </div>
            </div>

            {/* Price list */}
            <div className="p-6 space-y-3">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Comparar en {sortedPrecios.length} supermercados
                </h4>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Buscando mejores precios...</span>
                    </div>
                ) : sortedPrecios.length > 0 ? (
                    <div className="space-y-2">
                        {sortedPrecios.map((precio, index) => (
                            <StorePriceCard
                                key={precio.supermercado}
                                precio={precio}
                                esMejor={index === 0}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No se encontraron precios para este producto</p>
                    </div>
                )}
            </div>

            {/* Savings callout */}
            {sortedPrecios.length >= 2 && (
                <div className="mx-6 mb-6">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">
                                    Comprando en {getBranding(sortedPrecios[0].supermercado).nombre} ahorrás
                                </p>
                                <p className="text-2xl font-bold">
                                    {formatPrecio(sortedPrecios[sortedPrecios.length - 1].precio - sortedPrecios[0].precio)}
                                </p>
                                <p className="text-xs opacity-75">
                                    vs {getBranding(sortedPrecios[sortedPrecios.length - 1].supermercado).nombre}
                                </p>
                            </div>
                            <TrendingDown className="w-12 h-12 opacity-50" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreciarStylePriceCard;
