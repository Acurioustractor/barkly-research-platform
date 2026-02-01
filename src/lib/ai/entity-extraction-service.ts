/**
 * Entity Extraction Service
 * Specialized service for extracting and processing entities from documents
 */

import { aiConfig } from '@/lib/ai/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface EntityExtractionResult {
  entities: Entity[];
  relationships: EntityRelationship[];
  entityMap: Map<string, Entity>;
}

export interface Entity {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'location' | 'concept' | 'event' | 'product' | 'service' | 'method' | 'tool';
  category?: string;
  confidence: number;
  mentions: number;
  contexts: string[];
  attributes: Record<string, any>;
  aliases?: string[];
  description?: string;
  importance: number;
}

export interface EntityRelationship {
  fromEntity: string;
  toEntity: string;
  relationship: string;
  strength: number;
  evidence: string[];
  type: 'hierarchical' | 'associative' | 'causal' | 'temporal' | 'spatial';
}

/**
 * Extract entities from text with enhanced AI processing
 */
export async function extractEntitiesFromText(
  text: string,
  context: string = '',
  options: {
    includeRelationships?: boolean;
    minConfidence?: number;
    maxEntities?: number;
    entityTypes?: string[];
  } = {}
): Promise<EntityExtractionResult> {
  const provider = getAIProvider();
  if (!provider) {
    console.warn('AI service not configured. Returning empty entity extraction result.');
    return {
      entities: [],
      relationships: [],
      entityMap: new Map()
    };
  }

  const systemPrompt = `You are an expert entity extraction system specialized in identifying and categorizing entities from text. Your task is to extract all meaningful entities and their relationships with high precision.

Entity Types to Extract:
- person: Individuals, roles, positions
- organization: Companies, institutions, groups, teams
- location: Places, addresses, regions, venues
- concept: Ideas, methodologies, frameworks, principles
- event: Meetings, activities, processes, incidents
- product: Tools, software, systems, deliverables
- service: Offerings, programs, initiatives
- method: Techniques, approaches, procedures
- tool: Technologies, platforms, instruments

For each entity, provide:
1. Exact name as it appears in text
2. Normalized canonical name
3. Type classification
4. Confidence score (0.0-1.0)
5. All contexts where mentioned
6. Key attributes and properties
7. Aliases or variations
8. Importance score (1-10)

${options.includeRelationships ? `
Also extract relationships between entities:
- Hierarchical: parent-child, member-of, part-of
- Associative: related-to, similar-to, connected-to
- Causal: causes, leads-to, results-in
- Temporal: before, after, during
- Spatial: located-in, near, adjacent-to
` : ''}`;

  const userPrompt = `Extract entities from this text:

${context ? `Context: ${context}` : ''}

Text to analyze:
${text}

Return results in this exact JSON format:
{
  "entities": [
    {
      "id": "unique-identifier",
      "name": "Entity name as it appears",
      "canonicalName": "Normalized name",
      "type": "person|organization|location|concept|event|product|service|method|tool",
      "category": "subcategory if applicable",
      "confidence": 0.0-1.0,
      "mentions": count,
      "contexts": ["context1", "context2"],
      "attributes": {
        "role": "...",
        "description": "...",
        "properties": "..."
      },
      "aliases": ["alternative names"],
      "importance": 1-10
    }
  ]${options.includeRelationships ? `,
  "relationships": [
    {
      "fromEntity": "entity-id",
      "toEntity": "entity-id", 
      "relationship": "relationship description",
      "strength": 0.0-1.0,
      "evidence": ["supporting text"],
      "type": "hierarchical|associative|causal|temporal|spatial"
    }
  ]` : ''}
}

Requirements:
- Extract ALL entities, even if mentioned only once
- Confidence >= ${options.minConfidence || 0.3}
- Focus on entities relevant to the document context
- Provide rich attributes and context
- Normalize similar entities (e.g., "John Smith" and "J. Smith")
- Be precise with entity types and categories`;

  try {
    const modelConfig = aiConfig.getModelConfig();
    let response: string;

    if (provider === 'anthropic' && anthropic) {
      const completion = await anthropic.messages.create({
        model: modelConfig.model,
        max_tokens: 8192,
        temperature: 0.1,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      const content = completion.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      response = content.text;
    } else if (provider === 'openai' && openai) {
      const completion = await openai.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: 'json_object' }
      });

      response = completion.choices[0]?.message?.content || '';
    } else {
      throw new Error(`AI client not available for provider: ${provider}`);
    }

    const result = extractJSON(response);

    // Process and normalize entities
    const processedEntities = processEntities(result.entities || []);
    const processedRelationships = processRelationships(result.relationships || [], processedEntities);

    // Create entity map for quick lookup
    const entityMap = new Map<string, Entity>();
    processedEntities.forEach(entity => {
      entityMap.set(entity.id, entity);
      entityMap.set(entity.name.toLowerCase(), entity);
    });

    return {
      entities: processedEntities,
      relationships: processedRelationships,
      entityMap
    };

  } catch (error) {
    console.error('Entity extraction error:', error);
    throw error;
  }
}

/**
 * Process and normalize extracted entities
 */
function processEntities(rawEntities: any[]): Entity[] {
  const entityMap = new Map<string, Entity>();

  rawEntities.forEach(entity => {
    const normalizedName = normalizeEntityName(entity.name || entity.canonicalName);
    const id = entity.id || generateEntityId(normalizedName, entity.type);

    if (entityMap.has(normalizedName)) {
      // Merge with existing entity
      const existing = entityMap.get(normalizedName)!;
      existing.mentions += entity.mentions || 1;
      existing.contexts = [...new Set([...existing.contexts, ...(entity.contexts || [])])];
      existing.confidence = Math.max(existing.confidence, entity.confidence || 0);
      if (entity.aliases) {
        existing.aliases = [...new Set([...(existing.aliases || []), ...entity.aliases])];
      }
    } else {
      // Add new entity
      entityMap.set(normalizedName, {
        id,
        name: entity.name || entity.canonicalName,
        type: entity.type,
        category: entity.category,
        confidence: entity.confidence || 0.5,
        mentions: entity.mentions || 1,
        contexts: entity.contexts || [],
        attributes: entity.attributes || {},
        aliases: entity.aliases || [],
        description: entity.attributes?.description,
        importance: entity.importance || 5
      });
    }
  });

  return Array.from(entityMap.values())
    .filter(entity => entity.confidence >= 0.3)
    .sort((a: any, b: any) => b.importance - a.importance);
}

/**
 * Process and validate entity relationships
 */
function processRelationships(rawRelationships: any[], entities: Entity[]): EntityRelationship[] {
  const entityIds = new Set(entities.map(e => e.id));

  return rawRelationships
    .filter(rel => entityIds.has(rel.fromEntity) && entityIds.has(rel.toEntity))
    .map(rel => ({
      fromEntity: rel.fromEntity,
      toEntity: rel.toEntity,
      relationship: rel.relationship,
      strength: rel.strength || 0.5,
      evidence: rel.evidence || [],
      type: rel.type || 'associative'
    }));
}

/**
 * Normalize entity names for deduplication
 */
function normalizeEntityName(name: string): string {
  return name.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Generate unique entity ID
 */
function generateEntityId(name: string, type: string): string {
  const normalized = name.replace(/\s+/g, '-').toLowerCase();
  return `${type}-${normalized}-${Date.now()}`;
}

/**
 * Extract JSON from AI response
 */
function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch { }
    }

    // Try to find JSON object in the text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch { }
    }

    throw new Error('No valid JSON found in response');
  }
}

/**
 * Get configured AI provider
 */
function getAIProvider(): 'openai' | 'anthropic' | null {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
}

/**
 * Batch process entities for large documents
 */
export async function batchExtractEntities(
  textChunks: string[],
  context: string = '',
  options: {
    includeRelationships?: boolean;
    minConfidence?: number;
    batchSize?: number;
  } = {}
): Promise<EntityExtractionResult> {
  const batchSize = options.batchSize || 5;
  const allEntities: Entity[] = [];
  const allRelationships: EntityRelationship[] = [];

  // Process chunks in batches
  for (let i = 0; i < textChunks.length; i += batchSize) {
    const batch = textChunks.slice(i, i + batchSize);
    const batchPromises = batch.map(chunk =>
      extractEntitiesFromText(chunk, context, options)
    );

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        allEntities.push(...result.value.entities);
        allRelationships.push(...result.value.relationships);
      }
    });
  }

  // Deduplicate and merge entities
  const mergedEntities = mergeEntities(allEntities);
  const mergedRelationships = deduplicateRelationships(allRelationships);

  // Create entity map
  const entityMap = new Map<string, Entity>();
  mergedEntities.forEach(entity => {
    entityMap.set(entity.id, entity);
    entityMap.set(entity.name.toLowerCase(), entity);
  });

  return {
    entities: mergedEntities,
    relationships: mergedRelationships,
    entityMap
  };
}

/**
 * Merge similar entities across chunks
 */
function mergeEntities(entities: Entity[]): Entity[] {
  const entityMap = new Map<string, Entity>();

  entities.forEach(entity => {
    const key = `${entity.type}-${normalizeEntityName(entity.name)}`;

    if (entityMap.has(key)) {
      const existing = entityMap.get(key)!;
      existing.mentions += entity.mentions;
      existing.contexts = [...new Set([...existing.contexts, ...entity.contexts])];
      existing.confidence = Math.max(existing.confidence, entity.confidence);
      existing.importance = Math.max(existing.importance, entity.importance);

      // Merge attributes
      existing.attributes = { ...existing.attributes, ...entity.attributes };

      // Merge aliases
      if (entity.aliases) {
        existing.aliases = [...new Set([...(existing.aliases || []), ...entity.aliases])];
      }
    } else {
      entityMap.set(key, { ...entity });
    }
  });

  return Array.from(entityMap.values())
    .sort((a: any, b: any) => b.importance - a.importance);
}

/**
 * Remove duplicate relationships
 */
function deduplicateRelationships(relationships: EntityRelationship[]): EntityRelationship[] {
  const relationshipMap = new Map<string, EntityRelationship>();

  relationships.forEach(rel => {
    const key = `${rel.fromEntity}-${rel.toEntity}-${rel.relationship}`;

    if (relationshipMap.has(key)) {
      const existing = relationshipMap.get(key)!;
      existing.strength = Math.max(existing.strength, rel.strength);
      existing.evidence = [...new Set([...existing.evidence, ...rel.evidence])];
    } else {
      relationshipMap.set(key, { ...rel });
    }
  });

  return Array.from(relationshipMap.values())
    .sort((a: any, b: any) => b.strength - a.strength);
} 