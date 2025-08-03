/**
 * Unified Document Processor
 * Routes documents to appropriate processing methods based on type and content
 */
import { extractTextFromDOCX, DOCXExtractionResult } from './docx-extractor-enhanced';
import { processVisualDocument, VisionExtractionResult } from './vision-document-processor';
import { ImprovedPDFExtractor, ExtractionResult } from './pdf-extractor-improved';

export interface UnifiedExtractionResult {
  text: string;
  method: string;
  confidence: number;
  warnings: string[];
  metadata: any;
  services?: any[];
  insights?: any[];
  visualElements?: any[];
  processingType: 'text' | 'visual' | 'hybrid';
  originalResult: DOCXExtractionResult | VisionExtractionResult | ExtractionResult;
}

export class UnifiedDocumentProcessor {
  
  /**
   * Process any document type with intelligent routing
   */
  async processDocument(
    buffer: Buffer, 
    fileName: string, 
    mimeType?: string
  ): Promise<UnifiedExtractionResult> {
    
    console.log(`[UnifiedProcessor] Processing document: ${fileName} (${buffer.length} bytes)`);
    
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    const processingDecision = await this.determineProcessingMethod(buffer, fileName, mimeType, fileExtension);
    
    console.log(`[UnifiedProcessor] Selected processing method: ${processingDecision.method} (${processingDecision.reason})`);
    
    switch (processingDecision.method) {
      case 'docx':
        return await this.processDOCX(buffer, fileName);
      
      case 'vision':
        return await this.processWithVision(buffer, fileName);
      
      case 'pdf_text':
        return await this.processPDFText(buffer, fileName);
      
      case 'pdf_vision':
        return await this.processPDFVision(buffer, fileName);
      
      case 'image':
        return await this.processImage(buffer, fileName);
      
      default:
        throw new Error(`Unsupported document type: ${fileExtension}`);
    }
  }

  /**
   * Intelligently determine the best processing method
   */
  private async determineProcessingMethod(
    buffer: Buffer,
    fileName: string,
    mimeType?: string,
    fileExtension?: string
  ): Promise<{ method: string; reason: string; confidence: number }> {
    
    const fileSize = buffer.length;
    
    // DOCX files
    if (fileExtension === 'docx' || mimeType?.includes('wordprocessingml')) {
      return {
        method: 'docx',
        reason: 'Microsoft Word document detected',
        confidence: 0.95
      };
    }
    
    // Image files
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension || '')) {
      return {
        method: 'image',
        reason: `Image file (${fileExtension}) - using vision processing`,
        confidence: 0.95
      };
    }
    
    // PDF files - need to determine if text-based or image-heavy
    if (fileExtension === 'pdf' || mimeType?.includes('pdf')) {
      
      // Quick heuristics for PDF type detection
      
      // Very small PDFs are likely image-heavy
      if (fileSize < 1000) {
        return {
          method: 'pdf_vision',
          reason: 'Very small PDF - likely image-heavy',
          confidence: 0.8
        };
      }
      
      // File name analysis for visual content
      const visualKeywords = ['image', 'chart', 'diagram', 'infographic', 'tree', 'map', 'visual', 'story of change'];
      if (visualKeywords.some(keyword => fileName.toLowerCase().includes(keyword))) {
        return {
          method: 'pdf_vision',
          reason: 'PDF filename suggests visual content',
          confidence: 0.85
        };
      }
      
      // Check content density for PDFs
      try {
        const pdfExtractor = new ImprovedPDFExtractor(buffer);
        const isImageHeavy = await pdfExtractor.isImageHeavyPDF();
        
        if (isImageHeavy) {
          return {
            method: 'pdf_vision',
            reason: 'PDF detected as image-heavy',
            confidence: 0.9
          };
        } else {
          return {
            method: 'pdf_text',
            reason: 'PDF has sufficient text content',
            confidence: 0.8
          };
        }
      } catch (error) {
        console.warn('Could not analyze PDF content density:', error);
        
        // Fallback to text processing for larger PDFs
        if (fileSize > 50000) {
          return {
            method: 'pdf_text',
            reason: 'Large PDF - defaulting to text extraction',
            confidence: 0.6
          };
        } else {
          return {
            method: 'pdf_vision',
            reason: 'Small PDF - trying vision processing',
            confidence: 0.6
          };
        }
      }
    }
    
    // For other file types, try vision processing
    return {
      method: 'vision',
      reason: `Unknown file type (${fileExtension}) - attempting vision processing`,
      confidence: 0.3
    };
  }

  /**
   * Process DOCX documents
   */
  private async processDOCX(buffer: Buffer, fileName: string): Promise<UnifiedExtractionResult> {
    console.log(`[UnifiedProcessor] Processing DOCX: ${fileName}`);
    
    const docxResult = await extractTextFromDOCX(buffer);
    
    return {
      text: docxResult.text,
      method: `docx-${docxResult.method}`,
      confidence: docxResult.confidence,
      warnings: docxResult.warnings,
      metadata: {
        ...docxResult.metadata,
        wordCount: docxResult.wordCount,
        formatting: docxResult.formatting
      },
      processingType: 'text',
      originalResult: docxResult
    };
  }

  /**
   * Process PDF with text extraction
   */
  private async processPDFText(buffer: Buffer, fileName: string): Promise<UnifiedExtractionResult> {
    console.log(`[UnifiedProcessor] Processing PDF with text extraction: ${fileName}`);
    
    const pdfExtractor = new ImprovedPDFExtractor(buffer);
    const pdfResult = await pdfExtractor.extractText();
    
    return {
      text: pdfResult.text,
      method: `pdf-${pdfResult.method}`,
      confidence: pdfResult.confidence,
      warnings: pdfResult.warnings,
      metadata: {
        ...pdfResult.metadata,
        pageCount: pdfResult.pageCount
      },
      processingType: 'text',
      originalResult: pdfResult
    };
  }

  /**
   * Process PDF with vision (for image-heavy PDFs)
   */
  private async processPDFVision(buffer: Buffer, fileName: string): Promise<UnifiedExtractionResult> {
    console.log(`[UnifiedProcessor] Processing PDF with vision: ${fileName}`);
    
    const visionResult = await processVisualDocument(buffer, fileName, 'PDF with visual content');
    
    return {
      text: visionResult.text,
      method: `pdf-vision-${visionResult.method}`,
      confidence: visionResult.confidence,
      warnings: visionResult.warnings,
      metadata: visionResult.metadata,
      services: visionResult.services,
      insights: visionResult.insights,
      visualElements: visionResult.visualElements,
      processingType: 'visual',
      originalResult: visionResult
    };
  }

  /**
   * Process images with vision
   */
  private async processImage(buffer: Buffer, fileName: string): Promise<UnifiedExtractionResult> {
    console.log(`[UnifiedProcessor] Processing image: ${fileName}`);
    
    const visionResult = await processVisualDocument(buffer, fileName, 'Community intelligence image');
    
    return {
      text: visionResult.text,
      method: `image-${visionResult.method}`,
      confidence: visionResult.confidence,
      warnings: visionResult.warnings,
      metadata: visionResult.metadata,
      services: visionResult.services,
      insights: visionResult.insights,
      visualElements: visionResult.visualElements,
      processingType: 'visual',
      originalResult: visionResult
    };
  }

  /**
   * Process with vision (fallback for unknown types)
   */
  private async processWithVision(buffer: Buffer, fileName: string): Promise<UnifiedExtractionResult> {
    console.log(`[UnifiedProcessor] Processing with vision (unknown type): ${fileName}`);
    
    const visionResult = await processVisualDocument(buffer, fileName, 'Unknown document type');
    
    return {
      text: visionResult.text,
      method: `unknown-${visionResult.method}`,
      confidence: visionResult.confidence,
      warnings: [...visionResult.warnings, 'Unknown file type processed with vision'],
      metadata: visionResult.metadata,
      services: visionResult.services,
      insights: visionResult.insights,
      visualElements: visionResult.visualElements,
      processingType: 'visual',
      originalResult: visionResult
    };
  }

  /**
   * Get processing recommendations for a document
   */
  async getProcessingRecommendations(
    buffer: Buffer,
    fileName: string,
    mimeType?: string
  ): Promise<any> {
    
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    const fileSize = buffer.length;
    
    const recommendations = {
      fileName,
      fileSize,
      fileExtension,
      mimeType,
      recommendations: [] as string[],
      expectedProcessingTime: 'unknown',
      confidence: 0,
      suggestedMethod: 'unknown'
    };
    
    // Analyze and provide recommendations
    const processingDecision = await this.determineProcessingMethod(buffer, fileName, mimeType, fileExtension);
    
    recommendations.suggestedMethod = processingDecision.method;
    recommendations.confidence = processingDecision.confidence;
    
    // Size-based recommendations
    if (fileSize > 1000000) { // > 1MB
      recommendations.recommendations.push('Large file - expect longer processing time');
      recommendations.expectedProcessingTime = '30-60 seconds';
    } else if (fileSize > 100000) { // > 100KB
      recommendations.expectedProcessingTime = '10-30 seconds';
    } else {
      recommendations.expectedProcessingTime = '5-10 seconds';
    }
    
    // Type-specific recommendations
    switch (processingDecision.method) {
      case 'docx':
        recommendations.recommendations.push('DOCX document - will extract text and formatting');
        if (fileSize < 10000) {
          recommendations.recommendations.push('Small DOCX - may have limited content');
        }
        break;
        
      case 'pdf_vision':
        recommendations.recommendations.push('Image-heavy PDF - will use AI vision analysis');
        recommendations.recommendations.push('May contain diagrams, charts, or infographics');
        recommendations.expectedProcessingTime = '20-40 seconds';
        break;
        
      case 'pdf_text':
        recommendations.recommendations.push('Text-based PDF - will extract readable text');
        break;
        
      case 'image':
        recommendations.recommendations.push('Image file - will analyze visual content with AI');
        recommendations.expectedProcessingTime = '15-30 seconds';
        break;
    }
    
    // Quality predictions
    if (processingDecision.confidence > 0.8) {
      recommendations.recommendations.push('High confidence processing method selected');
    } else if (processingDecision.confidence < 0.5) {
      recommendations.recommendations.push('Low confidence - results may vary');
      recommendations.recommendations.push('Consider manual review after processing');
    }
    
    return recommendations;
  }
}

/**
 * Main export function for unified document processing
 */
export async function processAnyDocument(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<UnifiedExtractionResult> {
  const processor = new UnifiedDocumentProcessor();
  return await processor.processDocument(buffer, fileName, mimeType);
}

/**
 * Get processing recommendations without actually processing
 */
export async function getDocumentProcessingRecommendations(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<any> {
  const processor = new UnifiedDocumentProcessor();
  return await processor.getProcessingRecommendations(buffer, fileName, mimeType);
}