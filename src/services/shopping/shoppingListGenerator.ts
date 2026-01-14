/**
 * Shopping List Generator Service
 * Generates shopping list from meal plan minus pantry stock
 */

interface MealPlanIngredient {
    name: string;
    quantity: number;
    unit: string;
}

interface PantryItem {
    name: string;
    quantity: number;
    unit: string;
    expiresAt?: Date;
}

interface ShoppingListItem {
    nombre: string;
    cantidad: number;
    unidad: string;
    categoria: 'verduleria' | 'carniceria' | 'almacen' | 'panaderia' | 'lacteos' | 'limpieza' | 'otros';
    dePlanSemanal: boolean;
    recetasQueLoUsan: string[];
}

interface GeneratedShoppingList {
    items: ShoppingListItem[];
    fechaGeneracion: Date;
    rangoFechas: { desde: Date; hasta: Date };
    totalItems: number;
    porCategoria: Record<string, ShoppingListItem[]>;
}

// Mapeo de ingredientes a categorías de supermercado
const CATEGORIAS_MAP: Record<string, ShoppingListItem['categoria']> = {
    // Verdulería
    'tomate': 'verduleria',
    'cebolla': 'verduleria',
    'ajo': 'verduleria',
    'papa': 'verduleria',
    'zanahoria': 'verduleria',
    'lechuga': 'verduleria',
    'perejil': 'verduleria',
    'limón': 'verduleria',
    'pimiento': 'verduleria',
    'zapallo': 'verduleria',
    'manzana': 'verduleria',
    'banana': 'verduleria',
    'naranja': 'verduleria',

    // Carnicería
    'carne': 'carniceria',
    'pollo': 'carniceria',
    'cerdo': 'carniceria',
    'pescado': 'carniceria',
    'milanesa': 'carniceria',
    'asado': 'carniceria',
    'bife': 'carniceria',
    'molida': 'carniceria',
    'chorizo': 'carniceria',

    // Lácteos
    'leche': 'lacteos',
    'queso': 'lacteos',
    'yogur': 'lacteos',
    'manteca': 'lacteos',
    'crema': 'lacteos',
    'huevos': 'lacteos',

    // Panadería
    'pan': 'panaderia',
    'facturas': 'panaderia',
    'medialunas': 'panaderia',
    'galletitas': 'panaderia',

    // Almacén
    'arroz': 'almacen',
    'fideos': 'almacen',
    'aceite': 'almacen',
    'azúcar': 'almacen',
    'harina': 'almacen',
    'sal': 'almacen',
    'yerba': 'almacen',
    'café': 'almacen',
    'té': 'almacen',
    'lata': 'almacen',
    'conserva': 'almacen',
};

export class ShoppingListGenerator {
    /**
     * Detectar categoría de un ingrediente
     */
    private detectarCategoria(nombre: string): ShoppingListItem['categoria'] {
        const nombreLower = nombre.toLowerCase();

        for (const [keyword, categoria] of Object.entries(CATEGORIAS_MAP)) {
            if (nombreLower.includes(keyword)) {
                return categoria;
            }
        }

        return 'otros';
    }

    /**
     * Normalizar unidades para comparación
     */
    private normalizarUnidad(cantidad: number, unidad: string): { cantidad: number; unidad: string } {
        const unidadLower = unidad.toLowerCase();

        // Convertir gramos a kg si es mayor a 1000
        if (unidadLower === 'g' && cantidad >= 1000) {
            return { cantidad: cantidad / 1000, unidad: 'kg' };
        }

        // Convertir ml a L si es mayor a 1000
        if (unidadLower === 'ml' && cantidad >= 1000) {
            return { cantidad: cantidad / 1000, unidad: 'L' };
        }

        return { cantidad, unidad };
    }

    /**
     * Verificar si dos ingredientes son el mismo (fuzzy matching)
     */
    private sonMismoIngrediente(nombre1: string, nombre2: string): boolean {
        const n1 = nombre1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const n2 = nombre2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Coincidencia exacta
        if (n1 === n2) return true;

        // Uno contiene al otro
        if (n1.includes(n2) || n2.includes(n1)) return true;

        return false;
    }

    /**
     * Generar lista de compras desde plan semanal menos despensa
     */
    generateFromPlan(
        mealPlanIngredients: MealPlanIngredient[],
        pantryItems: PantryItem[],
        recipeNames?: string[]
    ): GeneratedShoppingList {
        const itemsMap = new Map<string, ShoppingListItem>();

        // Agregar todos los ingredientes del plan
        for (let i = 0; i < mealPlanIngredients.length; i++) {
            const ingredient = mealPlanIngredients[i];
            const key = ingredient.name.toLowerCase();

            if (itemsMap.has(key)) {
                // Sumar cantidad si ya existe
                const existing = itemsMap.get(key)!;
                existing.cantidad += ingredient.quantity;
                if (recipeNames && recipeNames[i]) {
                    existing.recetasQueLoUsan.push(recipeNames[i]);
                }
            } else {
                const normalizado = this.normalizarUnidad(ingredient.quantity, ingredient.unit);
                itemsMap.set(key, {
                    nombre: ingredient.name,
                    cantidad: normalizado.cantidad,
                    unidad: normalizado.unidad,
                    categoria: this.detectarCategoria(ingredient.name),
                    dePlanSemanal: true,
                    recetasQueLoUsan: recipeNames && recipeNames[i] ? [recipeNames[i]] : [],
                });
            }
        }

        // Restar lo que hay en despensa
        for (const pantryItem of pantryItems) {
            for (const [key, shoppingItem] of itemsMap.entries()) {
                if (this.sonMismoIngrediente(pantryItem.name, shoppingItem.nombre)) {
                    // Restar cantidad de despensa
                    // TODO: Considerar conversión de unidades
                    const cantidadRestante = shoppingItem.cantidad - pantryItem.quantity;

                    if (cantidadRestante <= 0) {
                        // Ya tenemos suficiente en despensa
                        itemsMap.delete(key);
                    } else {
                        shoppingItem.cantidad = cantidadRestante;
                    }
                    break;
                }
            }
        }

        // Convertir a array y agrupar por categoría
        const items = Array.from(itemsMap.values());
        const porCategoria = this.agruparPorCategoria(items);

        const ahora = new Date();
        const finSemana = new Date(ahora);
        finSemana.setDate(finSemana.getDate() + 7);

        return {
            items,
            fechaGeneracion: ahora,
            rangoFechas: { desde: ahora, hasta: finSemana },
            totalItems: items.length,
            porCategoria,
        };
    }

    /**
     * Agrupar items por categoría
     */
    private agruparPorCategoria(items: ShoppingListItem[]): Record<string, ShoppingListItem[]> {
        const grupos: Record<string, ShoppingListItem[]> = {};

        for (const item of items) {
            if (!grupos[item.categoria]) {
                grupos[item.categoria] = [];
            }
            grupos[item.categoria].push(item);
        }

        return grupos;
    }

    /**
     * Formatear cantidad para mostrar
     */
    formatCantidad(cantidad: number, unidad: string): string {
        // Redondear a 1 decimal si es necesario
        const cantidadFormateada = cantidad % 1 === 0
            ? cantidad.toString()
            : cantidad.toFixed(1);

        return `${cantidadFormateada} ${unidad}`;
    }
}

// Singleton
let generator: ShoppingListGenerator | null = null;

export function getShoppingListGenerator(): ShoppingListGenerator {
    if (!generator) {
        generator = new ShoppingListGenerator();
    }
    return generator;
}
