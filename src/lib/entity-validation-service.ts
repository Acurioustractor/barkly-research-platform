/**
 * Entity Validation & Manual Curation Service
 * Provides comprehensive tools for reviewing, validating, and curating AI-extracted entities
 * 
 * Note: This version works with the current database schema.
 * Additional validation fields will be added in a future migration.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

// Validation status enum
export enum ValidationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
  MERGED = 'merged'
}

// Validation action types
export enum ValidationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  EDIT = 'edit',
  MERGE = 'merge',
  FLAG = 'flag',
  ADD_MANUAL = 'add_manual'
}

// Interfaces for validation operations
export interface EntityValidationData {
  entityId: string;
  action: ValidationAction;
  userId: string;
  notes?: string;
  newData?: {
    name?: string;
    type?: string;
    category?: string;
    context?: string;
  };
  mergeWithEntityId?: string;
}

export interface PendingValidationOptions {
  limit?: number;
  offset?: number;
  minConfidence?: number;
  maxConfidence?: number;
  entityType?: string;
  documentId?: string;
  sortBy?: 'confidence' | 'extractedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface ValidationResult {
  entityId: string;
  validationStatus: string;
  validatedBy: string;
  validatedAt: Date;
  notes?: string;
}

export interface BatchValidationResult {
  successful: ValidationResult[];
  failed: Array<{
    entityId: string;
    error: string;
  }>;
}

class EntityValidationService {
  /**
   * Get entities pending validation
   */
  async getPendingValidation(options: PendingValidationOptions = {}) {
    const {
      limit = 50,
      offset = 0,
      minConfidence = 0,
      maxConfidence = 1,
      entityType,
      documentId,
      sortBy = 'confidence',
      sortOrder = 'desc'
    } = options;

    try {
      // Build where clause - simplified for current schema
      const whereClause: any = {
        confidence: {
          gte: minConfidence,
          lte: maxConfidence
        }
      };

      if (entityType) {
        whereClause.type = entityType;
      }

      if (documentId) {
        whereClause.documentId = documentId;
      }

      // For now, we'll consider all entities as "pending" since validation fields don't exist yet
      // In the future, this will filter by validationStatus

      // Get total count
      const total = await prisma.documentEntity.count({
        where: whereClause
      });

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'confidence') {
        orderBy.confidence = sortOrder;
      } else if (sortBy === 'extractedAt') {
        orderBy.createdAt = sortOrder;
      } else if (sortBy === 'name') {
        orderBy.name = sortOrder;
      }

      // Get entities
      const entities = await prisma.documentEntity.findMany({
        where: whereClause,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          // Include related data if needed
        }
      });

      const hasMore = offset + limit < total;

      logger.info('Retrieved pending validation entities', {
        total,
        retrieved: entities.length,
        hasMore,
        filters: options
      });

      return {
        entities,
        total,
        hasMore,
        pagination: {
          limit,
          offset,
          hasMore
        }
      };

    } catch (error) {
      logger.error('Error getting pending validation entities', error as Error);
      throw new Error('Failed to retrieve pending validation entities');
    }
  }

  /**
   * Validate a single entity
   */
  async validateEntity(validationData: EntityValidationData): Promise<ValidationResult> {
    const { entityId, action, userId, notes, newData, mergeWithEntityId } = validationData;

    try {
      // Get the entity first
      const entity = await prisma.documentEntity.findUnique({
        where: { id: entityId }
      });

      if (!entity) {
        throw new Error(`Entity with ID ${entityId} not found`);
      }

      let validationStatus: string;
      let updateData: any = {};

      switch (action) {
        case ValidationAction.APPROVE:
          validationStatus = ValidationStatus.VALIDATED;
          // For now, we'll just log the approval since validation fields don't exist
          logger.info('Entity approved', { entityId, userId, notes });
          break;

        case ValidationAction.REJECT:
          validationStatus = ValidationStatus.REJECTED;
          // For now, we could delete the entity or mark it somehow
          logger.info('Entity rejected', { entityId, userId, notes });
          // Optionally delete rejected entities
          // await prisma.documentEntity.delete({ where: { id: entityId } });
          break;

        case ValidationAction.EDIT:
          validationStatus = ValidationStatus.VALIDATED;
          if (newData) {
            updateData = {
              ...newData,
              // When validation fields are added, include:
              // validationStatus,
              // validatedBy: userId,
              // validatedAt: new Date(),
              // validationNotes: notes
            };
          }
          break;

        case ValidationAction.FLAG:
          validationStatus = ValidationStatus.NEEDS_REVIEW;
          logger.info('Entity flagged for review', { entityId, userId, notes });
          break;

        case ValidationAction.MERGE:
          if (!mergeWithEntityId) {
            throw new Error('mergeWithEntityId is required for merge action');
          }
          validationStatus = ValidationStatus.MERGED;
          // For now, we'll just log the merge since validation fields don't exist
          logger.info('Entity marked for merge', { entityId, mergeWithEntityId, userId, notes });
          break;

        default:
          throw new Error(`Invalid validation action: ${action}`);
      }

      // Update the entity if there's data to update
      if (Object.keys(updateData).length > 0) {
        await prisma.documentEntity.update({
          where: { id: entityId },
          data: updateData
        });
      }

      logger.info('Entity validation completed', {
        entityId,
        action,
        validationStatus,
        userId
      });

      return {
        entityId,
        validationStatus,
        validatedBy: userId,
        validatedAt: new Date(),
        notes
      };

    } catch (error) {
      logger.error('Error validating entity', error as Error, { entityId, action });
      throw error;
    }
  }

  /**
   * Batch validate multiple entities
   */
  async batchValidateEntities(validations: EntityValidationData[]): Promise<BatchValidationResult> {
    const successful: ValidationResult[] = [];
    const failed: Array<{ entityId: string; error: string }> = [];

    logger.info('Starting batch validation', { count: validations.length });

    for (const validation of validations) {
      try {
        const result = await this.validateEntity(validation);
        successful.push(result);
      } catch (error) {
        failed.push({
          entityId: validation.entityId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Batch validation completed', {
      total: validations.length,
      successful: successful.length,
      failed: failed.length
    });

    return {
      successful,
      failed
    };
  }

  /**
   * Get validation statistics
   */
  async getValidationStats() {
    try {
      const totalEntities = await prisma.documentEntity.count();
      
      // For now, return basic stats since validation fields don't exist
      const stats = {
        total: totalEntities,
        pending: totalEntities, // All entities are "pending" for now
        validated: 0,
        rejected: 0,
        needsReview: 0,
        merged: 0
      };

      logger.info('Retrieved validation statistics', stats);
      return stats;

    } catch (error) {
      logger.error('Error getting validation statistics', error as Error);
      throw new Error('Failed to retrieve validation statistics');
    }
  }

  /**
   * Find potential duplicate entities for merging
   */
  async findPotentialDuplicates(entityId: string, threshold: number = 0.8) {
    try {
      const entity = await prisma.documentEntity.findUnique({
        where: { id: entityId }
      });

      if (!entity) {
        throw new Error(`Entity with ID ${entityId} not found`);
      }

      // Simple duplicate detection based on name similarity and type
      const potentialDuplicates = await prisma.documentEntity.findMany({
        where: {
          id: { not: entityId },
          type: entity.type,
          name: {
            contains: entity.name,
            mode: 'insensitive'
          }
        },
        take: 10
      });

      logger.info('Found potential duplicates', {
        entityId,
        entityName: entity.name,
        duplicatesFound: potentialDuplicates.length
      });

      return potentialDuplicates;

    } catch (error) {
      logger.error('Error finding potential duplicates', error as Error, { entityId });
      throw new Error('Failed to find potential duplicates');
    }
  }

  /**
   * Add a manual entity
   */
  async addManualEntity(entityData: {
    documentId: string;
    type: string;
    name: string;
    category?: string;
    context?: string;
    userId: string;
  }) {
    try {
      // Skip document existence check for now to avoid schema issues
      // In a production system, you'd want to validate the document exists

      const entity = await prisma.documentEntity.create({
        data: {
          documentId: entityData.documentId,
          type: entityData.type,
          name: entityData.name,
          category: entityData.category,
          context: entityData.context,
          confidence: 1.0, // Manual entities have full confidence
          // Now we can use the validation fields with proper mapping
          validationStatus: 'validated',
          validatedBy: entityData.userId,
          validatedAt: new Date(),
          validationNotes: 'Manually added entity'
        }
      });

      logger.info('Manual entity added', {
        entityId: entity.id,
        name: entity.name,
        type: entity.type,
        documentId: entityData.documentId,
        userId: entityData.userId
      });

      return entity;

    } catch (error) {
      logger.error('Error adding manual entity', error as Error, {
        documentId: entityData.documentId,
        type: entityData.type,
        name: entityData.name,
        userId: entityData.userId
      });
      throw error; // Re-throw the original error for better debugging
    }
  }
}

// Export singleton instance
export const entityValidationService = new EntityValidationService(); 