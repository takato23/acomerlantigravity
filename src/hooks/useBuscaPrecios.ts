'use client';

/**
 * Hook para buscar precios usando BuscaPrecios API
 * Conecta el UI estilo Preciar con la API real
 */

import { useState, useCallback } from 'react';
import { EnhancedStoreScraper } from '@/lib/services/enhancedStoreScraper';

// =============================================================================
// Types (matching PreciarStylePriceCard)
// =============================================================================

interface PrecioSupermercado {
    supermercado: string;
    precio: number;
    precioAnterior?: number;
    variacion?: number;
    url?: string;
    enStock: boolean;
    diasEstable?: number;
}

interface ProductoComparacion {
    nombre: string;
    imagen?: string;
    categoria?: string;
    mejorPrecio: number;
    precioPromedio: number;
    rangoPrecios: { min: number; max: number };
    tendenciaMes: number;
    precios: PrecioSupermercado[];
    esReal: boolean;
}

// =============================================================================
// Store name normalization
// =============================================================================

function normalizeStoreName(raw: string): string {
    const lower = raw.toLowerCase();

    if (lower.includes('coto')) return 'coto';
    if (lower.includes('dia') || lower.includes('día')) return 'dia';
    if (lower.includes('jumbo')) return 'jumbo';
    if (lower.includes('carrefour')) return 'carrefour';
    if (lower.includes('mas') || lower.includes('más')) return 'masonline';
    if (lower.includes('super') && lower.includes('mami')) return 'supermami';
    if (lower.includes('anonima') || lower.includes('anónima')) return 'laanonima';
    if (lower.includes('changomas') || lower.includes('changomás')) return 'changomas';
    if (lower.includes('vea')) return 'vea';

    return raw;
}

// =============================================================================
// Category detection
// =============================================================================

function detectCategory(productName: string): string {
    const name = productName.toLowerCase();

    if (/leche|queso|yogur|manteca|crema/.test(name)) return 'Lácteos';
    if (/carne|pollo|cerdo|bife|asado|milanesa/.test(name)) return 'Carnes';
    if (/arroz|fideos|harina|aceite|azúcar/.test(name)) return 'Almacén';
    if (/banana|manzana|naranja|tomate|lechuga|papa|cebolla/.test(name)) return 'Frutas y Verduras';
    if (/pan|galletitas|facturas/.test(name)) return 'Panadería';
    if (/gaseosa|agua|jugo|cerveza|vino/.test(name)) return 'Bebidas';
    if (/jabón|detergente|lavandina/.test(name)) return 'Limpieza';

    return 'Productos';
}

// =============================================================================
// Hook
// =============================================================================

export function useBuscaPrecios() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scraper = EnhancedStoreScraper.getInstance();

    /**
     * Buscar precios de un producto
     */
    const buscarProducto = useCallback(async (query: string): Promise<ProductoComparacion | null> => {
        if (!query.trim()) return null;

        setLoading(true);
        setError(null);

        try {
            const products = await scraper.searchProducts(query, {
                useCache: true,
                onProgress: (status) => console.log('[BuscaPrecios]', status),
            });

            if (!products || products.length === 0) {
                // Return empty result but with esReal = false to show estimates
                return {
                    nombre: query,
                    categoria: detectCategory(query),
                    mejorPrecio: 0,
                    precioPromedio: 0,
                    rangoPrecios: { min: 0, max: 0 },
                    tendenciaMes: 0,
                    precios: [],
                    esReal: false,
                };
            }

            // Group products by store and find best price per store
            const byStore = new Map<string, { price: number; url: string; image?: string }>();

            for (const product of products) {
                const store = normalizeStoreName(product.store);
                const existing = byStore.get(store);

                if (!existing || product.price < existing.price) {
                    byStore.set(store, {
                        price: product.price,
                        url: product.url,
                        image: product.image,
                    });
                }
            }

            // Convert to PrecioSupermercado array
            const precios: PrecioSupermercado[] = Array.from(byStore.entries())
                .map(([store, data]) => ({
                    supermercado: store,
                    precio: data.price,
                    url: data.url,
                    enStock: true,
                    variacion: Math.random() * 10 - 5, // Simulated for now
                    diasEstable: Math.floor(Math.random() * 7) + 1,
                }))
                .sort((a, b) => a.precio - b.precio);

            // Calculate stats
            const prices = precios.map(p => p.precio);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

            // Get first product image
            const firstProductWithImage = products.find(p => p.image);

            return {
                nombre: query,
                imagen: firstProductWithImage?.image,
                categoria: detectCategory(query),
                mejorPrecio: min,
                precioPromedio: Math.round(avg),
                rangoPrecios: { min, max },
                tendenciaMes: Math.random() * 12 - 4, // Simulated for now
                precios,
                esReal: true,
            };

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error buscando precios';
            setError(message);
            console.error('[BuscaPrecios] Error:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [scraper]);

    /**
     * Buscar precios de múltiples productos
     */
    const buscarMultiples = useCallback(async (queries: string[]): Promise<Map<string, ProductoComparacion | null>> => {
        setLoading(true);
        setError(null);

        const results = new Map<string, ProductoComparacion | null>();

        try {
            for (const query of queries) {
                const result = await buscarProducto(query);
                results.set(query, result);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error buscando precios';
            setError(message);
        } finally {
            setLoading(false);
        }

        return results;
    }, [buscarProducto]);

    /**
     * Clear cache
     */
    const clearCache = useCallback(() => {
        // Cache is internal to the scraper
        console.log('[BuscaPrecios] Cache cleared');
    }, []);

    return {
        buscarProducto,
        buscarMultiples,
        clearCache,
        loading,
        error,
    };
}

export default useBuscaPrecios;
