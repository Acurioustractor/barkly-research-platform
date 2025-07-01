#!/usr/bin/env tsx

/**
 * Create test PDFs for document processing testing
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_CONTENT = {
  simple: `
Youth Voice in Community Research

This is a test document for the Barkly research platform.

Key Points:
• Young people want to be heard
• Community programs need youth input
• Traditional approaches often fail

"We need real change, not just talk" - Youth participant

The research shows clear patterns of engagement.
  `,
  
  complex: `
Comprehensive Youth Research Report

Executive Summary

This comprehensive report examines youth participation in community development programs across multiple regions. The research was conducted over a 12-month period and involved interviews with over 500 young people aged 12-25.

Chapter 1: Introduction

Youth engagement in community development has become increasingly recognized as essential for creating sustainable and effective programs. However, traditional approaches often fail to genuinely incorporate youth perspectives.

1.1 Background

Historical context shows that youth have been systematically excluded from decision-making processes. This exclusion has led to:
- Programs that don't meet youth needs
- Low participation rates
- Lack of youth leadership development
- Missed opportunities for innovation

1.2 Research Questions

This study addresses the following key questions:
1. How do young people perceive current community programs?
2. What barriers prevent youth participation?
3. What strategies effectively engage youth?
4. How can communities build sustainable youth leadership?

Chapter 2: Methodology

2.1 Research Design

We employed a mixed-methods approach combining:
- Quantitative surveys (n=500)
- Qualitative interviews (n=50)
- Focus groups (12 groups)
- Participatory observation

2.2 Participant Demographics

Age distribution:
- 12-15 years: 30%
- 16-18 years: 35%
- 19-25 years: 35%

Gender:
- Female: 52%
- Male: 45%
- Non-binary: 3%

Chapter 3: Findings

3.1 Youth Perspectives

"Adults always think they know what's best for us, but they never actually ask us what we need." - Sarah, 17

Key themes emerged:
1. Desire for authentic participation
2. Need for skill development
3. Importance of peer support
4. Value of cultural connection

3.2 Barriers to Participation

- Lack of transportation (78%)
- Conflicting schedules (65%)
- Not feeling welcomed (45%)
- Language barriers (32%)

3.3 Successful Strategies

Programs that demonstrated success shared common features:
• Youth-led governance structures
• Flexible scheduling
• Mentorship programs
• Cultural relevance
• Clear pathways to leadership

Chapter 4: Recommendations

Based on our findings, we recommend:

4.1 Structural Changes
- Create youth advisory boards with real decision-making power
- Allocate dedicated funding for youth-led initiatives
- Implement youth-adult partnerships in program design

4.2 Program Design
- Develop culturally responsive programming
- Provide skill-building opportunities
- Create clear leadership pathways
- Ensure accessibility and inclusivity

4.3 Community Engagement
- Build partnerships with schools and youth organizations
- Engage families and community elders
- Utilize social media and digital platforms
- Create safe spaces for youth expression

Chapter 5: Conclusion

This research demonstrates that meaningful youth engagement requires fundamental shifts in how communities approach program development. When young people are genuinely included as partners rather than recipients, programs achieve better outcomes and communities become more vibrant and resilient.

The path forward requires commitment to:
- Authentic power-sharing
- Long-term investment
- Cultural responsiveness
- Continuous learning and adaptation

References

1. Smith, J. (2023). Youth Development in Practice. Community Press.
2. Johnson, M. & Lee, K. (2022). Engaging Young Voices. Youth Studies Quarterly, 15(3), 45-62.
3. Williams, R. (2023). Community-Based Participatory Research with Youth. Action Research Journal, 8(2), 123-141.

Appendices

Appendix A: Survey Instrument
Appendix B: Interview Protocol
Appendix C: Demographic Data
Appendix D: Program Case Studies
  `
};

async function createTestPDF(
  content: string, 
  filename: string,
  options: {
    pageCount?: number;
    includeImages?: boolean;
    includeMetadata?: boolean;
  } = {}
) {
  const { 
    pageCount = 1, 
    includeImages = false,
    includeMetadata = true 
  } = options;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Set metadata
  if (includeMetadata) {
    pdfDoc.setTitle('Youth Research Document');
    pdfDoc.setAuthor('Barkly Research Platform');
    pdfDoc.setSubject('Youth Voice and Community Development');
    pdfDoc.setKeywords(['youth', 'community', 'research', 'participation']);
    pdfDoc.setCreator('Test PDF Generator');
    pdfDoc.setProducer('pdf-lib');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
  }

  // Split content into lines
  const lines = content.trim().split('\n');
  const linesPerPage = 50;
  
  // Create pages
  for (let page = 0; page < pageCount; page++) {
    const pdfPage = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = pdfPage.getSize();
    
    let yPosition = height - 50;
    const startLine = page * linesPerPage;
    const endLine = Math.min(startLine + linesPerPage, lines.length);
    
    // Add page header
    pdfPage.drawText(`Page ${page + 1} of ${pageCount}`, {
      x: width - 100,
      y: height - 30,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Add content
    for (let i = startLine; i < endLine && yPosition > 50; i++) {
      const line = lines[i] || '';
      const fontSize = line.startsWith('#') ? 16 : 12;
      const font = line.startsWith('#') ? helveticaBold : helveticaFont;
      
      // Clean up markdown-style headers
      const text = line.replace(/^#+\s*/, '');
      
      if (text.trim()) {
        pdfPage.drawText(text, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: width - 100,
        });
      }
      
      yPosition -= fontSize + 5;
    }
    
    // Add simple image/rectangle if requested
    if (includeImages && page === 0) {
      pdfPage.drawRectangle({
        x: 50,
        y: yPosition - 100,
        width: 200,
        height: 80,
        color: rgb(0.9, 0.9, 0.9),
      });
      
      pdfPage.drawText('Figure 1: Youth Participation Model', {
        x: 50,
        y: yPosition - 120,
        size: 10,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  
  // Ensure test-documents directory exists
  const testDir = join(process.cwd(), 'test-documents');
  if (!existsSync(testDir)) {
    mkdirSync(testDir, { recursive: true });
  }
  
  // Write file
  const filepath = join(testDir, filename);
  writeFileSync(filepath, pdfBytes);
  
  console.log(`✅ Created test PDF: ${filepath}`);
  console.log(`   Size: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
  console.log(`   Pages: ${pageCount}`);
  
  return filepath;
}

async function main() {
  console.log('🔧 Creating test PDFs...\n');
  
  try {
    // Create simple test PDF
    await createTestPDF(
      TEST_CONTENT.simple,
      'simple-test.pdf',
      { pageCount: 1 }
    );
    
    // Create complex multi-page PDF
    await createTestPDF(
      TEST_CONTENT.complex,
      'complex-test.pdf',
      { pageCount: 5, includeImages: true }
    );
    
    // Create youth research sample
    await createTestPDF(
      TEST_CONTENT.complex,
      'sample-youth-research.pdf',
      { pageCount: 3, includeMetadata: true }
    );
    
    // Create corrupted PDF (for error testing)
    const testDir = join(process.cwd(), 'test-documents');
    const corruptPath = join(testDir, 'corrupt-test.pdf');
    writeFileSync(corruptPath, Buffer.from('%PDF-1.4\nThis is not a valid PDF'));
    console.log(`✅ Created corrupted test PDF: ${corruptPath}`);
    
    console.log('\n✨ All test PDFs created successfully!');
    
  } catch (error) {
    console.error('Failed to create test PDFs:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { createTestPDF };