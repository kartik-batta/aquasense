import { Language } from '../types';

const SPEECH_LOCALES: Record<Language, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  es: 'es-ES',
  sw: 'sw-KE',
};

/** BCP-47 locale used for speech synthesis and recognition. */
export function speechLocale(language: Language): string {
  return SPEECH_LOCALES[language];
}

/** Removes markdown markup so text-to-speech reads content, not symbols. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\*(.+)\*$/gm, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
