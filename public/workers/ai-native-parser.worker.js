// public/workers/ai-native-parser.worker.js

/**
 * AI-NATIVE DOCUMENT PROCESSING WORKER
 *
 * This replaces parser.worker.js with a unified system that intelligently
 * processes ALL file types for optimal Claude analysis.
 *
 * Key Features:
 * - True PDF text extraction with PDF.js
 * - Intelligent content structuring for all file types
 * - Unified AIProcessedDocument format
 * - Smart discipline detection
 * - Claude-optimized preprocessing
 */

// Import PDF.js for true PDF processing
importScripts('https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.min.mjs');

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
}

// Import XLSX for Excel processing
importScripts('https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js');

// File contexts for tracking processing state
const fileContexts = new Map();

// Main message handler
self.onmessage = async function(event) {
  const { type, fileId, ...data } = event.data;

  try {
    switch (type) {
      case 'parse':
        await parseDocument(fileId, data.file, data.signal);
        break;
      case 'parse_url':
        await parseFromUrl(fileId, data.url, data.fileName, data.fileSize, data.signal);
        break;
      case 'cancel':
        cancelFile(fileId);
        break;
      default:
        postFileMessage(fileId, 'error', {
          code: 'INVALID_MESSAGE_TYPE',
          message: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    postFileMessage(fileId, 'error', {
      code: 'WORKER_ERROR',
      message: error.message,
      detail: error.stack
    });
  }
};

// Enhanced file message posting
function postFileMessage(fileId, type, data) {
  self.postMessage({
    type,
    fileId,
    ...data
  });
}

// AI-NATIVE DOCUMENT PROCESSING ENTRY POINT
async function parseDocument(fileId, file, signal) {
  try {
    fileContexts.set(fileId, { cancelled: false, signal });

    postFileMessage(fileId, 'progress', {
      phase: 'reading',
      progress: 10,
      loaded: 0,
      total: file.size
    });

    // AI-Native discipline detection
    const discipline = detectDocumentDiscipline(file.name);
    if (discipline) {
      postFileMessage(fileId, 'discipline_hint', { disciplineHint: discipline });
    }

    postFileMessage(fileId, 'progress', {
      phase: 'parsing',
      progress: 30,
      loaded: file.size * 0.3,
      total: file.size
    });

    // Check for cancellation
    if (isFileCancelled(fileId)) return;

    // SMART FILE TYPE ROUTING with AI-native processing
    const aiProcessedDoc = await processDocumentAINative(fileId, file);

    postFileMessage(fileId, 'progress', {
      phase: 'normalizing',
      progress: 80,
      loaded: file.size * 0.8,
      total: file.size
    });

    // Check for cancellation
    if (isFileCancelled(fileId)) return;

    // Generate legacy CsiLine format for backward compatibility
    const lines = generateLegacyLines(aiProcessedDoc);

    postFileMessage(fileId, 'progress', {
      phase: 'normalizing',
      progress: 100,
      loaded: file.size,
      total: file.size
    });

    // Success with both new AI format and legacy compatibility
    postFileMessage(fileId, 'success', {
      lines: lines,
      processedDoc: aiProcessedDoc,
      parseConfidence: aiProcessedDoc.metadata.confidence,
      totalPages: aiProcessedDoc.metadata.extractedStructure.textSections?.length || 1,
      disciplineHint: aiProcessedDoc.metadata.discipline
    });

    fileContexts.delete(fileId);

  } catch (error) {
    postFileMessage(fileId, 'error', {
      code: 'PROCESSING_ERROR',
      message: error.message
    });
    fileContexts.delete(fileId);
  }
}

// AI-NATIVE DOCUMENT PROCESSING - THE CORE INTELLIGENCE
async function processDocumentAINative(fileId, file) {
  const fileType = detectFileType(file.name, file.type);
  const discipline = detectDocumentDiscipline(file.name);

  console.log(`🤖 AI-Native processing: ${file.name} as ${fileType} (${discipline} discipline)`);

  let processedDoc;

  switch (fileType) {
    case 'pdf':
      processedDoc = await processPDFAINative(fileId, file);
      break;
    case 'excel':
      processedDoc = await processExcelAINative(fileId, file);
      break;
    case 'csv':
      processedDoc = await processCSVAINative(fileId, file);
      break;
    case 'docx':
      processedDoc = await processDocxAINative(fileId, file);
      break;
    case 'text':
      processedDoc = await processTextAINative(fileId, file);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Enhance with AI context
  processedDoc.metadata.discipline = discipline;
  processedDoc.aiContext = {
    analysisType: discipline,
    processingHints: generateProcessingHints(fileType, discipline, file.name),
    structuredPrompt: createStructuredPrompt(processedDoc)
  };

  return processedDoc;
}

// AI-NATIVE PDF PROCESSING with PDF.js
async function processPDFAINative(fileId, file) {
  console.log(`📄 AI-Native PDF processing for ${file.name}`);

  try {
    // Convert Uint8Array to proper format for PDF.js
    const pdfData = file.data;

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;

    console.log(`📖 PDF loaded: ${pdfDoc.numPages} pages`);

    const textSections = [];
    const tables = [];
    let allText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      if (isFileCancelled(fileId)) return;

      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let pageText = '';
      const pageItems = [];

      textContent.items.forEach(item => {
        pageText += item.str + ' ';
        pageItems.push({
          text: item.str,
          transform: item.transform,
          fontName: item.fontName,
          fontSize: item.transform[0]
        });
      });

      // Intelligent text section creation
      const section = {
        type: 'paragraph',
        content: pageText.trim(),
        pageNumber: pageNum,
        relevanceScore: calculateRelevanceScore(pageText)
      };

      textSections.push(section);
      allText += pageText + '\n';

      // Detect potential tables
      const detectedTables = detectTablesInPage(pageItems);
      tables.push(...detectedTables);

      // Progress update
      postFileMessage(fileId, 'progress', {
        phase: 'parsing',
        progress: 30 + (pageNum / pdfDoc.numPages) * 40,
        loaded: 0,
        total: file.size
      });
    }

    // Clean up extracted text
    allText = cleanExtractedText(allText);

    console.log(`✅ PDF text extraction complete: ${allText.length} characters, ${textSections.length} sections`);

    return {
      content: allText,
      fileType: 'pdf',
      fileName: file.name,
      isBase64: false,
      useBlobStorage: false,
      metadata: {
        extractedStructure: {
          textSections: textSections,
          tables: tables
        },
        confidence: calculatePDFConfidence(allText, textSections.length),
        fileSize: file.size,
        processingRoute: 'worker'
      }
    };

  } catch (error) {
    console.error('PDF processing failed:', error);

    // Fallback to base64 format
    const base64Data = arrayBufferToBase64(file.data);
    return {
      content: `data:application/pdf;base64,${base64Data}`,
      fileType: 'pdf',
      fileName: file.name,
      isBase64: true,
      useBlobStorage: false,
      metadata: {
        extractedStructure: {},
        confidence: 0.3, // Lower confidence for fallback
        fileSize: file.size,
        processingRoute: 'worker'
      }
    };
  }
}

// AI-NATIVE EXCEL PROCESSING
async function processExcelAINative(fileId, file) {
  console.log(`📊 AI-Native Excel processing for ${file.name}`);

  // Convert Uint8Array to ArrayBuffer for XLSX
  const arrayBuffer = file.data.buffer.slice(
    file.data.byteOffset,
    file.data.byteOffset + file.data.byteLength
  );

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Extract structured data
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const lineItems = [];
  let lineId = 1;

  // Intelligent row processing
  for (let i = 1; i < jsonData.length; i++) { // Skip header row
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const lineItem = parseStructuredRow(row, lineId, sheetName);
    if (lineItem) {
      lineItems.push(lineItem);
      lineId++;
    }
  }

  // Convert to text for Claude
  const structuredText = convertLineItemsToText(lineItems);

  return {
    content: structuredText,
    fileType: 'excel',
    fileName: file.name,
    isBase64: false,
    useBlobStorage: false,
    metadata: {
      extractedStructure: {
        lineItems: lineItems
      },
      confidence: calculateExcelConfidence(lineItems),
      fileSize: file.size,
      processingRoute: 'worker'
    }
  };
}

// UTILITY FUNCTIONS

function detectFileType(fileName, mimeType) {
  const extension = fileName.toLowerCase().split('.').pop() || '';

  if (mimeType.includes('pdf') || extension === 'pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || ['xlsx', 'xls'].includes(extension)) return 'excel';
  if (mimeType.includes('csv') || extension === 'csv') return 'csv';
  if (mimeType.includes('wordprocessing') || ['docx', 'doc'].includes(extension)) return 'docx';
  if (mimeType.includes('text') || extension === 'txt') return 'text';

  return 'pdf'; // Default
}

function detectDocumentDiscipline(fileName) {
  const name = fileName.toLowerCase();

  const disciplineKeywords = {
    construction: ['concrete', 'masonry', 'steel', 'framing', 'excavation', 'foundation', 'drywall', 'construction', 'builder', 'contractor'],
    design: ['schematic design', 'design development', 'aia', 'architectural', 'engineering', 'consultant', 'architect', 'design', 'proposal', 'arch', 'studio', 'firm'],
    trade: ['electrical', 'hvac', 'plumbing', 'mechanical', 'commissioning', 'controls', 'automation', 'electric', 'tech', 'systems']
  };

  const scores = { construction: 0, design: 0, trade: 0 };

  Object.entries(disciplineKeywords).forEach(([discipline, keywords]) => {
    keywords.forEach(keyword => {
      if (name.includes(keyword)) {
        scores[discipline] += keyword.length;
      }
    });
  });

  const maxScore = Math.max(...Object.values(scores));
  const detectedDiscipline = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'construction';

  console.log(`🎯 Worker discipline detection for ${fileName}:`, scores, '→', detectedDiscipline);
  return detectedDiscipline;
}

function generateProcessingHints(fileType, discipline, fileName) {
  const hints = [];

  if (fileType === 'pdf') {
    hints.push('PDF with extracted text content');
    hints.push('Look for structured sections and cost breakdowns');
  } else if (fileType === 'excel') {
    hints.push('Structured spreadsheet with clear line items');
    hints.push('Focus on numerical data and descriptions');
  }

  if (discipline === 'design') {
    hints.push('Design services with AIA phase structure');
  } else if (discipline === 'construction') {
    hints.push('Construction project with CSI divisions');
  } else if (discipline === 'trade') {
    hints.push('Trade services with technical specifications');
  }

  return hints;
}

function createStructuredPrompt(doc) {
  let prompt = `AI-Native Processing Results:\n`;
  prompt += `- File: ${doc.fileName} (${doc.fileType})\n`;
  prompt += `- Content Length: ${doc.content.length} characters\n`;

  if (doc.metadata.extractedStructure.lineItems) {
    prompt += `- Extracted ${doc.metadata.extractedStructure.lineItems.length} line items\n`;
  }

  if (doc.metadata.extractedStructure.textSections) {
    prompt += `- Extracted ${doc.metadata.extractedStructure.textSections.length} text sections\n`;
  }

  prompt += `- Processing Confidence: ${Math.round(doc.metadata.confidence * 100)}%\n`;

  return prompt;
}

function calculateRelevanceScore(text) {
  // Simple relevance scoring based on content
  const relevantTerms = ['cost', 'price', '$', 'total', 'amount', 'fee', 'estimate', 'bid'];
  let score = 0;

  relevantTerms.forEach(term => {
    score += (text.toLowerCase().match(new RegExp(term, 'g')) || []).length;
  });

  return Math.min(score / 10, 1); // Normalize to 0-1
}

function calculatePDFConfidence(text, sectionCount) {
  if (!text || text.length < 100) return 0.2;
  if (sectionCount === 0) return 0.3;

  // Check for common document indicators
  const hasNumbers = /\d/.test(text);
  const hasCurrency = /\$/.test(text);
  const hasStructure = sectionCount > 1;

  let confidence = 0.5;
  if (hasNumbers) confidence += 0.2;
  if (hasCurrency) confidence += 0.2;
  if (hasStructure) confidence += 0.1;

  return Math.min(confidence, 1);
}

function calculateExcelConfidence(lineItems) {
  if (!lineItems || lineItems.length === 0) return 0.1;

  const avgConfidence = lineItems.reduce((sum, item) => sum + item.confidence, 0) / lineItems.length;
  return avgConfidence;
}

function cleanExtractedText(text) {
  return text
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/\n\s*\n/g, '\n')      // Remove empty lines
    .trim();
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Legacy compatibility functions
function generateLegacyLines(aiDoc) {
  if (aiDoc.metadata.extractedStructure.lineItems) {
    return aiDoc.metadata.extractedStructure.lineItems.map(item => ({
      id: item.id,
      division: item.division || '00',
      description: item.description,
      cost: item.cost,
      unit: item.unit || 'EA',
      quantity: item.quantity || 1,
      unitCost: item.cost / (item.quantity || 1),
      subcontractor: item.subcontractor || 'Self-performed',
      confidence: item.confidence
    }));
  }

  return []; // Return empty array for non-structured documents
}

function isFileCancelled(fileId) {
  const context = fileContexts.get(fileId);
  return context?.cancelled || false;
}

function cancelFile(fileId) {
  const context = fileContexts.get(fileId);
  if (context) {
    context.cancelled = true;
  }
  fileContexts.delete(fileId);

  postFileMessage(fileId, 'cancelled', {});
}

// EXCEL PROCESSING HELPER FUNCTIONS

function parseStructuredRow(row, id, sheetName) {
  if (!row || row.length < 2) return null;

  let description = '';
  let cost = 0;
  let division = '00';
  let subcontractor = 'Self-performed';
  let quantity = 1;
  let unit = 'EA';

  // Intelligent column detection
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (!cell) continue;

    const cellStr = String(cell).trim();

    // Try to parse as cost
    const costMatch = cellStr.match(/[\$]?([\d,]+\.?\d*)/);
    if (costMatch && !cost) {
      const parsedCost = parseFloat(costMatch[1].replace(/,/g, ''));
      if (parsedCost > 10) { // Reasonable minimum
        cost = parsedCost;
        continue;
      }
    }

    // Try to extract CSI division
    const divisionMatch = cellStr.match(/\b\d{2}\b/);
    if (divisionMatch && division === '00') {
      const divisionNum = parseInt(divisionMatch[0]);
      if (divisionNum >= 1 && divisionNum <= 49) {
        division = divisionMatch[0].padStart(2, '0');
        continue;
      }
    }

    // Try to extract quantity and unit
    const qtyMatch = cellStr.match(/(\d+(?:\.\d+)?)\s*(SF|LF|CY|EA|LS|SY|TON|HR|DAY|SQ|BF|LB)/i);
    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1]);
      unit = qtyMatch[2].toUpperCase();
      continue;
    }

    // Build description from non-cost parts
    if (!costMatch || parsedCost < 10) {
      description += (description ? ' ' : '') + cellStr;
    }
  }

  if (!description || cost === 0) return null;

  return {
    id: `line-${id}`,
    description: description.substring(0, 200),
    cost: cost,
    division: division,
    quantity: quantity,
    unit: unit,
    subcontractor: subcontractor,
    confidence: calculateLineConfidence(description, cost, division)
  };
}

function calculateLineConfidence(description, cost, division) {
  let confidence = 0.5;

  if (description && description.length > 10) confidence += 0.2;
  if (cost > 0) confidence += 0.2;
  if (division && division !== '00') confidence += 0.1;

  return Math.min(confidence, 1.0);
}

function convertLineItemsToText(lineItems) {
  let text = `Structured Cost Data (${lineItems.length} items):\n\n`;

  lineItems.forEach(item => {
    text += `${item.division} - ${item.description}: $${item.cost.toLocaleString()}`;
    if (item.quantity > 1) {
      text += ` (${item.quantity} ${item.unit})`;
    }
    if (item.subcontractor !== 'Self-performed') {
      text += ` - ${item.subcontractor}`;
    }
    text += '\n';
  });

  return text;
}

// PDF TABLE DETECTION HELPERS

function detectTablesInPage(pageItems) {
  // Simple table detection based on text positioning
  const tables = [];
  const rows = groupItemsByVerticalPosition(pageItems);

  for (const row of rows) {
    if (row.length >= 3) { // Potential table row
      const table = {
        headers: [],
        rows: [row.map(item => item.text)],
        analysis: detectTableType(row.map(item => item.text))
      };
      tables.push(table);
    }
  }

  return tables;
}

function groupItemsByVerticalPosition(items) {
  const tolerance = 5; // Vertical position tolerance
  const groups = [];

  items.forEach(item => {
    const y = item.transform[5];
    let foundGroup = false;

    for (const group of groups) {
      if (Math.abs(group[0].transform[5] - y) <= tolerance) {
        group.push(item);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([item]);
    }
  });

  return groups.filter(group => group.length > 1);
}

function detectTableType(rowData) {
  const text = rowData.join(' ').toLowerCase();

  if (text.includes('cost') || text.includes('price') || text.includes('$')) {
    return 'costs';
  }
  if (text.includes('phase') || text.includes('schedule')) {
    return 'phases';
  }
  if (text.includes('spec') || text.includes('model')) {
    return 'specifications';
  }

  return 'costs'; // Default
}

// ADDITIONAL FILE TYPE PROCESSORS

async function processCSVAINative(fileId, file) {
  console.log(`📊 AI-Native CSV processing for ${file.name}`);

  const decoder = new TextDecoder('utf-8');
  const csvText = decoder.decode(file.data);

  return {
    content: csvText,
    fileType: 'csv',
    fileName: file.name,
    isBase64: false,
    useBlobStorage: false,
    metadata: {
      extractedStructure: {
        // TODO: Parse CSV into line items
      },
      confidence: 0.8,
      fileSize: file.size,
      processingRoute: 'worker'
    }
  };
}

async function processDocxAINative(fileId, file) {
  console.log(`📄 AI-Native DOCX processing for ${file.name}`);

  // For now, return base64 - TODO: implement proper DOCX parsing
  const base64Data = arrayBufferToBase64(file.data);

  return {
    content: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64Data}`,
    fileType: 'docx',
    fileName: file.name,
    isBase64: true,
    useBlobStorage: false,
    metadata: {
      extractedStructure: {},
      confidence: 0.4,
      fileSize: file.size,
      processingRoute: 'worker'
    }
  };
}

async function processTextAINative(fileId, file) {
  console.log(`📝 AI-Native Text processing for ${file.name}`);

  const decoder = new TextDecoder('utf-8');
  const textContent = decoder.decode(file.data);

  return {
    content: textContent,
    fileType: 'text',
    fileName: file.name,
    isBase64: false,
    useBlobStorage: false,
    metadata: {
      extractedStructure: {
        textSections: [{
          type: 'paragraph',
          content: textContent,
          relevanceScore: calculateRelevanceScore(textContent)
        }]
      },
      confidence: 0.9,
      fileSize: file.size,
      processingRoute: 'worker'
    }
  };
}

// URL-based processing
async function parseFromUrl(fileId, url, fileName, fileSize, signal) {
  try {
    console.log(`🌐 AI-Native URL processing: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create file-like object
    const file = {
      name: fileName,
      type: response.headers.get('content-type') || '',
      size: fileSize,
      data: uint8Array
    };

    // Process normally
    await parseDocument(fileId, file, signal);

  } catch (error) {
    postFileMessage(fileId, 'error', {
      code: 'URL_PROCESSING_ERROR',
      message: error.message
    });
  }
}

console.log('🤖 AI-Native Document Processing Worker initialized with PDF.js and XLSX support');