// NOTE: ported from fyredocs_app/src/lib/ai/flashcardDeck.ts — keep in sync.
/**
 * Flashcard review state (Phase 23 §2). PURE. A round walks the deck in
 * order; cards marked "again" form the next round, so a review ends only
 * when every card has been known once. No spaced-repetition scheduling —
 * that needs persisted per-card history this minimal screen deliberately
 * doesn't keep.
 */

import type { Flashcard } from './parse';

export interface DeckState {
  /** Card indices in this round, in order. */
  round: number[];
  pos: number;
  /** Indices marked "again" during this round. */
  again: number[];
  roundNumber: number;
  knownTotal: number;
}

export const startDeck = (cards: Flashcard[]): DeckState => ({
  round: cards.map((_, i) => i),
  pos: 0,
  again: [],
  roundNumber: 1,
  knownTotal: 0,
});

export const currentCard = (s: DeckState): number | null => (s.pos < s.round.length ? s.round[s.pos] : null);

export const answer = (s: DeckState, known: boolean): DeckState => {
  const card = currentCard(s);
  if (card === null) return s;
  return {
    ...s,
    pos: s.pos + 1,
    again: known ? s.again : [...s.again, card],
    knownTotal: known ? s.knownTotal + 1 : s.knownTotal,
  };
};

export const roundDone = (s: DeckState): boolean => s.pos >= s.round.length;

export const deckDone = (s: DeckState): boolean => roundDone(s) && s.again.length === 0;

/** Next round over the cards marked "again". */
export const nextRound = (s: DeckState): DeckState => ({
  round: s.again,
  pos: 0,
  again: [],
  roundNumber: s.roundNumber + 1,
  knownTotal: s.knownTotal,
});
