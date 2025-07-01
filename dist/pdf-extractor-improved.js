"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImprovedPDFExtractor = void 0;
exports.extractTextFromPDFImproved = extractTextFromPDFImproved;
exports.extractTextFromMultiplePDFs = extractTextFromMultiplePDFs;
/**
 * Improved PDF text extraction with multiple fallback methods
 * Handles various PDF types including scanned documents
 */
const unpdf_1 = require("unpdf");
class ImprovedPDFExtractor {
    constructor(buffer) {
        this.maxRetries = 3;
        this.buffer = buffer;
    }
    /**
     * Extract text using multiple methods with fallbacks
     */
    async extractText() {
        const warnings = [];
        // Method 1: Try unpdf (primary method)
        try {
            const result = await this.extractWithUnpdf();
            if (result.text && result.text.length > 50) {
                return { ...result, method: 'unpdf', warnings };
            }
            warnings.push('unpdf extracted minimal text');
        }
        catch (error) {
            warnings.push(`unpdf failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Method 2: Try pdf-parse (more robust for complex PDFs)
        try {
            const result = await this.extractWithPdfParse();
            if (result.text && result.text.length > 50) {
                return { ...result, method: 'pdf-parse', warnings };
            }
            warnings.push('pdf-parse extracted minimal text');
        }
        catch (error) {
            warnings.push(`pdf-parse failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Method 3: Try manual buffer parsing (last resort for simple PDFs)
        try {
            const result = await this.extractWithBufferParsing();
            if (result.text && result.text.length > 50) {
                return { ...result, method: 'buffer-parse', warnings };
            }
            warnings.push('buffer parsing extracted minimal text');
        }
        catch (error) {
            warnings.push(`buffer parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Method 4: Check if PDF might be scanned (image-based)
        const isLikelyScanned = await this.checkIfScanned();
        if (isLikelyScanned) {
            warnings.push('PDF appears to be scanned/image-based. OCR would be needed.');
            return {
                text: '',
                pageCount: 0,
                method: 'failed',
                confidence: 0,
                warnings: [...warnings, 'Scanned PDF detected - OCR required but not available in current environment']
            };
        }
        // All methods failed
        return {
            text: '',
            pageCount: 0,
            method: 'failed',
            confidence: 0,
            warnings
        };
    }
    /**
     * Method 1: Extract using unpdf library
     */
    async extractWithUnpdf() {
        const uint8Array = new Uint8Array(this.buffer);
        const result = await (0, unpdf_1.extractText)(uint8Array, {
            mergePages: true,
            sort: true
        });
        const text = result.text || '';
        const confidence = this.calculateConfidence(text, result.totalPages || 0);
        return {
            text: this.cleanExtractedText(text),
            pageCount: result.totalPages || 0,
            confidence
        };
    }
    /**
     * Method 2: Extract using pdf-parse library
     */
    async extractWithPdfParse() {
        try {
            // Dynamic import to handle optional dependency
            const pdfParse = await Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf-parse.js')));
            const data = await pdfParse.default(this.buffer);
            const confidence = this.calculateConfidence(data.text, data.numpages);
            return {
                text: this.cleanExtractedText(data.text),
                pageCount: data.numpages,
                confidence,
                metadata: {
                    title: data.info?.Title,
                    author: data.info?.Author,
                    subject: data.info?.Subject,
                    keywords: data.info?.Keywords,
                    creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
                    modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined
                }
            };
        }
        catch (error) {
            // If pdf-parse is not installed, throw error to try next method
            throw new Error('pdf-parse not available');
        }
    }
    /**
     * Method 3: Manual buffer parsing (improved version)
     */
    async extractWithBufferParsing() {
        const text = this.extractTextFromBuffer();
        const pageCount = this.estimatePageCount();
        const confidence = this.calculateConfidence(text, pageCount);
        return {
            text: this.cleanExtractedText(text),
            pageCount,
            confidence
        };
    }
    /**
     * Improved buffer text extraction
     */
    extractTextFromBuffer() {
        const str = this.buffer.toString('utf8', 0, Math.min(this.buffer.length, 1000000)); // Limit to 1MB for performance
        const texts = [];
        // Method 1: Extract text between parentheses (common in PDFs)
        const parenMatches = str.match(/\(([^)]+)\)/g) || [];
        texts.push(...parenMatches.map(match => match.slice(1, -1)));
        // Method 2: Extract text between BT and ET markers (PDF text objects)
        const btEtMatches = str.match(/BT\s*(.*?)\s*ET/gs) || [];
        btEtMatches.forEach(match => {
            const tjMatches = match.match(/\((.*?)\)\s*Tj/g) || [];
            texts.push(...tjMatches.map(m => m.match(/\((.*?)\)/)?.[1] || ''));
        });
        // Method 3: Extract hex strings (another PDF text encoding)
        const hexMatches = str.match(/<([0-9A-Fa-f]+)>\s*Tj/g) || [];
        hexMatches.forEach(match => {
            const hex = match.match(/<([0-9A-Fa-f]+)>/)?.[1];
            if (hex) {
                try {
                    const text = Buffer.from(hex, 'hex').toString('utf8');
                    if (this.isValidText(text)) {
                        texts.push(text);
                    }
                }
                catch { }
            }
        });
        // Filter and clean extracted texts
        return texts
            .filter(text => text && text.length > 2 && this.isValidText(text))
            .join(' ')
            .trim();
    }
    /**
     * Check if text is valid (not binary garbage)
     */
    isValidText(text) {
        // Check if text has reasonable amount of printable characters
        const printableChars = text.match(/[\x20-\x7E]/g)?.length || 0;
        const totalChars = text.length;
        return totalChars > 0 && (printableChars / totalChars) > 0.8;
    }
    /**
     * Estimate page count from buffer
     */
    estimatePageCount() {
        const str = this.buffer.toString('utf8', 0, Math.min(this.buffer.length, 100000));
        // Look for page objects
        const pageMatches = str.match(/\/Type\s*\/Page[^s]/g) || [];
        if (pageMatches.length > 0) {
            return pageMatches.length;
        }
        // Fallback: estimate based on file size (rough estimate)
        const avgBytesPerPage = 3000; // Rough average
        return Math.max(1, Math.round(this.buffer.length / avgBytesPerPage));
    }
    /**
     * Check if PDF is likely scanned (image-based)
     */
    async checkIfScanned() {
        const str = this.buffer.toString('utf8', 0, Math.min(this.buffer.length, 50000));
        // Check for image streams
        const imageStreamCount = (str.match(/\/Image/g) || []).length;
        const textStreamCount = (str.match(/BT[\s\S]*?ET/g) || []).length;
        // If mostly images and very little text, likely scanned
        return imageStreamCount > 5 && textStreamCount < 2;
    }
    /**
     * Calculate confidence score for extracted text
     */
    calculateConfidence(text, pageCount) {
        if (!text || text.length === 0)
            return 0;
        let confidence = 0;
        // Factor 1: Text length relative to pages
        const avgCharsPerPage = text.length / Math.max(1, pageCount);
        if (avgCharsPerPage > 500)
            confidence += 0.3;
        else if (avgCharsPerPage > 200)
            confidence += 0.2;
        else if (avgCharsPerPage > 50)
            confidence += 0.1;
        // Factor 2: Word count
        const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
        if (wordCount > 100)
            confidence += 0.3;
        else if (wordCount > 50)
            confidence += 0.2;
        else if (wordCount > 20)
            confidence += 0.1;
        // Factor 3: Sentence structure (has periods, capitals)
        const sentences = text.match(/[.!?]+/g)?.length || 0;
        const capitals = text.match(/[A-Z]/g)?.length || 0;
        if (sentences > 5 && capitals > 10)
            confidence += 0.2;
        // Factor 4: Language patterns (common English words)
        const commonWords = ['the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'for', 'with'];
        const lowerText = text.toLowerCase();
        const commonWordCount = commonWords.filter(word => lowerText.includes(` ${word} `) || lowerText.includes(`${word} `) || lowerText.includes(` ${word}`)).length;
        if (commonWordCount >= 7)
            confidence += 0.2;
        else if (commonWordCount >= 4)
            confidence += 0.1;
        return Math.min(1, confidence);
    }
    /**
     * Clean extracted text
     */
    cleanExtractedText(text) {
        return text
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Remove control characters
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            // Fix common PDF extraction issues
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
            .replace(/(\w)(\d)/g, '$1 $2') // Add space between letters and numbers
            .replace(/(\d)(\w)/g, '$1 $2') // Add space between numbers and letters
            // Remove repeated spaces
            .replace(/ +/g, ' ')
            .trim();
    }
    /**
     * Get detailed metadata about the PDF
     */
    async getDetailedMetadata() {
        const basic = await this.extractText();
        const str = this.buffer.toString('utf8', 0, Math.min(this.buffer.length, 10000));
        const advanced = {
            isEncrypted: str.includes('/Encrypt'),
            isScanned: await this.checkIfScanned(),
            hasForm: str.includes('/AcroForm'),
            compressionType: str.includes('/FlateDecode') ? 'FlateDecode' :
                str.includes('/DCTDecode') ? 'DCTDecode' : undefined,
            pdfVersion: str.match(/%PDF-(\d\.\d)/)?.[1]
        };
        return { basic, advanced };
    }
}
exports.ImprovedPDFExtractor = ImprovedPDFExtractor;
/**
 * Factory function for easy use
 */
async function extractTextFromPDFImproved(buffer) {
    const extractor = new ImprovedPDFExtractor(buffer);
    return await extractor.extractText();
}
/**
 * Batch processing with progress callback
 */
async function extractTextFromMultiplePDFs(buffers, onProgress) {
    const results = new Map();
    for (let i = 0; i < buffers.length; i++) {
        const { buffer, filename } = buffers[i];
        if (onProgress) {
            onProgress(filename, i + 1, buffers.length);
        }
        try {
            const extractor = new ImprovedPDFExtractor(buffer);
            const result = await extractor.extractText();
            results.set(filename, result);
        }
        catch (error) {
            results.set(filename, {
                text: '',
                pageCount: 0,
                method: 'failed',
                confidence: 0,
                warnings: [`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
            });
        }
    }
    return results;
}
