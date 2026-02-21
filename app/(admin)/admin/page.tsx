import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOverviewKpis } from "@/lib/admin/queries/overview";
import { fetchUserGrowth } from "@/lib/admin/queries/growth";
import { fetchFunnelData } from "@/lib/admin/queries/funnel";
import { fetchEngagementDepth } from "@/lib/admin/queries/engagement";
import { fetchShootingTrends } from "@/lib/admin/queries/trends";
import { KpiCard } from "@/components/admin/kpi-card";
import { LineChartCard } from "@/components/admin/line-chart-card";
import { BarChartCard } from "@/components/admin/bar-chart-card";
import { FunnelChart } from "@/components/admin/funnel-chart";

export const revalidate = 900; // ISR: 15 minutes

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [kpis, growth, funnel, engagement, trends] = await Promise.all([
    fetchOverviewKpis(admin),
    fetchUserGrowth(admin),
    fetchFunnelData(admin),
    fetchEngagementDepth(admin),
    fetchShootingTrends(admin),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Users" value={kpis.totalUsers} />
        <KpiCard label="Pro Users" value={kpis.proUsers} />
        <KpiCard label="Free Users" value={kpis.freeUsers} />
        <KpiCard label="Waitlist" value={kpis.waitlistUsers} />
        <KpiCard label="Total Rolls" value={kpis.totalRolls} />
        <KpiCard label="Total Frames" value={kpis.totalFrames} />
        <KpiCard label="Exports" value={kpis.totalExports} />
      </div>

      {/* Growth + Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LineChartCard
          title="User Growth (12 weeks)"
          data={growth}
          xKey="week"
          lines={[
            { dataKey: "signups", label: "Signups" },
            { dataKey: "confirmations", label: "Confirmations" },
          ]}
        />
        <FunnelChart title="Activation Funnel" data={funnel} />
      </div>

      {/* Engagement + Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChartCard
          title="Engagement Depth"
          data={engagement}
        />
        <BarChartCard
          title="Film Formats"
          data={trends.filmFormats}
          layout="vertical"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChartCard
          title="Film Processes"
          data={trends.filmProcesses}
          layout="vertical"
        />
        <BarChartCard
          title="Camera Types"
          data={trends.cameraTypes}
          layout="vertical"
        />
      </div>
    </div>
  );
}
