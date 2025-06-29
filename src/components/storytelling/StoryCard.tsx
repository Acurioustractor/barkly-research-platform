import React from 'react';
import { NarrativeExperience } from '@/data/schemas';
import { StoryTransformer } from '@/data/transformers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@/components/core';
import { cn } from '@/utils/cn';

export interface StoryCardProps {
  narrative: NarrativeExperience;
  onStart?: () => void;
  className?: string;
}

/**
 * Preview card for a narrative experience
 * Shows key information about the story before starting
 */
export const StoryCard: React.FC<StoryCardProps> = ({
  narrative,
  onStart,
  className
}) => {
  const estimatedTime = StoryTransformer.estimateReadingTime(narrative);
  const totalChapters = StoryTransformer.getAllChapters(narrative).length;
  const themes = StoryTransformer.getAllThemes(narrative).slice(0, 3);

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader>
        <CardTitle>{narrative.title}</CardTitle>
        <CardDescription>{narrative.tagline}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm">{narrative.introduction}</p>
        
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Chapters</p>
            <p className="font-medium">{totalChapters}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reading Time</p>
            <p className="font-medium">{estimatedTime} minutes</p>
          </div>
        </div>

        {/* Themes */}
        {themes.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Explore themes of</p>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <span
                  key={theme}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility */}
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">Available in</p>
          <p className="font-medium">{narrative.accessibility.languages.join(', ')}</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {narrative.accessibility.audioNarration && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
                Audio available
              </span>
            )}
            {narrative.accessibility.visualDescriptions && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
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
                Visual descriptions
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="primary"
          className="w-full"
          onClick={onStart}
        >
          Begin Journey
        </Button>
      </CardFooter>
    </Card>
  );
};