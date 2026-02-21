"use client";

import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: number;
}

export function KpiCard({ label, value }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
