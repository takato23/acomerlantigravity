/**
 * POST /api/precios/buscar
 * Buscar precios de un producto en múltiples supermercados
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPreciosService } from '@/services/pricing/preciosService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { producto, cantidad = 1 } = body;

        if (!producto || typeof producto !== 'string') {
            return NextResponse.json(
                { error: 'El campo "producto" es requerido y debe ser un texto' },
                { status: 400 }
            );
        }

        const preciosService = getPreciosService();
        const resultado = await preciosService.buscarPrecios(producto.trim(), cantidad);

        return NextResponse.json({
            success: true,
            data: resultado,
        });
    } catch (error) {
        console.error('Error buscando precios:', error);
        return NextResponse.json(
            { error: 'Error interno al buscar precios' },
            { status: 500 }
        );
    }
}
