// public/workers/parser.worker.js

// Import XLSX for Excel processing (need to load from CDN in worker)
importScripts('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');

// Enhanced Web Worker for multi-file, chunked document parsing
const fileContexts = new Map(); // Track per-file processing state
const chunkBuffers = new Map(); // Accumulate chunks for large files

// Message handler with enhanced protocol
self.onmessage = function(event) {
  const { type, fileId, ...data } = event.data;

  try {
    switch (type) {
      case 'parse':
        parseDocument(fileId, data.file, data.signal);
        break;
      case 'chunk':
        handleChunk(fileId, data.chunk, data.start, data.length, data.isLast);
        break;
      case 'cancel':
        cancelFile(fileId);
        break;
      case 'parse_url':
        parseFromUrl(fileId, data.url, data.fileName, data.fileSize, data.signal);
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

// Enhanced file message posting with fileId
function postFileMessage(fileId, type, data) {
  self.postMessage({
    type,
    fileId,
    ...data
  });
}

// Parse document (small/medium files)
async function parseDocument(fileId, file, signal) {
  try {
    fileContexts.set(fileId, { cancelled: false, signal });

    postFileMessage(fileId, 'progress', {
      phase: 'reading',
      progress: 10,
      loaded: 0,
      total: file.size
    });

    // Get early discipline hint
    const disciplineHint = await getDisciplineHint(fileId, file);
    if (disciplineHint) {
      postFileMessage(fileId, 'discipline_hint', { disciplineHint });
    }

    // Check for cancellation
    if (isFileCancelled(fileId)) return;

    // Process document based on file type
    const processedDoc = await processDocumentInWorker(fileId, file);

    postFileMessage(fileId, 'progress', {
      phase: 'parsing',
      progress: 50,
      loaded: file.size,
      total: file.size
    });

    // Check for cancellation
    if (isFileCancelled(fileId)) return;

    // Parse content into structured lines
    const lines = await parseContentToLines(processedDoc);

    postFileMessage(fileId, 'progress', {
      phase: 'normalizing',
      progress: 100,
      loaded: file.size,
      total: file.size
    });

    // Send results
    postFileMessage(fileId, 'success', {
      lines,
      parseConfidence: calculateParseConfidence(lines),
      totalPages: Math.max(...lines.map(l => l.pageRef || 1)),
      disciplineHint
    });

    // Cleanup
    fileContexts.delete(fileId);

  } catch (error) {
    postFileMessage(fileId, 'error', {
      code: 'PARSE_ERROR',
      message: error.message,
      detail: error.stack
    });
    fileContexts.delete(fileId);
  }
}

// Handle chunked data for large files
async function handleChunk(fileId, chunk, start, length, isLast) {
  try {
    if (!chunkBuffers.has(fileId)) {
      chunkBuffers.set(fileId, []);
    }

    const chunks = chunkBuffers.get(fileId);
    chunks.push(new Uint8Array(chunk));

    // Update progress
    const context = fileContexts.get(fileId);
    if (context) {
      const totalLoaded = start + length;
      postFileMessage(fileId, 'progress', {
        phase: 'reading',
        progress: Math.min(90, (totalLoaded / context.fileSize) * 90),
        loaded: totalLoaded,
        total: context.fileSize
      });
    }

    if (isLast) {
      // Combine all chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Create a file-like object
      const fileObj = {
        data: combined,
        name: context.fileName,
        type: context.fileType,
        size: totalLength
      };

      // Process the combined data
      await processChunkedFile(fileId, fileObj);

      // Cleanup
      chunkBuffers.delete(fileId);
    }
  } catch (error) {
    postFileMessage(fileId, 'error', {
      code: 'CHUNK_ERROR',
      message: error.message
    });
    chunkBuffers.delete(fileId);
  }
}

// Parse from URL (large files via blob)
async function parseFromUrl(fileId, url, fileName, fileSize, signal) {
  try {
    fileContexts.set(fileId, {
      cancelled: false,
      signal,
      fileName,
      fileSize,
      fileType: detectFileType(fileName, '')
    });

    postFileMessage(fileId, 'progress', {
      phase: 'reading',
      progress: 5,
      loaded: 0,
      total: fileSize
    });

    // Get discipline hint from first chunk
    const disciplineHint = await getDisciplineHintFromUrl(fileId, url);
    if (disciplineHint) {
      postFileMessage(fileId, 'discipline_hint', { disciplineHint });
    }

    // Read file in chunks and process
    await processFileFromUrl(fileId, url, fileName, fileSize);

  } catch (error) {
    postFileMessage(fileId, 'error', {
      code: 'URL_PARSE_ERROR',
      message: error.message
    });
    fileContexts.delete(fileId);
  }
}

// Get early discipline hint from file sample
async function getDisciplineHint(fileId, file) {
  try {
    const sampleSize = Math.min(2 * 1024 * 1024, file.size); // 2MB sample
    const sample = file.slice(0, sampleSize);

    let text = '';

    if (file.type.includes('text') || file.name.toLowerCase().endsWith('.csv')) {
      text = await sample.text();
    } else if (file.name.toLowerCase().endsWith('.xlsx')) {
      // Quick Excel header scan
      const buffer = await sample.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      text = decoder.decode(buffer);
    }

    return analyzeDiscipline(text);
  } catch (error) {
    console.warn('Failed to get discipline hint:', error);
    return null;
  }
}

// Get discipline hint from URL (first chunk)
async function getDisciplineHintFromUrl(fileId, url) {
  try {
    const response = await fetch(url, {
      headers: { 'Range': 'bytes=0-2097151' } // First 2MB
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(buffer);

    return analyzeDiscipline(text);
  } catch (error) {
    console.warn('Failed to get discipline hint from URL:', error);
    return null;
  }
}

// Analyze text for discipline keywords
function analyzeDiscipline(text) {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // Discipline keyword sets
  const disciplineKeywords = {
    construction: ['concrete', 'masonry', 'steel', 'framing', 'excavation', 'foundation', 'drywall'],
    design: ['schematic design', 'design development', 'aia', 'architectural', 'engineering', 'consultant'],
    trade: ['electrical', 'hvac', 'plumbing', 'mechanical', 'commissioning', 'controls', 'automation']
  };

  const scores = {};

  for (const [discipline, keywords] of Object.entries(disciplineKeywords)) {
    scores[discipline] = keywords.filter(keyword => lowerText.includes(keyword)).length;
  }

  // Check for CSI divisions or AIA phases
  if (/\b\d{2}\s*(concrete|masonry|metals|wood)/i.test(text)) scores.construction += 2;
  if (/\b(sd|dd|cd|bn|ca)\b/i.test(text)) scores.design += 2;
  if (/\b(elec|hvac|plumb|mech)\b/i.test(text)) scores.trade += 2;

  // Return highest scoring discipline
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return null;

  return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || null;
}

// Cancel file processing
function cancelFile(fileId) {
  const context = fileContexts.get(fileId);
  if (context) {
    context.cancelled = true;
    fileContexts.delete(fileId);
  }
  chunkBuffers.delete(fileId);

  postFileMessage(fileId, 'cancelled', {});
}

// Check if file processing was cancelled
function isFileCancelled(fileId) {
  const context = fileContexts.get(fileId);
  return !context || context.cancelled;
}

// Process chunked file data
async function processChunkedFile(fileId, fileObj) {
  try {
    const processedDoc = await processDocumentInWorker(fileId, {
      name: fileObj.name,
      type: fileObj.type,
      size: fileObj.size,
      data: fileObj.data
    });

    const lines = await parseContentToLines(processedDoc);

    postFileMessage(fileId, 'success', {
      lines,
      parseConfidence: calculateParseConfidence(lines),
      totalPages: Math.max(...lines.map(l => l.pageRef || 1))
    });

    fileContexts.delete(fileId);
  } catch (error) {
    postFileMessage(fileId, 'error', {
      code: 'CHUNK_PROCESS_ERROR',
      message: error.message
    });
    fileContexts.delete(fileId);
  }
}

// Process file from URL in chunks
async function processFileFromUrl(fileId, url, fileName, fileSize) {
  try {
    const chunkSize = 16 * 1024 * 1024; // 16MB chunks
    const chunks = [];
    let loaded = 0;

    for (let start = 0; start < fileSize; start += chunkSize) {
      if (isFileCancelled(fileId)) return;

      const end = Math.min(start + chunkSize - 1, fileSize - 1);
      const response = await fetch(url, {
        headers: { 'Range': `bytes=${start}-${end}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chunk: ${response.status}`);
      }

      const chunk = await response.arrayBuffer();
      chunks.push(new Uint8Array(chunk));
      loaded += chunk.byteLength;

      postFileMessage(fileId, 'progress', {
        phase: 'reading',
        progress: Math.min(90, (loaded / fileSize) * 90),
        loaded,
        total: fileSize
      });
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Process the combined data
    const fileObj = {
      data: combined,
      name: fileName,
      type: detectFileType(fileName, ''),
      size: totalLength
    };

    await processChunkedFile(fileId, fileObj);

  } catch (error) {
    postFileMessage(fileId, 'error', {
      code: 'URL_READ_ERROR',
      message: error.message
    });
    fileContexts.delete(fileId);
  }
}

// Enhanced document processing with fileId tracking
async function processDocumentInWorker(fileId, file) {
  const fileType = detectFileType(file.name, file.type);
  console.log(`Processing ${file.name} as ${fileType} in worker (fileId: ${fileId})`);

  // Handle different data formats
  if (file.data) {
    if (typeof file.data === 'string' && file.data.startsWith('data:')) {
      // Base64 data URL format
      const base64Data = file.data.split(',')[1];
      return await processBase64Data(fileId, file.name, fileType, base64Data);
    } else if (file.data instanceof Uint8Array) {
      // Raw binary data
      return await processBinaryData(fileId, file.name, fileType, file.data);
    }
  }

  throw new Error('Invalid file data format');
}

// Process base64 encoded data
async function processBase64Data(fileId, fileName, fileType, base64Data) {
  switch (fileType) {
    case 'excel':
      return await processExcelInWorker(fileName, base64Data);
    case 'pdf':
      return {
        content: `data:application/pdf;base64,${base64Data}`,
        fileType: 'pdf',
        fileName: fileName,
        isBase64: true
      };
    case 'csv':
      const csvText = atob(base64Data);
      return {
        content: csvText,
        fileType: 'csv',
        fileName: fileName,
        isBase64: false
      };
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// Process binary data
async function processBinaryData(fileId, fileName, fileType, binaryData) {
  switch (fileType) {
    case 'excel':
      return await processExcelFromBytes(fileName, binaryData);
    case 'csv':
      const decoder = new TextDecoder('utf-8');
      const csvText = decoder.decode(binaryData);
      return {
        content: csvText,
        fileType: 'csv',
        fileName: fileName,
        isBase64: false
      };
    case 'pdf':
      // Convert to base64 for PDF processing
      const base64 = btoa(String.fromCharCode(...binaryData));
      return {
        content: `data:application/pdf;base64,${base64}`,
        fileType: 'pdf',
        fileName: fileName,
        isBase64: true
      };
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

function detectFileType(fileName, mimeType) {
  const extension = fileName.toLowerCase().split('.').pop() || '';

  if (['xlsx', 'xls', 'csv'].includes(extension) ||
      (mimeType && (mimeType.includes('spreadsheet') || mimeType.includes('excel')))) {
    return 'excel';
  }

  if (extension === 'pdf' || (mimeType && mimeType.includes('pdf'))) {
    return 'pdf';
  }

  return 'unknown';
}

// Process Excel from base64 data
async function processExcelInWorker(fileName, base64Data) {
  try {
    // Convert base64 to binary data
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return await processExcelFromBytes(fileName, bytes);
  } catch (error) {
    console.error('Excel processing error in worker:', error);
    throw new Error('Failed to process Excel file. Please ensure it\'s a valid spreadsheet.');
  }
}

// Process Excel from byte array
async function processExcelFromBytes(fileName, bytes) {
  try {
    // Parse with XLSX
    const workbook = XLSX.read(bytes, { type: 'array' });

    let extractedText = `Excel File: ${fileName}\n\n`;

    // Process all worksheets
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

      extractedText += `=== Sheet ${index + 1}: ${sheetName} ===\n`;

      // Convert to readable format
      jsonData.forEach((row) => {
        if (Array.isArray(row) && row.some(cell => cell !== undefined && cell !== '')) {
          extractedText += row.join('\t') + '\n';
        }
      });

      extractedText += '\n';
    });

    console.log('Excel extraction successful in worker, content length:', extractedText.length);

    return {
      content: extractedText,
      fileType: 'excel',
      fileName: fileName,
      isBase64: false
    };
  } catch (error) {
    console.error('Excel processing error in worker:', error);
    throw new Error('Failed to process Excel file. Please ensure it\'s a valid spreadsheet.');
  }
}

async function parseContentToLines(processedDoc) {
  const lines = [];

  if (processedDoc.fileType === 'excel') {
    // Parse Excel content for real line items
    const content = processedDoc.content;
    const textLines = content.split('\n');

    let lineId = 1;
    let currentPage = 1;

    for (const textLine of textLines) {
      const line = textLine.trim();
      if (!line || line.startsWith('===') || line.startsWith('Excel File:')) continue;

      // Try to parse line for cost information
      const parsedLine = parseLineItem(line, lineId, currentPage);
      if (parsedLine) {
        lines.push(parsedLine);
        lineId++;
      }
    }
  } else if (processedDoc.fileType === 'pdf') {
    // PDFs are processed in the main thread with Claude API
    // This shouldn't be reached since PDFs bypass the Web Worker
    console.warn('PDF processing should not reach Web Worker - handled in main thread');
    return [];
  }

  return lines.length > 0 ? lines : createEmptyFallback();
}

function parseLineItem(line, id, pageRef) {
  // Enhanced line parsing to extract real contractor and cost data
  const parts = line.split('\t');
  if (parts.length < 2) return null;

  // Look for cost patterns (numbers with decimals, commas, dollar signs)
  let cost = 0;
  let description = '';
  let division = '00';
  let subcontractor = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();

    // Try to extract cost
    const costMatch = part.match(/[\$]?[\d,]+\.?\d*/);
    if (costMatch && !cost) {
      const cleanCost = costMatch[0].replace(/[$,]/g, '');
      const parsedCost = parseFloat(cleanCost);
      if (parsedCost > 100) { // Reasonable minimum for a line item
        cost = parsedCost;
      }
    }

    // Try to extract CSI division
    const divisionMatch = part.match(/\b\d{2}\b/);
    if (divisionMatch && !division || division === '00') {
      const divisionNum = parseInt(divisionMatch[0]);
      if (divisionNum >= 1 && divisionNum <= 49) {
        division = divisionMatch[0].padStart(2, '0');
      }
    }

    // Try to extract contractor/company names
    const companyMatch = part.match(/([A-Z][a-z]+\s+(?:Construction|Contractors?|Inc\.?|LLC|Corp\.?|Co\.?))/i);
    if (companyMatch && !subcontractor) {
      subcontractor = companyMatch[1];
    }

    // Build description from non-cost parts
    if (!costMatch || parsedCost < 100) {
      description += (description ? ' ' : '') + part;
    }
  }

  if (!description || cost === 0) return null;

  return {
    id: `line-${id}`,
    division: division,
    description: description.substring(0, 200), // Limit length
    cost: cost,
    unit: extractUnit(line),
    quantity: extractQuantity(line),
    unitCost: cost / Math.max(extractQuantity(line) || 1, 1),
    subcontractor: subcontractor || 'Self-performed',
    pageRef: pageRef,
    confidence: calculateLineConfidence(description, cost, division)
  };
}

function extractUnit(line) {
  const unitPatterns = /\b(SF|LF|CY|EA|LS|SY|TON|HR|DAY|SQ|BF|LB)\b/i;
  const match = line.match(unitPatterns);
  return match ? match[1].toUpperCase() : 'EA';
}

function extractQuantity(line) {
  // Look for quantity patterns like "100 SF" or "25 EA"
  const qtyMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:SF|LF|CY|EA|LS|SY|TON|HR|DAY|SQ|BF|LB)/i);
  return qtyMatch ? parseFloat(qtyMatch[1]) : 1;
}

function calculateLineConfidence(description, cost, division) {
  let confidence = 0.5; // Base confidence

  if (description && description.length > 10) confidence += 0.2;
  if (cost > 0) confidence += 0.2;
  if (division && division !== '00') confidence += 0.1;

  return Math.min(confidence, 1.0);
}

function calculateParseConfidence(lines) {
  if (lines.length === 0) return 0;

  const avgConfidence = lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length;
  return avgConfidence;
}

function createEmptyFallback() {
  console.log('No content parsed from document - returning empty result');
  return [];
}

// All mock data removed - using only real document processing