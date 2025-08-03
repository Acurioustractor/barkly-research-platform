/**
 * Claude Vision Document Processor for Images and Visual PDFs
 * Handles infographics, diagrams, charts, and image-heavy documents
 */
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface VisionExtractionResult {
  text: string;
  visualElements: VisualElement[];
  services: ServiceExtraction[];
  insights: VisionInsight[];
  confidence: number;
  method: 'claude-vision' | 'ocr-fallback' | 'failed';
  warnings: string[];
  metadata: {
    imageType: string;
    complexity: 'simple' | 'moderate' | 'complex';
    primaryContent: 'text' | 'diagram' | 'chart' | 'infographic' | 'mixed';
    estimatedTextDensity: number;
  };
}

export interface VisualElement {
  type: 'diagram' | 'chart' | 'table' | 'flowchart' | 'org_chart' | 'map' | 'infographic' | 'logo' | 'photo';
  description: string;
  location: string; // e.g., "top-left", "center", "bottom-right"
  relevance: number; // 0-1 score
  extractedData?: any;
}

export interface ServiceExtraction {
  serviceName: string;
  description: string;
  category: string;
  location?: string; // Where in the image this service is mentioned
  confidence: number;
  visualContext: string; // Description of how it appears visually
}

export interface VisionInsight {
  type: 'organizational_structure' | 'process_flow' | 'relationship' | 'gap_analysis' | 'community_voice';
  insight: string;
  evidence: string;
  confidence: number;
}

export class ClaudeVisionProcessor {
  
  /**
   * Process image or visual document using Claude Vision
   */
  async processVisualDocument(
    imageBuffer: Buffer, 
    fileName: string,
    context?: string
  ): Promise<VisionExtractionResult> {
    
    console.log(`[VisionProcessor] Processing visual document: ${fileName}`);
    
    try {
      // Convert buffer to base64 for Claude Vision
      const base64Image = imageBuffer.toString('base64');
      const mediaType = this.detectMediaType(fileName);
      
      // Generate specialized prompt based on file name and context
      const systemPrompt = this.generateSystemPrompt(fileName, context);
      const userPrompt = this.generateUserPrompt(fileName, context);
      
      // Call Claude Vision API
      const visionResult = await this.callClaudeVision(
        base64Image, 
        mediaType, 
        systemPrompt, 
        userPrompt
      );
      
      if (!visionResult) {
        throw new Error('Claude Vision returned empty result');
      }
      
      // Parse and structure the response
      const structuredResult = await this.parseVisionResponse(visionResult, fileName);
      
      console.log(`[VisionProcessor] Successfully processed ${fileName} - found ${structuredResult.services.length} services`);
      
      return structuredResult;
      
    } catch (error) {
      console.error(`[VisionProcessor] Failed to process ${fileName}:`, error);
      
      // Fallback to basic OCR if available
      return await this.fallbackProcessing(imageBuffer, fileName, error);
    }
  }

  /**
   * Call Claude Vision API with optimized prompts
   */
  private async callClaudeVision(
    base64Image: string,
    mediaType: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<any> {
    
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Use latest Claude with vision
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for consistent extraction
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as any,
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
    
    if (!responseText) {
      throw new Error('Empty response from Claude Vision');
    }

    return responseText;
  }

  /**
   * Generate specialized system prompt based on document type
   */
  private generateSystemPrompt(fileName: string, context?: string): string {
    const basePrompt = `You are an expert visual document analyst specializing in community intelligence and Indigenous Australian community development for the Barkly region and Tennant Creek.

CRITICAL CULTURAL PROTOCOLS:
- Respect Indigenous knowledge sovereignty and CARE+ principles
- Follow Traditional Owner protocols for cultural content
- Mark cultural sensitivity appropriately
- Prioritize community voice and self-determination

VISUAL ANALYSIS EXPERTISE:
- Organizational charts and service structures
- Community service flow diagrams
- Infographics and data visualizations
- Process maps and decision trees
- Community maps and geographical representations
- Training pathways and educational frameworks
- Policy frameworks and outcome indicators

EXTRACTION FOCUS:
- Community development initiatives and programs
- Youth services and educational pathways
- Government partnerships and service delivery
- Organizational structures and reporting lines
- Process flows and decision points
- Service gaps and community needs
- Funding streams and resource allocation
- Training and capacity building programs`;

    // Specialized prompts based on file name patterns
    if (fileName.toLowerCase().includes('story of change') || fileName.toLowerCase().includes('tree')) {
      return basePrompt + `\n\nSPECIAL FOCUS: This appears to be a "Story of Change" or systems change visualization. Pay special attention to:
- Causal relationships and change pathways
- Intervention points and leverage areas
- Outcome chains and impact flows
- Root causes and systemic issues
- Community assets and strengths
- Theory of change elements`;
    }
    
    if (fileName.toLowerCase().includes('training') || fileName.toLowerCase().includes('pathway')) {
      return basePrompt + `\n\nSPECIAL FOCUS: This appears to be a training or pathway diagram. Pay special attention to:
- Learning progressions and skill development
- Entry points and prerequisites
- Career pathways and opportunities
- Assessment and certification points
- Support services and wraparound care
- Employer engagement and job outcomes`;
    }
    
    if (fileName.toLowerCase().includes('youth') || fileName.toLowerCase().includes('strategy')) {
      return basePrompt + `\n\nSPECIAL FOCUS: This appears to be a youth strategy or program visualization. Pay special attention to:
- Age-specific services and programs
- Transition points and support needs
- Cultural identity and connection programs
- Education and employment pathways
- Crisis intervention and support services
- Community engagement and voice mechanisms`;
    }
    
    return basePrompt;
  }

  /**
   * Generate user prompt for specific document analysis
   */
  private generateUserPrompt(fileName: string, context?: string): string {
    return `Analyze this visual document comprehensively and extract community intelligence data in the following JSON format:

{
  "visual_summary": "Overall description of what the image shows",
  "primary_content_type": "diagram|chart|infographic|flowchart|org_chart|map|mixed",
  "complexity_level": "simple|moderate|complex",
  "visual_elements": [
    {
      "type": "diagram|chart|table|flowchart|org_chart|map|infographic|logo|photo",
      "description": "Detailed description of this element",
      "location": "top-left|top-center|top-right|center-left|center|center-right|bottom-left|bottom-center|bottom-right",
      "relevance": 0.9,
      "extracted_data": "Any specific data or text from this element"
    }
  ],
  "extracted_text": "All readable text from the image",
  "services_identified": [
    {
      "service_name": "Name of service or program",
      "description": "What this service does",
      "category": "youth|education|health|economic|housing|justice|cultural|community|infrastructure",
      "location_in_image": "Where this service appears",
      "confidence": 0.9,
      "visual_context": "How this service is represented visually"
    }
  ],
  "organizational_insights": [
    {
      "type": "organizational_structure|process_flow|relationship|gap_analysis|community_voice",
      "insight": "Key insight about community services or structure",
      "evidence": "Visual evidence supporting this insight",
      "confidence": 0.8
    }
  ],
  "relationships_and_connections": "Description of how elements connect",
  "community_intelligence": "Key insights for community development",
  "missing_or_unclear": "What information is unclear or missing"
}

CRITICAL: Return ONLY valid JSON. No additional text or formatting.

Document context: ${context || 'Barkly Regional Deal community services document'}
File name: ${fileName}`;
  }

  /**
   * Parse and structure Claude Vision response
   */
  private async parseVisionResponse(response: string, fileName: string): Promise<VisionExtractionResult> {
    try {
      // Clean the response
      let cleanedResponse = response.trim();
      
      // Remove any markdown formatting
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      // Transform to our result format
      const result: VisionExtractionResult = {
        text: parsed.extracted_text || '',
        visualElements: (parsed.visual_elements || []).map((ve: any) => ({
          type: ve.type || 'diagram',
          description: ve.description || '',
          location: ve.location || 'center',
          relevance: ve.relevance || 0.5,
          extractedData: ve.extracted_data
        })),
        services: (parsed.services_identified || []).map((service: any) => ({
          serviceName: service.service_name || '',
          description: service.description || '',
          category: service.category || 'community',
          location: service.location_in_image,
          confidence: service.confidence || 0.7,
          visualContext: service.visual_context || ''
        })),
        insights: (parsed.organizational_insights || []).map((insight: any) => ({
          type: insight.type || 'relationship',
          insight: insight.insight || '',
          evidence: insight.evidence || '',
          confidence: insight.confidence || 0.6
        })),
        confidence: this.calculateOverallConfidence(parsed),
        method: 'claude-vision',
        warnings: [],
        metadata: {
          imageType: fileName.split('.').pop() || 'unknown',
          complexity: parsed.complexity_level || 'moderate',
          primaryContent: parsed.primary_content_type || 'mixed',
          estimatedTextDensity: this.estimateTextDensity(parsed.extracted_text || '')
        }
      };
      
      return result;
      
    } catch (error) {
      console.error('Failed to parse vision response:', error);
      throw new Error(`Failed to parse Claude Vision response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fallback processing if Claude Vision fails
   */
  private async fallbackProcessing(
    imageBuffer: Buffer, 
    fileName: string, 
    originalError: any
  ): Promise<VisionExtractionResult> {
    
    console.log(`[VisionProcessor] Attempting fallback processing for ${fileName}`);
    
    // Basic image analysis without vision API
    const fileSize = imageBuffer.length;
    const fileType = fileName.split('.').pop()?.toLowerCase() || 'unknown';
    
    return {
      text: `[IMAGE PROCESSING FAILED] Visual document: ${fileName}`,
      visualElements: [{
        type: 'unknown',
        description: `Failed to process ${fileType} image (${fileSize} bytes)`,
        location: 'center',
        relevance: 0.1
      }],
      services: [],
      insights: [{
        type: 'gap_analysis',
        insight: `Visual document processing failed - manual review required for ${fileName}`,
        evidence: `Processing error: ${originalError instanceof Error ? originalError.message : 'Unknown error'}`,
        confidence: 0.9
      }],
      confidence: 0.1,
      method: 'failed',
      warnings: [
        'Claude Vision processing failed',
        'OCR fallback not available',
        'Manual review required for this visual document'
      ],
      metadata: {
        imageType: fileType,
        complexity: 'unknown',
        primaryContent: 'unknown',
        estimatedTextDensity: 0
      }
    };
  }

  /**
   * Detect media type for Claude Vision API
   */
  private detectMediaType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'pdf':
        return 'application/pdf'; // Claude can handle PDF images
      default:
        return 'image/png'; // Default fallback
    }
  }

  /**
   * Calculate overall confidence based on extraction quality
   */
  private calculateOverallConfidence(parsed: any): number {
    let confidence = 0;
    
    // Text extraction quality
    const textLength = (parsed.extracted_text || '').length;
    if (textLength > 500) confidence += 0.3;
    else if (textLength > 100) confidence += 0.2;
    else if (textLength > 20) confidence += 0.1;
    
    // Visual elements identified
    const visualElements = parsed.visual_elements || [];
    if (visualElements.length > 0) {
      confidence += Math.min(visualElements.length * 0.1, 0.3);
    }
    
    // Services identified
    const services = parsed.services_identified || [];
    if (services.length > 0) {
      confidence += Math.min(services.length * 0.05, 0.2);
    }
    
    // Insights generated
    const insights = parsed.organizational_insights || [];
    if (insights.length > 0) {
      confidence += Math.min(insights.length * 0.05, 0.2);
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Estimate text density in the image
   */
  private estimateTextDensity(text: string): number {
    if (!text) return 0;
    
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    // Rough estimation based on word count
    if (words.length > 500) return 0.9;
    if (words.length > 200) return 0.7;
    if (words.length > 100) return 0.5;
    if (words.length > 50) return 0.3;
    if (words.length > 10) return 0.1;
    
    return 0.05;
  }
}

/**
 * Helper function to process visual document
 */
export async function processVisualDocument(
  imageBuffer: Buffer, 
  fileName: string, 
  context?: string
): Promise<VisionExtractionResult> {
  const processor = new ClaudeVisionProcessor();
  return await processor.processVisualDocument(imageBuffer, fileName, context);
}