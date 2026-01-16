/**
 * Preciar.com Price Scraper Service
 * Scrapes real-time prices from Argentine supermarkets via Preciar.com
 */

import * as cheerio from 'cheerio';
import { logger } from '@/services/logger';

// Types
export type Supermercado =
    | 'coto'
    | 'dia'
    | 'jumbo'
    | 'carrefour'
    | 'masonline'
    | 'supermami'
    | 'laAnonima';

export interface PrecioPreciar {
    supermercado: Supermercado;
    nombreSupermercado: string;
    precio: number;
    url?: string;
    enStock: boolean;
}

export interface ProductoPreciar {
    nombre: string;
    slug: string;
    mejorPrecio: number | null;
    mejorSupermercado: string | null;
    precioPromedio: number;
    tendenciaMes: number; // Porcentaje (ej: +5.9 o -2.3)
    precios: PrecioPreciar[];
    fechaScraping: Date;
    esReal: boolean; // true si son datos reales, false si son estimados
}

// Cache configuration
interface CacheEntry {
    data: ProductoPreciar;
    timestamp: number;
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const priceCache = new Map<string, CacheEntry>();

// Supermarket name mappings from Preciar.com
const SUPERMERCADO_MAP: Record<string, Supermercado> = {
    'coto': 'coto',
    'cotodigital': 'coto',
    'dia': 'dia',
    'diaonline': 'dia',
    'jumbo': 'jumbo',
    'carrefour': 'carrefour',
    'más online': 'masonline',
    'masonline': 'masonline',
    'mas online': 'masonline',
    'super mami': 'supermami',
    'supermami': 'supermami',
    'dinoonline': 'supermami',
    'la anónima': 'laAnonima',
    'laanonima': 'laAnonima',
};

const SUPERMERCADO_NOMBRES: Record<Supermercado, string> = {
    coto: 'Coto',
    dia: 'Día',
    jumbo: 'Jumbo',
    carrefour: 'Carrefour',
    masonline: 'Más Online',
    supermami: 'Super Mami',
    laAnonima: 'La Anónima',
};

/**
 * Normalize product name to Preciar.com slug format
 */
function normalizeToSlug(producto: string): string {
    return producto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with dashes
        + '-x-kg'; // Common suffix for weight-based products
}

/**
 * Parse supermarket name from URL or text
 */
function parseSupermercado(text: string): Supermercado | null {
    const normalized = text.toLowerCase().replace(/[^a-z]/g, '');

    for (const [key, value] of Object.entries(SUPERMERCADO_MAP)) {
        if (normalized.includes(key.replace(/[^a-z]/g, ''))) {
            return value;
        }
    }

    return null;
}

/**
 * Parse price from text (handles Argentine format: $1.999)
 */
function parsePrice(text: string): number | null {
    const match = text.match(/\$?\s*([\d.,]+)/);
    if (!match) return null;

    // Remove thousand separators and convert
    const cleaned = match[1].replace(/\./g, '').replace(',', '.');
    const price = parseFloat(cleaned);

    return isNaN(price) ? null : price;
}

/**
 * Parse trend percentage from text (e.g., "+5.9%" or "-2.3%")
 */
function parseTrend(text: string): number {
    const match = text.match(/([+-]?\d+\.?\d*)%?/);
    if (!match) return 0;
    return parseFloat(match[1]) || 0;
}

/**
 * Fetch and parse product page from Preciar.com
 * This runs server-side to avoid CORS issues
 */
export async function scrapeProductoPreciar(producto: string): Promise<ProductoPreciar | null> {
    const slug = normalizeToSlug(producto);
    const cacheKey = slug;

    // Check cache
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug('[PreciarScraper] Cache hit for:', producto);
        return cached.data;
    }

    try {
        const url = `https://preciar.com/producto/${slug}`;
        logger.info('[PreciarScraper] Fetching:', url);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; KeCarajoComer/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'es-AR,es;q=0.9',
            },
            // Our manual cache handles revalidation (15 min TTL)
        });

        if (!response.ok) {
            logger.warn('[PreciarScraper] Failed to fetch:', 'PreciarScraper', { status: response.status });
            return null;
        }

        const html = await response.text();
        return parseProductoHtml(html, producto, slug);

    } catch (error: unknown) {
        logger.error('[PreciarScraper] Error scraping:', 'PreciarScraper', error);
        return null;
    }
}

/**
 * Parse product HTML from Preciar.com using Cheerio
 */
function parseProductoHtml(html: string, nombreOriginal: string, slug: string): ProductoPreciar {
    const $ = cheerio.load(html);
    const precios: PrecioPreciar[] = [];

    // Extract metadata from summary sections
    let mejorPrecio: number | null = null;
    let mejorSupermercado: string | null = null;
    let precioPromedio = 0;
    let tendenciaMes = 0;

    // Based on typical Preciar.com structure
    const summaryText = $('.product-summary').text() || html;

    // Better Price parsing from summary
    const bestPriceMatch = summaryText.match(/Mejor precio[^$]*\$\s*([\d.,]+)/i);
    if (bestPriceMatch) {
        mejorPrecio = parsePrice(bestPriceMatch[1]);
    }

    // Average price
    const averageMatch = summaryText.match(/Precio promedio[^$]*\$\s*([\d.,]+)/i);
    if (averageMatch) {
        precioPromedio = parsePrice(averageMatch[1]) || 0;
    }

    // Tendency
    const trendMatch = summaryText.match(/([+-]?\d+\.?\d*)%[^<]*(?:En aumento|En baja|Estable)/i);
    if (trendMatch) {
        tendenciaMes = parseTrend(trendMatch[1]);
    }

    // Parse specific supermarket rows/cards
    // Preciar usually has a list of supermarkets with prices
    $('.supermarket-list-item, .price-row, .shop-price-item').each((_, el) => {
        const row = $(el);
        const superName = row.find('.shop-name, .super-name, h4, h3').first().text().trim();
        const priceText = row.find('.price, .current-price, .amount').first().text().trim();
        const url = row.find('a[href*="producto"], a[href*="click"]').first().attr('href');

        const price = parsePrice(priceText);
        const supermercado = parseSupermercado(superName || url || '');

        if (supermercado && price) {
            precios.push({
                supermercado,
                nombreSupermercado: SUPERMERCADO_NOMBRES[supermercado],
                precio: price,
                url,
                enStock: !row.text().toLowerCase().includes('sin stock'),
            });
        }
    });

    // Fallback search if selectors fail (keep some regex but scoped)
    if (precios.length === 0) {
        // Look for patterns like: [Coto$1.999] in text blocks
        const preciosRegex = /\[([^\]$]+)\$\s*([\d.,]+)\]/g;
        let match;
        while ((match = preciosRegex.exec(html)) !== null) {
            const superName = match[1].trim();
            const precio = parsePrice(match[2]);
            const supermercado = parseSupermercado(superName);

            if (supermercado && precio && !precios.find(p => p.supermercado === supermercado)) {
                precios.push({
                    supermercado,
                    nombreSupermercado: SUPERMERCADO_NOMBRES[supermercado],
                    precio,
                    enStock: true,
                });
            }
        }
    }

    // Sort by price
    const uniquePrecios = Array.from(
        new Map(precios.map(p => [p.supermercado, p])).values()
    ).sort((a, b) => a.precio - b.precio);

    const result: ProductoPreciar = {
        nombre: nombreOriginal,
        slug,
        mejorPrecio: mejorPrecio || (uniquePrecios[0]?.precio ?? null),
        mejorSupermercado: mejorSupermercado || (uniquePrecios[0]?.nombreSupermercado ?? null),
        precioPromedio: precioPromedio || (uniquePrecios.length > 0
            ? uniquePrecios.reduce((sum, p) => sum + p.precio, 0) / uniquePrecios.length
            : 0),
        tendenciaMes,
        precios: uniquePrecios,
        fechaScraping: new Date(),
        esReal: uniquePrecios.length > 0,
    };

    // Cache the result
    priceCache.set(slug, {
        data: result,
        timestamp: Date.now(),
    });

    return result;
}

/**
 * Search for multiple products
 */
export async function scrapeMultiplesProductos(
    productos: string[]
): Promise<Map<string, ProductoPreciar | null>> {
    const results = new Map<string, ProductoPreciar | null>();

    // Process in parallel with a limit
    const batchSize = 3;
    for (let i = 0; i < productos.length; i += batchSize) {
        const batch = productos.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(p => scrapeProductoPreciar(p))
        );

        batch.forEach((producto, idx) => {
            results.set(producto, batchResults[idx]);
        });

        // Small delay between batches to be respectful
        if (i + batchSize < productos.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
}

/**
 * Clear the price cache
 */
export function clearPreciarCache(): void {
    priceCache.clear();
    logger.info('[PreciarScraper] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getPreciarCacheStats(): { size: number; entries: string[] } {
    return {
        size: priceCache.size,
        entries: Array.from(priceCache.keys()),
    };
}
