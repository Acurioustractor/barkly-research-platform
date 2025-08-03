'use client';

import React from 'react';
import { PageLayout, Container } from '@/components/core';
import { IntelligenceAnalyzer } from '@/components/intelligence/IntelligenceAnalyzer';

export default function IntelligenceTestPage() {
  return (
    <PageLayout>
      <Container>
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Community Intelligence Analysis Test</h1>
            <p className="text-gray-600 max-w-3xl">
              Test the enhanced AI analysis engine that identifies community needs, service gaps, 
              success patterns, opportunities, and assets from community documents and stories.
            </p>
          </div>

          <IntelligenceAnalyzer />

          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Sample Text for Testing</h2>
            <p className="text-sm text-blue-800 mb-4">
              Try copying and pasting this sample text to see the community intelligence analysis in action:
            </p>
            <div className="bg-white p-4 border border-blue-300 rounded text-sm text-gray-700">
              <p className="mb-3">
                "The youth in Tennant Creek are struggling with limited employment opportunities after finishing school. 
                Many young people are leaving the community to find work in Darwin or Alice Springs, which is breaking 
                up families and weakening cultural connections. However, the new mentorship program run by local elders 
                has been incredibly successful - 85% of participants have either found employment or continued their education."
              </p>
              <p className="mb-3">
                "There's a real gap in mental health services for young people in the region. The nearest psychologist 
                is in Alice Springs, which means families have to travel 500km for appointments. This is creating a 
                crisis situation where young people aren't getting the support they need."
              </p>
              <p>
                "On the positive side, the community has incredible cultural assets - strong elder knowledge, 
                traditional land management practices, and a growing arts program that's starting to generate income. 
                If we could get funding for a local training center, we could combine traditional knowledge with 
                contemporary skills training to create real pathways for our young people."
              </p>
            </div>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}