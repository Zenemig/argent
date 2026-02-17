"use client";

import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/useStats";

const CHART_HEIGHT = 260;
const BAR_COLOR = "var(--primary)";
const LINE_COLOR = "var(--primary)";
const GRID_COLOR = "var(--border)";
const TEXT_COLOR = "var(--muted-foreground)";

function ChartSkeleton() {
  return <Skeleton className="h-[260px] w-full rounded-md" />;
}

export function StatsContent() {
  const t = useTranslations("stats");
  const {
    filmUsage,
    shotsPerMonth,
    cameraUsage,
    focalLengthUsage,
    avgFramesPerRoll,
    isLoading,
    hasData,
  } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {Array.from({ length: 5 }, (_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <ChartSkeleton />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("noData")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      {/* Most Used Film Stocks */}
      {filmUsage && filmUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("mostUsedFilm")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={filmUsage}
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
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Shots Per Month */}
      {shotsPerMonth && shotsPerMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("shotsPerMonth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart
                data={shotsPerMonth}
                margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={GRID_COLOR}
                />
                <XAxis
                  dataKey="month"
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
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={LINE_COLOR}
                  strokeWidth={2}
                  dot={{ fill: LINE_COLOR, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Most Used Cameras */}
      {cameraUsage && cameraUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("mostUsedCamera")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={cameraUsage}
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
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Most Used Focal Lengths */}
      {focalLengthUsage && focalLengthUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("mostUsedFocalLength")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart
                data={focalLengthUsage}
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
                  dataKey="focalLength"
                  width={80}
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
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Average Frames Per Roll */}
      {avgFramesPerRoll !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("avgFramesPerRoll")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tabular-nums">
              {avgFramesPerRoll}
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
