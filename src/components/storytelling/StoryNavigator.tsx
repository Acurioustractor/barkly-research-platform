'use client';

import React, { useState, useEffect } from 'react';
import { NarrativeExperience } from '@/data/schemas';
import { StoryTransformer } from '@/data/transformers';
import { ChapterViewer } from './ChapterViewer';
import { Button, Card, CardContent } from '@/components/core';
import { cn } from '@/utils/cn';

export interface StoryNavigatorProps {
  narrative: NarrativeExperience;
  initialChapterId?: string;
  onComplete?: (visitedChapters: string[]) => void;
  className?: string;
}

/**
 * Main navigation component for interactive stories
 * Handles chapter progression, history, and user choices
 */
export const StoryNavigator: React.FC<StoryNavigatorProps> = ({
  narrative,
  initialChapterId,
  onComplete,
  className
}) => {
  // Get the first chapter if no initial chapter is specified
  const firstChapter = narrative.storyArcs[0]?.chapters[0];
  const [currentChapterId, setCurrentChapterId] = useState(
    initialChapterId || firstChapter?.id || ''
  );
  const [visitedChapters, setVisitedChapters] = useState<Set<string>>(new Set());
  const [chapterHistory, setChapterHistory] = useState<string[]>([]);
  
  const currentChapter = StoryTransformer.findChapter(narrative, currentChapterId);
  const progress = narrative.storyArcs[0] 
    ? StoryTransformer.calculateProgress(narrative.storyArcs[0], visitedChapters)
    : 0;

  // Track visited chapters
  useEffect(() => {
    if (currentChapterId && !visitedChapters.has(currentChapterId)) {
      setVisitedChapters(prev => new Set([...prev, currentChapterId]));
      setChapterHistory(prev => [...prev, currentChapterId]);
    }
  }, [currentChapterId]);

  const handleChoiceSelect = (choiceId: string) => {
    const chapter = StoryTransformer.findChapter(narrative, currentChapterId);
    const choice = chapter?.nextChoices.find(c => c.id === choiceId);
    
    if (choice) {
      setCurrentChapterId(choice.nextChapterId);
    }
  };

  const handleBack = () => {
    if (chapterHistory.length > 1) {
      const newHistory = [...chapterHistory];
      newHistory.pop(); // Remove current chapter
      const previousChapterId = newHistory[newHistory.length - 1];
      
      setChapterHistory(newHistory);
      setCurrentChapterId(previousChapterId || '');
    }
  };

  const handleRestart = () => {
    setCurrentChapterId(firstChapter?.id || '');
    setVisitedChapters(new Set());
    setChapterHistory([]);
  };

  const isComplete = currentChapter?.nextChoices.length === 0;

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete(Array.from(visitedChapters));
    }
  }, [isComplete, visitedChapters, onComplete]);

  if (!currentChapter) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No chapter found. Please check the story configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your journey</span>
          <span className="font-medium">{Math.round(progress)}% explored</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Breadcrumb Trail */}
      {chapterHistory.length > 1 && (
        <nav aria-label="Story path" className="flex items-center space-x-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-1"
            aria-label="Go back"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Button>
          <div className="flex items-center space-x-1 text-muted-foreground">
            {StoryTransformer.buildChapterPath(narrative, currentChapterId).map((chapter, index, array) => (
              <React.Fragment key={chapter.id}>
                <span className={cn(
                  'truncate max-w-[150px]',
                  index === array.length - 1 && 'text-foreground font-medium'
                )}>
                  {chapter.title}
                </span>
                {index < array.length - 1 && (
                  <svg
                    className="w-4 h-4 flex-shrink-0"
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
                )}
              </React.Fragment>
            ))}
          </div>
        </nav>
      )}

      {/* Chapter Content */}
      <ChapterViewer
        chapter={currentChapter}
        onChoiceSelect={handleChoiceSelect}
      />

      {/* Completion Message */}
      {isComplete && (
        <Card className="bg-primary/10 border-primary">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Story Complete!</h3>
              <p className="text-muted-foreground mt-1">
                You&apos;ve explored {visitedChapters.size} chapters on your journey.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={handleRestart}>
                Start Again
              </Button>
              <Button variant="primary">
                Explore More Stories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reading Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Chapter {chapterHistory.length} of your journey
        </span>
        <span>
          {visitedChapters.size} chapters explored
        </span>
      </div>
    </div>
  );
};