import { Scan } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCollapse } from '@/components/ui/animated';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';
import { OCR_LANGUAGES, SCAN_CLEANUP, SCAN_PAGE_SIZES } from './schemas';

export const ScanOptionsPanel = ({ form }: OptionsPanelProps) => {
  const ocrEnabled = Boolean(form.watch('ocr'));
  const language = (form.watch('language') as string) ?? 'eng';
  const pageSize = (form.watch('pageSize') as string) ?? 'auto';

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <Scan className="h-5 w-5 text-category-organize" aria-hidden />
        Scan Settings
      </h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="scan-page-size">Page size</Label>
          <Select
            value={pageSize}
            onValueChange={(value) => form.setValue('pageSize', value, { shouldValidate: true })}
          >
            <SelectTrigger id="scan-page-size" className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCAN_PAGE_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="space-y-0.5">
            <p className="font-medium">Clean-up</p>
            <Text variant="caption" tone="muted">
              Applies to every image and runs while the PDF is built.
            </Text>
          </div>
          {SCAN_CLEANUP.map(({ field, label }) => (
            <div key={field} className="flex items-center justify-between gap-4">
              <Label htmlFor={`scan-${field}`}>{label}</Label>
              <Switch
                id={`scan-${field}`}
                checked={Boolean(form.watch(field))}
                onCheckedChange={(checked) => form.setValue(field, checked, { shouldValidate: true })}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
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
