import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAIService } from '@/services/ai';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { preferences, constraints } = body;

    // Use unified AI service
    const aiService = UnifiedAIService.getInstance();

    // Generate meal plan using AI
    const prompt = `
Genera un plan de comidas semanal para una persona en Argentina.
Preferencias: ${JSON.stringify(preferences || {})}
Restricciones: ${JSON.stringify(constraints || {})}

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "success": true,
  "plan": {
    "meals": [
      {
        "day": 1,
        "dayName": "Lunes",
        "breakfast": { "name": "...", "ingredients": ["..."], "prepTime": 10 },
        "lunch": { "name": "...", "ingredients": ["..."], "prepTime": 30 },
        "snack": { "name": "...", "ingredients": ["..."], "prepTime": 15 },
        "dinner": { "name": "...", "ingredients": ["..."], "prepTime": 45 }
      }
    ]
  }
}

Incluye 7 días. Usa comida argentina típica para desayunos, almuerzos, meriendas (snack) y cenas.`;

    const text = await aiService.generateCompletion(prompt, {
      provider: 'gemini',
      temperature: 0.7
    });

    logger.info('Unified AI response received', 'meal-planning/generate-simple');

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const mealPlanRaw = JSON.parse(jsonMatch[0]);

    // Calculate week start (Monday)
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const sourcePlan = mealPlanRaw.plan || mealPlanRaw;
    const mealsArray: any[] = Array.isArray(sourcePlan?.meals) ? sourcePlan.meals : [];

    // Transform to format expected by applyGeneratedPlan
    const transformedMeals = mealsArray.map((dayMeal: any, idx: number) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD format

      // Helper to transform meal to recipe format
      const toRecipe = (meal: any) => {
        if (!meal) return null;
        // Check for common variant spelling/structures
        const title = meal.name || meal.title || meal.nombre || 'Receta sin título';
        const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : (Array.isArray(meal.ingredientes) ? meal.ingredientes : []);

        return {
          id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title,
          description: meal.description || meal.descripcion || `Deliciosa ${title}`,
          ingredients: ingredients.map((ing: any) => ({
            name: typeof ing === 'string' ? ing : (ing.name || ing.nombre || ''),
            quantity: ing.quantity || ing.cantidad || 1,
            unit: ing.unit || ing.unidad || 'unidad',
            category: ing.category || 'other'
          })),
          instructions: Array.isArray(meal.instructions) ? meal.instructions : (Array.isArray(meal.instrucciones) ? meal.instrucciones : []),
          prepTimeMinutes: meal.prepTime || meal.prepTimeMinutes || 15,
          cookTimeMinutes: meal.cookTime || meal.cookTimeMinutes || 30,
          servings: meal.servings || 2,
          difficulty: meal.difficulty || 'medium',
          nutrition: meal.nutrition || {
            calories: 400,
            protein: 20,
            carbs: 50,
            fat: 15
          },
          dietaryRestrictions: meal.dietaryRestrictions || [],
          tags: meal.tags || [],
          cuisine: 'Argentina',
          imageUrl: meal.imageUrl || meal.image || null
        };
      };

      return {
        date: dateStr,
        breakfast: (dayMeal.breakfast || dayMeal.desayuno) ? {
          recipe: toRecipe(dayMeal.breakfast || dayMeal.desayuno),
          confidence: 0.85
        } : null,
        lunch: (dayMeal.lunch || dayMeal.almuerzo) ? {
          recipe: toRecipe(dayMeal.lunch || dayMeal.almuerzo),
          confidence: 0.85
        } : null,
        dinner: (dayMeal.dinner || dayMeal.cena) ? {
          recipe: toRecipe(dayMeal.dinner || dayMeal.cena),
          confidence: 0.85
        } : null,
        snacks: (dayMeal.snack || dayMeal.merienda || dayMeal.snacks) ? [{
          recipe: toRecipe(dayMeal.snack || dayMeal.merienda || (Array.isArray(dayMeal.snacks) ? dayMeal.snacks[0] : dayMeal.snacks)),
          confidence: 0.85
        }] : []
      };
    }).filter((meal: any) => meal.breakfast || meal.lunch || meal.dinner || meal.snacks?.length);

    const normalizedPlan = {
      weekStartDate: monday.toISOString().slice(0, 10),
      meals: transformedMeals
    };

    return NextResponse.json({
      success: true,
      plan: normalizedPlan,
      metadata: {
        confidenceScore: 0.85,
        processingTime: Date.now()
      }
    });

  } catch (error: any) {
    console.error('Error in simple meal planning:', error);

    // Fallback to mock data if API fails (e.g., rate limit)
    console.log('Falling back to mock data for meal planning');

    // Calculate week start (Monday)
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    monday.setDate(monday.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    // Database of Real Argentine Recipes for Fallback
    const ARGENTINE_RECIPES = {
      breakfast: [
        {
          title: "Tostadas con Queso y Mermelada",
          description: "Clásico desayuno argentino con pan tostado, queso crema y mermelada de frutas",
          ingredients: [{ name: "Pan de molde", quantity: 2, unit: "rebanadas" }, { name: "Queso crema", quantity: 30, unit: "g" }, { name: "Mermelada", quantity: 20, unit: "g" }, { name: "Café con leche", quantity: 1, unit: "taza" }],
          instructions: ["Tostar el pan", "Untar con queso crema y mermelada", "Preparar café con leche"],
          prepTimeMinutes: 5, cookTimeMinutes: 2, servings: 1, difficulty: "easy",
          nutrition: { calories: 320, protein: 8, carbs: 45, fat: 12 },
          tags: ["desayuno", "clásico", "rápido"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Yogur con Granola y Frutas",
          description: "Desayuno fresco y nutritivo con yogur natural, granola casera y frutas de estación",
          ingredients: [{ name: "Yogur natural", quantity: 1, unit: "taza" }, { name: "Granola", quantity: 50, unit: "g" }, { name: "Frutillas", quantity: 5, unit: "unidades" }, { name: "Miel", quantity: 1, unit: "cdita" }],
          instructions: ["Servir el yogur en un bowl", "Agregar granola y frutas cortadas", "Endulzar con miel"],
          prepTimeMinutes: 5, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 280, protein: 12, carbs: 40, fat: 8 },
          tags: ["desayuno", "saludable", "fresco"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Medialunas con Café",
          description: "El desayuno más tradicional de Buenos Aires: medialunas de manteca y un buen café",
          ingredients: [{ name: "Medialunas", quantity: 2, unit: "unidades" }, { name: "Café", quantity: 1, unit: "taza" }, { name: "Leche", quantity: 50, unit: "ml" }],
          instructions: ["Calentar las medialunas (opcional)", "Preparar el café", "Disfrutar"],
          prepTimeMinutes: 2, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 450, protein: 6, carbs: 55, fat: 22 },
          tags: ["desayuno", "tradicional", "domingo"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1590623237199-31eac0c25a47?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Huevos Revueltos con Tostada",
          description: "Desayuno proteico para empezar el día con energía",
          ingredients: [{ name: "Huevos", quantity: 2, unit: "unidades" }, { name: "Pan integral", quantity: 1, unit: "rebanada" }, { name: "Aceite de oliva", quantity: 1, unit: "cdita" }],
          instructions: ["Batir huevos ligeramente", "Cocinar en sartén con aceite", "Servir sobre tostada"],
          prepTimeMinutes: 5, cookTimeMinutes: 5, servings: 1, difficulty: "easy",
          nutrition: { calories: 340, protein: 16, carbs: 20, fat: 18 },
          tags: ["desayuno", "proteico", "salado"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414395d8?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Mate con Bizcochitos",
          description: "Infaltable compañero de la mañana argentina",
          ingredients: [{ name: "Yerba Mate", quantity: 50, unit: "g" }, { name: "Bizcochos de grasa", quantity: 50, unit: "g" }, { name: "Agua caliente", quantity: 1, unit: "termo" }],
          instructions: ["Preparar el mate", "Servir con bizcochitos"],
          prepTimeMinutes: 5, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 250, protein: 4, carbs: 30, fat: 12 },
          tags: ["desayuno", "mate", "tradicional"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1517652796336-9aaa90c1f510?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Licuado de Banana y Avena",
          description: "Batido energético ideal para antes de entrenar o mañanas apuradas",
          ingredients: [{ name: "Banana", quantity: 1, unit: "unidad" }, { name: "Leche", quantity: 200, unit: "ml" }, { name: "Avena", quantity: 30, unit: "g" }, { name: "Canela", quantity: 1, unit: "pizca" }],
          instructions: ["Colocar todo en licuadora", "Licuar hasta que esté suave", "Servir frío"],
          prepTimeMinutes: 5, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 300, protein: 10, carbs: 55, fat: 5 },
          tags: ["desayuno", "bebida", "energético"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a9069485?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Tostado de Jamón y Queso",
          description: "El famoso 'Carlitos' o tostado mixto, un clásico de cafetería",
          ingredients: [{ name: "Pan de miga", quantity: 2, unit: "rebanadas" }, { name: "Jamón cocido", quantity: 2, unit: "fetas" }, { name: "Queso tybo", quantity: 2, unit: "fetas" }],
          instructions: ["Armar el sándwich", "Tostar hasta que el queso se derrita"],
          prepTimeMinutes: 5, cookTimeMinutes: 5, servings: 1, difficulty: "easy",
          nutrition: { calories: 380, protein: 18, carbs: 30, fat: 16 },
          tags: ["desayuno", "clásico", "favorito"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=60"
        }
      ],
      lunch: [
        {
          title: "Milanesa con Ensalada Mixta",
          description: "El plato favorito de los argentinos: milanesa al horno o frita con ensalada",
          ingredients: [{ name: "Milanesa de carne", quantity: 1, unit: "unidad" }, { name: "Lechuga", quantity: 50, unit: "g" }, { name: "Tomate", quantity: 1, unit: "unidad" }, { name: "Cebolla", quantity: 0.25, unit: "unidad" }],
          instructions: ["Cocinar milanesa al horno", "Cortar vegetales", "Condimentar ensalada"],
          prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 1, difficulty: "medium",
          nutrition: { calories: 450, protein: 35, carbs: 25, fat: 20 },
          tags: ["almuerzo", "carne", "clásico"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Tarta de Jamón y Queso",
          description: "Tarta casera simple y deliciosa, ideal para viandas",
          ingredients: [{ name: "Masa de tarta", quantity: 1, unit: "porción" }, { name: "Jamón cocido", quantity: 50, unit: "g" }, { name: "Queso mozzarella", quantity: 50, unit: "g" }, { name: "Huevo", quantity: 1, unit: "unidad" }],
          instructions: ["Rellenar masa con jamón, queso y huevo", "Hornear hasta dorar"],
          prepTimeMinutes: 15, cookTimeMinutes: 30, servings: 1, difficulty: "medium",
          nutrition: { calories: 520, protein: 22, carbs: 45, fat: 28 },
          tags: ["almuerzo", "tarta", "fácil"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1574822295663-8832dc0709ae?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Ensalada César con Pollo",
          description: "Fresca, crocante y completa con aderezo cremoso",
          ingredients: [{ name: "Pechuga de pollo", quantity: 150, unit: "g" }, { name: "Lechuga romana", quantity: 100, unit: "g" }, { name: "Crutones", quantity: 30, unit: "g" }, { name: "Aderezo César", quantity: 2, unit: "cdas" }],
          instructions: ["Grillar pollo", "Mezclar lechuga y aderezo", "Agregar pollo y crutones"],
          prepTimeMinutes: 15, cookTimeMinutes: 10, servings: 1, difficulty: "easy",
          nutrition: { calories: 380, protein: 30, carbs: 15, fat: 18 },
          tags: ["almuerzo", "ensalada", "liviano"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Empanadas de Carne",
          description: "El clásico argentino por excelencia, ideal para cualquier momento",
          ingredients: [{ name: "Tapas de empanada", quantity: 3, unit: "unidades" }, { name: "Carne picada", quantity: 100, unit: "g" }, { name: "Cebolla", quantity: 50, unit: "g" }, { name: "Huevo duro", quantity: 0.5, unit: "unidad" }],
          instructions: ["Preparar relleno (pino)", "Armar empanadas", "Hornear o freír"],
          prepTimeMinutes: 40, cookTimeMinutes: 20, servings: 1, difficulty: "medium",
          nutrition: { calories: 600, protein: 25, carbs: 50, fat: 30 },
          tags: ["almuerzo", "tradicional", "finger food"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1678229971037-14e3a479261f?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Wok de Vegetales y Arroz",
          description: "Opción vegetariana rápida y llena de sabor",
          ingredients: [{ name: "Arroz integral", quantity: 60, unit: "g" }, { name: "Zanahoria", quantity: 1, unit: "unidad" }, { name: "Zucchini", quantity: 1, unit: "unidad" }, { name: "Salsa de soja", quantity: 2, unit: "cdas" }],
          instructions: ["Hervir arroz", "Saltear vegetales en wok", "Mezclar con arroz y soja"],
          prepTimeMinutes: 15, cookTimeMinutes: 15, servings: 1, difficulty: "easy",
          nutrition: { calories: 350, protein: 8, carbs: 65, fat: 5 },
          tags: ["almuerzo", "vegetariano", "saludable"], cuisine: "Asiática",
          imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Bife a la Criolla con Puré",
          description: "Bife cocinado en salsa de tomate, cebolla y morrón",
          ingredients: [{ name: "Bife de nalga", quantity: 150, unit: "g" }, { name: "Papas", quantity: 200, unit: "g" }, { name: "Salsa de tomate", quantity: 100, unit: "ml" }, { name: "Cebolla", quantity: 1, unit: "unidad" }],
          instructions: ["Hervir papas para puré", "Cocinar bife en salsa con vegetales", "Servir"],
          prepTimeMinutes: 15, cookTimeMinutes: 25, servings: 1, difficulty: "medium",
          nutrition: { calories: 550, protein: 35, carbs: 40, fat: 22 },
          tags: ["almuerzo", "carne", "invernal"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Sándwich de Pollo y Palta",
          description: "Sándwich fresco y completo, ideal para llevar",
          ingredients: [{ name: "Pan integral", quantity: 2, unit: "rebanadas" }, { name: "Pollo cocido", quantity: 100, unit: "g" }, { name: "Palta (aguacate)", quantity: 0.5, unit: "unidad" }, { name: "Tomate", quantity: 0.5, unit: "unidad" }],
          instructions: ["Desmenuzar pollo", "Pisar palta", "Armar sándwich"],
          prepTimeMinutes: 10, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 420, protein: 28, carbs: 35, fat: 18 },
          tags: ["almuerzo", "rápido", "frío"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=500&q=60"
        }
      ],
      snacks: [
        {
          title: "Fruta Fresca",
          description: "La opción más simple y saludable: manzana, banana o pera",
          ingredients: [{ name: "Manzana", quantity: 1, unit: "unidad" }],
          instructions: ["Lavar", "Comer"],
          prepTimeMinutes: 1, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 80, protein: 0, carbs: 20, fat: 0 },
          tags: ["merienda", "snack", "saludable"], cuisine: "Natural",
          imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Yogur con Cereales",
          description: "Merienda clásica para media tarde",
          ingredients: [{ name: "Yogur bebible", quantity: 1, unit: "taza" }, { name: "Cereales sin azúcar", quantity: 30, unit: "g" }],
          instructions: ["Mezclar y disfrutar"],
          prepTimeMinutes: 1, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 180, protein: 8, carbs: 30, fat: 2 },
          tags: ["merienda", "rápido", "calcio"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1511690656952-34342d57a290?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Tostada con Dulce de Leche",
          description: "El gusto permitido de la tarde argentina",
          ingredients: [{ name: "Pan", quantity: 1, unit: "rebanada" }, { name: "Dulce de leche", quantity: 1, unit: "cda" }],
          instructions: ["Tostar pan", "Untar generosamente con dulce de leche"],
          prepTimeMinutes: 3, cookTimeMinutes: 2, servings: 1, difficulty: "easy",
          nutrition: { calories: 200, protein: 3, carbs: 35, fat: 4 },
          tags: ["merienda", "dulce", "argentino"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Puñado de Frutos Secos",
          description: "Energía concentrada y grasas saludables",
          ingredients: [{ name: "Nueces", quantity: 10, unit: "g" }, { name: "Almendras", quantity: 10, unit: "g" }, { name: "Pasas", quantity: 10, unit: "g" }],
          instructions: ["Servir porción"],
          prepTimeMinutes: 1, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 160, protein: 5, carbs: 8, fat: 14 },
          tags: ["merienda", "snack", "keto"], cuisine: "Natural",
          imageUrl: "https://images.unsplash.com/photo-1536553531422-777e4cb524f7?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Licuado de Durazno",
          description: "Refrescante batido de fruta natural con agua o leche",
          ingredients: [{ name: "Durazno", quantity: 1, unit: "unidad" }, { name: "Agua fría", quantity: 200, unit: "ml" }, { name: "Hielo", quantity: 3, unit: "cubitos" }],
          instructions: ["Licuar todo", "Servir bien frío"],
          prepTimeMinutes: 5, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 60, protein: 1, carbs: 14, fat: 0 },
          tags: ["merienda", "bebida", "verano"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1623817160756-3dd941a8fa6a?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Alfajor de Maicena",
          description: "Clásico alfajor casero relleno de dulce de leche y coco",
          ingredients: [{ name: "Alfajor de maicena", quantity: 1, unit: "unidad" }, { name: "Té o Café", quantity: 1, unit: "taza" }],
          instructions: ["Comer acompañado de una infusión"],
          prepTimeMinutes: 0, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 280, protein: 3, carbs: 45, fat: 10 },
          tags: ["merienda", "dulce", "tradicional"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1615486511484-92e1017d2e05?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Té con Galletitas",
          description: "Merienda liviana y digestiva",
          ingredients: [{ name: "Té", quantity: 1, unit: "taza" }, { name: "Galletitas de agua", quantity: 5, unit: "unidades" }, { name: "Mermelada light", quantity: 1, unit: "cda" }],
          instructions: ["Preparar té", "Servir galletitas"],
          prepTimeMinutes: 5, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 150, protein: 2, carbs: 32, fat: 2 },
          tags: ["merienda", "liviano", "rápido"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=60"
        }
      ],
      dinner: [
        {
          title: "Pollo al Horno con Papas",
          description: "Cena familiar reconfortante y saludable",
          ingredients: [{ name: "Pata muslo", quantity: 1, unit: "unidad" }, { name: "Papas", quantity: 150, unit: "g" }, { name: "Limón", quantity: 0.5, unit: "unidad" }, { name: "Romero", quantity: 1, unit: "rama" }],
          instructions: ["Condimentar pollo y papas", "Hornear a 200°C por 45 min", "Servir"],
          prepTimeMinutes: 10, cookTimeMinutes: 45, servings: 1, difficulty: "easy",
          nutrition: { calories: 480, protein: 32, carbs: 30, fat: 24 },
          tags: ["cena", "pollo", "familiar"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Tortilla de Papas",
          description: "Clásica tortilla española adaptada al paladar argentino",
          ingredients: [{ name: "Papas", quantity: 200, unit: "g" }, { name: "Huevos", quantity: 2, unit: "unidades" }, { name: "Cebolla", quantity: 0.5, unit: "unidad" }, { name: "Aceite", quantity: 2, unit: "cdas" }],
          instructions: ["Freír o dorar papas y cebolla", "Mezclar con huevo batido", "Cocinar en sartén vuelta y vuelta"],
          prepTimeMinutes: 20, cookTimeMinutes: 15, servings: 1, difficulty: "medium",
          nutrition: { calories: 420, protein: 14, carbs: 35, fat: 25 },
          tags: ["cena", "vegetariano", "huevo"], cuisine: "Española/Argentina",
          imageUrl: "https://images.unsplash.com/photo-1613564834361-9436948817d1?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Pizzetas Caseras",
          description: "Cena divertida para el fin de semana",
          ingredients: [{ name: "Pre-pizzas chicas", quantity: 2, unit: "unidades" }, { name: "Salsa de tomate", quantity: 2, unit: "cdas" }, { name: "Queso mozzarella", quantity: 50, unit: "g" }, { name: "Orégano", quantity: 1, unit: "pizca" }],
          instructions: ["Poner salsa y queso", "Gratinar en horno", "Servir"],
          prepTimeMinutes: 5, cookTimeMinutes: 10, servings: 1, difficulty: "easy",
          nutrition: { calories: 550, protein: 18, carbs: 60, fat: 22 },
          tags: ["cena", "permitido", "fin de semana"], cuisine: "Italiana/Argentina",
          imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Sopa de Verduras",
          description: "Cena ultra liviana y nutritiva para días fríos",
          ingredients: [{ name: "Zapallo", quantity: 100, unit: "g" }, { name: "Zanahoria", quantity: 1, unit: "unidad" }, { name: "Acelga", quantity: 50, unit: "g" }, { name: "Caldo", quantity: 500, unit: "ml" }],
          instructions: ["Hervir todos los vegetales en caldo", "Procesar o servir en trozos", "Servir caliente"],
          prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 1, difficulty: "easy",
          nutrition: { calories: 150, protein: 4, carbs: 25, fat: 2 },
          tags: ["cena", "liviano", "vegana"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1547592166-23acbe346499?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Fideos con Manteca y Queso",
          description: "La cena salvadora cuando hay poco tiempo (y ganas)",
          ingredients: [{ name: "Fideos", quantity: 80, unit: "g" }, { name: "Manteca", quantity: 10, unit: "g" }, { name: "Queso rallado", quantity: 20, unit: "g" }],
          instructions: ["Hervir pasta", "Colar y agregar manteca y queso"],
          prepTimeMinutes: 2, cookTimeMinutes: 10, servings: 1, difficulty: "easy",
          nutrition: { calories: 400, protein: 12, carbs: 65, fat: 12 },
          tags: ["cena", "rápido", "pasta"], cuisine: "Italiana",
          imageUrl: "https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Pastel de Papas",
          description: "Confort food argentino: carne picada abajo, puré arriba",
          ingredients: [{ name: "Carne picada", quantity: 100, unit: "g" }, { name: "Papas para puré", quantity: 200, unit: "g" }, { name: "Cebolla y morrón", quantity: 50, unit: "g" }, { name: "Queso para gratinar", quantity: 20, unit: "g" }],
          instructions: ["Hacer relleno de carne", "Hacer puré", "Armar capas y hornear"],
          prepTimeMinutes: 30, cookTimeMinutes: 30, servings: 1, difficulty: "medium",
          nutrition: { calories: 580, protein: 28, carbs: 45, fat: 30 },
          tags: ["cena", "tradicional", "calórico"], cuisine: "Argentina",
          imageUrl: "https://images.unsplash.com/photo-1628198934503-45bb29e06184?auto=format&fit=crop&w=500&q=60"
        },
        {
          title: "Ensalada de Atún",
          description: "Cena proteica y rápida sin cocción",
          ingredients: [{ name: "Atún al natural", quantity: 1, unit: "lata" }, { name: "Huevo duro", quantity: 1, unit: "unidad" }, { name: "Tomate", quantity: 1, unit: "unidad" }, { name: "Arroz frío (opcional)", quantity: 30, unit: "g" }],
          instructions: ["Mezclar todos los ingredientes", "Condimentar a gusto"],
          prepTimeMinutes: 10, cookTimeMinutes: 0, servings: 1, difficulty: "easy",
          nutrition: { calories: 350, protein: 35, carbs: 10, fat: 12 },
          tags: ["cena", "proteica", "rápido"], cuisine: "Internacional",
          imageUrl: "https://images.unsplash.com/photo-1633504381503-34ac1255e269?auto=format&fit=crop&w=500&q=60"
        }
      ]
    };

    const mockMeals = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dayName, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      const dateStr = date.toISOString().slice(0, 10);

      // Helper to transform real recipes into the expected format
      const getRecipeForDay = (type: 'breakfast' | 'lunch' | 'snacks' | 'dinner', dayIdx: number) => {
        const recipes = ARGENTINE_RECIPES[type];
        const recipe = recipes[dayIdx % recipes.length]; // Cycle through recipes if more days than recipes

        return {
          id: `fallback-${type}-${dayIdx}-${Date.now()}`,
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          nutrition: recipe.nutrition,
          dietaryRestrictions: [],
          tags: recipe.tags,
          cuisine: recipe.cuisine,
          imageUrl: recipe.imageUrl
        };
      };

      return {
        date: dateStr,
        breakfast: { recipe: getRecipeForDay('breakfast', idx), confidence: 0.95 },
        lunch: { recipe: getRecipeForDay('lunch', idx), confidence: 0.95 },
        snacks: [{ recipe: getRecipeForDay('snacks', idx), confidence: 0.95 }],
        dinner: { recipe: getRecipeForDay('dinner', idx), confidence: 0.95 }
      };
    });

    return NextResponse.json({
      success: true,
      plan: {
        weekStartDate: monday.toISOString().slice(0, 10),
        meals: mockMeals
      },
      metadata: {
        confidenceScore: 1.0,
        processingTime: Date.now(),
        isMock: true
      }
    });
  }
}