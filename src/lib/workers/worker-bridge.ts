// src/lib/workers/worker-bridge.ts

import type { CsiLine } from '@/types/analysis';
import { UploadErrorCode } from '../upload/errors';

export interface WorkerProgressEvent {
  fileId: string;
  phase: 'reading' | 'parsing' | 'normalizing';
  progress: number;
  loaded: number;
  total: number;
}

export interface WorkerSuccessEvent {
  fileId: string;
  lines: CsiLine[];
  parseConfidence: number;
  totalPages: number;
  disciplineHint?: string;
}

export interface WorkerErrorEvent {
  fileId: string;
  code: string;
  message: string;
  detail?: string;
}

export interface WorkerDisciplineHintEvent {
  fileId: string;
  disciplineHint: string;
}

export type WorkerEvent =
  | { type: 'progress'; } & WorkerProgressEvent
  | { type: 'success'; } & WorkerSuccessEvent
  | { type: 'error'; } & WorkerErrorEvent
  | { type: 'discipline_hint'; } & WorkerDisciplineHintEvent
  | { type: 'cancelled'; fileId: string };

export interface WorkerBridgeOptions {
  maxConcurrentFiles?: number;
  timeoutMs?: number;
  workerPath?: string;
}

export class WorkerBridge {
  private worker: Worker | null = null;
  private activeFiles = new Set<string>();
  private listeners = new Map<string, {
    onProgress?: (event: WorkerProgressEvent) => void;
    onSuccess?: (event: WorkerSuccessEvent) => void;
    onError?: (event: WorkerErrorEvent) => void;
    onDisciplineHint?: (event: WorkerDisciplineHintEvent) => void;
    onCancel?: () => void;
    timeout?: NodeJS.Timeout;
    abortController?: AbortController;
  }>();

  constructor(private options: WorkerBridgeOptions = {}) {
    this.initWorker();
  }

  private initWorker() {
    const workerPath = this.options.workerPath || '/workers/parser.worker.js';
    this.worker = new Worker(workerPath);

    this.worker.onmessage = (event) => {
      this.handleWorkerMessage(event.data as WorkerEvent);
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      // Notify all active files of worker error
      for (const fileId of this.activeFiles) {
        this.notifyError(fileId, {
          code: 'WORKER_ERROR',
          message: 'Worker encountered an error',
          detail: error.message
        });
      }
    };
  }

  private handleWorkerMessage(event: WorkerEvent) {
    const listener = this.listeners.get(event.fileId);
    if (!listener) return;

    switch (event.type) {
      case 'progress':
        listener.onProgress?.(event);
        break;

      case 'success':
        this.cleanup(event.fileId);
        listener.onSuccess?.(event);
        break;

      case 'error':
        this.cleanup(event.fileId);
        listener.onError?.(event);
        break;

      case 'discipline_hint':
        listener.onDisciplineHint?.(event);
        break;

      case 'cancelled':
        this.cleanup(event.fileId);
        listener.onCancel?.();
        break;
    }
  }

  private notifyError(fileId: string, error: { code: string; message: string; detail?: string }) {
    const listener = this.listeners.get(fileId);
    if (listener) {
      this.cleanup(fileId);
      listener.onError?.({
        fileId,
        ...error
      });
    }
  }

  private cleanup(fileId: string) {
    const listener = this.listeners.get(fileId);
    if (listener?.timeout) {
      clearTimeout(listener.timeout);
    }

    this.listeners.delete(fileId);
    this.activeFiles.delete(fileId);
  }

  /**
   * Parse a small/medium file directly
   */
  parseFile(
    fileId: string,
    file: File,
    callbacks: {
      onProgress?: (event: WorkerProgressEvent) => void;
      onSuccess?: (event: WorkerSuccessEvent) => void;
      onError?: (event: WorkerErrorEvent) => void;
      onDisciplineHint?: (event: WorkerDisciplineHintEvent) => void;
    }
  ): AbortController {
    if (this.activeFiles.size >= (this.options.maxConcurrentFiles || 3)) {
      setTimeout(() => {
        callbacks.onError?.({
          fileId,
          code: UploadErrorCode.MEMORY_LIMIT,
          message: 'Too many files processing simultaneously'
        });
      }, 0);
      return new AbortController();
    }

    const abortController = new AbortController();
    this.activeFiles.add(fileId);

    // Set timeout
    const timeout = setTimeout(() => {
      this.cancelFile(fileId);
      callbacks.onError?.({
        fileId,
        code: UploadErrorCode.TIMEOUT,
        message: 'File processing timed out'
      });
    }, this.options.timeoutMs || 10 * 60 * 1000); // 10 minutes default

    this.listeners.set(fileId, {
      ...callbacks,
      timeout,
      abortController
    });

    // Send file to worker
    this.worker?.postMessage({
      type: 'parse',
      fileId,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        data: file
      }
    });

    // Handle abort
    abortController.signal.addEventListener('abort', () => {
      this.cancelFile(fileId);
    });

    return abortController;
  }

  /**
   * Parse a large file from blob URL
   */
  parseFromUrl(
    fileId: string,
    url: string,
    fileName: string,
    fileSize: number,
    callbacks: {
      onProgress?: (event: WorkerProgressEvent) => void;
      onSuccess?: (event: WorkerSuccessEvent) => void;
      onError?: (event: WorkerErrorEvent) => void;
      onDisciplineHint?: (event: WorkerDisciplineHintEvent) => void;
    }
  ): AbortController {
    if (this.activeFiles.size >= (this.options.maxConcurrentFiles || 3)) {
      setTimeout(() => {
        callbacks.onError?.({
          fileId,
          code: UploadErrorCode.MEMORY_LIMIT,
          message: 'Too many files processing simultaneously'
        });
      }, 0);
      return new AbortController();
    }

    const abortController = new AbortController();
    this.activeFiles.add(fileId);

    // Set timeout
    const timeout = setTimeout(() => {
      this.cancelFile(fileId);
      callbacks.onError?.({
        fileId,
        code: UploadErrorCode.TIMEOUT,
        message: 'File processing timed out'
      });
    }, this.options.timeoutMs || 10 * 60 * 1000);

    this.listeners.set(fileId, {
      ...callbacks,
      timeout,
      abortController
    });

    // Send URL to worker
    this.worker?.postMessage({
      type: 'parse_url',
      fileId,
      url,
      fileName,
      fileSize
    });

    // Handle abort
    abortController.signal.addEventListener('abort', () => {
      this.cancelFile(fileId);
    });

    return abortController;
  }

  /**
   * Send a chunk of data for large file processing
   */
  sendChunk(
    fileId: string,
    chunk: ArrayBuffer,
    start: number,
    length: number,
    isLast: boolean
  ): void {
    this.worker?.postMessage({
      type: 'chunk',
      fileId,
      chunk,
      start,
      length,
      isLast
    }, [chunk]); // Transfer ownership
  }

  /**
   * Cancel file processing
   */
  cancelFile(fileId: string): void {
    this.worker?.postMessage({
      type: 'cancel',
      fileId
    });

    this.cleanup(fileId);
  }

  /**
   * Cancel all active files
   */
  cancelAll(): void {
    for (const fileId of this.activeFiles) {
      this.cancelFile(fileId);
    }
  }

  /**
   * Get count of active files
   */
  getActiveFileCount(): number {
    return this.activeFiles.size;
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    this.worker?.terminate();
    this.worker = null;

    // Clean up all listeners
    for (const fileId of this.activeFiles) {
      this.cleanup(fileId);
    }
  }
}