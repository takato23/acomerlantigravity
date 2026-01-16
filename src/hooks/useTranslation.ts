export type Translator = (key: string) => string;

export function useTranslation(_namespace?: string): { t: Translator } {
  const t: Translator = (key) => key;
  return { t };
}
