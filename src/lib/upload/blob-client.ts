// src/lib/upload/blob-client.ts

import { UploadErrorCode, UploadException } from './errors';

export interface BlobInfo {
  uploadUrl: string;
  getUrl: string;
  cleanup: () => Promise<void>;
}

interface BlobPutResponse {
  uploadUrl: string;
  getUrl: string;
  token: string;
}

/**
 * Create an ephemeral blob object for large file processing
 */
export async function createEphemeralObject(file: File): Promise<BlobInfo> {
  try {
    // Request upload URL from our API
    const response = await fetch('/api/blob/put', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new UploadException(
        UploadErrorCode.BLOB_UPLOAD_FAILED,
        `Failed to create upload URL: ${response.status}`,
        error
      );
    }

    const blobData: BlobPutResponse = await response.json();

    // Upload the file to the blob storage
    const uploadResponse = await fetch(blobData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });

    if (!uploadResponse.ok) {
      throw new UploadException(
        UploadErrorCode.BLOB_UPLOAD_FAILED,
        `Failed to upload file: ${uploadResponse.status}`,
        await uploadResponse.text()
      );
    }

    // Create cleanup function
    const cleanup = async (): Promise<void> => {
      try {
        const deleteResponse = await fetch('/api/blob/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: blobData.token
          })
        });

        if (!deleteResponse.ok) {
          console.warn('Failed to delete blob:', deleteResponse.status);
        }
      } catch (error) {
        console.warn('Blob cleanup failed:', error);
        // Don't throw - cleanup failures should not break the upload flow
      }
    };

    return {
      uploadUrl: blobData.uploadUrl,
      getUrl: blobData.getUrl,
      cleanup
    };

  } catch (error) {
    if (error instanceof UploadException) {
      throw error;
    }

    throw new UploadException(
      UploadErrorCode.BLOB_UPLOAD_FAILED,
      'Failed to create ephemeral blob object',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Read a chunk from a blob URL using range requests
 */
export async function readBlobChunk(
  url: string,
  start: number,
  length: number,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url, {
      headers: {
        'Range': `bytes=${start}-${start + length - 1}`
      },
      signal
    });

    if (!response.ok) {
      throw new UploadException(
        UploadErrorCode.READ_FAILED,
        `Failed to read blob chunk: ${response.status}`,
        await response.text()
      );
    }

    return await response.arrayBuffer();
  } catch (error) {
    if (error instanceof UploadException) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new UploadException(
        UploadErrorCode.ABORTED,
        'Blob read was cancelled'
      );
    }

    throw new UploadException(
      UploadErrorCode.READ_FAILED,
      'Failed to read blob chunk',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Stream a large blob file in chunks to a worker
 */
export async function streamBlobToWorker(
  worker: Worker,
  fileId: string,
  blobUrl: string,
  fileSize: number,
  chunkSize: number = 16 * 1024 * 1024, // 16MB chunks
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<void> {
  let loaded = 0;

  try {
    for (let start = 0; start < fileSize; start += chunkSize) {
      if (signal?.aborted) {
        throw new UploadException(UploadErrorCode.ABORTED, 'Stream was cancelled');
      }

      const length = Math.min(chunkSize, fileSize - start);
      const chunk = await readBlobChunk(blobUrl, start, length, signal);

      // Send chunk to worker
      worker.postMessage({
        type: 'chunk',
        fileId,
        chunk,
        start,
        length,
        isLast: start + length >= fileSize
      }, [chunk]); // Transfer ownership to avoid copying

      loaded += length;
      onProgress?.(loaded, fileSize);
    }
  } catch (error) {
    // Notify worker of error
    worker.postMessage({
      type: 'error',
      fileId,
      error: error instanceof UploadException ? error.toUploadError() : {
        code: UploadErrorCode.READ_FAILED,
        message: 'Failed to stream blob to worker'
      }
    });

    throw error;
  }
}