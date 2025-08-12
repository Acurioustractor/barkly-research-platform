'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Badge } from '@/components/core/Badge';
import { Button } from '@/components/core/Button';

export default function BarklyRegionalDealWikiPage() {
  const [activeId, setActiveId] = useState<string>('vision');

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('section[data-anchor]')) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top > b.boundingClientRect.top ? 1 : -1));
        if (visible.length > 0) {
          const id = (visible[0].target as HTMLElement).dataset.anchor || 'vision';
          setActiveId(id);
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 bg-gradient-to-r from-green-50 to-blue-50" data-anchor="top">
        <Container>
          <div className="max-w-5xl">
            <h1 className="text-3xl font-bold mb-4">Barkly Regional Deal</h1>
            <p className="text-lg text-muted-foreground mb-6">
              A comprehensive overview of the Barkly Regional Deal (BRD): vision, governance, initiatives, youth priorities, and links to live platform areas.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/governance-table"><Button variant="outline">Governance Table</Button></Link>
              <Link href="/data-insights"><Button variant="outline">AI Data Insights</Button></Link>
              <Link href="/conversations"><Button variant="outline">Community Conversations</Button></Link>
              <Link href="/outcomes"><Button variant="outline">Outcomes</Button></Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Sticky TOC + Core Context */}
      <section className="py-8" data-anchor="vision" id="vision">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 order-last lg:order-first">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">On this page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    { id: 'vision', label: 'Vision & Principles' },
                    { id: 'governance', label: 'Governance' },
                    { id: 'initiatives', label: '28 Initiatives' },
                    { id: 'youth', label: 'Youth Priorities' },
                    { id: 'documents', label: 'Documents' },
                    { id: 'links', label: 'Cross-links' },
                  ].map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block px-3 py-2 rounded border ${
                        activeId === item.id ? 'bg-primary/10 border-primary text-primary' : 'border-transparent hover:bg-muted/50'
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Vision and Principles</CardTitle>
                <CardDescription>
                  Community-led development with strong Aboriginal leadership and cultural safety
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  Community Vision: "Strong Barkly communities and families, together determining our future and thriving in both worlds."
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Aboriginal leadership and community control</li>
                  <li>Evidence-based decisions through UMEL frameworks</li>
                  <li>Youth-centered approaches and empowerment</li>
                  <li>Collaborative, strength-based, and accountable</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Deal Snapshot</CardTitle>
                <CardDescription>10-year commitment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span>Total Investment</span><span className="font-semibold">$100.5M</span></div>
                <div className="flex items-center justify-between"><span>Partners</span><span>3 tiers of government</span></div>
                <div className="flex items-center justify-between"><span>Initiatives</span><span>28 programs</span></div>
                <div className="flex items-center justify-between"><span>Focus</span><span>Youth, employment, housing, services</span></div>
                <div className="pt-2">
                  <a className="text-blue-700 underline" href="https://barklyregionaldeal.com.au/" target="_blank" rel="noreferrer">Official BRD Website</a>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Governance */}
      <section className="py-8 bg-muted/30" data-anchor="governance" id="governance">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Governance Structure</CardTitle>
              <CardDescription>Shared decision-making and accountability</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="p-3 bg-white rounded border">
                  <p className="font-medium">Governance Table</p>
                  <p className="text-xs text-muted-foreground">Representatives from communities across the Barkly region</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="font-medium">Barkly Aboriginal Alliance</p>
                  <p className="text-xs text-muted-foreground">Critical Aboriginal leadership body</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="font-medium">Backbone Team</p>
                  <p className="text-xs text-muted-foreground">Independent coordination and strategic support</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded border">
                  <p className="font-medium">Working Groups</p>
                  <p className="text-xs text-muted-foreground">Specialized groups for initiative areas</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="font-medium">Government Partners</p>
                  <p className="text-xs text-muted-foreground">Australian Government, NT Government, Barkly Regional Council</p>
                </div>
                <Link href="/governance-table"><Button variant="outline" className="w-full">Open Governance Table</Button></Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Initiatives */}
      <section className="py-8" data-anchor="initiatives" id="initiatives">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>28 Key Initiatives</CardTitle>
              <CardDescription>Economic development, youth, infrastructure, safety, housing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                {[
                  { label: 'Economic Development', count: 8, color: 'bg-green-500' },
                  { label: 'Youth & Education', count: 6, color: 'bg-blue-500' },
                  { label: 'Community Safety & Justice', count: 5, color: 'bg-orange-500' },
                  { label: 'Housing & Community', count: 5, color: 'bg-indigo-500' },
                  { label: 'Infrastructure & Services', count: 4, color: 'bg-purple-500' },
                ].map((item, idx) => (
                  <div key={idx} className="border rounded p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                      <span>{item.label}</span>
                    </div>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/data-insights"><Button variant="outline">See initiative-related insights</Button></Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Youth Priorities */}
      <section className="py-8 bg-muted/30" data-anchor="youth" id="youth">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Youth Priorities</CardTitle>
              <CardDescription>From roundtables and consultations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                <li>Safe House with 24/7 support</li>
                <li>Mental health and wellbeing support</li>
                <li>Two-way learning and flexible education</li>
                <li>Work experience and employment pathways</li>
                <li>Sports, recreation and leadership opportunities</li>
              </ul>
              <div className="space-y-2">
                <Link href="/conversations"><Button variant="outline" className="w-full">Explore youth roundtables</Button></Link>
                <Link href="/insights"><Button variant="outline" className="w-full">View AI youth insights</Button></Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Documents and References */}
      <section className="py-8" data-anchor="documents" id="documents">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Documents and References</CardTitle>
              <CardDescription>Source documents synced to the platform</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li><a className="text-blue-700 underline" href="https://barklyregionaldeal.com.au/" target="_blank" rel="noreferrer">Official BRD Website</a></li>
                <li>
                  Internal context: <code>.kiro/steering/barkly-regional-deal-context.md</code>
                </li>
                <li>
                  Project docs: <code>docs/project-knowledge/barkly-documents/</code>
                </li>
              </ul>
              <div className="pt-2">
                <Link href="/documents"><Button variant="outline">Browse processed documents</Button></Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* Cross-links */}
      <section className="py-8 bg-muted/30" data-anchor="links" id="links">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Governance</CardTitle>
                <CardDescription>Roles and decision-making</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/governance-table"><Button className="w-full" variant="outline">Open Governance Table</Button></Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Community Voice</CardTitle>
                <CardDescription>Consultations and input</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/conversations"><Button className="w-full" variant="outline">Explore Conversations</Button></Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Analysis</CardTitle>
                <CardDescription>Themes, patterns, gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/data-insights"><Button className="w-full" variant="outline">Open Data Insights</Button></Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}


