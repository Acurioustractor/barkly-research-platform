'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/core';
import { Container, Card, CardHeader, CardTitle, CardDescription } from '@/components/core';
import { StoryNavigator, StoryCard } from '@/components/storytelling';
import { barklyYouthNarrative } from '@/data/projects/barkly-youth';

export default function StoriesPage() {
  const [isReading, setIsReading] = useState(false);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);

  const handleStartReading = () => {
    setIsReading(true);
    setCompletedChapters([]);
  };

  const handleComplete = (chapters: string[]) => {
    setCompletedChapters(chapters);
  };

  const handleBackToStories = () => {
    setIsReading(false);
  };

  return (
    <PageLayout>
      <section className="py-12 lg:py-16">
        <Container>
          {!isReading ? (
            <>
              {/* Page Header */}
              <div className="mx-auto max-w-2xl text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                  Youth Stories
                </h1>
                <p className="text-lg text-muted-foreground">
                  Experience the journeys of young people in the Barkly region through interactive narratives 
                  that bring research to life.
                </p>
              </div>

              {/* Featured Story */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-6">Featured Story</h2>
                <div className="max-w-2xl mx-auto">
                  <StoryCard
                    narrative={barklyYouthNarrative}
                    onStart={handleStartReading}
                  />
                </div>
              </div>

              {/* How It Works */}
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle>How Interactive Stories Work</CardTitle>
                  <CardDescription>
                    Our stories put you in the shoes of young people and community members
                  </CardDescription>
                </CardHeader>
                <div className="p-6 pt-0">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <h3 className="font-medium mb-1">Read & Listen</h3>
                      <p className="text-sm text-muted-foreground">
                        Follow real stories from youth voices
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-primary font-bold">2</span>
                      </div>
                      <h3 className="font-medium mb-1">Make Choices</h3>
                      <p className="text-sm text-muted-foreground">
                        Decide how the story unfolds
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-primary font-bold">3</span>
                      </div>
                      <h3 className="font-medium mb-1">Learn & Reflect</h3>
                      <p className="text-sm text-muted-foreground">
                        Discover insights through experience
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <>
              {/* Story Reader */}
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <button
                    onClick={handleBackToStories}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
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
                    Back to stories
                  </button>
                </div>
                
                <StoryNavigator
                  narrative={barklyYouthNarrative}
                  onComplete={handleComplete}
                />

                {completedChapters.length > 0 && (
                  <Card className="mt-8 bg-success/10 border-success">
                    <div className="p-6">
                      <h3 className="font-semibold mb-2">Thank you for experiencing this story</h3>
                      <p className="text-sm text-muted-foreground">
                        You explored {completedChapters.length} chapters and gained insights into 
                        the lives of young people in the Barkly region.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </>
          )}
        </Container>
      </section>
    </PageLayout>
  );
}