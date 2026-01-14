'use client';

import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Store,
    TrendingDown,
    TrendingUp,
    Trophy,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Sparkles,
    Calculator,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PreciarProductCard from './PreciarProductCard';

interface PrecioProducto {
    nombre: string;
    supermercado: string;
    precio: number;
    precioUnitario?: number;
    url?: string;
    enStock: boolean;
    esOferta?: boolean;
    precioAnterior?: number;
    // Extended fields from Preciar scraping
    _esReal?: boolean;
    _tendencia?: number;
}

interface ComparacionPrecios {
    producto: string;
    precios: PrecioProducto[];
    mejorPrecio: PrecioProducto | null;
    ahorroMaximo: number;
    promedioMercado: number;
}

interface Props {
    items: string[];
    onClose?: () => void;
}

// Colores por supermercado
const SUPERMERCADO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    coto: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    dia: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
    jumbo: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    carrefour: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    masonline: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    supermami: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    laAnonima: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
};

const SUPERMERCADO_NAMES: Record<string, string> = {
    coto: 'Coto',
    dia: 'Día',
    jumbo: 'Jumbo',
    carrefour: 'Carrefour',
    masonline: 'Más Online',
    supermami: 'Super Mami',
    laAnonima: 'La Anónima',
};

export const PriceComparisonPanel: React.FC<Props> = ({ items, onClose }) => {
    const [comparaciones, setComparaciones] = useState<ComparacionPrecios[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
    const [totalesPorSuper, setTotalesPorSuper] = useState<Record<string, number>>({});

    useEffect(() => {
        if (items.length > 0) {
            fetchPrecios();
        }
    }, [items]);

    const fetchPrecios = async () => {
        if (items.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/precios/comparar?items=${items.join(',')}`);
            const data = await response.json();

            if (data.success) {
                setComparaciones(data.data.comparaciones);
                calcularTotales(data.data.comparaciones);
            } else {
                setError(data.error || 'Error al obtener precios');
            }
        } catch (err) {
            setError('Error de conexión al buscar precios');
        } finally {
            setLoading(false);
        }
    };

    const calcularTotales = (comps: ComparacionPrecios[]) => {
        const totales: Record<string, number> = {};

        for (const comp of comps) {
            for (const precio of comp.precios) {
                if (!totales[precio.supermercado]) {
                    totales[precio.supermercado] = 0;
                }
                totales[precio.supermercado] += precio.precio;
            }
        }

        setTotalesPorSuper(totales);
    };

    const getMejorSupermercado = (): string | null => {
        const entries = Object.entries(totalesPorSuper);
        if (entries.length === 0) return null;

        return entries.sort(([, a], [, b]) => a - b)[0][0];
    };

    const formatPrecio = (precio: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(precio);
    };

    const mejorSuper = getMejorSupermercado();
    const ahorroTotal = Object.values(totalesPorSuper).length > 0
        ? Math.max(...Object.values(totalesPorSuper)) - Math.min(...Object.values(totalesPorSuper))
        : 0;

    if (items.length === 0) {
        return (
            <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Agrega productos a tu lista para comparar precios</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <TrendingDown className="w-6 h-6" />
                        <CardTitle>Comparación de Precios</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchPrecios}
                            disabled={loading}
                            className="text-white hover:bg-white/20"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                        <span className="ml-3 text-gray-600">Buscando mejores precios...</span>
                    </div>
                ) : (
                    <>
                        {/* Resumen de Totales por Supermercado */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                                <Store className="w-5 h-5 mr-2 text-emerald-600" />
                                Total por Supermercado
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(totalesPorSuper)
                                    .sort(([, a], [, b]) => a - b)
                                    .map(([super_, total], index) => {
                                        const colors = SUPERMERCADO_COLORS[super_] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
                                        const isBest = super_ === mejorSuper;

                                        return (
                                            <div
                                                key={super_}
                                                className={`p-4 rounded-xl border-2 transition-all ${isBest
                                                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                                    : `${colors.border} ${colors.bg}`
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`font-medium ${isBest ? 'text-emerald-700' : colors.text}`}>
                                                        {SUPERMERCADO_NAMES[super_] || super_}
                                                    </span>
                                                    {isBest && (
                                                        <Badge className="bg-emerald-500 text-white text-xs">
                                                            <Trophy className="w-3 h-3 mr-1" />
                                                            Mejor
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className={`text-xl font-bold ${isBest ? 'text-emerald-700' : 'text-gray-900'}`}>
                                                    {formatPrecio(total)}
                                                </div>
                                                {index > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        +{formatPrecio(total - Object.values(totalesPorSuper).sort((a, b) => a - b)[0])} vs mejor
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Ahorro Estimado */}
                        {ahorroTotal > 0 && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-700">Comprando todo en {SUPERMERCADO_NAMES[mejorSuper!]} ahorrás</p>
                                        <p className="text-2xl font-bold text-green-600">{formatPrecio(ahorroTotal)}</p>
                                    </div>
                                    <TrendingDown className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                        )}

                        {/* Detalle por Producto */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900">Detalle por Producto</h3>

                            {comparaciones.map(comp => {
                                const isExpanded = expandedProduct === comp.producto;

                                return (
                                    <div
                                        key={comp.producto}
                                        className="border rounded-xl bg-white overflow-hidden transition-all duration-300"
                                    >
                                        <button
                                            onClick={() => setExpandedProduct(isExpanded ? null : comp.producto)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 bg-white"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="font-semibold text-lg text-gray-900 capitalize">{comp.producto}</span>
                                                {comp.mejorPrecio && !isExpanded && (
                                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                                        Mejor: {SUPERMERCADO_NAMES[comp.mejorPrecio.supermercado]} - {formatPrecio(comp.mejorPrecio.precio)}
                                                    </Badge>
                                                )}
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="px-6 pb-6 pt-2 border-t bg-gray-50/50">
                                                <PreciarProductCard
                                                    productName={comp.producto}
                                                    prices={comp.precios}
                                                    className="animate-in fade-in slide-in-from-top-2 duration-300"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default PriceComparisonPanel;
