'use client';

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/core';

export interface ThemeData {
  theme: string;
  youthVoices: number;
  communitySupport: number;
  serviceAlignment: number;
  culturalRelevance: number;
  actionPotential: number;
}

export interface ThemeRelationshipsProps {
  data: ThemeData[];
  className?: string;
  height?: number;
}

/**
 * Radar chart showing relationships between different themes
 * and their various dimensions
 */
export const ThemeRelationships: React.FC<ThemeRelationshipsProps> = ({
  data,
  className,
  height = 400
}) => {
  // Normalize data to 0-100 scale for better visualization
  type NormalizedData = {
    theme: string;
    [key: string]: string | number;
  };
  
  const normalizedData: NormalizedData[] = data.map(item => ({
    theme: item.theme,
    'Youth Voices': item.youthVoices,
    'Community Support': item.communitySupport,
    'Service Alignment': item.serviceAlignment,
    'Cultural Relevance': item.culturalRelevance,
    'Action Potential': item.actionPotential
  }));

  const dimensions = [
    'Youth Voices',
    'Community Support',
    'Service Alignment',
    'Cultural Relevance',
    'Action Potential'
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{data.theme}</p>
          <div className="space-y-1">
            {dimensions.map(dimension => (
              <div key={dimension} className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">{dimension}:</span>
                <span className="text-sm font-medium">{data[dimension]}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate average scores for insights
  const averageScores = dimensions.reduce((acc, dimension) => {
    const total = normalizedData.reduce((sum, item) => {
      const value = item[dimension];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    acc[dimension] = Math.round(total / normalizedData.length);
    return acc;
  }, {} as Record<string, number>);

  const highestDimension = Object.entries(averageScores).reduce((a, b) => 
    a[1] > b[1] ? a : b
  );
  const lowestDimension = Object.entries(averageScores).reduce((a, b) => 
    a[1] < b[1] ? a : b
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Theme Analysis</CardTitle>
        <CardDescription>
          Multi-dimensional analysis of key themes across different factors
        </CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={normalizedData}>
            <PolarGrid
              gridType="polygon"
              className="opacity-30"
            />
            <PolarAngleAxis
              dataKey="theme"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
            />
            {dimensions.map((dimension, index) => (
              <Radar
                key={dimension}
                name={dimension}
                dataKey={dimension}
                stroke={[
                  '#e85229', // Primary
                  '#0c9eeb', // Accent
                  '#10b981', // Success
                  '#DAA520', // Cultural knowledge
                  '#886859'  // Secondary
                ][index]}
                fill={[
                  '#e85229',
                  '#0c9eeb',
                  '#10b981',
                  '#DAA520',
                  '#886859'
                ][index]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {dimensions.map((dimension, index) => (
            <div key={dimension} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: [
                    '#e85229',
                    '#0c9eeb',
                    '#10b981',
                    '#DAA520',
                    '#886859'
                  ][index]
                }}
              />
              <span className="text-sm">{dimension}</span>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="bg-success/10 rounded-lg p-4">
            <p className="text-sm font-medium text-success mb-1">Strongest Dimension</p>
            <p className="text-lg font-semibold">{highestDimension[0]}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Average: {highestDimension[1]}%
            </p>
          </div>
          <div className="bg-warning/10 rounded-lg p-4">
            <p className="text-sm font-medium text-warning mb-1">Area for Growth</p>
            <p className="text-lg font-semibold">{lowestDimension[0]}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Average: {lowestDimension[1]}%
            </p>
          </div>
        </div>

        {/* Theme Comparison */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Theme Comparison</h4>
          <div className="space-y-2">
            {normalizedData.map(theme => {
              const totalScore = dimensions.reduce((sum, dim) => {
                const value = theme[dim];
                return sum + (typeof value === 'number' ? value : 0);
              }, 0);
              const avgScore = Math.round(totalScore / dimensions.length);
              
              return (
                <div key={theme.theme} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-32 truncate">
                    {theme.theme}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${avgScore}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {avgScore}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};