// src/lib/upload/errors.ts

export enum UploadErrorCode {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_INVALID = 'FILE_TYPE_INVALID',
  MIME_MISMATCH = 'MIME_MISMATCH',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  READ_FAILED = 'READ_FAILED',
  BLOB_UPLOAD_FAILED = 'BLOB_UPLOAD_FAILED',
  BLOB_DELETE_FAILED = 'BLOB_DELETE_FAILED',
  MEMORY_LIMIT = 'MEMORY_LIMIT',
  TIMEOUT = 'TIMEOUT',
  ABORTED = 'ABORTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DUPLICATE_FILE = 'DUPLICATE_FILE'
}

export interface UploadError {
  code: UploadErrorCode;
  message: string;
  detail?: string;
  fileId?: string;
  fileName?: string;
}

export class UploadException extends Error {
  constructor(
    public readonly code: UploadErrorCode,
    message: string,
    public readonly detail?: string,
    public readonly fileId?: string
  ) {
    super(message);
    this.name = 'UploadException';
  }

  toUploadError(): UploadError {
    return {
      code: this.code,
      message: this.message,
      detail: this.detail,
      fileId: this.fileId
    };
  }
}

export const ERROR_MESSAGES: Record<UploadErrorCode, string> = {
  [UploadErrorCode.FILE_TOO_LARGE]: 'File exceeds maximum size limit',
  [UploadErrorCode.FILE_TYPE_INVALID]: 'File type not supported',
  [UploadErrorCode.MIME_MISMATCH]: 'File content does not match extension',
  [UploadErrorCode.SIGNATURE_INVALID]: 'File signature validation failed',
  [UploadErrorCode.READ_FAILED]: 'Failed to read file contents',
  [UploadErrorCode.BLOB_UPLOAD_FAILED]: 'Failed to upload large file',
  [UploadErrorCode.BLOB_DELETE_FAILED]: 'Failed to cleanup temporary file',
  [UploadErrorCode.MEMORY_LIMIT]: 'Memory limit exceeded',
  [UploadErrorCode.TIMEOUT]: 'Upload operation timed out',
  [UploadErrorCode.ABORTED]: 'Upload was cancelled',
  [UploadErrorCode.NETWORK_ERROR]: 'Network connection failed',
  [UploadErrorCode.DUPLICATE_FILE]: 'File already in queue'
};

export function createUploadError(
  code: UploadErrorCode,
  detail?: string,
  fileId?: string
): UploadError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    detail,
    fileId
  };
}