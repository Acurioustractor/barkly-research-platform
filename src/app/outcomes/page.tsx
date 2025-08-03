'use client';

import React from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';

export default function OutcomesPage() {
  return (
    <PageLayout>
      <section className="py-8 bg-gradient-to-r from-green-50 to-blue-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">What's Working</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Success stories, progress updates, and positive outcomes from our community.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>Success stories and progress tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This page will showcase community successes and progress on key initiatives.</p>
            </CardContent>
          </Card>
        </Container>
      </section>
    </PageLayout>
  );
}