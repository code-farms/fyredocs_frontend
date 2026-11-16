import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { HealthStatusStrip, type HealthSegment } from '@/components/admin/HealthStatusStrip';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { MultiLineChart } from '@/components/admin/charts/MultiLineChart';
import { StackedAreaChart } from '@/components/admin/charts/StackedAreaChart';
import { Server, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { useServerPerformance } from '@/hooks/useAdminMetrics';
import type { ServerPerformanceData, ServiceRow } from '@/lib/adminApi';
import {
  CHART_COLORS,
  SEMANTIC,
  formatHourTick,
  usageToneClass,
} from '@/components/admin/chartTheme';
import { computeServerInsights } from '@/lib/insights';

// A type alias, not an interface: chart data/export props take Record<string, unknown>[].
type ResourcePoint = {
  time: string;
  cpu: number;
  mem: number;
  disk: number;
  usedGB: number;
  freeGB: number;
};

const MAX_POINTS = 120;

/** Flatten the services map into table rows when the backend omits servicesList. */
function deriveServiceRows(d: ServerPerformanceData | undefined): ServiceRow[] {
  if (d?.servicesList?.length) return d.servicesList;
  if (!d?.services) return [];
  return Object.entries(d.services)
    .map(([name, svc]) => ({
      name,
      status: svc.status,
      uptime: svc.uptime ?? '—',
      goroutines: svc.goroutines ?? 0,
      heapAllocMB: svc.memory?.heapAllocMB ?? 0,
      heapInuseMB: svc.memory?.heapInuseMB ?? 0,
      sysMB: svc.memory?.sysMB ?? 0,
      goVersion: svc.goVersion ?? '—',
      error: svc.error,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const serviceColumns: Column<ServiceRow>[] = [
  { key: 'name', label: 'Service', sortable: true, className: 'font-medium' },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (v) => (
      <Badge variant={v === 'healthy' ? 'default' : 'destructive'} className="px-1.5 py-0 text-[10px]">
        {String(v)}
      </Badge>
    ),
  },
  { key: 'uptime', label: 'Uptime', sortable: true, className: 'text-xs text-muted-foreground' },
  { key: 'goroutines', label: 'Goroutines', sortable: true, align: 'right', render: (v) => (v as number).toLocaleString() },
  { key: 'heapInuseMB', label: 'Heap (MB)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(1) },
  { key: 'sysMB', label: 'Sys (MB)', sortable: true, align: 'right', render: (v) => (v as number).toFixed(1) },
];

const ServerPerformancePage = () => {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useServerPerformance();
  const d = data;
  const sys = d?.system;

  const cpu = sys?.cpu?.usagePercent ?? 0;
  const mem = sys?.memory?.usagePercent ?? 0;
  const disk = sys?.storage?.usagePercent ?? 0;

  // Accumulate a rolling resource history client-side from the 10s refetch,
  // until the backend serves a server-side `history` series.
  const bufferRef = useRef<ResourcePoint[]>([]);
  const [, bump] = useState(0);
  useEffect(() => {
    if (!sys || !dataUpdatedAt) return;
    const point: ResourcePoint = {
      time: new Date(dataUpdatedAt).toISOString(),
      cpu: sys.cpu?.usagePercent ?? 0,
      mem: sys.memory?.usagePercent ?? 0,
      disk: sys.storage?.usagePercent ?? 0,
      usedGB: (sys.memory?.usedMB ?? 0) / 1024,
      freeGB: (sys.memory?.availableMB ?? sys.memory?.freeMB ?? 0) / 1024,
    };
    const buf = bufferRef.current;
    if (buf.length === 0 || buf[buf.length - 1].time !== point.time) {
      buf.push(point);
      if (buf.length > MAX_POINTS) buf.shift();
      bump((n) => n + 1);
    }
  }, [sys, dataUpdatedAt]);

  const history: ResourcePoint[] = useMemo(() => {
    if (d?.history?.length) {
      return d.history.map((h) => ({
        time: h.time,
        cpu: h.cpuPercent,
        mem: h.memPercent,
        disk: h.diskPercent,
        usedGB: 0,
        freeGB: 0,
      }));
    }
    return bufferRef.current.slice();
    // Keyed on dataUpdatedAt so this re-derives only when react-query reports
    // the payload actually changed, not on every refetch returning the same
    // history.
  }, [d?.history, dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const serviceRows = useMemo(() => deriveServiceRows(d), [d]);
  const insights = useMemo(() => computeServerInsights(d), [d]);

  const healthSegments: HealthSegment[] = serviceRows.map((s) => ({
    label: s.name,
    status: s.status === 'healthy' ? 'healthy' : 'critical',
    detail: s.status === 'healthy' ? s.uptime : s.error,
  }));

  const hasUsedFree = history.some((h) => h.usedGB > 0 || h.freeGB > 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader title="Server" description="Host resources and per-service health" />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="System Uptime" value={sys?.uptime ?? '—'} icon={Server} tone="success" isLoading={isLoading} />
            <StatCard label="CPU" value={`${cpu.toFixed(0)}%`} icon={Cpu} tone="info" color={usageToneClass(cpu)} subtitle={sys?.cpu?.count != null ? `${sys.cpu.count} cores` : undefined} isLoading={isLoading} />
            <StatCard label="Memory" value={`${mem.toFixed(0)}%`} icon={MemoryStick} tone="info" color={usageToneClass(mem)} subtitle={sys?.memory ? `${((sys.memory.usedMB ?? 0) / 1024).toFixed(1)} / ${((sys.memory.totalMB ?? 0) / 1024).toFixed(1)} GB` : undefined} isLoading={isLoading} />
            <StatCard label="Disk" value={`${disk.toFixed(0)}%`} icon={HardDrive} tone="brand" color={usageToneClass(disk)} subtitle={sys?.storage ? `${(sys.storage.usedGB ?? 0).toFixed(0)} / ${(sys.storage.totalGB ?? 0).toFixed(0)} GB` : undefined} isLoading={isLoading} />
          </div>

          <ChartCard
            title="Resource usage"
            description="CPU, memory, and disk utilization — live"
            isLoading={isLoading && history.length === 0}
            awaitingData={history.length < 2}
            awaitingMessage="Collecting live resource samples… the trend appears after a few refreshes."
            exportData={{ filename: 'server-resources', rows: history }}
          >
            <MultiLineChart
              data={history}
              xKey="time"
              xTickFormatter={formatHourTick}
              series={[
                { key: 'cpu', label: 'CPU %', color: CHART_COLORS[1] },
                { key: 'mem', label: 'Memory %', color: CHART_COLORS[0] },
                { key: 'disk', label: 'Disk %', color: CHART_COLORS[3] },
              ]}
              leftTickFormatter={(v) => `${v.toFixed(0)}%`}
              valueFormatter={(v) => `${v.toFixed(1)}%`}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Memory capacity"
              description="Used vs available (GB)"
              isLoading={isLoading && history.length === 0}
              awaitingData={!hasUsedFree || history.length < 2}
              awaitingMessage="Collecting capacity samples…"
              exportData={{ filename: 'memory-capacity', rows: history }}
            >
              <StackedAreaChart
                data={history}
                xKey="time"
                xTickFormatter={formatHourTick}
                valueTickFormatter={(v) => `${v.toFixed(0)}G`}
                series={[
                  { key: 'usedGB', label: 'Used', color: CHART_COLORS[0] },
                  { key: 'freeGB', label: 'Available', color: SEMANTIC.success },
                ]}
              />
            </ChartCard>

            <InsightsPanel insights={insights} title="Infrastructure insights" isLoading={isLoading} />
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Service distribution</CardTitle>
              {healthSegments.length > 0 && (
                <div className="pt-2">
                  <HealthStatusStrip segments={healthSegments} />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <DataTable<ServiceRow>
                data={serviceRows}
                columns={serviceColumns}
                isLoading={isLoading}
                searchableFields={['name']}
                defaultSort={{ key: 'name', desc: false }}
                emptyMessage="No service data available"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ServerPerformancePage;
