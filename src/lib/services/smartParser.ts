import { GoogleGenerativeAI } from '@google/generative-ai';
import { defaultGeminiConfig, getGeminiApiKey, isMockMode } from '@/lib/config/gemini.config';
import { logger } from '@/services/logger';

export interface SmartParsedItem {
    name: string;
    quantity: number;
    unit: string;
    confidence: number;
    category?: string;
    estimatedExpiryDays?: number;
}

class SmartParserService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any;

    constructor() {
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            if (!isMockMode()) {
                console.warn('SmartParser: No API Key found, will use mock or fail.');
            }
        }

        // Initialize even if mock mode might be active, but rely on checks inside methods
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: defaultGeminiConfig.model });
        }
    }

    async parseIngredient(text: string): Promise<SmartParsedItem | null> {
        if (isMockMode() || !this.model) {
            // Simple mock fallback for testing without API
            if (text.toLowerCase().includes('docena')) {
                return { name: 'Huevos', quantity: 12, unit: 'un', confidence: 0.9, category: 'Lácteos y Huevos', estimatedExpiryDays: 21 };
            }
            return {
                name: text,
                quantity: 1,
                unit: 'un',
                confidence: 0.5,
                category: 'Otros',
                estimatedExpiryDays: 7
            };
        }

        try {
            const prompt = `
        Parse the following text into a structured grocery item.
        Text: "${text}"
        
        Rules:
        - "docena" = 12
        - "media docena" = 6
        - Normalize units to: kg, g, l, ml, un, paq.
        - Predict the category (e.g., Frutas, Carnes, Lácteos).
        - Estimate shelf life in days (e.g., Fresh Fish = 2, Rice = 365).
        
        Return JSON ONLY:
        {
          "name": "normalized name",
          "quantity": number,
          "unit": "string",
          "category": "string",
          "estimatedExpiryDays": number,
          "confidence": number (0-1)
        }
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const jsonStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr) as SmartParsedItem;
        } catch (error) {
            logger.error('SmartParser error:', 'parseIngredient', error);
            return null;
        }
    }
    async suggestRecipes(ingredients: string[]): Promise<any[]> {
        if (isMockMode() || !this.model) {
            return [
                { title: 'Omelette de Queso', ingredients: ['Huevos', 'Queso'] },
                { title: 'Ensalada César', ingredients: ['Pollo', 'Lechuga', 'Crutones'] }
            ];
        }

        try {
            const prompt = `
                Suggest 3 simple recipes I can make with these ingredients: ${ingredients.join(', ')}.
                Assume I have basic staples (oil, salt, etc).
                
                Return JSON ONLY:
                [
                    { "title": "Recipe Name", "ingredients": ["List", "of", "main", "ingredients"] }
                ]
             `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const jsonStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            logger.error('SmartParser error:', 'suggestRecipes', error);
            return [];
        }
    }
}

export const smartParser = new SmartParserService();
