'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/core';

export interface DataStream {
  name: string;
  color: string;
  data: number[];
}

export interface DataRiverProps {
  streams: DataStream[];
  labels: string[];
  className?: string;
  height?: number;
}

/**
 * Data River visualization showing flow of themes/data over time
 * Uses stacked area charts to show relationships and patterns
 */
export const DataRiver: React.FC<DataRiverProps> = ({
  streams,
  labels,
  className,
  height = 400
}) => {
  // Transform data for Recharts
  const chartData = labels.map((label, index) => {
    const dataPoint: any = { name: label };
    streams.forEach(stream => {
      dataPoint[stream.name] = stream.data[index] || 0;
    });
    return dataPoint;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Data Flow Visualization</CardTitle>
        <CardDescription>
          See how different themes and patterns flow through the research journey
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {streams.map((stream, index) => (
                <linearGradient
                  key={stream.name}
                  id={`gradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={stream.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={stream.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px'
              }}
            />
            {streams.map((stream, index) => (
              <Area
                key={stream.name}
                type="monotone"
                dataKey={stream.name}
                stackId="1"
                stroke={stream.color}
                fill={`url(#gradient-${index})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Insights */}
        <div className="mt-6 space-y-3">
          <h4 className="font-medium">Key Patterns</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">Dominant Theme</p>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const totals = streams.map(stream => ({
                    name: stream.name,
                    total: stream.data.reduce((a, b) => a + b, 0)
                  }));
                  const dominant = totals.reduce((prev, current) => 
                    prev.total > current.total ? prev : current
                  );
                  return dominant.name;
                })()}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">Peak Period</p>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const periodTotals = labels.map((label, index) => {
                    const total = streams.reduce((sum, stream) => 
                      sum + (stream.data[index] || 0), 0
                    );
                    return { label, total };
                  });
                  const peak = periodTotals.reduce((prev, current) => 
                    prev.total > current.total ? prev : current
                  );
                  return peak.label;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};