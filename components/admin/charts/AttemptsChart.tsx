'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface AttemptsChartProps {
  data: { date: string; attempts: number; avgPercentage?: number }[];
  title?: string;
  description?: string;
  height?: number;
}

export function AttemptsChart({ data, title, description, height = 260 }: AttemptsChartProps) {
  // Format short date labels: "Oct 25"
  const formattedData = data.map((d) => {
    const parts = d.date.split('-');
    const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
    return {
      ...d,
      displayDate: label,
    };
  });

  const chart = (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="attemptsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.55 0.15 200)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="oklch(0.55 0.15 200)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0 0 / 0.5)" />
          <XAxis
            dataKey="displayDate"
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
                  <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-md backdrop-blur-xs text-xs font-sans">
                    <p className="font-semibold text-foreground mb-1">{item.date}</p>
                    <p className="text-primary font-medium">Attempts: {item.attempts}</p>
                    {item.avgPercentage !== undefined && (
                      <p className="text-muted-foreground mt-0.5">
                        Average: <span className="text-foreground font-semibold">{item.avgPercentage}%</span>
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="attempts"
            stroke="oklch(0.55 0.15 200)"
            strokeWidth={2.5}
            fill="url(#attemptsGradient)"
          />
        </AreaChart>
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
