import { Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { RATES } from '@/lib/reader/speech';
import type { ReadAloudStatus } from '@/hooks/useReadAloud';

interface ReadAloudBarProps {
  status: ReadAloudStatus;
  page: number | null;
  rate: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRate: (rate: number) => void;
}

export const ReadAloudBar = ({ status, page, rate, onPause, onResume, onStop, onRate }: ReadAloudBarProps) => (
  <div role="region" aria-label="Read aloud" className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
    {status === 'paused' ? (
      <Button variant="ghost" size="icon" onClick={onResume} aria-label="Resume reading">
        <Play aria-hidden />
      </Button>
    ) : (
      <Button variant="ghost" size="icon" onClick={onPause} aria-label="Pause reading">
        <Pause aria-hidden />
      </Button>
    )}
    <Button variant="ghost" size="icon" onClick={onStop} aria-label="Stop reading">
      <Square aria-hidden />
    </Button>
    <Text variant="body-sm" tone="muted" as="span" aria-live="polite" className="flex-1">
      {page ? `${status === 'paused' ? 'Paused on' : 'Reading'} page ${page}` : 'Starting…'}
    </Text>
    <Select value={String(rate)} onValueChange={(v) => onRate(Number(v))}>
      <SelectTrigger className="h-8 w-24" aria-label="Reading speed">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RATES.map((r) => (
          <SelectItem key={r} value={String(r)}>
            {r}×
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
