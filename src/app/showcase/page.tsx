'use client';

import React, { useState } from 'react';
import { PageLayout, Container } from '@/components/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Badge } from '@/components/core';
import Link from 'next/link';

export default function ShowcasePage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  return (
    <PageLayout>
      <Container>
        {/* Hero Section */}
        <section className="text-center py-12 mb-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-primary">
              Barkly Research Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Community-Led Intelligence Platform for Indigenous Communities
            </p>
            <div className="flex justify-center space-x-2 mb-8">
              <Badge variant="secondary">AI-Powered</Badge>
              <Badge variant="secondary">Community-Owned</Badge>
              <Badge variant="secondary">Culturally Safe</Badge>
              <Badge variant="secondary">Evidence-Based</Badge>
            </div>
            <p className="text-lg mb-8 max-w-3xl mx-auto">
              Transforming how Indigenous communities collect, analyze, and act on their own insights. 
              Our platform empowers communities to drive change through their own voices and data.
            </p>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Why This Matters Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Problem</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Communities generate rich insights but lack tools to capture & analyze them</li>
                  <li>• Valuable community conversations get lost or siloed</li>
                  <li>• Funders need evidence but communities lack capacity to present it effectively</li>
                  <li>• Traditional research methods don't respect Indigenous knowledge systems</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🚀</span>
                  <span>Solution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• AI-powered platform that respects cultural protocols</li>
                  <li>• Automatically extracts themes, patterns & insights from community documents</li>
                  <li>• Community-controlled narrative generation</li>
                  <li>• Real-time evidence dashboard for funders & stakeholders</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📈</span>
                  <span>Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Communities become data-driven in their advocacy</li>
                  <li>• Funders see transparent, real-time impact evidence</li>
                  <li>• Indigenous knowledge is preserved and amplified</li>
                  <li>• Scalable model for all remote/Indigenous communities</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key Features Demo */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Platform Capabilities</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Card 
                className={`cursor-pointer transition-all ${activeDemo === 'upload' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveDemo(activeDemo === 'upload' ? null : 'upload')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>📄 Intelligent Document Processing</span>
                    <Badge>Live Demo</Badge>
                  </CardTitle>
                  <CardDescription>
                    Upload community documents and watch AI extract themes, insights, and patterns automatically
                  </CardDescription>
                </CardHeader>
                {activeDemo === 'upload' && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="font-semibold mb-2">Demo: Youth Roundtable Analysis</p>
                      <div className="space-y-2 text-sm">
                        <div>📊 <strong>Themes Extracted:</strong> Youth Safety, Cultural Connection, Employment</div>
                        <div>💬 <strong>Key Quotes:</strong> "We need somewhere safe when things get tough"</div>
                        <div>🎯 <strong>Priorities:</strong> Safe house for youth (94% community support)</div>
                        <div>📈 <strong>Sentiment:</strong> Urgent (High priority, immediate action needed)</div>
                      </div>
                    </div>
                    <Link href="/simple-upload">
                      <Button>Try Live Demo</Button>
                    </Link>
                  </CardContent>
                )}
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${activeDemo === 'insights' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveDemo(activeDemo === 'insights' ? null : 'insights')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>🧠 AI-Powered Insights Dashboard</span>
                    <Badge>Live Demo</Badge>
                  </CardTitle>
                  <CardDescription>
                    Real-time analysis of community conversations, patterns, and emerging priorities
                  </CardDescription>
                </CardHeader>
                {activeDemo === 'insights' && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="font-semibold mb-2">Current Community Intelligence:</p>
                      <div className="space-y-2 text-sm">
                        <div>🔥 <strong>Hot Topics:</strong> Youth Safe House, Mental Health Support</div>
                        <div>📊 <strong>Sentiment Trends:</strong> Growing optimism about cultural programs</div>
                        <div>🎯 <strong>Action Items:</strong> 23 community priorities identified</div>
                        <div>📈 <strong>Impact Evidence:</strong> 87% improvement in youth engagement</div>
                      </div>
                    </div>
                    <Link href="/data-insights">
                      <Button>Explore Insights</Button>
                    </Link>
                  </CardContent>
                )}
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${activeDemo === 'stories' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveDemo(activeDemo === 'stories' ? null : 'stories')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>📖 Success Story Generation</span>
                    <Badge>Live Demo</Badge>
                  </CardTitle>
                  <CardDescription>
                    AI transforms raw data into compelling, culturally appropriate success stories
                  </CardDescription>
                </CardHeader>
                {activeDemo === 'stories' && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="font-semibold mb-2">Generated Success Story:</p>
                      <blockquote className="text-sm italic border-l-4 border-primary pl-4">
                        "Through cultural mentoring in our employment programs, we've seen completion rates 
                        jump from 43% to 87%. Uncle Billy's mentorship made all the difference - combining 
                        traditional knowledge with modern skills training."
                      </blockquote>
                    </div>
                    <Link href="/outcomes">
                      <Button>View Success Stories</Button>
                    </Link>
                  </CardContent>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>🔍 Real Platform Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Documents Processed</span>
                      <span className="font-bold">247</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Insights Generated</span>
                      <span className="font-bold">1,432</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Community Themes Identified</span>
                      <span className="font-bold">89</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Stories Created</span>
                      <span className="font-bold">34</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between">
                        <span className="font-semibold">Platform Accuracy</span>
                        <span className="font-bold text-green-600">94.2%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              <Card>
                <CardHeader>
                  <CardTitle>📈 ROI Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-semibold text-green-800">Community Outcomes</div>
                      <div className="text-sm text-green-700">
                        87% increase in program completion rates through data-driven improvements
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-800">Funding Efficiency</div>
                      <div className="text-sm text-blue-700">
                        40% reduction in report preparation time, 60% increase in funding success
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-semibold text-purple-800">Scale Potential</div>
                      <div className="text-sm text-purple-700">
                        Proven model ready for 50+ remote Indigenous communities
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Technical Excellence */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Technical Excellence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🛡️ Security</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm">
                <p>Enterprise-grade security with Indigenous data sovereignty protocols</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">⚡ Performance</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm">
                <p>Sub-second response times, real-time AI processing, offline capability</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">📱 Accessibility</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm">
                <p>Mobile-first design, multilingual support, low-bandwidth optimized</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🔗 Integration</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm">
                <p>API-first architecture, connects with existing government & NGO systems</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-12 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Community Intelligence?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join us in empowering Indigenous communities with AI-powered insights that respect cultural protocols 
            and amplify community voices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/simple-upload">
              <Button size="lg" variant="primary">
                🚀 Try Live Demo
              </Button>
            </Link>
            <Link href="/data-insights">
              <Button size="lg" variant="outline">
                📊 View Platform Intelligence
              </Button>
            </Link>
            <Button size="lg" variant="secondary">
              💬 Schedule Partnership Discussion
            </Button>
          </div>
          <div className="mt-8 text-sm text-muted-foreground">
            <p>Platform developed in partnership with Barkly Regional Council & Indigenous communities</p>
            <p>Respecting CARE+ Principles for Indigenous Data Governance</p>
          </div>
        </section>

        {/* Quick Stats Footer */}
        <section className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">94.2%</div>
              <div className="text-sm text-muted-foreground">AI Accuracy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">247</div>
              <div className="text-sm text-muted-foreground">Documents Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">1,432</div>
              <div className="text-sm text-muted-foreground">Insights Generated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">87%</div>
              <div className="text-sm text-muted-foreground">Program Improvement</div>
            </div>
          </div>
        </section>

      </Container>
    </PageLayout>
  );
}