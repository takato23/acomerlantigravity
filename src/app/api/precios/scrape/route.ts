/**
 * POST /api/precios/scrape
 * Server-side price scraping from Preciar.com
 * Runs on server to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    scrapeProductoPreciar,
    scrapeMultiplesProductos,
    type ProductoPreciar
} from '@/services/pricing/preciarScraper';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Por favor esperá un momento.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { producto, productos } = body;

        // Handle single product
        if (producto && typeof producto === 'string') {
            const result = await scrapeProductoPreciar(producto.trim());

            if (!result) {
                return NextResponse.json({
                    success: false,
                    error: 'No se encontraron precios para este producto',
                    data: null,
                });
            }

            return NextResponse.json({
                success: true,
                data: result,
                source: 'preciar.com',
            });
        }

        // Handle multiple products
        if (productos && Array.isArray(productos)) {
            if (productos.length > 10) {
                return NextResponse.json(
                    { error: 'Máximo 10 productos por consulta' },
                    { status: 400 }
                );
            }

            const results = await scrapeMultiplesProductos(productos);
            const data: Record<string, ProductoPreciar | null> = {};

            results.forEach((value, key) => {
                data[key] = value;
            });

            return NextResponse.json({
                success: true,
                data,
                source: 'preciar.com',
                count: results.size,
            });
        }

        return NextResponse.json(
            { error: 'Se requiere "producto" (string) o "productos" (array)' },
            { status: 400 }
        );

    } catch (error) {
        console.error('[API/precios/scrape] Error:', error);
        return NextResponse.json(
            { error: 'Error interno al scrapear precios' },
            { status: 500 }
        );
    }
}

// GET for health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'Preciar.com Price Scraper',
        rateLimit: `${RATE_LIMIT} requests per minute`,
    });
}
