import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { OptionsPanelProps } from './types';
import { ConvertInfoPanel } from './ConvertInfoPanel';

type PptMode = 'editable' | 'image';

const PPT_MODES: Array<{
  value: PptMode;
  label: string;
  summary: string;
  description: string;
}> = [
  {
    value: 'editable',
    label: 'Editable text',
    summary: 'Recommended',
    description:
      'Text becomes text boxes you can edit. The layout can shift slightly and missing fonts are replaced. Scanned pages and Hindi or other Indian-language text come out as image slides.',
  },
  {
    value: 'image',
    label: 'Exact look',
    summary: 'Image slides',
    description:
      'Each page becomes a picture on its slide — looks exactly like the PDF, but the text cannot be edited.',
  },
];

/** PDF → PowerPoint mode: editable text boxes (default) or exact-look image slides. */
export const PptModeOptionsPanel = (props: OptionsPanelProps) => {
  const { form } = props;
  const mode = (form.watch('mode') as PptMode) ?? 'editable';

  return (
    <div className="space-y-4">
      {/* Keeps the "Converting to .PPTX" strip every convert tool shows. */}
      <ConvertInfoPanel {...props} />
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Slide type</h3>

        <RadioGroup
          value={mode}
          onValueChange={(value) =>
            form.setValue('mode', value as PptMode, { shouldValidate: true })
          }
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {PPT_MODES.map((m) => (
            <div key={m.value}>
              <RadioGroupItem
                value={m.value}
                id={`ppt-mode-${m.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`ppt-mode-${m.value}`}
                className={cn(
                  'flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition-colors',
                  'hover:border-primary/50',
                  'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
                )}
              >
                <span className="mb-1 font-medium">{m.label}</span>
                <span className="text-center text-caption text-muted-foreground">
                  {m.summary}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Text variant="body-sm" tone="muted" className="mt-4 text-center">
          {PPT_MODES.find((m) => m.value === mode)?.description}
        </Text>
      </div>
    </div>
  );
};
