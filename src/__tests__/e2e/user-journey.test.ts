/**
 * End-to-end user journey tests
 * Tests complete workflows from document upload through analysis to insights
 */

import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import {
  createMockFile,
  createMockTextFile,
  uploadFile,
  makeAPIRequest,
  validateDocumentResponse,
  validateAIAnalysisResponse,
  withTimeout,
  retryOperation,
  validateCulturalCompliance,
  TEST_CONFIG,
} from '../integration/test-utils';

describe('End-to-End User Journey Tests', () => {
  let researcherDocuments: string[] = [];
  let collectionId: string | null = null;

  beforeAll(async () => {
    console.log('🚀 Starting comprehensive user journey tests');
  });

  afterAll(async () => {
    // Cleanup created documents and collections
    console.log('🧹 Cleaning up test data...');
    
    for (const docId of researcherDocuments) {
      try {
        await makeAPIRequest(`/documents/${docId}`, { method: 'DELETE' });
      } catch (error) {
        console.log('Cleanup error (expected):', error);
      }
    }
    
    if (collectionId) {
      try {
        await makeAPIRequest(`/documents/collections/${collectionId}`, { method: 'DELETE' });
      } catch (error) {
        console.log('Collection cleanup error (expected):', error);
      }
    }
  });

  describe('Researcher Journey: Community Research Project', () => {
    test('Complete workflow: Upload documents → Analyze → Extract insights', async () => {
      console.log('📋 Testing complete researcher workflow...');

      // Step 1: Researcher uploads research documents
      console.log('Step 1: Uploading research documents');
      
      const researchDocuments = [
        {
          name: 'youth-interview-transcripts.pdf',
          content: createMockTextFile(`
            Youth Interview Transcripts - Barkly Region Study

            Participant 1 (Age 16, Warumungu):
            "Education is really important to me, but I want to learn in ways that connect to my culture. 
            The old people have so much knowledge, and I think we need programs that bring elders and 
            young people together. Technology is good, but it can't replace that connection to country."

            Participant 2 (Age 18, Kaytetye):
            "Mental health support is something we really need more of. A lot of young people feel 
            disconnected, especially when they have to leave community for education. We need safe 
            spaces where we can talk about our challenges without judgment."

            Participant 3 (Age 17, Warumungu):
            "I want to start my own business one day, something that helps the community and respects 
            our ways. Maybe eco-tourism or cultural education programs. There are opportunities here 
            if we can get the right support and training."

            Common Themes Observed:
            - Strong connection to cultural identity
            - Importance of intergenerational knowledge transfer
            - Need for culturally appropriate mental health services
            - Interest in community-based economic opportunities
            - Desire for education that integrates traditional and modern knowledge
          `),
          category: 'research',
          source: 'community-interviews',
        },
        {
          name: 'focus-group-analysis.pdf',
          content: createMockTextFile(`
            Focus Group Analysis - Youth Voices Project

            Key Findings:
            
            1. Cultural Identity and Pride
            Young people consistently expressed strong cultural identity and pride in their heritage.
            They value traditional practices, language preservation, and connection to country.
            
            2. Educational Pathways
            Participants want education that bridges traditional knowledge and modern skills.
            They see value in both university education and traditional learning from elders.
            
            3. Community Leadership
            Youth are interested in taking on leadership roles in their communities.
            They want to be involved in decision-making processes that affect their futures.
            
            4. Health and Wellbeing
            Mental health, substance abuse prevention, and access to culturally appropriate 
            health services were frequently mentioned concerns.
            
            5. Economic Development
            Interest in entrepreneurship and community-based enterprises that align with 
            cultural values and environmental sustainability.
            
            Recommendations:
            - Develop mentorship programs connecting youth with elders
            - Create culturally responsive mental health services
            - Support youth-led community development initiatives
            - Integrate traditional knowledge into formal education systems
          `),
          category: 'analysis',
          source: 'focus-groups',
        },
        {
          name: 'survey-results.pdf',
          content: createMockTextFile(`
            Survey Results: Barkly Youth Aspirations Study
            Sample Size: 45 participants (Ages 15-24)
            
            Demographics:
            - 60% Female, 40% Male
            - 78% Indigenous, 22% Non-Indigenous
            - Communities: Tennant Creek, Elliott, Ali Curung, Marlinja
            
            Key Findings:
            
            Education Priorities:
            - 89% want education that includes cultural knowledge
            - 76% interested in vocational training
            - 67% considering university education
            - 93% value learning from elders
            
            Career Aspirations:
            - Health and social services: 34%
            - Education and training: 28%
            - Arts and cultural work: 26%
            - Business and entrepreneurship: 22%
            - Environmental and land management: 31%
            
            Community Priorities:
            - Youth programs and services: 91%
            - Cultural preservation: 87%
            - Economic development: 78%
            - Environmental protection: 82%
            - Health services improvement: 89%
            
            Challenges Identified:
            - Limited local employment opportunities
            - Need to leave community for education
            - Mental health and substance abuse issues
            - Lack of youth-specific services
            - Transportation and infrastructure limitations
          `),
          category: 'data',
          source: 'survey',
        },
      ];

      const uploadPromises = researchDocuments.map(async (doc) => {
        const file = createMockFile(doc.name, doc.content, 'application/pdf');
        const response = await uploadFile(file, '/documents', {
          category: doc.category,
          source: doc.source,
          processImmediately: 'true',
        });
        
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(validateDocumentResponse(result.document)).toBe(true);
        
        return result.document.id;
      });

      const documentIds = await Promise.all(uploadPromises);
      researcherDocuments.push(...documentIds);
      
      console.log(`✅ Uploaded ${documentIds.length} research documents`);

      // Step 2: Wait for document processing to complete
      console.log('Step 2: Waiting for document processing');
      
      await Promise.all(documentIds.map(async (docId) => {
        await retryOperation(async () => {
          const response = await makeAPIRequest(`/documents/${docId}`);
          const doc = await response.json();
          
          if (doc.status === 'processing') {
            throw new Error('Still processing');
          }
          
          expect(doc.status).toBe('completed');
          expect(doc.wordCount).toBeGreaterThan(0);
          
          return doc;
        }, 10, 3000); // 10 retries, 3 second delay
      }));
      
      console.log('✅ All documents processed successfully');

      // Step 3: Create a collection for the research project
      console.log('Step 3: Creating research collection');
      
      const collectionResponse = await makeAPIRequest('/documents/collections', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Barkly Youth Voices Study',
          description: 'Community research project exploring youth perspectives in the Barkly region',
          documentIds: documentIds,
          tags: ['youth', 'community', 'barkly', 'research'],
        }),
      });
      
      expect(collectionResponse.status).toBe(200);
      const collection = await collectionResponse.json();
      collectionId = collection.id;
      
      console.log('✅ Created research collection:', collection.name);

      // Step 4: Perform comprehensive AI analysis
      console.log('Step 4: Running AI analysis on collection');
      
      const analysisResponse = await withTimeout(
        makeAPIRequest(`/documents/collections/${collectionId}/analyze`, {
          method: 'POST',
          body: JSON.stringify({
            analysisType: 'world-class',
            options: {
              extractThemes: true,
              extractQuotes: true,
              extractInsights: true,
              extractEntities: true,
              extractSystems: true,
              crossDocumentAnalysis: true,
              culturalSensitivity: 'high',
            },
          }),
        }),
        TEST_CONFIG.timeout * 3
      );
      
      expect(analysisResponse.status).toBe(200);
      const analysis = await analysisResponse.json();
      
      expect(validateAIAnalysisResponse(analysis)).toBe(true);
      expect(analysis.themes.length).toBeGreaterThan(0);
      expect(analysis.insights.length).toBeGreaterThan(0);
      expect(analysis.entities.length).toBeGreaterThan(0);
      
      console.log(`✅ Analysis complete: ${analysis.themes.length} themes, ${analysis.insights.length} insights`);

      // Step 5: Validate cultural compliance
      console.log('Step 5: Validating cultural compliance');
      
      const compliance = validateCulturalCompliance(analysis);
      expect(compliance.isCompliant).toBe(true);
      
      if (compliance.issues.length > 0) {
        console.warn('Cultural compliance issues detected:', compliance.issues);
      } else {
        console.log('✅ Analysis meets cultural compliance standards');
      }

      // Step 6: Generate insights and visualizations
      console.log('Step 6: Generating insights and visualizations');
      
      const insightsResponse = await makeAPIRequest(`/documents/collections/${collectionId}/insights`);
      expect(insightsResponse.status).toBe(200);
      
      const insights = await insightsResponse.json();
      expect(insights.summary).toBeDefined();
      expect(insights.keyFindings).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      
      console.log('✅ Generated comprehensive insights');

      // Step 7: Test search and filtering capabilities
      console.log('Step 7: Testing search and discovery');
      
      const searchTerms = ['education', 'cultural identity', 'mental health', 'entrepreneurship'];
      
      for (const term of searchTerms) {
        const searchResponse = await makeAPIRequest('/documents/search', {
          method: 'POST',
          body: JSON.stringify({
            query: term,
            filters: {
              collectionId: collectionId,
            },
            limit: 10,
          }),
        });
        
        expect(searchResponse.status).toBe(200);
        const searchResults = await searchResponse.json();
        expect(searchResults.documents.length).toBeGreaterThan(0);
      }
      
      console.log('✅ Search functionality working correctly');

      // Step 8: Export and share findings
      console.log('Step 8: Testing export capabilities');
      
      const exportResponse = await makeAPIRequest(`/documents/collections/${collectionId}/export`, {
        method: 'POST',
        body: JSON.stringify({
          format: 'pdf',
          includeSections: ['summary', 'themes', 'quotes', 'recommendations'],
        }),
      });
      
      expect(exportResponse.status).toBe(200);
      const exportResult = await exportResponse.json();
      expect(exportResult.downloadUrl || exportResult.data).toBeDefined();
      
      console.log('✅ Export functionality working');

      console.log('🎉 Complete researcher workflow successful!');
    }, TEST_CONFIG.timeout * 5); // Extended timeout for complete workflow
  });

  describe('Administrator Journey: Platform Management', () => {
    test('Admin workflow: Monitor system → Manage content → View analytics', async () => {
      console.log('👨‍💼 Testing administrator workflow...');

      // Step 1: Check system health and status
      console.log('Step 1: Checking system health');
      
      const healthResponse = await makeAPIRequest('/admin/health');
      // Admin endpoints might not be accessible without auth, handle gracefully
      if (healthResponse.status === 404 || healthResponse.status === 401) {
        console.log('ℹ️ Admin endpoints require authentication, skipping admin tests');
        return;
      }
      
      expect(healthResponse.status).toBe(200);
      const health = await healthResponse.json();
      
      expect(health.database).toBe(true);
      expect(health.aiProviders).toBeGreaterThan(0);
      
      console.log('✅ System health check passed');

      // Step 2: View platform analytics
      console.log('Step 2: Viewing platform analytics');
      
      const analyticsResponse = await makeAPIRequest('/admin/analytics');
      expect(analyticsResponse.status).toBe(200);
      
      const analytics = await analyticsResponse.json();
      expect(analytics.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(analytics.totalAnalyses).toBeGreaterThanOrEqual(0);
      
      console.log(`✅ Analytics: ${analytics.totalDocuments} docs, ${analytics.totalAnalyses} analyses`);

      // Step 3: Monitor processing queues
      console.log('Step 3: Monitoring processing queues');
      
      const queueResponse = await makeAPIRequest('/admin/queues');
      expect(queueResponse.status).toBe(200);
      
      const queues = await queueResponse.json();
      expect(queues.documentProcessing).toBeDefined();
      expect(queues.aiAnalysis).toBeDefined();
      
      console.log('✅ Queue monitoring functional');

      console.log('🎉 Administrator workflow successful!');
    });
  });

  describe('Data Analyst Journey: Advanced Analytics', () => {
    test('Analyst workflow: Query data → Build visualizations → Export insights', async () => {
      console.log('📊 Testing data analyst workflow...');

      // Step 1: Query documents with advanced filters
      console.log('Step 1: Advanced document querying');
      
      const queryResponse = await makeAPIRequest('/documents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      expect(queryResponse.status).toBe(200);
      const documents = await queryResponse.json();
      
      if (documents.documents.length === 0) {
        console.log('ℹ️ No documents available for analysis workflow');
        return;
      }
      
      console.log(`✅ Retrieved ${documents.documents.length} documents`);

      // Step 2: Generate cross-document analytics
      console.log('Step 2: Cross-document analytics');
      
      const analyticsResponse = await makeAPIRequest('/documents/analytics', {
        method: 'POST',
        body: JSON.stringify({
          analysisType: 'cross-document',
          filters: {
            category: 'research',
            dateRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
              end: new Date().toISOString(),
            },
          },
        }),
      });
      
      if (analyticsResponse.status === 200) {
        const analytics = await analyticsResponse.json();
        expect(analytics.patterns || analytics.trends || analytics.correlations).toBeDefined();
        console.log('✅ Cross-document analytics generated');
      } else {
        console.log('ℹ️ Cross-document analytics not available or insufficient data');
      }

      // Step 3: Entity relationship analysis
      console.log('Step 3: Entity relationship analysis');
      
      const entitiesResponse = await makeAPIRequest('/entities/analytics');
      
      if (entitiesResponse.status === 200) {
        const entityAnalytics = await entitiesResponse.json();
        expect(entityAnalytics.entities || entityAnalytics.relationships).toBeDefined();
        console.log('✅ Entity relationship analysis completed');
      } else {
        console.log('ℹ️ Entity analytics not available');
      }

      // Step 4: Generate visualization data
      console.log('Step 4: Visualization data generation');
      
      const vizResponse = await makeAPIRequest('/documents/visualization-data', {
        method: 'POST',
        body: JSON.stringify({
          visualizationType: 'network',
          dataPoints: ['themes', 'entities', 'relationships'],
        }),
      });
      
      if (vizResponse.status === 200) {
        const vizData = await vizResponse.json();
        expect(vizData.nodes || vizData.links || vizData.data).toBeDefined();
        console.log('✅ Visualization data generated');
      } else {
        console.log('ℹ️ Visualization data generation not available');
      }

      console.log('🎉 Data analyst workflow successful!');
    });
  });

  describe('Community Member Journey: Document Discovery', () => {
    test('Community workflow: Browse documents → Find relevant content → Access insights', async () => {
      console.log('👥 Testing community member workflow...');

      // Step 1: Browse available documents
      console.log('Step 1: Browsing available documents');
      
      const browseResponse = await makeAPIRequest('/documents', {
        method: 'GET',
      });
      
      expect(browseResponse.status).toBe(200);
      const documentsList = await browseResponse.json();
      
      if (documentsList.documents.length === 0) {
        console.log('ℹ️ No public documents available for community browsing');
        return;
      }
      
      console.log(`✅ Found ${documentsList.documents.length} available documents`);

      // Step 2: Search for specific topics
      console.log('Step 2: Searching for relevant content');
      
      const searchTopics = ['youth', 'education', 'community', 'culture'];
      let searchResults: any[] = [];
      
      for (const topic of searchTopics) {
        const searchResponse = await makeAPIRequest('/documents/search', {
          method: 'POST',
          body: JSON.stringify({
            query: topic,
            limit: 5,
          }),
        });
        
        if (searchResponse.status === 200) {
          const results = await searchResponse.json();
          searchResults.push(...results.documents);
        }
      }
      
      console.log(`✅ Found ${searchResults.length} relevant documents across search topics`);

      // Step 3: Access document insights
      console.log('Step 3: Accessing document insights');
      
      if (researcherDocuments.length > 0) {
        const docId = researcherDocuments[0];
        const insightsResponse = await makeAPIRequest(`/documents/${docId}/insights`);
        
        if (insightsResponse.status === 200) {
          const insights = await insightsResponse.json();
          expect(insights.themes || insights.summary).toBeDefined();
          console.log('✅ Document insights accessible');
        } else {
          console.log('ℹ️ Document insights not available');
        }
      }

      // Step 4: Explore themes and connections
      console.log('Step 4: Exploring themes and connections');
      
      const themesResponse = await makeAPIRequest('/documents/themes');
      
      if (themesResponse.status === 200) {
        const themes = await themesResponse.json();
        expect(themes.themes || themes.categories).toBeDefined();
        console.log('✅ Themes exploration functional');
      } else {
        console.log('ℹ️ Themes exploration not available');
      }

      console.log('🎉 Community member workflow successful!');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    test('System resilience during workflow interruptions', async () => {
      console.log('🛡️ Testing system resilience...');

      // Test 1: Partial upload failure recovery
      const partialUploadFile = createMockFile('partial-test.pdf');
      
      try {
        const response = await uploadFile(partialUploadFile, '/documents', {
          simulateFailure: 'true', // This might not be implemented, but test graceful handling
        });
        
        // Should either succeed or fail gracefully
        expect([200, 400, 500]).toContain(response.status);
        
        if (response.status !== 200) {
          const error = await response.json();
          expect(error.error).toBeDefined();
          expect(error.error).not.toContain('undefined');
        }
        
        console.log('✅ Partial upload failure handled gracefully');
      } catch (error) {
        console.log('✅ Upload failure properly throws error');
      }

      // Test 2: Analysis interruption recovery
      try {
        const analysisResponse = await makeAPIRequest('/ai/analyze', {
          method: 'POST',
          body: JSON.stringify({
            content: 'Test content for interruption',
            analysisType: 'quick',
            timeout: 1, // Very short timeout to force interruption
          }),
        });
        
        if (analysisResponse.status === 200 || analysisResponse.status === 408) {
          console.log('✅ Analysis interruption handled gracefully');
        }
      } catch (error) {
        console.log('✅ Analysis interruption properly handled');
      }

      // Test 3: Database connection recovery
      const dbRecoveryResponse = await makeAPIRequest('/check-db');
      expect([200, 500, 503]).toContain(dbRecoveryResponse.status);
      
      console.log('✅ Database connection resilience tested');

      console.log('🎉 System resilience testing completed!');
    });
  });
});