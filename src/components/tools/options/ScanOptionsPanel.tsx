import { Scan } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCollapse } from '@/components/ui/animated';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';
import { OCR_LANGUAGES } from './schemas';

export const ScanOptionsPanel = ({ form }: OptionsPanelProps) => {
  const ocrEnabled = Boolean(form.watch('ocr'));
  const language = (form.watch('language') as string) ?? 'eng';

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <Scan className="h-5 w-5 text-category-organize" aria-hidden />
        Scan Settings
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="ocr-toggle">Enable OCR</Label>
            <Text variant="caption" tone="muted">
              Make text in scanned images searchable
            </Text>
          </div>
          <Switch
            id="ocr-toggle"
            checked={ocrEnabled}
            onCheckedChange={(checked) => form.setValue('ocr', checked, { shouldValidate: true })}
          />
        </div>

        <AnimatedCollapse show={ocrEnabled}>
          <div className="space-y-2">
            <Label htmlFor="scan-language">Document Language</Label>
            <Select
              value={language}
              onValueChange={(value) => form.setValue('language', value, { shouldValidate: true })}
            >
              <SelectTrigger id="scan-language" className="max-w-xs">
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
              Select the primary language of your documents
            </Text>
          </div>
        </AnimatedCollapse>
      </div>
    </div>
  );
};
