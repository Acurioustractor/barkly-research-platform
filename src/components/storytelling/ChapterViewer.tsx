'use client';

import React from 'react';
import { StoryChapter, DataPoint } from '@/data/schemas';
import { Card, CardContent } from '@/components/core';
import { cn } from '@/utils/cn';

export interface ChapterViewerProps {
  chapter: StoryChapter;
  onChoiceSelect?: (choiceId: string) => void;
  className?: string;
}

/**
 * Displays a single chapter of a story with its narrative, data points, and choices
 */
export const ChapterViewer: React.FC<ChapterViewerProps> = ({
  chapter,
  onChoiceSelect,
  className
}) => {
  const renderDataPoint = (dataPoint: DataPoint) => {
    switch (dataPoint.type) {
      case 'statistic':
        return (
          <div className="bg-accent/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-accent">{dataPoint.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{dataPoint.label}</div>
            {dataPoint.context && (
              <div className="text-xs text-muted-foreground mt-2">{dataPoint.context}</div>
            )}
          </div>
        );
      
      case 'quote':
        return (
          <blockquote className="border-l-4 border-accent pl-4 py-2 italic">
            <p className="text-muted-foreground">&ldquo;{dataPoint.value}&rdquo;</p>
            {dataPoint.label && (
              <footer className="text-sm text-muted-foreground mt-2">— {dataPoint.label}</footer>
            )}
          </blockquote>
        );
      
      case 'observation':
        return (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm">{dataPoint.value}</p>
            {dataPoint.label && (
              <p className="text-xs text-muted-foreground mt-1">{dataPoint.label}</p>
            )}
          </div>
        );
      
      case 'milestone':
        return (
          <div className="flex items-center gap-3 bg-primary/10 rounded-lg p-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold">{dataPoint.value}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">{dataPoint.label}</p>
              {dataPoint.context && (
                <p className="text-sm text-muted-foreground">{dataPoint.context}</p>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-muted/30 rounded-lg p-4">
            <p>{dataPoint.value}</p>
            <p className="text-sm text-muted-foreground">{dataPoint.label}</p>
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Cultural Warning */}
      {chapter.culturalWarning?.present && (
        <Card className="border-cultural-respect bg-cultural-respect/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-cultural-respect mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-medium text-cultural-respect">Cultural Notice</p>
                <p className="text-sm mt-1">{chapter.culturalWarning.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapter Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{chapter.title}</h2>
        {chapter.culturalContext && (
          <p className="text-muted-foreground mt-2">{chapter.culturalContext}</p>
        )}
      </div>

      {/* Narrative */}
      <div className="prose prose-lg max-w-none">
        {chapter.narrative.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Data Points */}
      {chapter.dataPoints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Key Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {chapter.dataPoints.map((dataPoint) => (
              <div key={dataPoint.id}>
                {renderDataPoint(dataPoint)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Metaphor */}
      {chapter.visualMetaphor && (
        <Card className="bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-accent">Visual Metaphor: {chapter.visualMetaphor.type}</p>
                <p className="text-sm mt-1">{chapter.visualMetaphor.description}</p>
                {chapter.visualMetaphor.culturalSignificance && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium">Cultural significance:</span> {chapter.visualMetaphor.culturalSignificance}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Choices */}
      {chapter.nextChoices.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-xl font-semibold">What happens next?</h3>
          <div className="space-y-3">
            {chapter.nextChoices.map((choice) => (
              <Card
                key={choice.id}
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                onClick={() => onChoiceSelect?.(choice.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{choice.text}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {choice.consequence}
                      </p>
                      {choice.culturalConsideration && (
                        <p className="text-sm text-cultural-knowledge mt-2">
                          <span className="font-medium">Cultural note:</span> {choice.culturalConsideration}
                        </p>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Themes */}
      {chapter.themes.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4">
          {chapter.themes.map((theme) => (
            <span
              key={theme}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};