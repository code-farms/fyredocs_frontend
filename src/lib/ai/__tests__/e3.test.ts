// NOTE: ported from fyredocs_app/src/lib/ai/__tests__/e3.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
/// <reference types="jest" />
import { checkCost, estimateRun, formatTokens, LARGE_RUN_TOKENS, OUTPUT_CAP_TOKENS } from './../cost';
import { answer, currentCard, deckDone, nextRound, roundDone, startDeck } from './../flashcardDeck';
import { splitTranslation, translationForDisplay, translationToStoredText } from './../translation';

const cards = [
  { front: 'a', back: '1' },
  { front: 'b', back: '2' },
  { front: 'c', back: '3' },
];

describe('flashcard deck', () => {
  it('walks a round, then re-reviews only the cards marked again', () => {
    let s = startDeck(cards);
    s = answer(s, true);
    s = answer(s, false);
    s = answer(s, true);
    expect(roundDone(s)).toBe(true);
    expect(deckDone(s)).toBe(false);
    s = nextRound(s);
    expect(s.roundNumber).toBe(2);
    expect(currentCard(s)).toBe(1);
    s = answer(s, true);
    expect(deckDone(s)).toBe(true);
    expect(s.knownTotal).toBe(3);
  });

  it('ignores answers past the end', () => {
    const s = answer(answer(startDeck([cards[0]]), true), false);
    expect(s.again).toEqual([]);
  });
});

describe('translation pages', () => {
  const out = 'Intro line\n<<page 1>>\nUno\n\n<< Page 2 >>\nDos';

  it('splits on markers, keeping any leading text', () => {
    expect(splitTranslation(out)).toEqual([
      { page: null, text: 'Intro line' },
      { page: 1, text: 'Uno' },
      { page: 2, text: 'Dos' },
    ]);
  });

  it('treats marker-less output as one page, honestly', () => {
    expect(splitTranslation('Just text')).toEqual([{ page: null, text: 'Just text' }]);
    expect(splitTranslation('  ')).toEqual([]);
  });

  it('stores pages form-feed separated and displays headings', () => {
    expect(translationToStoredText('<<page 1>>\nUno\n<<page 2>>\nDos')).toBe('Uno\fDos');
    expect(translationForDisplay('<<page 3>>\nTres')).toBe('Page 3\nTres');
  });
});

describe('cost check', () => {
  const quota = { remainingTokens: 50_000, limitTokens: 300_000, resetsAt: '2026-12-01T00:00:00Z' };

  it('estimates input plus the output cap per call', () => {
    expect(estimateRun([{ op: 'notes', pages: [{ index: 0, text: 'x'.repeat(388) }] }])).toBe(100 + OUTPUT_CAP_TOKENS);
  });

  it('runs small requests straight away', () => {
    expect(checkCost(5000, quota)).toEqual({ kind: 'ok', estimate: 5000 });
  });

  it('confirms large or multi-call runs', () => {
    expect(checkCost(LARGE_RUN_TOKENS + 1, quota).kind).toBe('confirm');
    expect(checkCost(1000, quota, 3).kind).toBe('confirm');
  });

  it('blocks a run the ledger would refuse, with the reset date', () => {
    expect(checkCost(60_000, quota)).toEqual({ kind: 'insufficient', estimate: 60_000, remaining: 50_000, resetsAt: quota.resetsAt });
  });

  it('never blocks on an unknown quota', () => {
    expect(checkCost(60_000, null).kind).toBe('confirm');
  });

  it('formats tokens for humans', () => {
    expect([formatTokens(850), formatTokens(12_400), formatTokens(5_000_000)]).toEqual(['850', '12k', '5.0M']);
  });
});
