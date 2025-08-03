import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CommunityConversation {
  id: string;
  title: string;
  date: string;
  type: 'youth-roundtable' | 'elder-consultation' | 'success-story' | 'systems-change';
  culturalSensitivity: 'public' | 'community' | 'sacred';
  content: string;
  themes: string[];
  keyInsights: string[];
  communityImpact: string;
  relatedInitiatives: string[];
}

export async function GET(request: NextRequest) {
  try {
    const sampleDataPath = path.join(process.cwd(), 'sample-data', 'community-conversations');
    
    // Check if sample data directory exists
    if (!fs.existsSync(sampleDataPath)) {
      return NextResponse.json({
        conversations: [],
        message: 'No community conversations found'
      });
    }

    const files = fs.readdirSync(sampleDataPath);
    const conversations: CommunityConversation[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(sampleDataPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Parse the markdown content to extract key information
        const conversation = parseConversationContent(file, content);
        conversations.push(conversation);
      }
    }

    return NextResponse.json({
      conversations,
      totalCount: conversations.length,
      themes: extractCommonThemes(conversations),
      insights: generateCommunityInsights(conversations)
    });

  } catch (error) {
    console.error('Error loading community conversations:', error);
    return NextResponse.json(
      { error: 'Failed to load community conversations' },
      { status: 500 }
    );
  }
}

function parseConversationContent(filename: string, content: string): CommunityConversation {
  const lines = content.split('\n');
  const title = lines[0].replace('# ', '');
  
  // Extract metadata from content
  const dateMatch = content.match(/\*\*Date:\*\* (.+)/);
  const culturalSensitivityMatch = content.match(/\*\*Cultural Sensitivity:\*\* (.+)/);
  const impactMatch = content.match(/\*\*Community Impact:\*\* (.+)/);
  const impactMatch2 = content.match(/\*\*BRD Initiative Impact:\*\* (.+)/);
  const impactMatch3 = content.match(/\*\*Impact on BRD:\*\* (.+)/);
  
  // Determine conversation type from filename
  let type: CommunityConversation['type'] = 'youth-roundtable';
  if (filename.includes('elder')) type = 'elder-consultation';
  if (filename.includes('success')) type = 'success-story';
  if (filename.includes('systems')) type = 'systems-change';
  
  // Extract themes from content
  const themes = extractThemes(content);
  const keyInsights = extractKeyInsights(content);
  const relatedInitiatives = extractRelatedInitiatives(content);
  
  return {
    id: filename.replace('.md', ''),
    title,
    date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
    type,
    culturalSensitivity: culturalSensitivityMatch?.includes('Community') ? 'community' : 
                        culturalSensitivityMatch?.includes('Sacred') ? 'sacred' : 'public',
    content,
    themes,
    keyInsights,
    communityImpact: impactMatch?.[1] || impactMatch2?.[1] || impactMatch3?.[1] || 'Community engagement and feedback',
    relatedInitiatives
  };
}

function extractThemes(content: string): string[] {
  const themes: string[] = [];
  
  // Look for common themes in the content
  const themePatterns = [
    'safe house', 'youth', 'mental health', 'cultural mentoring', 'training',
    'employment', 'elder', 'traditional knowledge', 'two-way learning',
    'systems change', 'health services', 'cultural protocols', 'community consultation'
  ];
  
  themePatterns.forEach(pattern => {
    if (content.toLowerCase().includes(pattern)) {
      themes.push(pattern);
    }
  });
  
  return themes;
}

function extractKeyInsights(content: string): string[] {
  const insights: string[] = [];
  
  // Look for quoted text (community voices)
  const quoteMatches = content.match(/"([^"]+)"/g);
  if (quoteMatches) {
    insights.push(...quoteMatches.slice(0, 3)); // Take first 3 quotes
  }
  
  // Look for key findings or outcomes
  const findingsMatch = content.match(/### Key Findings[\s\S]*?(?=###|$)/);
  if (findingsMatch) {
    const findings = findingsMatch[0].split('\n').filter(line => line.startsWith('- '));
    insights.push(...findings.slice(0, 2));
  }
  
  return insights;
}

function extractRelatedInitiatives(content: string): string[] {
  const initiatives: string[] = [];
  
  // Look for BRD Initiative references
  const initiativeMatches = content.match(/BRD Initiative #\d+/g);
  if (initiativeMatches) {
    initiatives.push(...initiativeMatches);
  }
  
  // Look for Priority Reform references
  const reformMatches = content.match(/Priority Reform #\d+/g);
  if (reformMatches) {
    initiatives.push(...reformMatches);
  }
  
  return initiatives;
}

function extractCommonThemes(conversations: CommunityConversation[]): Array<{theme: string, frequency: number}> {
  const themeCount: Record<string, number> = {};
  
  conversations.forEach(conv => {
    conv.themes.forEach(theme => {
      themeCount[theme] = (themeCount[theme] || 0) + 1;
    });
  });
  
  return Object.entries(themeCount)
    .map(([theme, frequency]) => ({ theme, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
}

function generateCommunityInsights(conversations: CommunityConversation[]): Array<{
  insight: string,
  evidence: string[],
  actionItems: string[]
}> {
  const insights = [];
  
  // Cultural mentoring insight
  const mentoringConvs = conversations.filter(c => 
    c.themes.includes('cultural mentoring') || c.content.includes('mentor')
  );
  if (mentoringConvs.length > 0) {
    insights.push({
      insight: 'Cultural mentoring significantly improves training and employment outcomes',
      evidence: mentoringConvs.map(c => c.title),
      actionItems: [
        'Expand cultural mentoring to all training programs',
        'Establish mentor recognition and support program',
        'Create mentor training and development pathways'
      ]
    });
  }
  
  // Youth priorities insight
  const youthConvs = conversations.filter(c => c.type === 'youth-roundtable');
  if (youthConvs.length > 0) {
    insights.push({
      insight: 'Youth consistently prioritize safe spaces and mental health support',
      evidence: youthConvs.map(c => c.title),
      actionItems: [
        'Accelerate youth safe house development',
        'Expand culturally appropriate mental health services',
        'Increase youth participation in decision-making'
      ]
    });
  }
  
  // Systems change insight
  const systemsConvs = conversations.filter(c => c.type === 'systems-change');
  if (systemsConvs.length > 0) {
    insights.push({
      insight: 'Community-led systems change produces measurable improvements',
      evidence: systemsConvs.map(c => c.title),
      actionItems: [
        'Replicate successful transformation models',
        'Increase community leadership in systems change',
        'Develop systematic approach to cultural transformation'
      ]
    });
  }
  
  return insights;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type, culturalSensitivity } = body;
    
    // In a real implementation, this would save to database
    // For now, we'll just return a success response
    
    const newConversation: CommunityConversation = {
      id: `conv-${Date.now()}`,
      title,
      date: new Date().toISOString().split('T')[0],
      type: type || 'youth-roundtable',
      culturalSensitivity: culturalSensitivity || 'public',
      content,
      themes: extractThemes(content),
      keyInsights: extractKeyInsights(content),
      communityImpact: 'New community input',
      relatedInitiatives: extractRelatedInitiatives(content)
    };
    
    return NextResponse.json({
      success: true,
      conversation: newConversation,
      message: 'Community conversation added successfully'
    });
    
  } catch (error) {
    console.error('Error adding community conversation:', error);
    return NextResponse.json(
      { error: 'Failed to add community conversation' },
      { status: 500 }
    );
  }
}