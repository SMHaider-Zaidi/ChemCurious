'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ScoreDistributionProps {
  data: { bucket: string; count: number }[];
  title?: string;
  description?: string;
  height?: number;
}

export function ScoreDistributionChart({
  data,
  title,
  description,
  height = 240,
}: ScoreDistributionProps) {
  const getBarColor = (bucket: string) => {
    switch (bucket) {
      case '0-39':
        return 'oklch(0.55 0.25 25)'; // Destructive Red
      case '40-59':
        return 'oklch(0.75 0.15 85)'; // Secondary Amber
      case '60-79':
        return 'oklch(0.55 0.15 200)'; // Primary Cyan
      case '80-100':
        return 'oklch(0.65 0.18 150)'; // Emerald
      default:
        return 'oklch(0.55 0.15 200)';
    }
  };

  const chart = (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0 0 / 0.5)" />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            stroke="oklch(0.55 0 0)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            stroke="oklch(0.55 0 0)"
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0]!.payload;
                return (
                  <div className="rounded-lg border border-border bg-popover/95 p-2.5 shadow-md backdrop-blur-xs text-xs font-sans">
                    <p className="font-semibold text-foreground">{item.bucket}% Score</p>
                    <p className="text-muted-foreground mt-0.5">
                      Completed: <span className="text-foreground font-semibold">{item.count}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.bucket)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  if (title) {
    return (
      <Card className="rounded-xl border border-border shadow-xs">
        <CardHeader>
          <CardTitle className="font-serif text-base font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs font-sans">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>{chart}</CardContent>
      </Card>
    );
  }

  return chart;
}
