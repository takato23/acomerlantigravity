/**
 * Servicio de Precios - KeCarajoComer
 * Comparación de precios entre supermercados argentinos
 * Integrado con scraping real de Preciar.com + fallback a datos mock
 */

import { scrapeProductoPreciar, type ProductoPreciar } from './preciarScraper';
import { logger } from '@/services/logger';

export type Supermercado = 'coto' | 'dia' | 'jumbo' | 'carrefour' | 'masonline' | 'supermami' | 'laAnonima';

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

export interface OptimizacionCompra {
    items: Array<{
        nombre: string;
        mejorSupermercado: Supermercado;
        precio: number;
        alternativas: PrecioProducto[];
    }>;
    totalOptimizado: number;
    totalPorSupermercado: Record<Supermercado, number>;
    supermercadoRecomendado: Supermercado;
    ahorroEstimado: number;
}

// Cache en memoria con TTL
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class PreciosCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL = 7 * 24 * 60 * 60 * 1000; // 7 días

    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl ?? this.defaultTTL,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// Datos mock de precios (hasta integrar scraping real)
const MOCK_PRECIOS: Record<string, Partial<Record<Supermercado, number>>> = {
    'arroz': { coto: 1299, dia: 1199, jumbo: 1350, carrefour: 1249, masonline: 1180 },
    'fideos': { coto: 899, dia: 849, jumbo: 950, carrefour: 879, masonline: 820 },
    'aceite': { coto: 2499, dia: 2399, jumbo: 2650, carrefour: 2449, masonline: 2350 },
    'leche': { coto: 899, dia: 849, jumbo: 920, carrefour: 869, masonline: 830 },
    'pan': { coto: 599, dia: 549, jumbo: 650, carrefour: 579, masonline: 520 },
    'yerba': { coto: 3499, dia: 3299, jumbo: 3650, carrefour: 3399, masonline: 3150 },
    'azucar': { coto: 1199, dia: 1099, jumbo: 1250, carrefour: 1149, masonline: 1050 },
    'harina': { coto: 799, dia: 749, jumbo: 850, carrefour: 779, masonline: 720 },
    'huevos': { coto: 2299, dia: 2199, jumbo: 2450, carrefour: 2249, masonline: 2100 },
    'pollo': { coto: 3999, dia: 3799, jumbo: 4200, carrefour: 3899, masonline: 3650 },
    'carne picada': { coto: 4999, dia: 4799, jumbo: 5200, carrefour: 4899, masonline: 4650 },
    'carne': { coto: 6999, dia: 6599, jumbo: 7200, carrefour: 6799, masonline: 6400 },
    'tomate': { coto: 999, dia: 899, jumbo: 1100, carrefour: 949, masonline: 850 },
    'cebolla': { coto: 599, dia: 499, jumbo: 650, carrefour: 549, masonline: 480 },
    'papa': { coto: 799, dia: 699, jumbo: 850, carrefour: 749, masonline: 680 },
    'lechuga': { coto: 699, dia: 599, jumbo: 750, carrefour: 649, masonline: 580 },
    'queso': { coto: 3499, dia: 3299, jumbo: 3700, carrefour: 3399, masonline: 3200 },
    'jamon': { coto: 4999, dia: 4699, jumbo: 5200, carrefour: 4799, masonline: 4500 },
    'manteca': { coto: 1999, dia: 1849, jumbo: 2100, carrefour: 1899, masonline: 1780 },
    'cafe': { coto: 4499, dia: 4199, jumbo: 4700, carrefour: 4299, masonline: 4050 },
    'galletitas': { coto: 799, dia: 699, jumbo: 850, carrefour: 749, masonline: 680 },
    'milanesas': { coto: 4499, dia: 4199, jumbo: 4700, carrefour: 4299, masonline: 4050 },
    'empanadas': { coto: 2999, dia: 2799, jumbo: 3200, carrefour: 2899, masonline: 2700 },
    'pizza': { coto: 3999, dia: 3699, jumbo: 4200, carrefour: 3799, masonline: 3550 },
};

const SUPERMERCADO_INFO: Record<Supermercado, { nombre: string; url: string; color: string }> = {
    coto: { nombre: 'Coto', url: 'https://www.coto.com.ar', color: '#e31837' },
    dia: { nombre: 'Día', url: 'https://www.dia.com.ar', color: '#ed1c24' },
    jumbo: { nombre: 'Jumbo', url: 'https://www.jumbo.com.ar', color: '#00a651' },
    carrefour: { nombre: 'Carrefour', url: 'https://www.carrefour.com.ar', color: '#004b93' },
    masonline: { nombre: 'Más Online', url: 'https://www.masonline.com.ar', color: '#ff6600' },
    supermami: { nombre: 'Super Mami', url: 'https://www.supermami.com.ar', color: '#ff69b4' },
    laAnonima: { nombre: 'La Anónima', url: 'https://www.laAnonima.com.ar', color: '#0066cc' },
};

export class PreciosService {
    private cache: PreciosCache;

    constructor() {
        this.cache = new PreciosCache();
    }

    /**
     * Buscar precios de un producto específico
     */
    async buscarPrecios(producto: string, cantidad: number = 1): Promise<ComparacionPrecios> {
        const cacheKey = `precios:${producto.toLowerCase()}:${cantidad}`;
        const cached = this.cache.get<ComparacionPrecios>(cacheKey);
        if (cached) return cached;

        const precios = await this.obtenerPreciosProducto(producto, cantidad);

        const mejorPrecio = precios.reduce<PrecioProducto | null>((mejor, actual) => {
            if (!mejor || actual.precio < mejor.precio) return actual;
            return mejor;
        }, null);

        const promedioMercado = precios.length > 0
            ? precios.reduce((sum, p) => sum + p.precio, 0) / precios.length
            : 0;

        const ahorroMaximo = precios.length > 0
            ? Math.max(...precios.map(p => p.precio)) - Math.min(...precios.map(p => p.precio))
            : 0;

        const resultado: ComparacionPrecios = {
            producto,
            precios,
            mejorPrecio,
            ahorroMaximo,
            promedioMercado,
        };

        this.cache.set(cacheKey, resultado);
        return resultado;
    }

    /**
     * Comparar precios de múltiples productos
     */
    async compararLista(items: string[]): Promise<ComparacionPrecios[]> {
        const resultados: ComparacionPrecios[] = [];

        for (const item of items) {
            const comparacion = await this.buscarPrecios(item);
            resultados.push(comparacion);
        }

        return resultados;
    }

    /**
     * Optimizar compra - sugerir mejor supermercado por item
     */
    async optimizarCompra(items: Array<{ nombre: string; cantidad?: number }>): Promise<OptimizacionCompra> {
        const comparaciones = await Promise.all(
            items.map(item => this.buscarPrecios(item.nombre, item.cantidad ?? 1))
        );

        const optimizados = comparaciones.map(comp => ({
            nombre: comp.producto,
            mejorSupermercado: comp.mejorPrecio?.supermercado ?? 'dia' as Supermercado,
            precio: comp.mejorPrecio?.precio ?? 0,
            alternativas: comp.precios.filter(p => p.supermercado !== comp.mejorPrecio?.supermercado),
        }));

        const totalOptimizado = optimizados.reduce((sum, item) => sum + item.precio, 0);

        // Calcular total por supermercado
        const supermercados: Supermercado[] = ['coto', 'dia', 'jumbo', 'carrefour', 'masonline', 'supermami', 'laAnonima'];
        const totalPorSupermercado = {} as Record<Supermercado, number>;

        for (const supermercado of supermercados) {
            let total = 0;
            for (const comp of comparaciones) {
                const precio = comp.precios.find(p => p.supermercado === supermercado);
                total += precio?.precio ?? 0;
            }
            totalPorSupermercado[supermercado] = total;
        }

        // Encontrar supermercado con mejor total
        const supermercadoRecomendado = (Object.entries(totalPorSupermercado)
            .filter(([_, total]) => total > 0)
            .sort(([, a], [, b]) => a - b)[0]?.[0] ?? 'dia') as Supermercado;

        const peorTotal = Math.max(...Object.values(totalPorSupermercado).filter(t => t > 0));
        const ahorroEstimado = peorTotal - totalOptimizado;

        return {
            items: optimizados,
            totalOptimizado,
            totalPorSupermercado,
            supermercadoRecomendado,
            ahorroEstimado,
        };
    }

    /**
     * Obtener precios de un producto desde diferentes fuentes
     * Primero intenta scraping real de Preciar.com, luego fallback a mock
     */
    private async obtenerPreciosProducto(producto: string, cantidad: number): Promise<PrecioProducto[]> {
        const productoNormalizado = this.normalizarProducto(producto);
        const ahora = new Date();

        // 1. Intentar scraping real de Preciar.com
        try {
            logger.info('[PreciosService] Intentando scraping real para:', producto);
            const preciarData = await scrapeProductoPreciar(producto);

            if (preciarData && preciarData.esReal && preciarData.precios.length > 0) {
                logger.info('[PreciosService] ✅ Precios reales obtenidos:', 'PreciosService', { count: preciarData.precios.length });

                return preciarData.precios.map(p => ({
                    nombre: producto,
                    supermercado: p.supermercado,
                    precio: p.precio * cantidad,
                    precioUnitario: p.precio,
                    unidad: 'kg',
                    url: p.url || SUPERMERCADO_INFO[p.supermercado]?.url,
                    enStock: p.enStock,
                    fechaActualizacion: preciarData.fechaScraping,
                    esOferta: false,
                    // Añadir metadata para UI
                    _esReal: true,
                    _tendencia: preciarData.tendenciaMes,
                } as PrecioProducto));
            }
        } catch (error: unknown) {
            logger.warn('[PreciosService] Scraping falló, usando fallback:', 'PreciosService', error);
        }

        // 2. Fallback a datos mock
        logger.info('[PreciosService] Usando datos mock para:', producto);
        const preciosMock = MOCK_PRECIOS[productoNormalizado];

        if (!preciosMock) {
            // 3. Generar precios estimados si no hay mock
            return this.generarPreciosEstimados(producto, cantidad);
        }

        const precios: PrecioProducto[] = [];

        for (const [supermercado, precioBase] of Object.entries(preciosMock)) {
            if (precioBase) {
                const info = SUPERMERCADO_INFO[supermercado as Supermercado];
                precios.push({
                    nombre: producto,
                    supermercado: supermercado as Supermercado,
                    precio: precioBase * cantidad,
                    precioUnitario: precioBase,
                    unidad: 'unidad',
                    url: info?.url,
                    enStock: true,
                    fechaActualizacion: ahora,
                    // Marcar como estimado
                    _esReal: false,
                } as PrecioProducto);
            }
        }

        return precios;
    }

    /**
     * Normalizar nombre de producto para búsqueda
     */
    private normalizarProducto(producto: string): string {
        return producto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Generar precios estimados cuando no hay datos reales
     */
    private generarPreciosEstimados(producto: string, cantidad: number): PrecioProducto[] {
        // Precios base estimados por tipo de producto
        const precioBase = this.estimarPrecioBase(producto);
        const ahora = new Date();

        const supermercados: Supermercado[] = ['coto', 'dia', 'jumbo', 'carrefour', 'masonline'];

        return supermercados.map(supermercado => {
            // Agregar variación aleatoria (-10% a +15%)
            const variacion = 0.9 + Math.random() * 0.25;
            const precioFinal = Math.round(precioBase * variacion * cantidad);
            const info = SUPERMERCADO_INFO[supermercado];

            return {
                nombre: producto,
                supermercado,
                precio: precioFinal,
                precioUnitario: Math.round(precioBase * variacion),
                unidad: 'unidad',
                url: info?.url,
                enStock: Math.random() > 0.1, // 90% probabilidad de stock
                fechaActualizacion: ahora,
            };
        });
    }

    /**
     * Estimar precio base según tipo de producto
     */
    private estimarPrecioBase(producto: string): number {
        const categorias: Record<string, number> = {
            'carne': 5000,
            'pollo': 3500,
            'pescado': 4500,
            'lacteo': 900,
            'verdura': 600,
            'fruta': 700,
            'bebida': 1200,
            'limpieza': 800,
            'almacen': 1000,
        };

        const productoLower = producto.toLowerCase();

        // Detectar categoría
        if (productoLower.includes('carne') || productoLower.includes('bife') || productoLower.includes('asado')) {
            return categorias['carne'];
        }
        if (productoLower.includes('pollo')) {
            return categorias['pollo'];
        }
        if (productoLower.includes('leche') || productoLower.includes('queso') || productoLower.includes('yogur')) {
            return categorias['lacteo'];
        }
        if (productoLower.includes('tomate') || productoLower.includes('lechuga') || productoLower.includes('cebolla')) {
            return categorias['verdura'];
        }
        if (productoLower.includes('manzana') || productoLower.includes('banana') || productoLower.includes('naranja')) {
            return categorias['fruta'];
        }
        if (productoLower.includes('gaseosa') || productoLower.includes('agua') || productoLower.includes('jugo')) {
            return categorias['bebida'];
        }

        return categorias['almacen'];
    }

    /**
     * Obtener información de supermercado
     */
    getSupermercadoInfo(supermercado: Supermercado) {
        return SUPERMERCADO_INFO[supermercado];
    }

    /**
     * Limpiar cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Singleton
let preciosService: PreciosService | null = null;

export function getPreciosService(): PreciosService {
    if (!preciosService) {
        preciosService = new PreciosService();
    }
    return preciosService;
}
