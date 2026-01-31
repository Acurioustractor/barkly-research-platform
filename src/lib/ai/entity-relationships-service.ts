/**
 * Entity Relationships Service
 * Manages and analyzes relationships between document entities
 */

import { prisma } from '@/lib/database-safe';
import { logger } from '@/lib/utils/logger';
import type { EntityRelationship } from './entity-extraction-service';

export interface DocumentEntityRelationship {
  id: string;
  documentId: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  relationship: string;
  strength: number;
  description?: string;
  confidence: number;
  evidence?: string;
  context?: string;
  createdAt: Date;
  updatedAt: Date;
  fromEntity?: {
    id: string;
    name: string;
    type: string;
    category?: string;
  };
  toEntity?: {
    id: string;
    name: string;
    type: string;
    category?: string;
  };
}

export type RelationshipType = 'hierarchical' | 'associative' | 'causal' | 'temporal' | 'spatial';

export interface RelationshipAnalysis {
  totalRelationships: number;
  relationshipTypes: Record<RelationshipType, number>;
  strongestRelationships: DocumentEntityRelationship[];
  entityConnections: EntityConnection[];
  networkMetrics: NetworkMetrics;
  clusters: EntityCluster[];
}

export interface EntityConnection {
  entityId: string;
  entityName: string;
  entityType: string;
  connectionCount: number;
  averageStrength: number;
  relationshipTypes: string[];
  connectedEntities: Array<{
    id: string;
    name: string;
    type: string;
    relationship: string;
    strength: number;
  }>;
}

export interface NetworkMetrics {
  density: number;
  averageStrength: number;
  strongConnectionsCount: number;
  weakConnectionsCount: number;
  isolatedEntities: number;
  mostConnectedEntity?: {
    id: string;
    name: string;
    connectionCount: number;
  };
}

export interface EntityCluster {
  id: string;
  entities: string[];
  entityNames: string[];
  centralEntity: string;
  averageStrength: number;
  dominantRelationshipType: string;
  size: number;
}

export interface RelationshipInsight {
  type: 'pattern' | 'anomaly' | 'opportunity' | 'strength';
  title: string;
  description: string;
  entities: string[];
  confidence: number;
  actionable: boolean;
  recommendations?: string[];
}

class EntityRelationshipsService {
  /**
   * Store entity relationships extracted from text
   */
  async storeEntityRelationships(
    documentId: string,
    relationships: EntityRelationship[],
    entityNameToIdMap: Map<string, string>
  ): Promise<DocumentEntityRelationship[]> {
    if (!prisma || relationships.length === 0) {
      return [];
    }

    try {
      const relationshipData = relationships
        .filter(rel => 
          entityNameToIdMap.has(rel.fromEntity) && 
          entityNameToIdMap.has(rel.toEntity)
        )
        .map(rel => ({
          documentId,
          fromEntityId: entityNameToIdMap.get(rel.fromEntity)!,
          toEntityId: entityNameToIdMap.get(rel.toEntity)!,
          type: rel.type,
          relationship: rel.relationship,
          strength: rel.strength,
          confidence: 0.8, // Default confidence for extracted relationships
          evidence: rel.evidence.join(' | '),
          context: `Extracted relationship: ${rel.fromEntity} ${rel.relationship} ${rel.toEntity}`
        }));

      // Use createMany for bulk insert, handling duplicates
      if (!prisma) {
        throw new Error('Database connection not available');
      }
      
      const created = await Promise.allSettled(
        relationshipData.map(data => 
          prisma!.documentEntityRelationship.create({ data })
        )
      );

      const successful = created
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as any).value);

      logger.info('Entity relationships stored', {
        documentId,
        totalExtracted: relationships.length,
        stored: successful.length,
        failed: created.length - successful.length
      });

      return successful;

    } catch (error) {
      logger.error('Error storing entity relationships', error as Error, {
        documentId,
        relationshipCount: relationships.length
      });
      throw error;
    }
  }

  /**
   * Get relationships for a specific document
   */
  async getDocumentRelationships(
    documentId: string,
    options: {
      includeEntities?: boolean;
      minStrength?: number;
      relationshipType?: RelationshipType;
      limit?: number;
    } = {}
  ): Promise<DocumentEntityRelationship[]> {
    if (!prisma) return [];

    const {
      includeEntities = true,
      minStrength = 0,
      relationshipType,
      limit = 100
    } = options;

    try {
      const whereClause: any = {
        documentId,
        strength: { gte: minStrength }
      };

      if (relationshipType) {
        whereClause.type = relationshipType;
      }

      const relationships = await prisma.documentEntityRelationship.findMany({
        where: whereClause,
        orderBy: { strength: 'desc' },
        take: limit,
        include: includeEntities ? {
          fromEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          },
          toEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          }
        } : undefined
      });

      return relationships as DocumentEntityRelationship[];

    } catch (error) {
      logger.error('Error getting document relationships', error as Error, {
        documentId,
        options
      });
      return [];
    }
  }

  /**
   * Get relationships for a specific entity
   */
  async getEntityRelationships(
    entityId: string,
    options: {
      includeEntities?: boolean;
      direction?: 'from' | 'to' | 'both';
      minStrength?: number;
      limit?: number;
    } = {}
  ): Promise<DocumentEntityRelationship[]> {
    if (!prisma) return [];

    const {
      includeEntities = true,
      direction = 'both',
      minStrength = 0,
      limit = 50
    } = options;

    try {
      const whereClause: any = {
        strength: { gte: minStrength }
      };

      if (direction === 'from') {
        whereClause.fromEntityId = entityId;
      } else if (direction === 'to') {
        whereClause.toEntityId = entityId;
      } else {
        whereClause.OR = [
          { fromEntityId: entityId },
          { toEntityId: entityId }
        ];
      }

      const relationships = await prisma.documentEntityRelationship.findMany({
        where: whereClause,
        orderBy: { strength: 'desc' },
        take: limit,
        include: includeEntities ? {
          fromEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          },
          toEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          }
        } : undefined
      });

      return relationships as DocumentEntityRelationship[];

    } catch (error) {
      logger.error('Error getting entity relationships', error as Error, {
        entityId,
        options
      });
      return [];
    }
  }

  /**
   * Analyze relationships for a document or set of entities
   */
  async analyzeRelationships(
    documentId?: string,
    entityIds?: string[]
  ): Promise<RelationshipAnalysis> {
    if (!prisma) {
      return this.getEmptyAnalysis();
    }

    try {
      const whereClause: any = {};
      
      if (documentId) {
        whereClause.documentId = documentId;
      } else if (entityIds && entityIds.length > 0) {
        whereClause.OR = [
          { fromEntityId: { in: entityIds } },
          { toEntityId: { in: entityIds } }
        ];
      }

      // Get all relationships
      const relationships = await prisma.documentEntityRelationship.findMany({
        where: whereClause,
        include: {
          fromEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          },
          toEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          }
        }
      });

      // Analyze relationship types
      const relationshipTypes = relationships.reduce((acc, rel) => {
        acc[rel.type as RelationshipType] = (acc[rel.type as RelationshipType] || 0) + 1;
        return acc;
      }, {} as Record<RelationshipType, number>);

      // Get strongest relationships
      const strongestRelationships = (relationships as DocumentEntityRelationship[])
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 10);

      // Analyze entity connections
      const entityConnections = this.analyzeEntityConnections(relationships as DocumentEntityRelationship[]);

      // Calculate network metrics
      const networkMetrics = this.calculateNetworkMetrics(relationships as DocumentEntityRelationship[], entityConnections);

      // Identify clusters
      const clusters = this.identifyClusters(relationships as DocumentEntityRelationship[], entityConnections);

      return {
        totalRelationships: relationships.length,
        relationshipTypes,
        strongestRelationships,
        entityConnections,
        networkMetrics,
        clusters
      };

    } catch (error) {
      logger.error('Error analyzing relationships', error as Error, {
        documentId,
        entityIds
      });
      return this.getEmptyAnalysis();
    }
  }

  /**
   * Generate relationship insights
   */
  async generateRelationshipInsights(
    documentId?: string,
    entityIds?: string[]
  ): Promise<RelationshipInsight[]> {
    const analysis = await this.analyzeRelationships(documentId, entityIds);
    const insights: RelationshipInsight[] = [];

    // Pattern insights
    if (analysis.totalRelationships > 5) {
      const dominantType = Object.entries(analysis.relationshipTypes)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (dominantType && dominantType[1] > analysis.totalRelationships * 0.4) {
        insights.push({
          type: 'pattern',
          title: `Dominant ${dominantType[0]} relationships`,
          description: `${dominantType[1]} out of ${analysis.totalRelationships} relationships are ${dominantType[0]}-type, suggesting a strong ${dominantType[0]} structure.`,
          entities: [],
          confidence: 0.8,
          actionable: true,
          recommendations: [
            `Explore the ${dominantType[0]} structure further`,
            'Consider if this pattern indicates missing relationship types'
          ]
        });
      }
    }

    // Network density insights
    if (analysis.networkMetrics.density > 0.7) {
      insights.push({
        type: 'strength',
        title: 'Highly connected entity network',
        description: `Network density of ${(analysis.networkMetrics.density * 100).toFixed(1)}% indicates strong interconnections between entities.`,
        entities: [],
        confidence: 0.9,
        actionable: true,
        recommendations: [
          'Leverage these strong connections for analysis',
          'Look for central entities that could be key to understanding the domain'
        ]
      });
    } else if (analysis.networkMetrics.density < 0.2) {
      insights.push({
        type: 'opportunity',
        title: 'Sparse entity connections',
        description: `Low network density (${(analysis.networkMetrics.density * 100).toFixed(1)}%) suggests potential missing relationships.`,
        entities: [],
        confidence: 0.7,
        actionable: true,
        recommendations: [
          'Review text for additional relationship extraction',
          'Consider manual relationship curation',
          'Look for implicit relationships that may have been missed'
        ]
      });
    }

    // Most connected entity insight
    if (analysis.networkMetrics.mostConnectedEntity) {
      const entity = analysis.networkMetrics.mostConnectedEntity;
      insights.push({
        type: 'strength',
        title: 'Central entity identified',
        description: `"${entity.name}" has ${entity.connectionCount} connections, making it a central entity in the network.`,
        entities: [entity.id],
        confidence: 0.9,
        actionable: true,
        recommendations: [
          'Focus analysis on this central entity',
          'Explore its relationships for key insights',
          'Consider it as a starting point for further investigation'
        ]
      });
    }

    // Cluster insights
    if (analysis.clusters.length > 1) {
      const largestCluster = analysis.clusters.sort((a, b) => b.size - a.size)[0];
      insights.push({
        type: 'pattern',
        title: 'Entity clusters detected',
        description: `Found ${analysis.clusters.length} distinct entity clusters, with the largest containing ${largestCluster.size} entities centered around "${largestCluster.centralEntity}".`,
        entities: largestCluster.entities,
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Analyze each cluster separately',
          'Look for themes or patterns within clusters',
          'Consider cluster boundaries for organizing analysis'
        ]
      });
    }

    return insights;
  }

  /**
   * Create manual relationship between entities
   */
  async createManualRelationship(
    fromEntityId: string,
    toEntityId: string,
    relationship: string,
    type: RelationshipType,
    strength: number = 0.8,
    description?: string,
    userId?: string
  ): Promise<DocumentEntityRelationship | null> {
    if (!prisma) return null;

    try {
      // Get the entities to determine document
      const entities = await prisma.documentEntity.findMany({
        where: {
          id: { in: [fromEntityId, toEntityId] }
        }
      });

      if (entities.length !== 2) {
        throw new Error('Both entities must exist');
      }

      // Use the document from the first entity (they should be in the same document for manual relationships)
      const documentId = entities[0].documentId;

      const relationshipData = {
        documentId,
        fromEntityId,
        toEntityId,
        type,
        relationship,
        strength: Math.max(0, Math.min(1, strength)), // Clamp between 0 and 1
        description,
        confidence: 1.0, // Manual relationships have full confidence
        context: `Manual relationship created${userId ? ` by ${userId}` : ''}`
      };

      const created = await prisma.documentEntityRelationship.create({
        data: relationshipData,
        include: {
          fromEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          },
          toEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          }
        }
      });

      logger.info('Manual relationship created', {
        relationshipId: created.id,
        fromEntity: entities[0].name,
        toEntity: entities[1].name,
        relationship,
        type,
        userId
      });

      return created as DocumentEntityRelationship;

    } catch (error) {
      logger.error('Error creating manual relationship', error as Error, {
        fromEntityId,
        toEntityId,
        relationship,
        type,
        userId
      });
      return null;
    }
  }

  /**
   * Update relationship strength or details
   */
  async updateRelationship(
    relationshipId: string,
    updates: {
      strength?: number;
      description?: string;
      confidence?: number;
    },
    userId?: string
  ): Promise<DocumentEntityRelationship | null> {
    if (!prisma) return null;

    try {
      const updated = await prisma.documentEntityRelationship.update({
        where: { id: relationshipId },
        data: {
          ...updates,
          updatedAt: new Date(),
          context: updates.description ? 
            `Updated by ${userId || 'system'}: ${updates.description}` : 
            undefined
        },
        include: {
          fromEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          },
          toEntity: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true
            }
          }
        }
      });

      logger.info('Relationship updated', {
        relationshipId,
        updates,
        userId
      });

      return updated as DocumentEntityRelationship;

    } catch (error) {
      logger.error('Error updating relationship', error as Error, {
        relationshipId,
        updates,
        userId
      });
      return null;
    }
  }

  /**
   * Delete relationship
   */
  async deleteRelationship(
    relationshipId: string,
    userId?: string
  ): Promise<boolean> {
    if (!prisma) return false;

    try {
      await prisma.documentEntityRelationship.delete({
        where: { id: relationshipId }
      });

      logger.info('Relationship deleted', {
        relationshipId,
        userId
      });

      return true;

    } catch (error) {
      logger.error('Error deleting relationship', error as Error, {
        relationshipId,
        userId
      });
      return false;
    }
  }

  /**
   * Analyze entity connections
   */
  private analyzeEntityConnections(relationships: DocumentEntityRelationship[]): EntityConnection[] {
    const connectionMap = new Map<string, {
      entity: any;
      connections: any[];
      strengthSum: number;
      relationshipTypes: Set<string>;
    }>();

    // Build connection map
    relationships.forEach(rel => {
      // From entity
      if (!connectionMap.has(rel.fromEntityId)) {
        connectionMap.set(rel.fromEntityId, {
          entity: rel.fromEntity,
          connections: [],
          strengthSum: 0,
          relationshipTypes: new Set()
        });
      }

      // To entity
      if (!connectionMap.has(rel.toEntityId)) {
        connectionMap.set(rel.toEntityId, {
          entity: rel.toEntity,
          connections: [],
          strengthSum: 0,
          relationshipTypes: new Set()
        });
      }

      const fromConn = connectionMap.get(rel.fromEntityId)!;
      const toConn = connectionMap.get(rel.toEntityId)!;

      // Add connections
      fromConn.connections.push({
        id: rel.toEntityId,
        name: rel.toEntity?.name || '',
        type: rel.toEntity?.type || '',
        relationship: rel.relationship,
        strength: rel.strength
      });

      toConn.connections.push({
        id: rel.fromEntityId,
        name: rel.fromEntity?.name || '',
        type: rel.fromEntity?.type || '',
        relationship: rel.relationship,
        strength: rel.strength
      });

      // Update strength and relationship types
      fromConn.strengthSum += rel.strength;
      toConn.strengthSum += rel.strength;
      fromConn.relationshipTypes.add(rel.relationship);
      toConn.relationshipTypes.add(rel.relationship);
    });

    // Convert to EntityConnection array
    return Array.from(connectionMap.entries()).map(([entityId, data]) => ({
      entityId,
      entityName: data.entity?.name || 'Unknown',
      entityType: data.entity?.type || 'Unknown',
      connectionCount: data.connections.length,
      averageStrength: data.connections.length > 0 ? data.strengthSum / data.connections.length : 0,
      relationshipTypes: Array.from(data.relationshipTypes),
      connectedEntities: data.connections
    }));
  }

  /**
   * Calculate network metrics
   */
  private calculateNetworkMetrics(
    relationships: DocumentEntityRelationship[],
    entityConnections: EntityConnection[]
  ): NetworkMetrics {
    const totalEntities = entityConnections.length;
    const totalRelationships = relationships.length;
    
    // Network density: actual connections / possible connections
    const possibleConnections = totalEntities * (totalEntities - 1) / 2;
    const density = possibleConnections > 0 ? totalRelationships / possibleConnections : 0;

    // Average strength
    const averageStrength = relationships.length > 0 ? 
      relationships.reduce((sum, rel) => sum + rel.strength, 0) / relationships.length : 0;

    // Strong vs weak connections
    const strongConnectionsCount = relationships.filter(rel => rel.strength >= 0.7).length;
    const weakConnectionsCount = relationships.filter(rel => rel.strength < 0.3).length;

    // Isolated entities
    const isolatedEntities = entityConnections.filter(conn => conn.connectionCount === 0).length;

    // Most connected entity
    const mostConnectedEntity = entityConnections.length > 0 ? 
      entityConnections.reduce((max, conn) => 
        conn.connectionCount > max.connectionCount ? conn : max
      ) : undefined;

    return {
      density,
      averageStrength,
      strongConnectionsCount,
      weakConnectionsCount,
      isolatedEntities,
      mostConnectedEntity: mostConnectedEntity ? {
        id: mostConnectedEntity.entityId,
        name: mostConnectedEntity.entityName,
        connectionCount: mostConnectedEntity.connectionCount
      } : undefined
    };
  }

  /**
   * Identify entity clusters using simple connection analysis
   */
  private identifyClusters(
    relationships: DocumentEntityRelationship[],
    entityConnections: EntityConnection[]
  ): EntityCluster[] {
    const clusters: EntityCluster[] = [];
    const visited = new Set<string>();

    entityConnections.forEach(entity => {
      if (visited.has(entity.entityId)) return;

      // Simple clustering: entities with strong connections (>= 0.6)
      const strongConnections = entity.connectedEntities.filter(conn => conn.strength >= 0.6);
      
      if (strongConnections.length >= 2) {
        const clusterEntities = [entity.entityId, ...strongConnections.map(c => c.id)];
        const clusterEntityNames = [entity.entityName, ...strongConnections.map(c => c.name)];
        
        // Mark all as visited
        clusterEntities.forEach(id => visited.add(id));

        // Calculate cluster metrics
        const clusterRelationships = relationships.filter(rel => 
          clusterEntities.includes(rel.fromEntityId) && 
          clusterEntities.includes(rel.toEntityId)
        );

        const averageStrength = clusterRelationships.length > 0 ?
          clusterRelationships.reduce((sum, rel) => sum + rel.strength, 0) / clusterRelationships.length : 0;

        const relationshipTypeCounts = clusterRelationships.reduce((acc, rel) => {
          acc[rel.relationship] = (acc[rel.relationship] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const dominantRelationshipType = Object.entries(relationshipTypeCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

        clusters.push({
          id: `cluster-${clusters.length + 1}`,
          entities: clusterEntities,
          entityNames: clusterEntityNames,
          centralEntity: entity.entityName,
          averageStrength,
          dominantRelationshipType,
          size: clusterEntities.length
        });
      }
    });

    return clusters;
  }

  /**
   * Get empty analysis result
   */
  private getEmptyAnalysis(): RelationshipAnalysis {
    return {
      totalRelationships: 0,
      relationshipTypes: {
        hierarchical: 0,
        associative: 0,
        causal: 0,
        temporal: 0,
        spatial: 0
      },
      strongestRelationships: [],
      entityConnections: [],
      networkMetrics: {
        density: 0,
        averageStrength: 0,
        strongConnectionsCount: 0,
        weakConnectionsCount: 0,
        isolatedEntities: 0
      },
      clusters: []
    };
  }
}

// Export singleton instance
export const entityRelationshipsService = new EntityRelationshipsService(); 