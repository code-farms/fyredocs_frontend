/**
 * Browser text-to-speech helpers for read-aloud (the web side of the app's
 * Phase 13). speechSynthesis is feature-detected: where it's missing the
 * reader hides the control instead of showing a broken one.
 */

/**
 * Utterance length cap. Chrome silently stops long utterances after ~15 s, so
 * sentences are split well below that (chunkForSpeech prefers clause breaks).
 */
export const SPEECH_CHUNK_CHARS = 200;

export const RATES = [0.75, 1, 1.25, 1.5, 2] as const;

export const speechSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function';

/** Devanagari script → Hindi voice; anything else → English. Our OCR scope is eng/hin. */
export const languageFor = (text: string): 'hi' | 'en' => (/[ऀ-ॿ]/.test(text) ? 'hi' : 'en');

/**
 * Best voice for `lang`: a local (offline) voice of that language first, then
 * any voice of it, else null (the browser default speaks it as best it can).
 */
export const pickVoice = (
  voices: Pick<SpeechSynthesisVoice, 'lang' | 'localService' | 'default'>[],
  lang: 'hi' | 'en'
) => {
  const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
  return (
    matching.find((v) => v.localService && v.default) ??
    matching.find((v) => v.localService) ??
    matching[0] ??
    null
  );
};
