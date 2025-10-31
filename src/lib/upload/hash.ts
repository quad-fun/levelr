// src/lib/upload/hash.ts

export interface FileFingerprint {
  hash: string;
  size: number;
  name: string;
  lastModified: number;
}

/**
 * Generate a SHA-256 hash of the first 2MB of a file plus metadata
 * for duplicate detection
 */
export async function generateFileFingerprint(file: File): Promise<FileFingerprint> {
  const chunkSize = 2 * 1024 * 1024; // 2MB
  const chunk = file.slice(0, Math.min(chunkSize, file.size));

  const buffer = await chunk.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Include file metadata in fingerprint
  const metadata = `${file.name}:${file.size}:${file.lastModified}`;
  const metadataBuffer = new TextEncoder().encode(metadata);
  const metadataHashBuffer = await crypto.subtle.digest('SHA-256', metadataBuffer);
  const metadataHashArray = Array.from(new Uint8Array(metadataHashBuffer));
  const metadataHashHex = metadataHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Combine content hash with metadata hash
  const combinedData = hashHex + metadataHashHex;
  const finalBuffer = new TextEncoder().encode(combinedData);
  const finalHashBuffer = await crypto.subtle.digest('SHA-256', finalBuffer);
  const finalHashArray = Array.from(new Uint8Array(finalHashBuffer));
  const finalHash = finalHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    hash: finalHash,
    size: file.size,
    name: file.name,
    lastModified: file.lastModified
  };
}

/**
 * Fast content hash for immediate duplicate detection
 * Uses first 64KB + size + name for quick comparison
 */
export async function generateQuickHash(file: File): Promise<string> {
  const quickChunkSize = 64 * 1024; // 64KB
  const chunk = file.slice(0, Math.min(quickChunkSize, file.size));

  const buffer = await chunk.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Create a simple signature from name and size
  const signature = `${file.name.toLowerCase()}:${file.size}`;

  return `${contentHash.substring(0, 16)}-${btoa(signature).replace(/[/+=]/g, '').substring(0, 8)}`;
}

/**
 * Compare two files for duplicate detection
 */
export function areFilesEqual(fp1: FileFingerprint, fp2: FileFingerprint): boolean {
  // Exact hash match is definitive
  if (fp1.hash === fp2.hash) return true;

  // If hashes don't match but files have same name and size,
  // they might be duplicates with different timestamps
  return fp1.name === fp2.name &&
         fp1.size === fp2.size &&
         Math.abs(fp1.lastModified - fp2.lastModified) < 1000; // Within 1 second
}

/**
 * Create a short display hash for UI
 */
export function getDisplayHash(fingerprint: FileFingerprint): string {
  return fingerprint.hash.substring(0, 8);
}