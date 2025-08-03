'use client';

import React from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';

export default function CommunityVoicePage() {
  return (
    <PageLayout>
      <section className="py-8 bg-gradient-to-r from-purple-50 to-pink-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Community Voice</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Share what you need, tell your story, and help us understand community priorities.
            </p>
            <div className="flex gap-4">
              <Button variant="primary">Share Your Needs</Button>
              <Button variant="secondary">Tell Your Story</Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>Community input and storytelling features</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This page will allow community members to share their needs and stories.</p>
            </CardContent>
          </Card>
        </Container>
      </section>
    </PageLayout>
  );
}