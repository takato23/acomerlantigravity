import { smartParser, type SmartParsedItem } from '@/lib/services/smartParser';

export type ParsedIngredient = SmartParsedItem;

export class SmartParser {
  constructor(private language: string = 'es') {
    this.language = language;
  }

  async parseIngredient(text: string): Promise<ParsedIngredient | null> {
    return smartParser.parseIngredient(text);
  }

  async parseIngredients(text: string): Promise<ParsedIngredient[]> {
    const parts = text
      .split(/,| y | and /i)
      .map((part) => part.trim())
      .filter(Boolean);

    const results = await Promise.all(
      parts.map((part) => this.parseIngredient(part))
    );

    return results.filter((item): item is ParsedIngredient => Boolean(item));
  }
}
