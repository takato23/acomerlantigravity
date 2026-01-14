/**
 * GET /api/precios/comparar
 * Comparar precios de múltiples productos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPreciosService } from '@/services/pricing/preciosService';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const itemsParam = searchParams.get('items');

        if (!itemsParam) {
            return NextResponse.json(
                { error: 'El parámetro "items" es requerido (ej: ?items=arroz,yerba,leche)' },
                { status: 400 }
            );
        }

        const items = itemsParam.split(',').map(item => item.trim()).filter(Boolean);

        if (items.length === 0) {
            return NextResponse.json(
                { error: 'Debe proporcionar al menos un producto' },
                { status: 400 }
            );
        }

        const preciosService = getPreciosService();
        const comparaciones = await preciosService.compararLista(items);

        // Calcular estadísticas generales
        const estadisticas = {
            totalItems: items.length,
            mejorSupermercadoGlobal: calcularMejorSupermercadoGlobal(comparaciones),
            ahorroTotalPosible: comparaciones.reduce((sum, c) => sum + c.ahorroMaximo, 0),
        };

        return NextResponse.json({
            success: true,
            data: {
                comparaciones,
                estadisticas,
            },
        });
    } catch (error) {
        console.error('Error comparando precios:', error);
        return NextResponse.json(
            { error: 'Error interno al comparar precios' },
            { status: 500 }
        );
    }
}

function calcularMejorSupermercadoGlobal(comparaciones: any[]): string {
    const conteo: Record<string, number> = {};

    for (const comp of comparaciones) {
        if (comp.mejorPrecio?.supermercado) {
            conteo[comp.mejorPrecio.supermercado] = (conteo[comp.mejorPrecio.supermercado] || 0) + 1;
        }
    }

    const mejor = Object.entries(conteo).sort(([, a], [, b]) => b - a)[0];
    return mejor?.[0] || 'dia';
}
