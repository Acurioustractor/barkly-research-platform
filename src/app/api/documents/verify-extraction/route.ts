import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({
        error: 'Document ID is required'
      }, { status: 400 });
    }

    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Get document info
    const document = await prisma.$queryRaw<Array<any>>`
      SELECT id, title, content, processing_status, ai_analysis, processed_at
      FROM documents 
      WHERE id = ${documentId}::uuid
    `;

    if (!document || document.length === 0) {
      return NextResponse.json({
        error: 'Document not found'
      }, { status: 404 });
    }

    const doc = document[0];

    // Get all extracted themes (services) with metadata
    const themes = await prisma.$queryRaw<Array<any>>`
      SELECT 
        id, theme_name, description, confidence_score, 
        cultural_significance, ai_model, created_at,
        CASE 
          WHEN theme_name ILIKE '%initiative%' THEN 'initiative'
          WHEN theme_name ILIKE '%program%' THEN 'program'
          WHEN theme_name ILIKE '%service%' THEN 'service'
          WHEN theme_name ILIKE '%centre%' OR theme_name ILIKE '%center%' THEN 'facility'
          WHEN theme_name ILIKE '%hub%' THEN 'facility'
          WHEN theme_name ILIKE '%support%' THEN 'support'
          WHEN theme_name ILIKE '%development%' THEN 'development'
          WHEN theme_name ILIKE '%education%' THEN 'education'
          WHEN theme_name ILIKE '%youth%' THEN 'youth'
          WHEN theme_name ILIKE '%health%' THEN 'health'
          WHEN theme_name ILIKE '%housing%' THEN 'housing'
          WHEN theme_name ILIKE '%training%' THEN 'training'
          WHEN theme_name ILIKE '%employment%' THEN 'employment'
          ELSE 'general'
        END as detected_category
      FROM document_themes 
      WHERE document_id = ${documentId}::uuid
      ORDER BY confidence_score DESC, created_at DESC
    `;

    // Get quotes for verification
    const quotes = await prisma.$queryRaw<Array<any>>`
      SELECT id, quote_text, knowledge_holder, cultural_sensitivity, created_at
      FROM document_quotes 
      WHERE document_id = ${documentId}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Analyze extraction quality
    const qualityAnalysis = analyzeExtractionQuality(themes, doc);

    // Group by detected category
    const servicesByCategory = themes.reduce((acc: any, theme: any) => {
      const category = theme.detected_category;
      if (!acc[category]) acc[category] = [];
      acc[category].push({
        id: theme.id,
        name: theme.theme_name,
        description: theme.description,
        confidence: theme.confidence_score,
        cultural_significance: theme.cultural_significance,
        ai_model: theme.ai_model,
        created_at: theme.created_at
      });
      return acc;
    }, {});

    // Detect duplicates
    const duplicates = findDuplicateServices(themes);

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        title: doc.title,
        status: doc.processing_status,
        processed_at: doc.processed_at,
        content_length: doc.content?.length || 0,
        ai_analysis: doc.ai_analysis
      },
      extraction: {
        total_themes: themes.length,
        total_quotes: quotes.length,
        services_by_category: servicesByCategory,
        category_counts: Object.keys(servicesByCategory).reduce((acc: any, cat) => {
          acc[cat] = servicesByCategory[cat].length;
          return acc;
        }, {}),
        duplicates: duplicates,
        quality_analysis: qualityAnalysis
      },
      verification: {
        high_confidence: themes.filter((t: any) => t.confidence_score >= 0.8).length,
        medium_confidence: themes.filter((t: any) => t.confidence_score >= 0.5 && t.confidence_score < 0.8).length,
        low_confidence: themes.filter((t: any) => t.confidence_score < 0.5).length,
        needs_review: duplicates.length + themes.filter((t: any) => t.confidence_score < 0.6).length
      },
      sample_quotes: quotes.slice(0, 5)
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Analyze extraction quality
 */
function analyzeExtractionQuality(themes: any[], document: any) {
  const totalThemes = themes.length;
  const avgConfidence = themes.reduce((sum: number, t: any) => sum + (t.confidence_score || 0), 0) / Math.max(totalThemes, 1);

  // Check for expected Barkly initiatives
  const expectedKeywords = [
    'youth centre', 'business hub', 'sports program', 'student boarding',
    'crisis youth', 'training', 'education', 'health', 'housing'
  ];

  const foundKeywords = expectedKeywords.filter((keyword: string) =>
    themes.some((theme: any) =>
      theme.theme_name.toLowerCase().includes(keyword.toLowerCase()) ||
      theme.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  // Check for overly generic themes
  const genericThemes = themes.filter((theme: any) => {
    const name = theme.theme_name.toLowerCase();
    return name.length < 15 ||
      name.includes('general') ||
      name.includes('various') ||
      name.includes('multiple');
  });

  return {
    total_extracted: totalThemes,
    average_confidence: Math.round(avgConfidence * 100) / 100,
    expected_keywords_found: foundKeywords.length,
    expected_keywords_total: expectedKeywords.length,
    keyword_coverage: Math.round((foundKeywords.length / expectedKeywords.length) * 100),
    generic_themes: genericThemes.length,
    specific_themes: totalThemes - genericThemes.length,
    quality_score: calculateQualityScore(totalThemes, avgConfidence, foundKeywords.length, genericThemes.length),
    found_keywords: foundKeywords
  };
}

/**
 * Find potential duplicate services
 */
function findDuplicateServices(themes: any[]) {
  const duplicates = [];

  for (let i = 0; i < themes.length; i++) {
    for (let j = i + 1; j < themes.length; j++) {
      const similarity = calculateSimilarity(themes[i].theme_name, themes[j].theme_name);

      if (similarity > 0.7) {
        duplicates.push({
          theme1: {
            id: themes[i].id,
            name: themes[i].theme_name,
            confidence: themes[i].confidence_score
          },
          theme2: {
            id: themes[j].id,
            name: themes[j].theme_name,
            confidence: themes[j].confidence_score
          },
          similarity: Math.round(similarity * 100),
          recommended_action: themes[i].confidence_score >= themes[j].confidence_score ?
            'Keep theme1, review theme2' : 'Keep theme2, review theme1'
        });
      }
    }
  }

  return duplicates;
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(
  totalThemes: number,
  avgConfidence: number,
  keywordsFound: number,
  genericThemes: number
): number {
  let score = 0;

  // Theme count (max 25 points)
  score += Math.min(totalThemes / 30 * 25, 25);

  // Average confidence (max 30 points)
  score += avgConfidence * 30;

  // Keyword coverage (max 25 points)
  score += (keywordsFound / 9) * 25;

  // Specificity bonus (max 20 points)
  const specificityRatio = (totalThemes - genericThemes) / Math.max(totalThemes, 1);
  score += specificityRatio * 20;

  return Math.min(Math.round(score), 100);
}

export async function POST(request: NextRequest) {
  try {
    const { action, themeId, documentId } = await request.json();

    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    switch (action) {
      case 'mark_verified':
        await prisma.$queryRaw`
          UPDATE document_themes 
          SET confidence_score = GREATEST(confidence_score, 0.95)
          WHERE id = ${themeId}::uuid
        `;
        break;

      case 'mark_duplicate':
        await prisma.$queryRaw`
          UPDATE document_themes 
          SET confidence_score = 0.1,
          theme_name = '[DUPLICATE] ' || theme_name
          WHERE id = ${themeId}::uuid
        `;
        break;

      case 'mark_invalid':
        await prisma.$queryRaw`
          DELETE FROM document_themes 
          WHERE id = ${themeId}::uuid
        `;
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Verification action error:', error);
    return NextResponse.json({
      error: 'Action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}