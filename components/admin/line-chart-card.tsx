"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CHART_HEIGHT = 260;
const GRID_COLOR = "var(--border)";
const TEXT_COLOR = "var(--muted-foreground)";

const COLORS = [
  "var(--primary)",
  "var(--chart-2, #f59e0b)",
  "var(--chart-3, #10b981)",
  "var(--chart-4, #8b5cf6)",
];

interface LineConfig {
  dataKey: string;
  label: string;
}

interface LineChartCardProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  xKey: string;
  lines: LineConfig[];
}

export function LineChartCard({ title, data, xKey, lines }: LineChartCardProps) {
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
          <LineChart
            data={data}
            margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              dataKey={xKey}
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
            {lines.length > 1 && <Legend />}
            {lines.map((line, i) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.label}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[i % COLORS.length], r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
