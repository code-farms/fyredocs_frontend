import { Cell, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ANIM, CHART_COLORS, formatNumber } from '@/components/admin/chartTheme';

// A type alias, not an interface: aliases are assignable to Record<string, unknown> (ChartCard export rows).
export type DonutSegment = {
  name: string;
  value: number;
  /** Optional explicit color; falls back to the rotating chart palette. */
  color?: string;
};

interface DonutChartProps {
  data: DonutSegment[];
  /** Center label (e.g. total). When omitted, the summed value is shown. */
  centerLabel?: string;
  centerSubLabel?: string;
  valueFormatter?: (value: number) => string;
}

/**
 * Donut with a center total and a side legend listing name / value / share.
 * Used for plan distribution and user segmentation.
 */
export function DonutChart({
  data,
  centerLabel,
  centerSubLabel = 'Total',
  valueFormatter = formatNumber,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colored = data.map((d, i) => ({ ...d, color: d.color ?? CHART_COLORS[i % CHART_COLORS.length] }));
  const config: ChartConfig = Object.fromEntries(
    colored.map((d) => [d.name, { label: d.name, color: d.color }]),
  );

  return (
    <div className="flex h-full flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-full min-h-[160px] w-full sm:w-1/2">
        <ChartContainer config={config} className="aspect-auto h-full w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <span className="flex w-full justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {valueFormatter(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={colored}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              strokeWidth={0}
              {...ANIM}
            >
              {colored.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {centerLabel ?? valueFormatter(total)}
          </span>
          <span className="text-caption text-muted-foreground">{centerSubLabel}</span>
        </div>
      </div>

      <ul className="w-full space-y-1.5 sm:w-1/2">
        {colored.map((d) => {
          const share = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li key={d.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: d.color }} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.name}</span>
              <span className="font-medium tabular-nums text-foreground">{valueFormatter(d.value)}</span>
              <span className="w-12 text-right text-caption tabular-nums text-muted-foreground">
                {share.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
