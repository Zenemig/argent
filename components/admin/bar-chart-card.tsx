"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CHART_HEIGHT = 260;
const BAR_COLOR = "var(--primary)";
const GRID_COLOR = "var(--border)";
const TEXT_COLOR = "var(--muted-foreground)";

interface BarChartCardProps {
  title: string;
  data: { name: string; count: number }[];
  layout?: "vertical" | "horizontal";
}

export function BarChartCard({
  title,
  data,
  layout = "horizontal",
}: BarChartCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-10 text-center text-sm text-muted-foreground">
            No data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          {layout === "vertical" ? (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID_COLOR}
                horizontal={false}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: GRID_COLOR,
                  color: "var(--popover-foreground)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : (
            <BarChart
              data={data}
              margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID_COLOR}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: GRID_COLOR,
                  color: "var(--popover-foreground)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
