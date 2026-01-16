import { VoiceCommand } from '@/app/api/parse-voice-command/route';
import { logger } from '@/services/logger';

export interface GeminiParseResult {
  commands: VoiceCommand[];
  success: boolean;
  error?: string;
}

export async function parseWithGemini(transcript: string): Promise<GeminiParseResult> {
  try {
    const response = await fetch('/api/parse-voice-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      commands: data.commands || [],
      success: true
    };
  } catch (error: unknown) {
    logger.error('Gemini parsing failed:', 'Lib:geminiVoiceParser', error);
    
    return {
      commands: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Convert Gemini commands to our internal format
export type ShoppingVoiceCommandType = 'add' | 'complete' | 'remove' | 'quantity';

export function convertToShoppingCommands(geminiCommands: VoiceCommand[]) {
  return geminiCommands.map(cmd => {
    const type: ShoppingVoiceCommandType =
      cmd.action === 'add'
        ? 'add'
        : cmd.action === 'complete'
          ? 'complete'
          : cmd.action === 'remove'
            ? 'remove'
            : cmd.action === 'update_quantity'
              ? 'quantity'
              : 'add';

    return {
      type,
      item: cmd.item,
      quantity: cmd.quantity,
      unit: cmd.unit,
      action: cmd.action
    };
  });
}
