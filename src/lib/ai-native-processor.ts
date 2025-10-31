// src/lib/ai-native-processor.ts

/**
 * AI-Native Document Processing System
 *
 * This replaces the legacy document-processor.ts with a unified system
 * that intelligently preprocesses all file types for optimal Claude analysis.
 */

export interface AIProcessedDocument {
  // Core content
  content: string;              // Intelligently processed text content
  fileType: 'pdf' | 'excel' | 'csv' | 'docx' | 'text' | 'image';
  fileName: string;

  // AI-Native enhancements
  metadata: {
    discipline: 'construction' | 'design' | 'trade';
    extractedStructure: {
      lineItems?: CostLineItem[];        // For Excel/CSV structured data
      textSections?: DocumentSection[];  // For PDFs/Word docs
      tables?: TableData[];              // For any tabular content
    };
    confidence: number;                  // Processing confidence score
    fileSize: number;
    processingRoute: 'worker' | 'blob';
  };

  // Claude optimization
  aiContext: {
    analysisType: 'construction' | 'design' | 'trade';
    processingHints: string[];           // Hints for Claude analysis
    structuredPrompt?: string;           // Pre-built prompt context
  };

  // Technical details
  isBase64: boolean;
  useBlobStorage: boolean;
  blobUrl?: string;
}

export interface CostLineItem {
  id: string;
  description: string;
  cost: number;
  division?: string;              // CSI division for construction
  phase?: string;                 // AIA phase for design
  system?: string;                // System type for trade
  quantity?: number;
  unit?: string;
  subcontractor?: string;
  confidence: number;
}

export interface DocumentSection {
  type: 'header' | 'paragraph' | 'list' | 'table' | 'footer';
  content: string;
  level?: number;                 // For headers
  pageNumber?: number;
  relevanceScore: number;         // How relevant for analysis
}

export interface TableData {
  headers: string[];
  rows: string[][];
  analysis: 'costs' | 'phases' | 'specifications' | 'timeline';
}

/**
 * Discipline Detection based on filename and content analysis
 */
export function detectDocumentDiscipline(fileName: string, contentSample?: string): 'construction' | 'design' | 'trade' {
  const name = fileName.toLowerCase();
  const content = contentSample?.toLowerCase() || '';

  const disciplineKeywords = {
    construction: [
      'concrete', 'masonry', 'steel', 'framing', 'excavation', 'foundation',
      'drywall', 'construction', 'builder', 'contractor', 'csi', 'division',
      'estimate', 'bid', 'proposal', 'general contractor', 'gc'
    ],
    design: [
      'schematic design', 'design development', 'aia', 'architectural',
      'engineering', 'consultant', 'architect', 'design', 'proposal',
      'arch', 'studio', 'firm', 'phase', 'deliverables', 'drawings'
    ],
    trade: [
      'electrical', 'hvac', 'plumbing', 'mechanical', 'commissioning',
      'controls', 'automation', 'electric', 'tech', 'systems', 'equipment',
      'installation', 'testing', 'subcontractor', 'specialty'
    ]
  };

  const scores = { construction: 0, design: 0, trade: 0 };

  Object.entries(disciplineKeywords).forEach(([discipline, keywords]) => {
    keywords.forEach(keyword => {
      const nameMatches = (name.match(new RegExp(keyword, 'gi')) || []).length;
      const contentMatches = (content.match(new RegExp(keyword, 'gi')) || []).length;

      // Weight filename matches higher than content matches
      scores[discipline as keyof typeof scores] += (nameMatches * 3) + contentMatches;
    });
  });

  const maxScore = Math.max(...Object.values(scores));
  const detectedDiscipline = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'construction';

  console.log(`🎯 AI-Native discipline detection for ${fileName}:`, scores, '→', detectedDiscipline);
  return detectedDiscipline as 'construction' | 'design' | 'trade';
}

/**
 * File Type Detection with intelligent classification
 */
export function detectFileType(fileName: string, mimeType: string): AIProcessedDocument['fileType'] {
  const extension = fileName.toLowerCase().split('.').pop() || '';

  // Enhanced detection logic
  if (mimeType.includes('pdf') || extension === 'pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || ['xlsx', 'xls'].includes(extension)) return 'excel';
  if (mimeType.includes('csv') || extension === 'csv') return 'csv';
  if (mimeType.includes('wordprocessing') || ['docx', 'doc'].includes(extension)) return 'docx';
  if (mimeType.includes('text') || ['txt'].includes(extension)) return 'text';
  if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';

  return 'pdf'; // Default fallback
}

/**
 * Generate AI-optimized processing hints based on file characteristics
 */
export function generateProcessingHints(
  fileType: AIProcessedDocument['fileType'],
  discipline: string,
  fileName: string
): string[] {
  const hints: string[] = [];

  // File type hints
  if (fileType === 'pdf') {
    hints.push('PDF document with potential text extraction challenges');
    hints.push('Look for tabular data that may be formatted as text');
  } else if (fileType === 'excel') {
    hints.push('Structured spreadsheet data with clear row/column format');
    hints.push('Prioritize numerical cost data and item descriptions');
  }

  // Discipline hints
  if (discipline === 'design') {
    hints.push('Focus on AIA phases and design deliverables');
    hints.push('Look for percentage-based fee structures');
  } else if (discipline === 'construction') {
    hints.push('Analyze CSI divisions and line item costs');
    hints.push('Identify subcontractor assignments');
  } else if (discipline === 'trade') {
    hints.push('Focus on technical systems and equipment specifications');
    hints.push('Look for installation and testing requirements');
  }

  // Filename hints
  if (fileName.includes('proposal')) {
    hints.push('Formal proposal document with executive summary');
  }
  if (fileName.includes('estimate')) {
    hints.push('Detailed cost breakdown with line items');
  }

  return hints;
}

/**
 * Create optimized prompt context for Claude based on processed document
 */
export function createStructuredPrompt(doc: AIProcessedDocument): string {
  const { metadata, aiContext } = doc;

  let prompt = `Document Analysis Context:\n`;
  prompt += `- File: ${doc.fileName} (${doc.fileType})\n`;
  prompt += `- Discipline: ${metadata.discipline}\n`;
  prompt += `- Processing Route: ${metadata.processingRoute}\n`;
  prompt += `- Confidence: ${Math.round(metadata.confidence * 100)}%\n\n`;

  if (metadata.extractedStructure.lineItems?.length) {
    prompt += `Extracted ${metadata.extractedStructure.lineItems.length} structured line items.\n`;
  }

  if (metadata.extractedStructure.textSections?.length) {
    prompt += `Extracted ${metadata.extractedStructure.textSections.length} document sections.\n`;
  }

  if (aiContext.processingHints.length) {
    prompt += `\nProcessing Hints:\n`;
    aiContext.processingHints.forEach(hint => prompt += `- ${hint}\n`);
  }

  return prompt;
}

/**
 * Legacy compatibility function - bridges to new AI-native system
 */
export interface LegacyProcessedDocument {
  content: string;
  fileType: string;
  fileName: string;
  isBase64: boolean;
  useBlobStorage?: boolean;
}

export function convertToLegacyFormat(aiDoc: AIProcessedDocument): LegacyProcessedDocument {
  return {
    content: aiDoc.content,
    fileType: aiDoc.fileType,
    fileName: aiDoc.fileName,
    isBase64: aiDoc.isBase64,
    useBlobStorage: aiDoc.useBlobStorage
  };
}

export function convertFromLegacyFormat(
  legacyDoc: LegacyProcessedDocument,
  discipline?: string
): AIProcessedDocument {
  const detectedDiscipline = discipline || detectDocumentDiscipline(legacyDoc.fileName, legacyDoc.content);

  return {
    content: legacyDoc.content,
    fileType: detectFileType(legacyDoc.fileName, ''),
    fileName: legacyDoc.fileName,
    isBase64: legacyDoc.isBase64,
    useBlobStorage: legacyDoc.useBlobStorage || false,
    metadata: {
      discipline: detectedDiscipline as 'construction' | 'design' | 'trade',
      extractedStructure: {},
      confidence: 0.7, // Default for legacy conversions
      fileSize: legacyDoc.content.length,
      processingRoute: 'blob' // Assume blob for legacy
    },
    aiContext: {
      analysisType: detectedDiscipline as 'construction' | 'design' | 'trade',
      processingHints: generateProcessingHints(
        detectFileType(legacyDoc.fileName, ''),
        detectedDiscipline,
        legacyDoc.fileName
      )
    }
  };
}