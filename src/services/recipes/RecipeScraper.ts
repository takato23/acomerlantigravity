import { getGeminiService } from '../ai/GeminiService';
import type { Recipe, RecipeIngredient, RecipeInstruction, RecipeCategory, DifficultyLevel } from '@/types/recipes';
import type { Ingredient } from '@/types/pantry';
import { logger } from '@/services/logger';

export interface RecipeSource {
  url: string;
  name: string;
  selector?: string;
}

export interface ScrapedRecipe extends Recipe {
  sourceUrl: string;
  sourceName: string;
  imageUrl?: string;
  videoUrl?: string;
  rating?: number;
  reviews?: number;
}

/**
 * Scraper de Recetas con adaptación automática
 */
export class RecipeScraper {
  private geminiService;
  
  // Fuentes de recetas populares en Argentina
  private readonly RECIPE_SOURCES: RecipeSource[] = [
    { url: 'https://www.paulinacocina.net', name: 'Paulina Cocina' },
    { url: 'https://www.recetasgratis.net', name: 'Recetas Gratis' },
    { url: 'https://cookpad.com/ar', name: 'Cookpad Argentina' },
    { url: 'https://www.recetasdeargentina.com.ar', name: 'Recetas de Argentina' }
  ];
  
  constructor() {
    this.geminiService = getGeminiService();
  }
  
  /**
   * Buscar recetas basadas en ingredientes disponibles
   */
  async searchRecipesByIngredients(
    ingredients: string[],
    preferences?: {
      dietaryRestrictions?: string[];
      cuisineType?: string;
      maxCookingTime?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
    }
  ): Promise<ScrapedRecipe[]> {
    try {

      // Por ahora generar recetas con IA basadas en ingredientes
      const recipes = await this.generateRecipesWithAI(ingredients, preferences);
      
      return recipes;
      
    } catch (error: unknown) {
      logger.error('Error buscando recetas:', 'RecipeScraper', error);
      return [];
    }
  }
  
  /**
   * Scrape receta desde URL
   */
  async scrapeRecipeFromUrl(url: string): Promise<ScrapedRecipe | null> {
    try {

      // TODO: Implementar scraping real con fetch y parsing
      // Por ahora usar IA para extraer información
      
      const mockRecipe = await this.extractRecipeWithAI(url);
      return mockRecipe;
      
    } catch (error: unknown) {
      logger.error('Error scrapeando receta:', 'RecipeScraper', error);
      return null;
    }
  }
  
  /**
   * Adaptar receta a preferencias del usuario
   */
  async adaptRecipeToPreferences(
    recipe: Recipe,
    preferences: {
      servings?: number;
      dietaryRestrictions?: string[];
      allergies?: string[];
      dislikedIngredients?: string[];
      skillLevel?: number;
    }
  ): Promise<Recipe> {
    try {

      // 1. Ajustar porciones
      if (preferences.servings && preferences.servings !== recipe.servings) {
        recipe = this.adjustServings(recipe, preferences.servings);
      }
      
      // 2. Sustituir ingredientes problemáticos
      if (preferences.allergies || preferences.dislikedIngredients || preferences.dietaryRestrictions) {
        recipe = await this.substituteIngredients(recipe, preferences);
      }
      
      // 3. Simplificar según nivel de habilidad
      if (preferences.skillLevel && preferences.skillLevel <= 2) {
        recipe = await this.simplifyRecipe(recipe);
      }
      
      return recipe;
      
    } catch (error: unknown) {
      logger.error('Error adaptando receta:', 'RecipeScraper', error);
      return recipe;
    }
  }
  
  /**
   * Generar recetas con IA basadas en ingredientes
   */
  private async generateRecipesWithAI(
    ingredients: string[],
    preferences?: any
  ): Promise<ScrapedRecipe[]> {
    try {
      const prompt = `
        Genera 5 recetas argentinas/latinoamericanas usando estos ingredientes:
        ${ingredients.join(', ')}
        
        ${preferences?.dietaryRestrictions ? `Restricciones: ${preferences.dietaryRestrictions.join(', ')}` : ''}
        ${preferences?.maxCookingTime ? `Tiempo máximo: ${preferences.maxCookingTime} minutos` : ''}
        ${preferences?.difficulty ? `Dificultad: ${preferences.difficulty}` : ''}
        
        Para cada receta incluye:
        - Nombre atractivo
        - Descripción breve
        - Lista completa de ingredientes con cantidades
        - Instrucciones paso a paso
        - Tiempo de preparación y cocción
        - Dificultad
        - Información nutricional aproximada
        - Tags relevantes
        
        Responde con un JSON array de recetas.
      `;
      
      // Por ahora retornar recetas mock
      return this.getMockRecipes(ingredients);
      
    } catch (error: unknown) {
      logger.error('Error generando recetas con IA:', 'RecipeScraper', error);
      return this.getMockRecipes(ingredients);
    }
  }
  
  /**
   * Extraer receta de URL con IA
   */
  private async extractRecipeWithAI(url: string): Promise<ScrapedRecipe> {
    // Mock implementation
    return this.buildMockRecipe({
      id: 'scraped-1',
      name: 'Receta Scrapeada',
      description: 'Receta obtenida de ' + url,
      ingredients: [{ name: 'Ingrediente 1', quantity: 1, unit: 'unidad' }],
      instructions: ['Paso 1', 'Paso 2'],
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'medium',
      tags: ['scrapeada'],
      category: 'cena',
      sourceUrl: url,
      sourceName: new URL(url).hostname
    });
  }
  
  /**
   * Ajustar porciones de receta
   */
  private adjustServings(recipe: Recipe, newServings: number): Recipe {
    const ratio = newServings / recipe.servings;
    
    return {
      ...recipe,
      servings: newServings,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        quantity: Math.round(ing.quantity * ratio * 10) / 10
      }))
    };
  }
  
  /**
   * Sustituir ingredientes problemáticos
   */
  private async substituteIngredients(
    recipe: Recipe,
    preferences: any
  ): Promise<Recipe> {
    const allRestrictions = [
      ...(preferences.allergies || []),
      ...(preferences.dislikedIngredients || []),
      ...(preferences.dietaryRestrictions || [])
    ];
    
    const substitutions = this.getCommonSubstitutions();
    const updatedIngredients = recipe.ingredients.map(ing => {
      const ingredientName = ing.ingredient?.name ?? ing.ingredient_id;
      // Verificar si el ingrediente tiene restricciones
      const hasRestriction = allRestrictions.some(
        r => ingredientName.toLowerCase().includes(r.toLowerCase())
      );
      
      if (hasRestriction) {
        // Buscar sustitución
        const substitute = substitutions[ingredientName.toLowerCase()];
        if (substitute) {
          return {
            ...ing,
            ingredient_id: substitute,
            ingredient: ing.ingredient
              ? {
                  ...ing.ingredient,
                  name: substitute,
                  normalized_name: substitute.toLowerCase()
                }
              : ing.ingredient,
            notes: `Sustituido por ${substitute}`
          };
        }
      }
      
      return ing;
    });
    
    return {
      ...recipe,
      ingredients: updatedIngredients
    };
  }
  
  /**
   * Simplificar receta para principiantes
   */
  private async simplifyRecipe(recipe: Recipe): Promise<Recipe> {
    return {
      ...recipe,
      difficulty: 'facil'
    };
  }
  
  /**
   * Obtener sustituciones comunes
   */
  private getCommonSubstitutions(): Record<string, string> {
    return {
      'leche': 'leche de almendras',
      'manteca': 'aceite de coco',
      'huevo': 'sustituto de huevo',
      'harina': 'harina sin gluten',
      'crema': 'crema de coco',
      'queso': 'queso vegano',
      'carne': 'proteína vegetal',
      'pollo': 'tofu',
      'pescado': 'tempeh'
    };
  }
  
  /**
   * Recetas mock para desarrollo
   */
  private getMockRecipes(ingredients: string[]): ScrapedRecipe[] {
    const baseRecipes = [
      this.buildMockRecipe({
        id: 'mock-1',
        name: 'Milanesas a la Napolitana',
        description: 'Clásicas milanesas argentinas con jamón, queso y salsa',
        ingredients: [
          { name: 'Milanesas', quantity: 4, unit: 'unidad' },
          { name: 'Jamón', quantity: 200, unit: 'g' },
          { name: 'Queso', quantity: 200, unit: 'g' },
          { name: 'Salsa de tomate', quantity: 500, unit: 'ml' }
        ],
        instructions: [
          'Freír las milanesas hasta dorar',
          'Colocar jamón y queso sobre cada milanesa',
          'Cubrir con salsa de tomate',
          'Gratinar en el horno 10 minutos'
        ],
        prepTime: 15,
        cookTime: 25,
        servings: 4,
        difficulty: 'easy',
        tags: ['argentina', 'clásico', 'horno'],
        category: 'cena',
        sourceUrl: 'https://ejemplo.com/milanesas',
        sourceName: 'Recetas Argentinas',
        rating: 4.8,
        reviews: 234
      }),
      this.buildMockRecipe({
        id: 'mock-2',
        name: 'Empanadas de Carne',
        description: 'Empanadas jugosas al horno con el mejor relleno',
        ingredients: [
          { name: 'Carne picada', quantity: 500, unit: 'g' },
          { name: 'Cebolla', quantity: 2, unit: 'unidad' },
          { name: 'Huevo duro', quantity: 2, unit: 'unidad' },
          { name: 'Tapas de empanada', quantity: 12, unit: 'unidad' }
        ],
        instructions: [
          'Rehogar la cebolla hasta transparentar',
          'Agregar la carne y cocinar',
          'Condimentar y dejar enfriar',
          'Rellenar las empanadas y cerrar con repulgue',
          'Hornear 20 minutos a 200°C'
        ],
        prepTime: 45,
        cookTime: 20,
        servings: 12,
        difficulty: 'medium',
        tags: ['argentina', 'horno', 'tradicional'],
        category: 'almuerzo',
        sourceUrl: 'https://ejemplo.com/empanadas',
        sourceName: 'Cocina Criolla',
        rating: 4.9,
        reviews: 567
      }),
      this.buildMockRecipe({
        id: 'mock-3',
        name: 'Locro Criollo',
        description: 'Guiso tradicional perfecto para días fríos',
        ingredients: [
          { name: 'Maíz blanco', quantity: 300, unit: 'g' },
          { name: 'Porotos', quantity: 200, unit: 'g' },
          { name: 'Zapallo', quantity: 300, unit: 'g' },
          { name: 'Carne de cerdo', quantity: 400, unit: 'g' },
          { name: 'Chorizo', quantity: 2, unit: 'unidad' }
        ],
        instructions: [
          'Remojar maíz y porotos la noche anterior',
          'Hervir con la carne hasta tiernizar',
          'Agregar zapallo y chorizo',
          'Cocinar a fuego lento 2 horas',
          'Servir con salsa picante'
        ],
        prepTime: 30,
        cookTime: 180,
        servings: 8,
        difficulty: 'medium',
        tags: ['argentina', 'invierno', 'tradicional'],
        category: 'cena',
        sourceUrl: 'https://ejemplo.com/locro',
        sourceName: 'Sabores Patrios',
        rating: 4.7,
        reviews: 189
      })
    ];
    
    // Filtrar recetas que contengan algún ingrediente disponible
    return baseRecipes.filter(recipe => 
      recipe.ingredients.some(ing => 
        ingredients.some(available => 
          (ing.ingredient?.name ?? ing.ingredient_id)
            .toLowerCase()
            .includes(available.toLowerCase())
        )
      )
    );
  }

  private buildMockRecipe(data: {
    id: string;
    name: string;
    description: string;
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
    instructions: string[];
    prepTime: number;
    cookTime: number;
    servings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    category: RecipeCategory;
    sourceUrl: string;
    sourceName: string;
    rating?: number;
    reviews?: number;
  }): ScrapedRecipe {
    const now = new Date();
    const totalTime = data.prepTime + data.cookTime;
    const recipeId = data.id;
    const difficulty = this.mapDifficulty(data.difficulty);

    return {
      id: recipeId,
      name: data.name,
      description: data.description,
      ingredients: data.ingredients.map((ingredient, index) =>
        this.buildMockIngredient(recipeId, ingredient, index)
      ),
      instructions: data.instructions.map((instruction, index) =>
        this.buildMockInstruction(recipeId, instruction, index)
      ),
      cook_time: data.cookTime,
      prep_time: data.prepTime,
      total_time: totalTime,
      servings: data.servings,
      difficulty,
      cuisine_type: 'argentina',
      category: data.category,
      tags: data.tags,
      dietary_info: this.getDefaultDietaryInfo(),
      ai_generated: true,
      source: {
        type: 'imported',
        url: data.sourceUrl
      },
      created_by: 'system',
      rating: data.rating,
      rating_count: data.reviews,
      created_at: now,
      updated_at: now,
      sourceUrl: data.sourceUrl,
      sourceName: data.sourceName,
      reviews: data.reviews
    };
  }

  private buildMockIngredient(
    recipeId: string,
    ingredient: { name: string; quantity: number; unit: string },
    index: number
  ): RecipeIngredient {
    const now = new Date();
    const normalizedName = ingredient.name.toLowerCase();
    const ingredientId = `${recipeId}-ingredient-${index + 1}`;
    const ingredientData: Ingredient = {
      id: ingredientId,
      name: ingredient.name,
      normalized_name: normalizedName,
      category: 'otros',
      common_names: [ingredient.name],
      default_unit: ingredient.unit,
      created_at: now,
      updated_at: now
    };

    return {
      id: ingredientId,
      recipe_id: recipeId,
      ingredient_id: ingredientId,
      ingredient: ingredientData,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      optional: false,
      order: index + 1
    };
  }

  private buildMockInstruction(
    recipeId: string,
    instruction: string,
    index: number
  ): RecipeInstruction {
    return {
      id: `${recipeId}-instruction-${index + 1}`,
      recipe_id: recipeId,
      step_number: index + 1,
      instruction
    };
  }

  private mapDifficulty(difficulty: 'easy' | 'medium' | 'hard'): DifficultyLevel {
    switch (difficulty) {
      case 'easy':
        return 'facil';
      case 'hard':
        return 'dificil';
      case 'medium':
      default:
        return 'intermedio';
    }
  }

  private getDefaultDietaryInfo(): Recipe['dietary_info'] {
    return {
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      dairy_free: false,
      nut_free: false,
      low_carb: false,
      keto: false,
      paleo: false,
      allergies: []
    };
  }
}

// Singleton
let recipeScraper: RecipeScraper | null = null;

export function getRecipeScraper(): RecipeScraper {
  if (!recipeScraper) {
    recipeScraper = new RecipeScraper();
  }
  return recipeScraper;
}
