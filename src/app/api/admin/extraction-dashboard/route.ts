import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-safe';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    // Get overall extraction statistics
    const stats = await prisma.$queryRaw<Array<any>>`
      SELECT 
        COUNT(*) as total_themes,
        AVG(confidence_score) as avg_confidence,
        COUNT(CASE WHEN confidence_score >= 0.8 THEN 1 END) as high_confidence,
        COUNT(CASE WHEN confidence_score < 0.6 THEN 1 END) as needs_review,
        COUNT(DISTINCT ai_model) as ai_models_used,
        MIN(created_at) as first_extraction,
        MAX(created_at) as last_extraction
      FROM document_themes
    `;

    // Get themes by AI model for tracking
    const byModel = await prisma.$queryRaw<Array<any>>`
      SELECT 
        ai_model,
        COUNT(*) as count,
        AVG(confidence_score) as avg_confidence
      FROM document_themes 
      GROUP BY ai_model 
      ORDER BY count DESC
    `;

    // Get recent high-volume extractions (potentially suspicious)
    const recentBulk = await prisma.$queryRaw<Array<any>>`
      SELECT 
        d.id,
        d.title,
        COUNT(dt.id) as themes_count,
        dt.ai_model,
        MAX(dt.created_at) as last_processed
      FROM documents d
      LEFT JOIN document_themes dt ON d.id = dt.document_id
      WHERE dt.created_at > NOW() - INTERVAL '2 hours'
      GROUP BY d.id, d.title, dt.ai_model
      HAVING COUNT(dt.id) > 20
      ORDER BY themes_count DESC
    `;

    // Get potential duplicates for review
    const suspiciousDuplicates = await prisma.$queryRaw<Array<any>>`
      WITH theme_counts AS (
        SELECT 
          theme_name,
          COUNT(*) as occurrence_count,
          AVG(confidence_score) as avg_confidence,
          ARRAY_AGG(DISTINCT ai_model) as models
        FROM document_themes 
        GROUP BY theme_name
        HAVING COUNT(*) > 1
      )
      SELECT * FROM theme_counts 
      WHERE occurrence_count >= 3
      ORDER BY occurrence_count DESC
      LIMIT 20
    `;

    // Get category distribution for validation
    const categoryStats = await prisma.$queryRaw<Array<any>>`
      SELECT 
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
        END as category,
        COUNT(*) as count,
        AVG(confidence_score) as avg_confidence
      FROM document_themes 
      GROUP BY category
      ORDER BY count DESC
    `;

    // Quality score calculation
    const overallStats = stats[0];
    const qualityScore = calculateOverallQuality(overallStats, byModel, categoryStats);

    return NextResponse.json({
      success: true,
      dashboard: {
        overview: {
          total_themes: parseInt(overallStats.total_themes),
          average_confidence: Math.round((overallStats.avg_confidence || 0) * 100) / 100,
          high_confidence: parseInt(overallStats.high_confidence),
          needs_review: parseInt(overallStats.needs_review),
          ai_models_used: parseInt(overallStats.ai_models_used),
          extraction_period: {
            first: overallStats.first_extraction,
            last: overallStats.last_extraction
          },
          quality_score: qualityScore
        },
        by_model: byModel.map((m: any) => ({
          model: m.ai_model,
          count: parseInt(m.count),
          avg_confidence: Math.round((m.avg_confidence || 0) * 100) / 100
        })),
        recent_bulk_extractions: recentBulk.map(b => ({
          document_id: b.id,
          title: b.title,
          themes_extracted: parseInt(b.themes_count),
          ai_model: b.ai_model,
          processed_at: b.last_processed
        })),
        potential_duplicates: suspiciousDuplicates.map(d => ({
          theme_name: d.theme_name,
          occurrences: parseInt(d.occurrence_count),
          avg_confidence: Math.round((d.avg_confidence || 0) * 100) / 100,
          models_used: d.models
        })),
        category_distribution: categoryStats.map(c => ({
          category: c.category,
          count: parseInt(c.count),
          avg_confidence: Math.round((c.avg_confidence || 0) * 100) / 100
        }))
      },
      recommendations: generateRecommendations(overallStats, recentBulk, suspiciousDuplicates, categoryStats)
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({
      error: 'Dashboard generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateOverallQuality(stats: any, models: any[], categories: any[]): number {
  const totalThemes = parseInt(stats.total_themes);
  const avgConfidence = stats.avg_confidence || 0;
  const highConfidenceRatio = parseInt(stats.high_confidence) / Math.max(totalThemes, 1);

  // Quality factors
  let score = 0;

  // Confidence scoring (40 points)
  score += avgConfidence * 40;

  // High confidence ratio (30 points)
  score += highConfidenceRatio * 30;

  // Category diversity (20 points)
  const categoryCount = categories.length;
  score += Math.min(categoryCount / 8, 1) * 20;

  // Model consistency (10 points)
  const modelCount = models.length;
  if (modelCount >= 2 && modelCount <= 4) {
    score += 10; // Good model diversity
  } else if (modelCount === 1) {
    score += 5; // Single model consistency
  }

  return Math.min(Math.round(score), 100);
}

function generateRecommendations(stats: any, bulkExtractions: any[], duplicates: any[], categories: any[]): string[] {
  const recommendations = [];

  const totalThemes = parseInt(stats.total_themes);
  const avgConfidence = stats.avg_confidence || 0;
  const needsReview = parseInt(stats.needs_review);

  // Confidence recommendations
  if (avgConfidence < 0.7) {
    recommendations.push("🔍 Average confidence is low - consider reviewing extraction prompts or adding human validation");
  }

  if (needsReview > totalThemes * 0.3) {
    recommendations.push("⚠️ Over 30% of extractions need review - implement automated filtering");
  }

  // Volume recommendations
  if (bulkExtractions.length > 0) {
    const maxBulk = Math.max(...bulkExtractions.map(b => parseInt(b.themes_count)));
    if (maxBulk > 100) {
      recommendations.push(`📊 Very high extraction volume detected (${maxBulk} themes) - verify quality and implement chunked validation`);
    }
  }

  // Duplicate recommendations
  if (duplicates.length > 10) {
    recommendations.push("🔄 High number of duplicate themes detected - improve deduplication logic");
  }

  // Category recommendations
  const categoryCount = categories.length;
  if (categoryCount < 5) {
    recommendations.push("🏷️ Limited category diversity - ensure extraction covers all service types");
  }

  // Barkly-specific recommendations
  const barklyKeywords = ['youth centre', 'business hub', 'student boarding', 'training'];
  const foundBarkly = categories.some(c =>
    barklyKeywords.some(keyword =>
      c.category.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  if (!foundBarkly) {
    recommendations.push("🎯 Key Barkly Regional Deal initiatives may be missing - verify coverage of 28 specific programs");
  }

  if (totalThemes > 200) {
    recommendations.push("✅ Excellent extraction volume - focus on quality validation and verification");
  }

  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    const { action, themeIds } = await request.json();

    if (!prisma) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 });
    }

    switch (action) {
      case 'bulk_verify':
        // Mark multiple themes as verified
        for (const id of themeIds) {
          await prisma.$queryRaw`
            UPDATE document_themes 
            SET confidence_score = GREATEST(confidence_score, 0.95)
            WHERE id = ${id}::uuid
          `;
        }
        break;

      case 'bulk_remove_duplicates':
        // Remove duplicate themes
        for (const id of themeIds) {
          await prisma.$queryRaw`
            DELETE FROM document_themes 
            WHERE id = ${id}::uuid
          `;
        }
        break;

      default:
        return NextResponse.json({
          error: 'Invalid bulk action'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Bulk action '${action}' completed for ${themeIds.length} themes`
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json({
      error: 'Bulk action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}