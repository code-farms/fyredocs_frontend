import { Check, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
  PLAN_TIERS,
  PlanLimits,
  PlanTierId,
  formatFileSize,
  formatRetention,
} from './planContent';

interface PlanComparisonTableProps {
  /** Resolved (live or fallback) limits per tier, keyed by tier id. */
  limits: Record<PlanTierId, PlanLimits>;
  className?: string;
}

type RowValue = string | boolean;

interface ComparisonRow {
  label: string;
  values: Record<PlanTierId, RowValue>;
}

const buildRows = (limits: PlanComparisonTableProps['limits']): ComparisonRow[] => [
  {
    label: 'Max file size',
    values: {
      guest: formatFileSize(limits.guest.maxFileSizeMb),
      free: formatFileSize(limits.free.maxFileSizeMb),
      pro: formatFileSize(limits.pro.maxFileSizeMb),
    },
  },
  {
    label: 'Files per job',
    values: {
      guest: String(limits.guest.maxFilesPerJob),
      free: String(limits.free.maxFilesPerJob),
      pro: String(limits.pro.maxFilesPerJob),
    },
  },
  {
    label: 'OCR pages per scan',
    values: {
      guest: String(limits.guest.maxOcrPages),
      free: String(limits.free.maxOcrPages),
      pro: String(limits.pro.maxOcrPages),
    },
  },
  {
    label: 'File retention',
    values: {
      guest: formatRetention(limits.guest.retentionDays),
      free: formatRetention(limits.free.retentionDays),
      pro: formatRetention(limits.pro.retentionDays),
    },
  },
  {
    label: 'Access to all tools',
    values: { guest: true, free: true, pro: true },
  },
  {
    label: 'No sign-up required',
    values: { guest: true, free: false, pro: false },
  },
  {
    label: 'Job history & re-downloads',
    values: { guest: false, free: true, pro: true },
  },
  {
    label: 'Resumable chunked uploads',
    values: { guest: true, free: true, pro: true },
  },
  {
    label: 'Encrypted in transit (HTTPS)',
    values: { guest: true, free: true, pro: true },
  },
];

const CellValue = ({ value }: { value: RowValue }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-success" aria-label="Included" />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />
    );
  }
  return <span className="text-body-sm font-medium">{value}</span>;
};

export function PlanComparisonTable({ limits, className }: PlanComparisonTableProps) {
  const rows = buildRows(limits);

  return (
    <div className={className}>
      {/* Desktop: full comparison table */}
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[34%]">Feature</TableHead>
              {PLAN_TIERS.map((tier) => (
                <TableHead
                  key={tier.id}
                  className={cn('text-center', tier.highlighted && 'text-primary')}
                >
                  {tier.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium text-foreground">{row.label}</TableCell>
                {PLAN_TIERS.map((tier) => (
                  <TableCell key={tier.id} className="text-center">
                    <CellValue value={row.values[tier.id]} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked per-plan cards */}
      <div className="space-y-4 md:hidden">
        {PLAN_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              'rounded-xl border bg-card p-4',
              tier.highlighted && 'border-primary',
            )}
          >
            <Heading level="h4" as="h3" className={cn(tier.highlighted && 'text-primary')}>
              {tier.name}
            </Heading>
            <dl className="mt-3 space-y-2">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <dt>
                    <Text as="span" variant="body-sm" tone="muted">
                      {row.label}
                    </Text>
                  </dt>
                  <dd className="text-right">
                    <CellValue value={row.values[tier.id]} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
