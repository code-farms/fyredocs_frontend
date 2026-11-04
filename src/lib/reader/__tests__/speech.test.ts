import { describe, expect, it } from 'vitest';
import { languageFor, pickVoice } from '@/lib/reader/speech';

const v = (lang: string, localService = false, isDefault = false) => ({ lang, localService, default: isDefault });

describe('speech helpers', () => {
  it('detects Hindi by Devanagari script', () => {
    expect(languageFor('यह एक परीक्षण है')).toBe('hi');
    expect(languageFor('Rent is due on the 5th.')).toBe('en');
    expect(languageFor('Total राशि 500')).toBe('hi');
  });

  it('prefers a local default voice of the language, then any of it', () => {
    const voices = [v('en-GB'), v('hi-IN', true), v('en-US', true, true), v('hi-IN')];
    expect(pickVoice(voices, 'en')).toEqual(v('en-US', true, true));
    expect(pickVoice(voices, 'hi')).toEqual(v('hi-IN', true));
    expect(pickVoice([v('en-US')], 'hi')).toBeNull();
  });
});
