'use client';

import React from 'react';
import Link from 'next/link';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';

export default function WikiIndexPage() {
  return (
    <PageLayout>
      <section className="py-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">Community Wiki</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Explore curated knowledge that underpins the Barkly Community Intelligence Platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/wiki/barkly-regional-deal">
                <Button variant="primary">Barkly Regional Deal</Button>
              </Link>
              <Link href="/governance-table">
                <Button variant="outline">Governance Table</Button>
              </Link>
              <Link href="/data-insights">
                <Button variant="outline">AI Data Insights</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Barkly Regional Deal</CardTitle>
                <CardDescription>
                  A comprehensive overview with links to initiatives, governance, youth priorities, and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/wiki/barkly-regional-deal">
                  <Button className="w-full">Open</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Platform Areas</CardTitle>
                <CardDescription>Navigate to related sections across the site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link href="/conversations"><Button variant="outline">Community Conversations</Button></Link>
                  <Link href="/insights"><Button variant="outline">Insights</Button></Link>
                  <Link href="/services-map"><Button variant="outline">Services Map</Button></Link>
                  <Link href="/outcomes"><Button variant="outline">Outcomes</Button></Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}



