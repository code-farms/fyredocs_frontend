import { useState } from 'react';
import { Copy, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Text } from '@/components/ui/typography';
import { useAiOp } from '@/hooks/useAiOp';
import { buildAiRequest } from '@/lib/ai/request';
import { toast } from '@/lib/toast';

/** Server limit for a rewrite passage (ai-service internal/ops maxPassageChars). */
const MAX_PASSAGE = 20000;

/**
 * "Simplify text" (the app's RewriteSheet). The passage is pasted and sent
 * WITHOUT the document: it stands alone, and the document as context would
 * cost far more than the rewrite itself.
 */
export const RewriteDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const ai = useAiOp();
  const [passage, setPassage] = useState('');
  const running = ai.state.status === 'running';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) ai.reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Simplify text</DialogTitle>
          <DialogDescription>Paste a passage to rewrite in plain language. Only the passage is sent.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={passage}
          onChange={(e) => setPassage(e.target.value)}
          placeholder="Paste a passage…"
          aria-label="Passage to simplify"
          maxLength={MAX_PASSAGE}
          disabled={running}
          rows={6}
        />
        <Button disabled={!passage.trim() || running} onClick={() => void ai.run(buildAiRequest('rewrite', [], { passage }))}>
          <Wand2 aria-hidden />
          {running ? 'Simplifying…' : 'Simplify'}
        </Button>
        {ai.state.text && (
          <div className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-body-sm" aria-live="polite">
            {ai.state.text}
          </div>
        )}
        {ai.state.status === 'error' && <Text variant="body-sm" className="text-destructive">{ai.state.error}</Text>}
        {ai.state.status === 'done' && ai.state.text && (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              void navigator.clipboard.writeText(ai.state.text).then(
                () => toast.success('Copied to clipboard'),
                () => toast.error("Couldn't copy the text.")
              )
            }
          >
            <Copy aria-hidden />
            Copy
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
