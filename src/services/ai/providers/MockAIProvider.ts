import {
    AIProviderInterface
} from './AIProviderInterface';
import {
    AITextRequest,
    AITextResponse,
    AIImageRequest,
    AIStreamResponse,
    AIServiceConfig
} from '../types';

export class MockAIProvider implements AIProviderInterface {
    name = 'mock';

    async generateText(request: AITextRequest, _config: AIServiceConfig): Promise<AITextResponse> {
        console.log('[MockAIProvider] Generating text for prompt:', request.prompt);

        let data = 'Esta es una respuesta mock del servicio de IA.';

        if (request.format === 'json') {
            if (request.prompt.toLowerCase().includes('recipe') || request.prompt.toLowerCase().includes('receta')) {
                data = JSON.stringify({
                    id: 'mock-recipe-id',
                    name: 'Receta Mock de Prueba',
                    description: 'Una deliciosa receta generada de forma local.',
                    ingredients: [
                        { name: 'Ingrediente 1', amount: 100, unit: 'g' },
                        { name: 'Ingrediente 2', amount: 2, unit: 'unidades' }
                    ],
                    instructions: ['Paso 1: Preparar los ingredientes', 'Paso 2: Cocinar', 'Paso 3: Servir'],
                    prepTime: 10,
                    cookTime: 20,
                    servings: 2,
                    difficulty: 'Fácil',
                    nutritionalInfo: { calories: 350, protein: 20, carbs: 40, fat: 10 }
                });
            } else if (request.prompt.toLowerCase().includes('meal plan') || request.prompt.toLowerCase().includes('plan de comidas')) {
                data = JSON.stringify({
                    id: 'mock-plan-id',
                    name: 'Plan Semanal Mock',
                    days: [
                        {
                            day: 1,
                            meals: [
                                { type: 'Desayuno', recipeName: 'Huevos con tostadas' },
                                { type: 'Almuerzo', recipeName: 'Ensalada Cesar' },
                                { type: 'Cena', recipeName: 'Sopa de verduras' }
                            ]
                        }
                    ]
                });
            } else {
                data = JSON.stringify({ success: true, message: 'Respuesta JSON mock' });
            }
        }

        return {
            data,
            provider: 'mock',
            model: 'mock-model',
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        };
    }

    async streamText(_request: AITextRequest, _config: AIServiceConfig): Promise<AIStreamResponse> {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                const text = 'Esta es una respuesta en streaming mock...';
                controller.enqueue(encoder.encode(text));
                controller.close();
            }
        });

        return {
            stream,
            provider: 'mock',
            model: 'mock-model'
        };
    }

    async analyzeImage(request: AIImageRequest, _config: AIServiceConfig): Promise<AITextResponse> {
        return {
            data: 'En la imagen se ve un ticket de compra con varios artículos de supermercado.',
            provider: 'mock',
            model: 'mock-model'
        };
    }

    getCapabilities() {
        return {
            textGeneration: true,
            imageAnalysis: true,
            streaming: true,
            functionCalling: false,
            maxTokens: 4096
        };
    }
}
