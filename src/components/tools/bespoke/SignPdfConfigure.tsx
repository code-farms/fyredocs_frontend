import { useState } from 'react';
import { PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { ToolOptions } from '@/types';
import { BespokeConfigureProps } from './types';
import { SignaturePad } from '@/components/common/SignaturePad';

/**
 * Bespoke configure body for Sign PDF: canvas signature pad (draw/upload tabs)
 * plus position/page settings. Lazily imported by the workbench so the canvas
 * code stays out of the main chunk.
 */
const SignPdfConfigure = ({ canSubmit, onSubmit }: BespokeConfigureProps) => {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [page, setPage] = useState('last');
  const [position, setPosition] = useState('br');

  const hasSignature = signatureDataUrl !== null;

  const handleProcess = () => {
    if (!hasSignature || !signatureDataUrl) return;
    onSubmit({
      page: page === 'last' ? -1 : parseInt(page) || 1,
      position,
      signatureData: signatureDataUrl,
    } as ToolOptions);
  };

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <h3 className="flex items-center gap-2 text-h4 font-semibold">
        <PenTool className="h-5 w-5" aria-hidden />
        Signature
      </h3>

      <SignaturePad onChange={setSignatureDataUrl} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="br">Bottom Right</SelectItem>
              <SelectItem value="bl">Bottom Left</SelectItem>
              <SelectItem value="bc">Bottom Center</SelectItem>
              <SelectItem value="tr">Top Right</SelectItem>
              <SelectItem value="tl">Top Left</SelectItem>
              <SelectItem value="tc">Top Center</SelectItem>
              <SelectItem value="c">Center</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sign-page">Page</Label>
          <Input
            id="sign-page"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Page number or 'last'"
          />
          <Text variant="caption" tone="muted">
            Enter a page number or &quot;last&quot; for the last page
          </Text>
        </div>
      </div>

      <Button
        onClick={handleProcess}
        disabled={!hasSignature || !canSubmit}
        variant="gradient"
        className="w-full"
        size="lg"
      >
        <PenTool className="mr-2 h-5 w-5" aria-hidden />
        Sign PDF
      </Button>
    </div>
  );
};

export default SignPdfConfigure;
