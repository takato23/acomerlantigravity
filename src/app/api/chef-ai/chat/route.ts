import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Check for API key with multiple possible env var names
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

if (!apiKey) {
    console.error('[Chef AI] No API key configured. Set GOOGLE_GEMINI_API_KEY in .env.local');
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChefChatRequest {
    message: string;
    history?: ChatMessage[];
    currentPlan?: {
        startDate: string;
        endDate: string;
        meals: Array<{
            day: string;
            mealType: string;
            recipeName: string;
        }>;
    };
    userPreferences?: {
        dietaryRestrictions?: string[];
        householdSize?: number;
    };
}

export async function POST(request: NextRequest) {
    // BUG #2 Fix: Check API key availability first
    if (!apiKey) {
        console.error('[Chef AI] API request failed - no API key');
        return NextResponse.json(
            {
                error: 'Chef IA no disponible en este momento. Contacta al administrador.',
                code: 'NO_API_KEY'
            },
            { status: 503 }
        );
    }

    try {
        const body: ChefChatRequest = await request.json();
        const { message, history = [], currentPlan, userPreferences } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Se requiere un mensaje' },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Build context from current plan
        let planContext = '';
        if (currentPlan?.meals?.length) {
            planContext = `\n\nPLAN ACTUAL DEL USUARIO:\n`;
            const mealsByDay = currentPlan.meals.reduce((acc, meal) => {
                if (!acc[meal.day]) acc[meal.day] = [];
                acc[meal.day].push(`${meal.mealType}: ${meal.recipeName}`);
                return acc;
            }, {} as Record<string, string[]>);

            Object.entries(mealsByDay).forEach(([day, meals]) => {
                planContext += `${day}:\n`;
                meals.forEach(m => planContext += `  - ${m}\n`);
            });
        }

        // Build preferences context
        let prefsContext = '';
        if (userPreferences) {
            prefsContext = '\n\nPREFERENCIAS DEL USUARIO:\n';
            if (userPreferences.householdSize) {
                prefsContext += `- Personas en casa: ${userPreferences.householdSize}\n`;
            }
            if (userPreferences.dietaryRestrictions?.length) {
                prefsContext += `- Restricciones: ${userPreferences.dietaryRestrictions.join(', ')}\n`;
            }
        }

        // Build conversation history
        const conversationHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const systemPrompt = `Sos un chef argentino amigable y experto llamado "Chef IA". Ayudás a los usuarios con:
- Sugerencias de recetas argentinas
- Modificaciones a su plan de comidas semanal
- Consejos de cocina y técnicas
- Sustituciones de ingredientes
- Ideas para aprovechar lo que tienen en la heladera

Reglas:
- Respondé siempre en español argentino casual pero profesional
- Usá "vos" en lugar de "tú"
- Sé conciso pero útil
- Si el usuario quiere modificar su plan, sugerí cambios específicos
- Incluí emojis cuando sea apropiado para hacer la conversación más amigable
- Si te piden una receta, dala en formato simple con ingredientes y pasos

${planContext}${prefsContext}

Responde al usuario de manera conversacional y útil.`;

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: '¡Hola! Soy tu Chef IA 👨‍🍳 ¿En qué te puedo ayudar hoy con tu plan de comidas?' }]
                },
                ...conversationHistory
            ],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            }
        });

        // BUG #2 Fix: Add 10 second timeout for Gemini API call
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini timeout')), 10000)
        );

        const result = await Promise.race([
            chat.sendMessage(message),
            timeoutPromise
        ]);

        const response = await result.response;
        const text = response.text();

        // Check if the response includes plan modification suggestions
        const suggestsPlanChange = text.toLowerCase().includes('cambiar') ||
            text.toLowerCase().includes('agregar') ||
            text.toLowerCase().includes('reemplazar') ||
            text.toLowerCase().includes('quitar');

        return NextResponse.json({
            success: true,
            message: text,
            suggestsPlanChange,
        });
    } catch (error) {
        console.error('[Chef AI] Error:', error);

        // Check if it's a timeout error
        const isTimeout = error instanceof Error && error.message.includes('timeout');

        if (isTimeout) {
            return NextResponse.json(
                { error: 'Chef IA está pensando... intenta de nuevo en unos segundos.' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: 'Perdón, tuve un problema técnico. Intenta de nuevo.' },
            { status: 500 }
        );
    }
}
