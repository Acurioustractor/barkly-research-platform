/**
 * PDF text extraction using PDF.js - works in Vercel serverless
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Set worker to empty string to disable in serverless
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  error?: string;
}> {
  try {
    // Load PDF from buffer
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      standardFontDataUrl: undefined
    });
    
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items
        const pageText = textContent.items
          .map((item: { str?: string }) => item.str || '')
          .join(' ');
        
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      } catch (pageError) {
        console.error(`Error extracting page ${pageNum}:`, pageError);
        fullText += `\n--- Page ${pageNum} ---\n[Error extracting text]\n`;
      }
    }
    
    return {
      text: fullText.trim() || 'No text content found in PDF',
      pageCount
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'Failed to extract PDF text'
    };
  }
}