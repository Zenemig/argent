"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelStep } from "@/lib/admin/queries/funnel";

interface FunnelChartProps {
  title: string;
  data: FunnelStep[];
}

export function FunnelChart({ title, data }: FunnelChartProps) {
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

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((step) => (
          <div key={step.step}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{step.step}</span>
              <span className="flex items-center gap-2 tabular-nums">
                <span className="font-medium">{step.count}</span>
                {step.dropOff !== null && (
                  <span className="text-xs text-muted-foreground">
                    (-{step.dropOff}%)
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(step.count / maxCount) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
