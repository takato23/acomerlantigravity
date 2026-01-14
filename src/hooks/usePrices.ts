'use client';

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export type Supermercado = 'coto' | 'dia' | 'jumbo' | 'carrefour' | 'masonline' | 'vea' | 'supermami' | 'laAnonima';

export interface PrecioProducto {
    nombre: string;
    supermercado: Supermercado;
    precio: number;
    precioUnitario?: number;
    unidad?: string;
    url?: string;
    enStock: boolean;
    fechaActualizacion: Date;
    esOferta?: boolean;
    precioAnterior?: number;
}

export interface ComparacionPrecios {
    producto: string;
    precios: PrecioProducto[];
    mejorPrecio: PrecioProducto | null;
    ahorroMaximo: number;
    promedioMercado: number;
}

interface ShoppingItemWithPrice {
    itemId: string;
    nombre: string;
    cantidad: number;
    unidad: string;
    comparacion: ComparacionPrecios | null;
    isLoading: boolean;
    error: string | null;
}

interface UsePricesReturn {
    items: ShoppingItemWithPrice[];
    isLoadingAll: boolean;
    totalOptimizado: number;
    totalPromedio: number;
    ahorroTotal: number;
    mejorSupermercado: Supermercado | null;
    fetchPriceForItem: (itemId: string, nombre: string, cantidad: number) => Promise<void>;
    fetchPricesForAll: (items: Array<{ id: string; nombre: string; cantidad: number }>) => Promise<void>;
    clearPrices: () => void;
}

const SUPERMERCADO_URLS: Record<Supermercado, string> = {
    coto: 'https://www.coto.com.ar/buscar?keyword=',
    dia: 'https://diaonline.supermercadosdia.com.ar/buscar?q=',
    jumbo: 'https://www.jumbo.com.ar/busca/?ft=',
    carrefour: 'https://www.carrefour.com.ar/busca/?ft=',
    masonline: 'https://www.masonline.com.ar/buscar?q=',
    vea: 'https://www.vea.com.ar/buscar?q=',
    supermami: 'https://www.supermami.com.ar/buscar?q=',
    laAnonima: 'https://www.laAnonima.com.ar/buscar?q='
};

export function usePrices(): UsePricesReturn {
    const [items, setItems] = useState<ShoppingItemWithPrice[]>([]);
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    /**
     * Fetch price for a single item
     */
    const fetchPriceForItem = useCallback(async (
        itemId: string,
        nombre: string,
        cantidad: number
    ) => {
        // Update loading state for this item
        setItems(prev => {
            const existing = prev.find(i => i.itemId === itemId);
            if (existing) {
                return prev.map(i => i.itemId === itemId ? { ...i, isLoading: true, error: null } : i);
            }
            return [...prev, { itemId, nombre, cantidad, unidad: '', comparacion: null, isLoading: true, error: null }];
        });

        try {
            const response = await fetch('/api/precios/buscar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ producto: nombre, cantidad })
            });

            if (!response.ok) {
                throw new Error('Error fetching prices');
            }

            const data = await response.json();

            setItems(prev => prev.map(i =>
                i.itemId === itemId
                    ? { ...i, comparacion: data, isLoading: false }
                    : i
            ));
        } catch (err) {
            setItems(prev => prev.map(i =>
                i.itemId === itemId
                    ? { ...i, isLoading: false, error: 'Error al obtener precios' }
                    : i
            ));
        }
    }, []);

    /**
     * Fetch prices for all items in the shopping list
     */
    const fetchPricesForAll = useCallback(async (
        shoppingItems: Array<{ id: string; nombre: string; cantidad: number }>
    ) => {
        setIsLoadingAll(true);

        // Initialize all items with loading state
        setItems(shoppingItems.map(item => ({
            itemId: item.id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            unidad: '',
            comparacion: null,
            isLoading: true,
            error: null
        })));

        try {
            // Fetch prices in batches to avoid overwhelming the API
            const batchSize = 5;
            for (let i = 0; i < shoppingItems.length; i += batchSize) {
                const batch = shoppingItems.slice(i, i + batchSize);

                await Promise.all(batch.map(async (item) => {
                    try {
                        const response = await fetch('/api/precios/buscar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ producto: item.nombre, cantidad: item.cantidad })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            setItems(prev => prev.map(i =>
                                i.itemId === item.id
                                    ? { ...i, comparacion: data, isLoading: false }
                                    : i
                            ));
                        } else {
                            throw new Error('API error');
                        }
                    } catch {
                        setItems(prev => prev.map(i =>
                            i.itemId === item.id
                                ? { ...i, isLoading: false, error: 'Error' }
                                : i
                        ));
                    }
                }));
            }

            toast.success('Precios actualizados');
        } catch (err) {
            toast.error('Error al obtener precios');
        } finally {
            setIsLoadingAll(false);
        }
    }, []);

    /**
     * Clear all price data
     */
    const clearPrices = useCallback(() => {
        setItems([]);
    }, []);

    /**
     * Calculate totals and best supermarket
     */
    const { totalOptimizado, totalPromedio, ahorroTotal, mejorSupermercado } = useMemo(() => {
        let optimizado = 0;
        let promedio = 0;
        const supermercadoTotals: Record<Supermercado, number> = {} as Record<Supermercado, number>;

        items.forEach(item => {
            if (item.comparacion?.mejorPrecio) {
                optimizado += item.comparacion.mejorPrecio.precio * item.cantidad;
                promedio += item.comparacion.promedioMercado * item.cantidad;

                const super_ = item.comparacion.mejorPrecio.supermercado;
                supermercadoTotals[super_] = (supermercadoTotals[super_] || 0) + item.comparacion.mejorPrecio.precio;
            }
        });

        // Find most recommended supermarket (lowest total)
        let bestSuper: Supermercado | null = null;
        let lowestTotal = Infinity;

        (Object.entries(supermercadoTotals) as [Supermercado, number][]).forEach(([super_, total]) => {
            if (total < lowestTotal) {
                lowestTotal = total;
                bestSuper = super_;
            }
        });

        return {
            totalOptimizado: optimizado,
            totalPromedio: promedio,
            ahorroTotal: promedio - optimizado,
            mejorSupermercado: bestSuper
        };
    }, [items]);

    return {
        items,
        isLoadingAll,
        totalOptimizado,
        totalPromedio,
        ahorroTotal,
        mejorSupermercado,
        fetchPriceForItem,
        fetchPricesForAll,
        clearPrices
    };
}

/**
 * Get the shopping URL for a supermarket
 */
export function getSupermercadoShoppingUrl(supermercado: Supermercado, producto: string): string {
    const baseUrl = SUPERMERCADO_URLS[supermercado];
    return `${baseUrl}${encodeURIComponent(producto)}`;
}

/**
 * Supermarket display info
 */
export const SUPERMERCADO_INFO: Record<Supermercado, { nombre: string; color: string; logo?: string }> = {
    coto: { nombre: 'Coto', color: '#e31837' },
    dia: { nombre: 'Día', color: '#e30613' },
    jumbo: { nombre: 'Jumbo', color: '#00a859' },
    carrefour: { nombre: 'Carrefour', color: '#004e9a' },
    masonline: { nombre: 'Mas Online', color: '#ff6600' },
    vea: { nombre: 'Vea', color: '#00b050' },
    supermami: { nombre: 'Super Mami', color: '#ff69b4' },
    laAnonima: { nombre: 'La Anónima', color: '#0066cc' }
};
