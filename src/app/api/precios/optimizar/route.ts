/**
 * GET /api/precios/optimizar
 * POST /api/precios/optimizar
 * Sugerir dónde comprar cada cosa para minimizar gasto total
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPreciosService } from '@/services/pricing/preciosService';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const itemsParam = searchParams.get('items');

        if (!itemsParam) {
            return NextResponse.json(
                { error: 'El parámetro "items" es requerido' },
                { status: 400 }
            );
        }

        const items = itemsParam.split(',').map(item => ({ nombre: item.trim() })).filter(i => i.nombre);

        if (items.length === 0) {
            return NextResponse.json(
                { error: 'Debe proporcionar al menos un producto' },
                { status: 400 }
            );
        }

        const preciosService = getPreciosService();
        const optimizacion = await preciosService.optimizarCompra(items);

        return NextResponse.json({
            success: true,
            data: optimizacion,
        });
    } catch (error) {
        console.error('Error optimizando compra:', error);
        return NextResponse.json(
            { error: 'Error interno al optimizar compra' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'El campo "items" es requerido y debe ser un array' },
                { status: 400 }
            );
        }

        // Normalizar items
        const itemsNormalizados = items.map(item => {
            if (typeof item === 'string') {
                return { nombre: item, cantidad: 1 };
            }
            return {
                nombre: item.nombre || item.name || '',
                cantidad: item.cantidad || item.quantity || 1,
            };
        }).filter(i => i.nombre);

        const preciosService = getPreciosService();
        const optimizacion = await preciosService.optimizarCompra(itemsNormalizados);

        return NextResponse.json({
            success: true,
            data: optimizacion,
        });
    } catch (error) {
        console.error('Error optimizando compra:', error);
        return NextResponse.json(
            { error: 'Error interno al optimizar compra' },
            { status: 500 }
        );
    }
}
