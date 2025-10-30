// public/workers/parser.worker.js

// Import XLSX for Excel processing (need to load from CDN in worker)
importScripts('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');

// Web Worker for browser-only document parsing
self.onmessage = function(event) {
  const { type, file } = event.data;

  if (type === 'parse') {
    parseDocument(file);
  }
};

async function parseDocument(file) {
  try {
    // Send initial progress
    self.postMessage({
      type: 'progress',
      progress: 10
    });

    // Real document processing based on file type
    const processedDoc = await processDocumentInWorker(file);

    self.postMessage({
      type: 'progress',
      progress: 50
    });

    // Parse content into structured lines
    const lines = await parseContentToLines(processedDoc);

    // Send completion progress
    self.postMessage({
      type: 'progress',
      progress: 100
    });

    // Send results
    self.postMessage({
      type: 'success',
      data: {
        lines,
        parseConfidence: calculateParseConfidence(lines),
        totalPages: Math.max(...lines.map(l => l.pageRef || 1))
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
}

// Real document processing functions
async function processDocumentInWorker(file) {
  const fileType = detectFileType(file.name, file.type);
  console.log(`Processing ${file.name} as ${fileType} in worker`);

  if (file.data && file.data.startsWith('data:')) {
    // Convert base64 data URL back to file content
    const base64Data = file.data.split(',')[1];

    switch (fileType) {
      case 'excel':
        return await processExcelInWorker(file.name, base64Data);
      case 'pdf':
        return {
          content: file.data, // Keep as base64 for PDF
          fileType: 'pdf',
          fileName: file.name,
          isBase64: true
        };
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } else {
    throw new Error('Invalid file data format');
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

async function processExcelInWorker(fileName, base64Data) {
  try {
    // Convert base64 to binary data
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

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
    // For PDF, we'll need to send to Claude for parsing
    // For now, create a placeholder that indicates real PDF content
    lines.push({
      id: 'pdf-1',
      division: '00',
      description: `PDF Document: ${processedDoc.fileName} (requires Claude processing)`,
      cost: 0,
      confidence: 0.5,
      pageRef: 1
    });
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