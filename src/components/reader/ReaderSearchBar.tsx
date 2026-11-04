import { useEffect, useRef } from 'react';
import { CaseSensitive, ChevronDown, ChevronUp, WholeWord, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Text } from '@/components/ui/typography';
import type { DocSearchState } from '@/hooks/useDocSearch';

interface ReaderSearchBarProps {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  state: DocSearchState;
  pageCount: number;
  /** 0-based index of the selected match. */
  current: number;
  onQuery: (q: string) => void;
  onCaseSensitive: (v: boolean) => void;
  onWholeWord: (v: boolean) => void;
  onStep: (dir: 1 | -1) => void;
  onClose: () => void;
}

const statusText = (state: DocSearchState, current: number, pageCount: number, hasQuery: boolean) => {
  if (!hasQuery) return '';
  if (state.status === 'searching' && state.total === 0) return `Searching… ${state.scanned}/${pageCount}`;
  if (state.total === 0) return state.status === 'done' ? 'No matches' : 'Searching…';
  const pages = state.hits.length;
  const more = state.status === 'searching' ? '+' : '';
  return `${current + 1} of ${state.total}${more} · ${pages} ${pages === 1 ? 'page' : 'pages'}`;
};

export const ReaderSearchBar = ({
  query,
  caseSensitive,
  wholeWord,
  state,
  pageCount,
  current,
  onQuery,
  onCaseSensitive,
  onWholeWord,
  onStep,
  onClose,
}: ReaderSearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  const canStep = state.total > 0;

  return (
    <div role="search" className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
      <Input
        ref={inputRef}
        aria-label="Search in document"
        placeholder="Search in document"
        className="h-8 min-w-0 flex-1 sm:max-w-xs"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canStep) onStep(e.shiftKey ? -1 : 1);
          if (e.key === 'Escape') onClose();
        }}
      />
      <Toggle size="sm" pressed={caseSensitive} onPressedChange={onCaseSensitive} aria-label="Match case">
        <CaseSensitive aria-hidden />
      </Toggle>
      <Toggle size="sm" pressed={wholeWord} onPressedChange={onWholeWord} aria-label="Whole words">
        <WholeWord aria-hidden />
      </Toggle>
      <Text variant="body-sm" tone="muted" as="span" aria-live="polite" className="min-w-[8rem] tabular-nums">
        {statusText(state, current, pageCount, query.trim().length > 0)}
      </Text>
      <Button variant="ghost" size="icon" disabled={!canStep} onClick={() => onStep(-1)} aria-label="Previous match">
        <ChevronUp aria-hidden />
      </Button>
      <Button variant="ghost" size="icon" disabled={!canStep} onClick={() => onStep(1)} aria-label="Next match">
        <ChevronDown aria-hidden />
      </Button>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close search">
        <X aria-hidden />
      </Button>
    </div>
  );
};
