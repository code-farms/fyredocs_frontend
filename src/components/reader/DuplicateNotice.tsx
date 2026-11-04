import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import type { DuplicateMatches } from '@/lib/documentsApi';
import { readerHref } from '@/lib/reader/reader';

/**
 * "Same file as …" / "Looks like a re-scan of …" (the app's DuplicateNotice,
 * Phase 23 §3): exact matches win; a text-only match is called a re-scan.
 * Renders nothing without a match.
 */
export const DuplicateNotice = ({ matches, orgId }: { matches: DuplicateMatches; orgId?: string }) => {
  const [dismissed, setDismissed] = useState(false);
  const exact = matches.exact[0];
  const near = matches.near[0];
  const target = exact ?? near;
  if (dismissed || !target) return null;
  const others = (exact ? matches.exact.length : matches.near.length) - 1;

  return (
    <div role="status" className="flex items-center gap-3 border-b bg-info-subtle px-4 py-2 text-info-subtle-foreground">
      <Copy className="h-4 w-4 shrink-0" aria-hidden />
      <Text variant="body-sm" as="span" className="min-w-0 flex-1 truncate">
        {exact ? 'Same file as' : 'Looks like a re-scan of'} “{target.name}”
        {others > 0 ? ` and ${others} more` : ''}
      </Text>
      <Button variant="outline" size="sm" asChild>
        <Link to={readerHref({ kind: 'doc', id: target.id, ...(orgId ? { orgId } : {}) })}>Open</Link>
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDismissed(true)} aria-label="Dismiss duplicate notice">
        <X aria-hidden />
      </Button>
    </div>
  );
};
