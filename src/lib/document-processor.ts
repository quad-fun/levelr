import * as XLSX from 'xlsx';

export type FileType = 'excel' | 'pdf' | 'image' | 'text' | 'unknown';

export interface ProcessedDocument {
  content: string;
  fileType: FileType;
  fileName: string;
  isBase64: boolean;
  useBlobStorage?: boolean;
}

export function detectFileType(fileName: string, mimeType?: string): FileType {
  const extension = fileName.toLowerCase().split('.').pop() || '';
  
  // Excel files
  if (['xlsx', 'xls', 'csv'].includes(extension) || 
      mimeType?.includes('spreadsheet') || 
      mimeType?.includes('excel')) {
    return 'excel';
  }
  
  // PDF files
  if (extension === 'pdf' || mimeType?.includes('pdf')) {
    return 'pdf';
  }
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension) || 
      mimeType?.startsWith('image/')) {
    return 'image';
  }
  
  // Text files
  if (['txt', 'doc', 'docx'].includes(extension) || 
      mimeType?.startsWith('text/') || 
      mimeType?.includes('document')) {
    return 'text';
  }
  
  return 'unknown';
}

export async function processDocument(file: File): Promise<ProcessedDocument> {
  const fileType = detectFileType(file.name, file.type);
  console.log(`Processing ${file.name} as ${fileType}`);
  
  switch (fileType) {
    case 'excel':
      return await processExcelFile(file);
    
    case 'pdf':
    case 'image':
      return await processBase64File(file, fileType);
    
    case 'text':
      return await processTextFile(file);
    
    default:
      throw new Error(`Unsupported file type: ${file.type}. Please upload Excel (.xlsx), PDF, text, or image files.`);
  }
}

async function processExcelFile(file: File): Promise<ProcessedDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let extractedText = `Excel File: ${file.name}\n\n`;
        
        // Process all worksheets
        workbook.SheetNames.forEach((sheetName, index) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
          
          extractedText += `=== Sheet ${index + 1}: ${sheetName} ===\n`;
          
          // Convert to readable format
          jsonData.forEach((row: unknown) => {
            if (Array.isArray(row) && row.some(cell => cell !== undefined && cell !== '')) {
              extractedText += row.join('\t') + '\n';
            }
          });
          
          extractedText += '\n';
        });
        
        console.log('Excel extraction successful, content length:', extractedText.length);
        
        resolve({
          content: extractedText,
          fileType: 'excel',
          fileName: file.name,
          isBase64: false
        });
      } catch (error) {
        console.error('Excel processing error:', error);
        reject(new Error('Failed to process Excel file. Please ensure it\'s a valid spreadsheet.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

async function processBase64File(file: File, fileType: FileType): Promise<ProcessedDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      console.log(`${fileType} file processed as base64, size:`, Math.round(result.length / 1024), 'KB');
      
      resolve({
        content: result,
        fileType,
        fileName: file.name,
        isBase64: true
      });
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read ${fileType} file`));
    };
    
    reader.readAsDataURL(file);
  });
}

async function processTextFile(file: File): Promise<ProcessedDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      console.log('Text file processed, content length:', content.length);
      
      resolve({
        content: `Text Document: ${file.name}\n\n${content}`,
        fileType: 'text',
        fileName: file.name,
        isBase64: false
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read text file'));
    };
    
    reader.readAsText(file);
  });
}