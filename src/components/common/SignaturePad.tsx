import { useCallback, useRef, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';

/**
 * Draw-or-upload signature capture (shared by Sign PDF and the reader's
 * annotate signature tool). Reports a data URL, or null while empty.
 */
export const SignaturePad = ({
  onChange,
  idPrefix = 'signature',
}: {
  onChange: (dataUrl: string | null) => void;
  /** Distinct ids when two pads could share a page. */
  idPrefix?: string;
}) => {
  const [signatureDataUrl, setSignatureDataUrlState] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  // Stable setter (the drawing handlers are memoised) that always calls the latest onChange.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const setSignatureDataUrl = useCallback((url: string | null) => {
    setSignatureDataUrlState(url);
    onChangeRef.current(url);
  }, []);

  // Map a pointer event to canvas *buffer* coordinates. The canvas has a fixed
  // 500x200 drawing buffer but is stretched by CSS (w-full), so display pixels
  // must be scaled by buffer/displayed size — otherwise the drawn line is offset
  // from the cursor and strokes can land outside the buffer (and get lost).
  const getCanvasPoint = (
    canvas: HTMLCanvasElement,
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // True when the canvas has no drawn (non-transparent) pixels.
  const isCanvasBlank = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return false; // any non-transparent alpha
    }
    return true;
  };

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const { x, y } = getCanvasPoint(canvas, e);
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(canvas, e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const endDraw = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Only capture a real signature — a stray click leaves the canvas blank.
    setSignatureDataUrl(isCanvasBlank(canvas) ? null : canvas.toDataURL('image/png'));
  }, [setSignatureDataUrl]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
      <Tabs defaultValue="draw">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw">Draw Signature</TabsTrigger>
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-4">
          <div className="relative rounded-lg border bg-white">
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            Clear
          </Button>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor={`${idPrefix}-upload`} className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-md border px-4 py-2 transition-colors hover:bg-muted">
                <Upload className="h-4 w-4" aria-hidden />
                Choose image
              </div>
            </Label>
            <input
              id={`${idPrefix}-upload`}
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              className="hidden"
            />
            {signatureFile && (
              <Text variant="body-sm" tone="muted" as="span">
                {signatureFile.name}
              </Text>
            )}
          </div>
          {signatureDataUrl && (
            <div className="rounded-lg border bg-white p-4">
              <img src={signatureDataUrl} alt="Signature" className="mx-auto max-h-32" />
            </div>
          )}
        </TabsContent>
      </Tabs>
  );
};
