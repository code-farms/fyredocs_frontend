import { ShieldCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/typography';

/** "Process in browser" switch for the page tools (lib/localTools.ts). */
export const LocalModeToggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4">
    <div className="flex gap-3">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="space-y-0.5">
        <Label htmlFor="local-mode">Process in browser (private, no upload)</Label>
        <Text variant="caption" tone="muted">
          Files stay on this device. The result isn't saved to My Files, and files up to 25 MB are supported.
        </Text>
      </div>
    </div>
    <Switch id="local-mode" checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);
