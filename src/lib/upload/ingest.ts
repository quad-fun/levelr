// src/lib/upload/ingest.ts

import { validateFileType } from './mime';
import { generateFileFingerprint, generateQuickHash, type FileFingerprint } from './hash';
import { UploadErrorCode, UploadException } from './errors';

export interface UploadConfig {
  maxFileSizeMB: number;
  maxFiles: number;
  smallFileMB: number;
  mediumFileMB: number;
  enableBlobStorage: boolean;
  blobTTLMinutes: number;
  timeoutSeconds: number;
  chunkSizeMB: number;
  memoryLimitMB: number;
}

export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSizeMB: 200,
  maxFiles: 3,
  smallFileMB: 4,
  mediumFileMB: 64,
  enableBlobStorage: true,
  blobTTLMinutes: 10,
  timeoutSeconds: 600, // 10 minutes
  chunkSizeMB: 16,
  memoryLimitMB: 512
};

export enum FileProcessingRoute {
  SMALL = 'small',    // ≤4MB: in-memory processing
  MEDIUM = 'medium',  // 4-64MB: chunked streaming
  LARGE = 'large'     // >64MB: blob storage + range requests
}

export enum FileUploadStatus {
  QUEUED = 'queued',
  VALIDATING = 'validating',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export interface UploadFileInfo {
  id: string;
  file: File;
  fingerprint: FileFingerprint;
  quickHash: string;
  route: FileProcessingRoute;
  status: FileUploadStatus;
  progress: number;
  error?: string;
  disciplineHint?: string;
  blobInfo?: {
    uploadUrl: string;
    getUrl: string;
    cleanup: () => Promise<void>;
  };
  abortController: AbortController;
  startTime: number;
  endTime?: number;
}

export interface UploadSession {
  id: string;
  files: Map<string, UploadFileInfo>;
  config: UploadConfig;
  totalProgress: number;
  memoryUsage: number;
  status: 'active' | 'completed' | 'error';
  autoLevelingEnabled: boolean;
}

export class UploadManager {
  private sessions = new Map<string, UploadSession>();
  private memoryTracker = new Map<string, number>();

  constructor(private config: UploadConfig = DEFAULT_UPLOAD_CONFIG) {}

  /**
   * Create a new upload session
   */
  createSession(autoLevelingEnabled = true): UploadSession {
    const sessionId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: UploadSession = {
      id: sessionId,
      files: new Map(),
      config: this.config,
      totalProgress: 0,
      memoryUsage: 0,
      status: 'active',
      autoLevelingEnabled
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Add files to an upload session with validation and deduplication
   */
  async addFiles(sessionId: string, files: File[]): Promise<{
    added: UploadFileInfo[];
    duplicates: string[];
    errors: Array<{ file: File; error: string }>;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UploadException(UploadErrorCode.NETWORK_ERROR, 'Session not found');
    }

    const results = {
      added: [] as UploadFileInfo[],
      duplicates: [] as string[],
      errors: [] as Array<{ file: File; error: string }>
    };

    // Check file count limit
    if (session.files.size + files.length > this.config.maxFiles) {
      throw new UploadException(
        UploadErrorCode.FILE_TOO_LARGE,
        `Maximum ${this.config.maxFiles} files allowed`
      );
    }

    for (const file of files) {
      try {
        const fileInfo = await this.validateAndPrepareFile(file, session);

        // Check for duplicates
        const isDuplicate = Array.from(session.files.values()).some(existing =>
          existing.quickHash === fileInfo.quickHash ||
          existing.fingerprint.hash === fileInfo.fingerprint.hash
        );

        if (isDuplicate) {
          results.duplicates.push(file.name);
          continue;
        }

        session.files.set(fileInfo.id, fileInfo);
        results.added.push(fileInfo);

      } catch (error) {
        const message = error instanceof UploadException
          ? error.message
          : 'Unknown validation error';
        results.errors.push({ file, error: message });
      }
    }

    this.updateSessionProgress(session);
    return results;
  }

  /**
   * Validate and prepare a single file for upload
   */
  private async validateAndPrepareFile(file: File, _session: UploadSession): Promise<UploadFileInfo> {
    // Size validation
    const maxBytes = this.config.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new UploadException(
        UploadErrorCode.FILE_TOO_LARGE,
        `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of ${this.config.maxFileSizeMB}MB`
      );
    }

    // MIME type validation
    const mimeValidation = await validateFileType(file, { strict: true });
    if (!mimeValidation.isValid) {
      throw new UploadException(
        UploadErrorCode.MIME_MISMATCH,
        `Invalid file: ${mimeValidation.errors.join(', ')}`
      );
    }

    // Generate fingerprints
    const [fingerprint, quickHash] = await Promise.all([
      generateFileFingerprint(file),
      generateQuickHash(file)
    ]);

    // Determine processing route
    const route = this.determineProcessingRoute(file.size);

    const fileInfo: UploadFileInfo = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      fingerprint,
      quickHash,
      route,
      status: FileUploadStatus.QUEUED,
      progress: 0,
      abortController: new AbortController(),
      startTime: Date.now()
    };

    return fileInfo;
  }

  /**
   * Determine the processing route based on file size
   */
  private determineProcessingRoute(fileSize: number): FileProcessingRoute {
    const smallBytes = this.config.smallFileMB * 1024 * 1024;
    const mediumBytes = this.config.mediumFileMB * 1024 * 1024;

    if (fileSize <= smallBytes) {
      return FileProcessingRoute.SMALL;
    } else if (fileSize <= mediumBytes) {
      return FileProcessingRoute.MEDIUM;
    } else {
      return FileProcessingRoute.LARGE;
    }
  }

  /**
   * Get early discipline hints from file content
   */
  async getDisciplineHint(fileInfo: UploadFileInfo): Promise<string | undefined> {
    try {
      const sampleSize = Math.min(2 * 1024 * 1024, fileInfo.file.size); // 2MB sample
      const chunk = fileInfo.file.slice(0, sampleSize);
      const buffer = await chunk.arrayBuffer();
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

      // Look for discipline keywords
      const constructionKeywords = ['concrete', 'masonry', 'steel', 'framing', 'excavation'];
      const designKeywords = ['schematic design', 'design development', 'aia', 'architectural'];
      const tradeKeywords = ['electrical', 'hvac', 'plumbing', 'mechanical', 'commissioning'];

      const lowerText = text.toLowerCase();

      const constructionScore = constructionKeywords.filter(k => lowerText.includes(k)).length;
      const designScore = designKeywords.filter(k => lowerText.includes(k)).length;
      const tradeScore = tradeKeywords.filter(k => lowerText.includes(k)).length;

      if (designScore > constructionScore && designScore > tradeScore) return 'design';
      if (tradeScore > constructionScore) return 'trade';
      if (constructionScore > 0) return 'construction';

      // Check for CSI divisions or AIA phases
      if (/\b\d{2}\s*(concrete|masonry|metals|wood)/i.test(text)) return 'construction';
      if (/\b(sd|dd|cd|bn|ca)\b/i.test(text)) return 'design';
      if (/\b(elec|hvac|plumb|mech)\b/i.test(text)) return 'trade';

      return undefined;
    } catch (error) {
      console.warn('Failed to analyze discipline hint:', error);
      return undefined;
    }
  }

  /**
   * Update session progress
   */
  private updateSessionProgress(session: UploadSession): void {
    const files = Array.from(session.files.values());
    if (files.length === 0) {
      session.totalProgress = 0;
      return;
    }

    const totalProgress = files.reduce((sum, file) => sum + file.progress, 0);
    session.totalProgress = totalProgress / files.length;

    // Update status
    const allCompleted = files.every(f => f.status === FileUploadStatus.COMPLETED);
    const hasErrors = files.some(f => f.status === FileUploadStatus.ERROR);

    if (allCompleted) {
      session.status = 'completed';
    } else if (hasErrors) {
      session.status = 'error';
    } else {
      session.status = 'active';
    }
  }

  /**
   * Cancel file upload
   */
  cancelFile(sessionId: string, fileId: string): void {
    const session = this.sessions.get(sessionId);
    const fileInfo = session?.files.get(fileId);

    if (fileInfo && session) {
      fileInfo.abortController.abort();
      fileInfo.status = FileUploadStatus.CANCELLED;
      this.updateSessionProgress(session);
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): UploadSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Cleanup session resources
   */
  async cleanupSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Cleanup blob storage for all files
    const cleanupPromises = Array.from(session.files.values())
      .filter(file => file.blobInfo)
      .map(file => file.blobInfo!.cleanup().catch(console.error));

    await Promise.allSettled(cleanupPromises);

    // Remove from memory tracker
    this.memoryTracker.delete(sessionId);

    // Remove session
    this.sessions.delete(sessionId);
  }

  /**
   * Check memory usage and enforce limits
   */
  checkMemoryLimit(sessionId: string, additionalBytes: number): boolean {
    const currentUsage = this.memoryTracker.get(sessionId) || 0;
    const maxBytes = this.config.memoryLimitMB * 1024 * 1024;

    return (currentUsage + additionalBytes) <= maxBytes;
  }

  /**
   * Update memory usage tracking
   */
  updateMemoryUsage(sessionId: string, bytes: number): void {
    const current = this.memoryTracker.get(sessionId) || 0;
    this.memoryTracker.set(sessionId, current + bytes);
  }
}