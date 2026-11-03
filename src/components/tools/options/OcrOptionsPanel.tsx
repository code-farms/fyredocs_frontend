import { ScanText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';
import { OCR_LANGUAGES } from './schemas';

const DPI_OPTIONS = ['150', '300', '400', '600'];
const DPI_AUTO = 'auto';

export const OcrOptionsPanel = ({ form }: OptionsPanelProps) => {
  const language = (form.watch('language') as string) ?? 'eng';
  const dpi = (form.watch('dpi') as string) || '';

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <h3 className="flex items-center gap-2 text-h4 font-semibold">
        <ScanText className="h-5 w-5" aria-hidden />
        OCR Settings
      </h3>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ocr-language">Document Language</Label>
          <Select
            value={language}
            onValueChange={(value) => form.setValue('language', value, { shouldValidate: true })}
          >
            <SelectTrigger id="ocr-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCR_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Text variant="caption" tone="muted">
            Select the primary language of your document
          </Text>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ocr-dpi">Scan Resolution (DPI)</Label>
          <Select
            value={dpi || DPI_AUTO}
            onValueChange={(value) =>
              form.setValue('dpi', value === DPI_AUTO ? '' : value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="ocr-dpi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DPI_AUTO}>Automatic</SelectItem>
              {DPI_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value} DPI
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Text variant="caption" tone="muted">
            Higher DPI improves accuracy on small text
          </Text>
        </div>
      </div>
    </div>
  );
};
