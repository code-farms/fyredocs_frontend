import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import type { Flashcard } from '@/lib/ai/parse';
import { answer, currentCard, deckDone, nextRound, roundDone, startDeck } from '@/lib/ai/flashcardDeck';

export interface FlashcardsState {
  title: string;
  cards: Flashcard[];
}

/**
 * Minimal flashcard review (the app's app/ai/flashcards.tsx): tap to flip,
 * Know / Again, then re-review the "again" pile until every card is known.
 * The deck arrives in router state — kilobytes don't belong in a URL — so a
 * reload lands on the "no deck" message instead of a broken review. The flip
 * is an instant swap, which reads the same with reduced motion and to a
 * screen reader.
 */
const FlashcardsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const deck = location.state as FlashcardsState | null;
  const [state, setState] = useState(() => (deck?.cards.length ? startDeck(deck.cards) : null));
  const [flipped, setFlipped] = useState(false);

  const head = (
    <Helmet>
      <title>Flashcards — Fyredocs</title>
    </Helmet>
  );

  if (!deck || !state) {
    return (
      <div className="container max-w-xl py-16 text-center">
        {head}
        <Heading level="h2" className="mb-2">
          No flashcards to review
        </Heading>
        <Text tone="muted" className="mb-6">
          Generate flashcards from a PDF in the reader's AI assistant, then open them here.
        </Text>
        <Button asChild>
          <Link to="/reader">Open the reader</Link>
        </Button>
      </div>
    );
  }

  const idx = currentCard(state);
  const card = idx !== null ? deck.cards[idx] : null;

  const mark = (known: boolean) => {
    setState((s) => (s ? answer(s, known) : s));
    setFlipped(false);
  };

  return (
    <div className="container max-w-xl py-10">
      {head}
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft aria-hidden />
        Back
      </Button>
      <Heading level="h3" className="mb-1">
        {deck.title}
      </Heading>
      <Text variant="body-sm" tone="muted" className="mb-6">
        Round {state.roundNumber} · {state.knownTotal} of {deck.cards.length} known
      </Text>

      {deckDone(state) ? (
        <div className="space-y-4 rounded-xl border bg-card p-8 text-center">
          <Check className="mx-auto h-8 w-8 text-success" aria-hidden />
          <Text>All {deck.cards.length} cards known.</Text>
          <Button
            variant="outline"
            onClick={() => {
              setState(startDeck(deck.cards));
              setFlipped(false);
            }}
          >
            <RotateCcw aria-hidden />
            Review again
          </Button>
        </div>
      ) : roundDone(state) ? (
        <div className="space-y-4 rounded-xl border bg-card p-8 text-center">
          <Text>{state.again.length} card{state.again.length === 1 ? '' : 's'} to go over again.</Text>
          <Button onClick={() => setState((s) => (s ? nextRound(s) : s))}>Next round</Button>
        </div>
      ) : card ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? 'Show question' : 'Show answer'}
            className="flex min-h-[14rem] w-full flex-col items-center justify-center gap-2 rounded-xl border bg-card p-8 text-center hover:bg-muted/50"
          >
            <Text variant="overline" tone="muted" as="span">
              {flipped ? 'Answer' : 'Question'} · {state.pos + 1}/{state.round.length}
            </Text>
            <Text variant="body-lg" as="span" className="whitespace-pre-wrap">
              {flipped ? card.back : card.front}
            </Text>
          </button>
          {flipped ? (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => mark(false)}>
                Again
              </Button>
              <Button onClick={() => mark(true)}>Know it</Button>
            </div>
          ) : (
            <Text variant="caption" tone="muted" className="text-center">
              Click the card to see the answer.
            </Text>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default FlashcardsPage;
