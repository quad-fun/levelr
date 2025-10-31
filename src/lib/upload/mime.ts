// src/lib/upload/mime.ts

// MIME type validation for uploaded files

export interface FileTypeInfo {
  mimeTypes: string[];
  extensions: string[];
  magicBytes: Uint8Array[];
  description: string;
}

export const SUPPORTED_FILE_TYPES: Record<string, FileTypeInfo> = {
  pdf: {
    mimeTypes: ['application/pdf'],
    extensions: ['pdf'],
    magicBytes: [
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]), // %PDF-
    ],
    description: 'PDF Document'
  },
  xlsx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip'
    ],
    extensions: ['xlsx'],
    magicBytes: [
      new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // ZIP signature
      new Uint8Array([0x50, 0x4B, 0x05, 0x06]), // Empty ZIP
      new Uint8Array([0x50, 0x4B, 0x07, 0x08]), // Spanned ZIP
    ],
    description: 'Excel Spreadsheet (xlsx)'
  },
  xls: {
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/msexcel'
    ],
    extensions: ['xls'],
    magicBytes: [
      new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]), // OLE2 signature
    ],
    description: 'Excel Spreadsheet (xls)'
  },
  csv: {
    mimeTypes: [
      'text/csv',
      'application/csv',
      'text/plain'
    ],
    extensions: ['csv'],
    magicBytes: [], // CSV has no magic bytes, rely on content validation
    description: 'CSV File'
  },
  docx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip'
    ],
    extensions: ['docx'],
    magicBytes: [
      new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // ZIP signature
      new Uint8Array([0x50, 0x4B, 0x05, 0x06]), // Empty ZIP
      new Uint8Array([0x50, 0x4B, 0x07, 0x08]), // Spanned ZIP
    ],
    description: 'Word Document'
  }
};

export interface MimeValidationResult {
  isValid: boolean;
  detectedType?: string;
  confidence: number;
  errors: string[];
}

export function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() || '';
}

export function getSupportedTypeByExtension(extension: string): FileTypeInfo | null {
  for (const info of Object.values(SUPPORTED_FILE_TYPES)) {
    if (info.extensions.includes(extension.toLowerCase())) {
      return info;
    }
  }
  return null;
}

export function getSupportedTypeByMime(mimeType: string): FileTypeInfo | null {
  for (const info of Object.values(SUPPORTED_FILE_TYPES)) {
    if (info.mimeTypes.some(mime =>
      mimeType.toLowerCase().includes(mime.toLowerCase())
    )) {
      return info;
    }
  }
  return null;
}

export function matchesMagicBytes(buffer: Uint8Array, magicBytes: Uint8Array[]): boolean {
  if (magicBytes.length === 0) return true; // No magic bytes to check

  return magicBytes.some(magic => {
    if (buffer.length < magic.length) return false;

    for (let i = 0; i < magic.length; i++) {
      if (buffer[i] !== magic[i]) return false;
    }
    return true;
  });
}

export async function validateFileType(
  file: File,
  options: { strict?: boolean } = {}
): Promise<MimeValidationResult> {
  const { strict = true } = options;
  const extension = getFileExtension(file.name);
  const errors: string[] = [];
  let confidence = 0;
  let detectedType: string | undefined;

  // Check if extension is supported
  const typeByExtension = getSupportedTypeByExtension(extension);
  if (!typeByExtension) {
    errors.push(`Unsupported file extension: .${extension}`);
    return { isValid: false, confidence: 0, errors };
  }

  confidence += 0.3; // Extension matches

  // Check MIME type
  const typeByMime = getSupportedTypeByMime(file.type);
  if (typeByMime) {
    confidence += 0.3; // MIME type matches
    if (typeByExtension === typeByMime) {
      confidence += 0.2; // Extension and MIME agree
    }
  } else if (strict) {
    errors.push(`Invalid MIME type: ${file.type}`);
  }

  // Read first chunk for magic byte validation
  try {
    const chunk = await readFileChunk(file, 0, 512); // Read first 512 bytes

    if (matchesMagicBytes(chunk, typeByExtension.magicBytes)) {
      confidence += 0.2; // Magic bytes match
      detectedType = Object.keys(SUPPORTED_FILE_TYPES).find(
        key => SUPPORTED_FILE_TYPES[key] === typeByExtension
      );
    } else if (typeByExtension.magicBytes.length > 0 && strict) {
      errors.push('File signature does not match extension');
    }
  } catch (error) {
    errors.push(`Failed to read file signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const isValid = errors.length === 0 && confidence >= (strict ? 0.7 : 0.3);

  return {
    isValid,
    detectedType,
    confidence,
    errors
  };
}

async function readFileChunk(file: File, start: number, length: number): Promise<Uint8Array> {
  const blob = file.slice(start, start + length);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

export function getAcceptedFileTypes(): string {
  const extensions = Object.values(SUPPORTED_FILE_TYPES)
    .flatMap(type => type.extensions)
    .map(ext => `.${ext}`)
    .join(',');

  const mimeTypes = Object.values(SUPPORTED_FILE_TYPES)
    .flatMap(type => type.mimeTypes)
    .join(',');

  return `${extensions},${mimeTypes}`;
}