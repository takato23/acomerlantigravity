/**
 * Mock Data for Gemini Services
 * Used when no API key is present
 */

export const MOCK_MEAL_PLAN = {
    daily_plans: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        meals: {
            breakfast: {
                name: "Tostadas con Palta y Huevo",
                ingredients: ["Pan integral", "Palta", "Huevo", "Sal", "Pimienta"],
                prep_time: 10,
                cook_time: 5,
                servings: 2,
                difficulty: "easy",
                nutrition: {
                    calories: 350,
                    protein: 15,
                    carbs: 30,
                    fat: 20
                },
                instructions: ["Tostar el pan", "Pisar la palta", "Hacer huevo revuelto", "Servir todo junto"]
            },
            lunch: {
                name: "Ensalada César con Pollo",
                ingredients: ["Lechuga", "Pollo", "Crutones", "Queso Parmesano", "Aderezo César"],
                prep_time: 15,
                cook_time: 15,
                servings: 2,
                difficulty: "easy",
                nutrition: {
                    calories: 450,
                    protein: 35,
                    carbs: 20,
                    fat: 25
                }
            },
            dinner: {
                name: "Milanesas con Puré",
                ingredients: ["Carne para milanesa", "Pan rallado", "Huevo", "Papa", "Leche", "Manteca"],
                prep_time: 30,
                cook_time: 30,
                servings: 4,
                difficulty: "medium",
                nutrition: {
                    calories: 600,
                    protein: 40,
                    carbs: 50,
                    fat: 25
                }
            }
        }
    })),
    shopping_list_preview: [
        { item: "Pan integral", quantity: "1", unit: "paquete" },
        { item: "Palta", quantity: "2", unit: "unidades" },
        { item: "Huevos", quantity: "6", unit: "unidades" },
        { item: "Pollo", quantity: "500", unit: "gramos" }
    ],
    nutritional_analysis: {
        average_daily_calories: 2000,
        protein_grams: 100,
        carbs_grams: 200,
        fat_grams: 70
    },
    optimization_summary: {
        total_estimated_cost: 15000,
        prep_time_total_minutes: 120,
        variety_score: 8
    }
};

export const MOCK_RECEIPT_DATA = {
    store_name: "Supermercado Mock",
    date: new Date().toISOString(),
    total: 12500.50,
    raw_text: "MOCK RECEIPT TEXT",
    items: [
        {
            name: "Leche Descremada",
            quantity: 2,
            unit: "litros",
            price: 1500,
            confidence: 0.95,
            raw_text: "LECHE DESC 2L"
        },
        {
            name: "Arroz Gallo Oro",
            quantity: 1,
            unit: "kg",
            price: 2500,
            confidence: 0.98,
            raw_text: "ARROZ GALLO ORO 1KG"
        }
    ]
};

export const MOCK_SHOPPING_LIST = {
    categories: [
        {
            name: "Verdulería",
            items: [
                { name: "Palta", quantity: 2, unit: "unidades", estimatedCost: 2000, notes: "Maduras para hoy" },
                { name: "Lechuga", quantity: 1, unit: "planta", estimatedCost: 1500 },
                { name: "Papa", quantity: 1, unit: "kg", estimatedCost: 1200 }
            ],
            categoryTotal: 4700
        },
        {
            name: "Carnicería",
            items: [
                { name: "Carne para milanesa", quantity: 1, unit: "kg", estimatedCost: 8500 },
                { name: "Pollo", quantity: 0.5, unit: "kg", estimatedCost: 3000 }
            ],
            categoryTotal: 11500
        },
        {
            name: "Almacén",
            items: [
                { name: "Pan integral", quantity: 1, unit: "paquete", estimatedCost: 2500 },
                { name: "Huevos", quantity: 6, unit: "unidades", estimatedCost: 1800 },
                { name: "Pan rallado", quantity: 500, unit: "g", estimatedCost: 1200 }
            ],
            categoryTotal: 5500
        }
    ],
    totalEstimatedCost: 21700,
    savingTips: ["Compra la papa en bolsa grande si consumes mucho", "El pollo entero es más barato que pechuga sola"],
    alternativeSuggestions: {
        "Palta": "Usar aceite de oliva si están muy caras"
    }
};
