/**
 * Service for extracting system entities and relationships from documents
 * Uses AI to identify services, themes, outcomes, factors and their connections
 */

import { prisma } from '@/lib/database-safe';
import type { SystemEntityType, RelationshipType, RelationshipStrength } from '@prisma/client';

export interface ExtractedEntity {
  name: string;
  type: SystemEntityType;
  category?: string;
  description?: string;
  confidence: number;
  evidence: string;
}

export interface ExtractedRelationship {
  fromName: string;
  toName: string;
  type: RelationshipType;
  strength: RelationshipStrength;
  description: string;
  confidence: number;
  evidence: string;
}

export interface SystemExtractionResult {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

/**
 * Extract system entities and relationships from a chunk of text
 */
export async function extractSystemsFromChunk(
  chunkText: string,
  documentContext?: string
): Promise<SystemExtractionResult> {
  const systemPrompt = `You are an expert in youth development systems analysis. 
Extract system entities and their relationships from the text.
Focus on identifying services, themes, outcomes, and environmental factors relevant to youth support systems.`;

  const userPrompt = `Analyze this text to extract system entities and relationships:
${documentContext ? `Context: ${documentContext}\n\n` : ''}
Text: ${chunkText}

Extract and return in JSON format:
{
  "entities": [
    {
      "name": "Entity name (e.g., 'Youth Hub', 'Cultural Identity')",
      "type": "SERVICE|THEME|OUTCOME|FACTOR",
      "category": "Optional sub-category",
      "description": "Brief description of the entity",
      "confidence": 0.0-1.0,
      "evidence": "Direct quote or paraphrase supporting this entity"
    }
  ],
  "relationships": [
    {
      "fromName": "Source entity name",
      "toName": "Target entity name",
      "type": "SUPPORTS|BLOCKS|ENABLES|INFLUENCES|REQUIRES",
      "strength": "STRONG|MEDIUM|WEAK",
      "description": "How/why they are related",
      "confidence": 0.0-1.0,
      "evidence": "Text supporting this relationship"
    }
  ]
}

Guidelines:
- SERVICE: Programs, organizations, or support systems (e.g., "Youth Mentoring Program", "Family Support Services")
- THEME: Key issues, challenges, or focus areas (e.g., "Cultural Identity", "Mental Health", "Education Access")
- OUTCOME: Goals, impacts, or results (e.g., "Improved Wellbeing", "Community Engagement", "Academic Success")
- FACTOR: Environmental conditions, barriers, or enablers (e.g., "Funding Constraints", "Geographic Isolation", "Community Support")

Relationship types:
- SUPPORTS: A strengthens or promotes B
- BLOCKS: A hinders or prevents B
- ENABLES: A makes B possible
- INFLUENCES: A affects B (neutral)
- REQUIRES: A needs B to function

Focus on the most significant entities and relationships (3-7 of each).`;

  try {
    // Call the AI service directly
    const { callAI } = await import('@/lib/ai-service-direct');
    const result = await callAI(systemPrompt, userPrompt, {
      maxTokens: 2000,
      temperature: 0.3,
      responseFormat: 'json'
    });

    return result as SystemExtractionResult;
  } catch (error) {
    console.error('System extraction error:', error);
    // Return empty result on error
    return { entities: [], relationships: [] };
  }
}

/**
 * Process a document and extract all system entities and relationships
 */
export async function extractSystemsFromDocument(
  documentId: string,
  chunks: Array<{ id: string; text: string }>
): Promise<{
  entities: Map<string, ExtractedEntity>;
  relationships: ExtractedRelationship[];
}> {
  if (!prisma) {
    throw new Error('Database not available');
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { originalName: true }
  });

  const documentContext = document?.originalName || 'Unknown document';

  // Extract from each chunk
  const allEntities = new Map<string, ExtractedEntity>();
  const allRelationships: ExtractedRelationship[] = [];

  // Process chunks in batches
  const batchSize = 3;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(chunk =>
        extractSystemsFromChunk(chunk.text, documentContext)
          .catch(err => {
            console.error('Chunk extraction failed:', err);
            return { entities: [], relationships: [] };
          })
      )
    );

    // Aggregate results
    for (const result of batchResults) {
      // Merge entities (keep highest confidence for duplicates)
      for (const entity of result.entities) {
        const existing = allEntities.get(entity.name);
        if (!existing || entity.confidence > existing.confidence) {
          allEntities.set(entity.name, entity);
        }
      }

      // Add relationships
      allRelationships.push(...result.relationships);
    }
  }

  // Consolidate duplicate relationships
  const consolidatedRelationships = consolidateRelationships(allRelationships);

  return {
    entities: allEntities,
    relationships: consolidatedRelationships
  };
}

/**
 * Consolidate duplicate relationships, keeping the highest confidence version
 */
function consolidateRelationships(
  relationships: ExtractedRelationship[]
): ExtractedRelationship[] {
  const relationshipMap = new Map<string, ExtractedRelationship>();

  for (const rel of relationships) {
    const key = `${rel.fromName}-${rel.type}-${rel.toName}`;
    const existing = relationshipMap.get(key);

    if (!existing || rel.confidence > existing.confidence) {
      relationshipMap.set(key, rel);
    } else if (rel.confidence === existing.confidence) {
      // Combine evidence if confidence is equal
      existing.evidence += ' | ' + rel.evidence;
    }
  }

  return Array.from(relationshipMap.values());
}

/**
 * Store extracted systems data in the database
 */
export async function storeSystemsData(
  documentId: string,
  entities: Map<string, ExtractedEntity>,
  relationships: ExtractedRelationship[]
): Promise<void> {
  if (!prisma) {
    throw new Error('Database not available');
  }

  // First, store all entities
  const entityNameToId = new Map<string, string>();

  for (const [name, entity] of entities) {
    const created = await prisma.systemEntity.create({
      data: {
        documentId,
        name: entity.name,
        type: entity.type,
        category: entity.category,
        description: entity.description,
        confidence: entity.confidence,
        evidence: entity.evidence
      }
    });

    entityNameToId.set(name, created.id);
  }

  // Then store relationships
  const relationshipData = relationships
    .filter(rel => entityNameToId.has(rel.fromName) && entityNameToId.has(rel.toName))
    .map(rel => ({
      documentId,
      fromId: entityNameToId.get(rel.fromName)!,
      toId: entityNameToId.get(rel.toName)!,
      type: rel.type,
      strength: rel.strength,
      description: rel.description,
      confidence: rel.confidence,
      evidence: rel.evidence
    }));

  await prisma.systemRelationship.createMany({
    data: relationshipData
  });
}

/**
 * Generate aggregated systems map data from multiple documents
 */
export async function generateSystemsMapData(
  documentIds: string[],
  filters?: {
    entityTypes?: SystemEntityType[];
    minConfidence?: number;
  }
): Promise<{
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    group?: string;
    documents: string[];
    confidence: number;
  }>;
  connections: Array<{
    id: string;
    from: string;
    to: string;
    type: string;
    strength: string;
    description: string;
    documents: string[];
    confidence: number;
  }>;
}> {
  if (!prisma) {
    throw new Error('Database not available');
  }

  // Fetch entities
  const entityWhere: any = {
    documentId: { in: documentIds }
  };

  if (filters?.entityTypes) {
    entityWhere.type = { in: filters.entityTypes };
  }

  if (filters?.minConfidence) {
    entityWhere.confidence = { gte: filters.minConfidence };
  }

  const entities = await prisma.systemEntity.findMany({
    where: entityWhere,
    include: {
      document: {
        select: { id: true, originalName: true }
      }
    }
  });

  // Aggregate entities by name
  const entityMap = new Map<string, {
    id: string;
    label: string;
    type: SystemEntityType;
    documents: Set<string>;
    totalConfidence: number;
    count: number;
  }>();

  for (const entity of entities) {
    const existing = entityMap.get(entity.name);
    if (existing) {
      existing.documents.add(entity.document.originalName);
      existing.totalConfidence += entity.confidence;
      existing.count++;
    } else {
      entityMap.set(entity.name, {
        id: entity.name.toLowerCase().replace(/\s+/g, '-'),
        label: entity.name,
        type: entity.type,
        documents: new Set([entity.document.originalName]),
        totalConfidence: entity.confidence,
        count: 1
      });
    }
  }

  // Convert to nodes array
  const nodes = Array.from(entityMap.values()).map(entity => ({
    id: entity.id,
    label: entity.label,
    type: entity.type.toLowerCase(),
    documents: Array.from(entity.documents),
    confidence: entity.totalConfidence / entity.count
  }));

  // Fetch relationships
  const relationships = await prisma.systemRelationship.findMany({
    where: {
      documentId: { in: documentIds },
      confidence: { gte: filters?.minConfidence || 0 }
    },
    include: {
      fromEntity: true,
      toEntity: true,
      document: {
        select: { id: true, originalName: true }
      }
    }
  });

  // Aggregate relationships
  const relationshipMap = new Map<string, {
    from: string;
    to: string;
    type: RelationshipType;
    strength: RelationshipStrength;
    descriptions: string[];
    documents: Set<string>;
    totalConfidence: number;
    count: number;
  }>();

  for (const rel of relationships) {
    const fromId = rel.fromEntity.name.toLowerCase().replace(/\s+/g, '-');
    const toId = rel.toEntity.name.toLowerCase().replace(/\s+/g, '-');
    const key = `${fromId}-${rel.type}-${toId}`;

    const existing = relationshipMap.get(key);
    if (existing) {
      existing.documents.add(rel.document.originalName);
      existing.descriptions.push(rel.description);
      existing.totalConfidence += rel.confidence;
      existing.count++;
      // Upgrade strength if we find a stronger relationship
      if (rel.strength === 'STRONG' && existing.strength !== 'STRONG') {
        existing.strength = 'STRONG';
      } else if (rel.strength === 'MEDIUM' && existing.strength === 'WEAK') {
        existing.strength = 'MEDIUM';
      }
    } else {
      relationshipMap.set(key, {
        from: fromId,
        to: toId,
        type: rel.type,
        strength: rel.strength,
        descriptions: [rel.description],
        documents: new Set([rel.document.originalName]),
        totalConfidence: rel.confidence,
        count: 1
      });
    }
  }

  // Convert to connections array
  const connections = Array.from(relationshipMap.values()).map((rel, index) => ({
    id: `c${index + 1}`,
    from: rel.from,
    to: rel.to,
    type: rel.type.toLowerCase(),
    strength: rel.strength.toLowerCase(),
    description: rel.descriptions.join(' | '),
    documents: Array.from(rel.documents),
    confidence: rel.totalConfidence / rel.count
  }));

  return { nodes, connections };
}