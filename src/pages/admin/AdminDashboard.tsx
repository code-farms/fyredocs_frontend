import { useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { KpiCard, type KpiCardProps } from '@/components/admin/KpiCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { HealthStatusStrip, type HealthSegment } from '@/components/admin/HealthStatusStrip';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MultiLineChart } from '@/components/admin/charts/MultiLineChart';
import {
  useExecutiveOverview,
  useUserGrowth,
  useBusiness,
  useGrowth,
  useEngagement,
  useReliability,
  useServerPerformance,
  useApiPerformance,
} from '@/hooks/useAdminMetrics';
import { useAdminTimeRange } from '@/hooks/useAdminTimeRange';
import {
  CHART_COLORS,
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@/components/admin/chartTheme';
import { kpiDelta, rateStatus, usageStatus } from '@/lib/adminDerived';
import {
  aggregateInsights,
  computeApiInsights,
  computeBusinessInsights,
  computeGrowthInsights,
  computeReliabilityInsights,
  computeServerInsights,
} from '@/lib/insights';
import type { HealthStatus } from '@/components/admin/chartTheme';
import type { ExecutiveKpi } from '@/lib/adminApi';

/** Deep-link to a section, preserving the active `?days=`. */
function sectionLink(path: string, days: number): string {
  return `${path}?days=${days}`;
}

interface KpiMetric {
  current: number | null;
  previous: number | null;
  spark: number[];
}

/** Pull a display-ready metric from an executive KPI, with a fallback. */
function fromExec(
  kpi: ExecutiveKpi | undefined,
  fallback: KpiMetric,
  scale = 1,
): KpiMetric {
  if (!kpi) return fallback;
  return {
    current: kpi.current != null ? kpi.current * scale : fallback.current,
    previous: kpi.previous != null ? kpi.previous * scale : fallback.previous,
    spark: kpi.sparkline?.length ? kpi.sparkline.map((p) => p.value * scale) : fallback.spark,
  };
}

const AdminDashboard = () => {
  const { days } = useAdminTimeRange();

  const exec = useExecutiveOverview(days);
  const growthQ = useUserGrowth(days);
  const business = useBusiness(days);
  const growth = useGrowth(days);
  const engagement = useEngagement(days);
  const reliability = useReliability(days);
  const server = useServerPerformance();
  const api = useApiPerformance();

  const e = exec.data ?? undefined;

  // --- KPI metrics: prefer the executive endpoint, fall back to live hooks ---
  const rel = reliability.data;
  const relTotalSpark = (rel?.errorTrend ?? []).map((r) => r.total);
  const relSuccessSpark = (rel?.errorTrend ?? []).map((r) =>
    r.total > 0 ? (1 - r.failures / r.total) * 100 : 100,
  );
  const dauSpark = (growth.data?.dauTrend ?? []).map((r) => r.dau);

  const totalUsers = fromExec(e?.totalUsers, { current: null, previous: null, spark: [] });
  const activeUsers = fromExec(e?.activeUsers, {
    current: growth.data?.dau ?? null,
    previous: null,
    spark: dauSpark,
  });
  const revenue = fromExec(e?.revenue, {
    current: business.data?.revenue?.mrr ?? null,
    previous: null,
    spark: [],
  });
  const jobsCreated = fromExec(e?.jobsCreated, {
    current: rel?.jobRate?.total ?? null,
    previous: null,
    spark: relTotalSpark,
  });
  const successRate = fromExec(
    e?.successRate,
    {
      current: rel?.jobRate ? rel.jobRate.successRate * 100 : null,
      previous: null,
      spark: relSuccessSpark,
    },
    100, // exec returns a 0–1 ratio
  );
  const apiRequests = fromExec(e?.apiRequests, {
    current: api.data?.data?.summary?.totalRequests ?? null,
    previous: null,
    spark: [],
  });
  const apiErrorRate = fromExec(
    e?.apiErrorRate,
    {
      current: api.data?.data?.summary ? api.data.data.summary.errorRate * 100 : null,
      previous: null,
      spark: [],
    },
    100,
  );

  const serversCurrent = e?.activeServers?.current ?? server.data?.availability?.healthyServices ?? null;
  const serversTotal = e?.activeServers?.total ?? server.data?.availability?.totalServices ?? 0;

  const successStatus: HealthStatus =
    successRate.current != null ? rateStatus(successRate.current) : 'healthy';
  const errorStatus: HealthStatus =
    apiErrorRate.current != null ? usageStatus(apiErrorRate.current, 1, 5) : 'healthy';
  const serverStatus: HealthStatus =
    serversTotal > 0 && serversCurrent != null && serversCurrent < serversTotal ? 'critical' : 'healthy';

  const isKpiLoading = exec.isLoading && reliability.isLoading;

  const kpis: (KpiCardProps & { key: string })[] = [
    {
      key: 'totalUsers',
      label: 'Total Users',
      value: totalUsers.current != null ? formatCompact(totalUsers.current) : '—',
      sparkline: totalUsers.spark,
      deltaPct: kpiDelta(totalUsers.current, totalUsers.previous),
      to: sectionLink('/admin/growth', days),
      insight: totalUsers.current == null ? 'Awaiting the executive metrics endpoint.' : undefined,
    },
    {
      key: 'activeUsers',
      label: 'Active Users',
      value: activeUsers.current != null ? formatCompact(activeUsers.current) : '—',
      sparkline: activeUsers.spark,
      deltaPct: kpiDelta(activeUsers.current, activeUsers.previous),
      status: 'healthy',
      to: sectionLink('/admin/growth', days),
    },
    {
      key: 'revenue',
      label: 'Revenue (est.)',
      value:
        revenue.current != null
          ? formatCurrency(revenue.current, e?.revenue?.currency ?? business.data?.revenue?.currency ?? 'USD')
          : '—',
      sparkline: revenue.spark,
      deltaPct: kpiDelta(revenue.current, revenue.previous),
      to: sectionLink('/admin/business', days),
      insight: revenue.current == null ? 'Estimated MRR — configure plan prices to populate.' : 'Estimated from plan distribution.',
    },
    {
      key: 'jobsCreated',
      label: 'Jobs Created',
      value: jobsCreated.current != null ? formatCompact(jobsCreated.current) : '—',
      sparkline: jobsCreated.spark,
      deltaPct: kpiDelta(jobsCreated.current, jobsCreated.previous),
      to: sectionLink('/admin/reliability', days),
    },
    {
      key: 'successRate',
      label: 'Success Rate',
      value: successRate.current != null ? formatPercent(successRate.current, 1, true) : '—',
      sparkline: successRate.spark,
      deltaPct: kpiDelta(successRate.current, successRate.previous),
      status: successStatus,
      to: sectionLink('/admin/reliability', days),
    },
    {
      key: 'apiRequests',
      label: 'API Requests',
      value: apiRequests.current != null ? formatCompact(apiRequests.current) : '—',
      sparkline: apiRequests.spark,
      deltaPct: kpiDelta(apiRequests.current, apiRequests.previous),
      to: '/admin/api-performance',
    },
    {
      key: 'apiErrorRate',
      label: 'Error Rate',
      value: apiErrorRate.current != null ? formatPercent(apiErrorRate.current, 2, true) : '—',
      sparkline: apiErrorRate.spark,
      deltaPct: kpiDelta(apiErrorRate.current, apiErrorRate.previous),
      invertGood: true,
      status: errorStatus,
      to: '/admin/api-performance',
    },
    {
      key: 'activeServers',
      label: 'Active Servers',
      value: serversCurrent != null ? `${serversCurrent}/${serversTotal}` : '—',
      status: serverStatus,
      to: '/admin/server-performance',
      insight:
        serverStatus === 'critical'
          ? 'One or more services are unhealthy.'
          : serversCurrent != null
            ? 'All services healthy.'
            : undefined,
    },
  ];

  // --- Activity chart: signups + DAU + jobs created, merged by date ---
  const activityData = useMemo(() => {
    const byDate = new Map<string, { date: string; signups: number; dau: number; jobs: number }>();
    for (const r of growthQ.data?.rows ?? []) {
      byDate.set(r.date, { date: r.date, signups: r.signups, dau: r.dau, jobs: 0 });
    }
    for (const r of rel?.errorTrend ?? []) {
      const row = byDate.get(r.date) ?? { date: r.date, signups: 0, dau: 0, jobs: 0 };
      row.jobs = r.total;
      byDate.set(r.date, row);
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [growthQ.data, rel]);

  // --- Aggregated cross-domain insights ---
  const insights = useMemo(
    () =>
      aggregateInsights(
        [
          computeBusinessInsights(business.data),
          computeGrowthInsights(growth.data),
          computeReliabilityInsights(reliability.data),
          computeServerInsights(server.data),
          computeApiInsights(api.data?.data),
        ],
        6,
      ),
    [business.data, growth.data, reliability.data, server.data, api.data],
  );

  // --- Health strip across subsystems ---
  const healthSegments: HealthSegment[] = useMemo(() => {
    const segs: HealthSegment[] = [];
    const s = server.data;
    if (s?.services) {
      for (const [name, svc] of Object.entries(s.services)) {
        segs.push({
          label: name,
          status: svc.status === 'healthy' ? 'healthy' : 'critical',
          detail: svc.status === 'healthy' ? svc.uptime : svc.error,
        });
      }
    }
    return segs;
  }, [server.data]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader title="Executive Overview" description="Platform health at a glance — click any metric to drill in." />

      <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
        {kpis.map(({ key, ...props }) => (
          <KpiCard key={key} {...props} isLoading={isKpiLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Platform activity"
          description="Signups, daily active users, and jobs created"
          isLoading={growthQ.isLoading}
          isError={growthQ.isError}
          onRetry={() => growthQ.refetch()}
          exportData={{ filename: 'platform-activity', rows: activityData }}
        >
          <MultiLineChart
            data={activityData}
            xKey="date"
            series={[
              { key: 'dau', label: 'DAU', color: CHART_COLORS[1] },
              { key: 'signups', label: 'Signups', color: CHART_COLORS[0] },
              { key: 'jobs', label: 'Jobs created', color: CHART_COLORS[2] },
            ]}
            leftTickFormatter={formatCompact}
            valueFormatter={(v) => formatNumber(v)}
          />
        </ChartCard>

        <InsightsPanel
          insights={insights}
          title="Top insights"
          description="Across all domains"
          showDomain
          isLoading={business.isLoading && reliability.isLoading}
        />
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <h3 className="text-sm font-medium text-foreground">Service health</h3>
          <p className="text-caption text-muted-foreground">Live status across all backend services</p>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {healthSegments.length > 0 ? (
            <HealthStatusStrip segments={healthSegments} />
          ) : (
            <p className="text-caption text-muted-foreground">
              {server.isLoading ? 'Loading service status…' : 'Service status unavailable.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
