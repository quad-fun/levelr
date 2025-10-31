// src/components/analysis/MultiFileUpload.tsx

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
// Multi-file upload component with emoji icons
import { UploadManager, type UploadSession, type UploadFileInfo, DEFAULT_UPLOAD_CONFIG, FileUploadStatus } from '@/lib/upload/ingest';
import type { CsiLine } from '@/types/analysis';
import { WorkerBridge } from '@/lib/workers/worker-bridge';
import { createEphemeralObject } from '@/lib/upload/blob-client';
import UploadDropzone from './UploadDropzone';
import UploadQueueItem from './UploadQueueItem';

interface MultiFileUploadProps {
  onFilesProcessed: (results: Array<{
    fileId: string;
    fileName: string;
    analysis: any; // Full analysis result from discipline-specific API
    disciplineHint?: string;
  }>) => void;
  onAutoLevelingReady?: () => void;
  maxFiles?: number;
  className?: string;
}

export default function MultiFileUpload({
  onFilesProcessed,
  onAutoLevelingReady,
  maxFiles = 3,
  className = ''
}: MultiFileUploadProps) {
  const [session, setSession] = useState<UploadSession | null>(null);
  const [autoLevelingEnabled, setAutoLevelingEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const uploadManagerRef = useRef<UploadManager | null>(null);
  const workerBridgeRef = useRef<WorkerBridge | null>(null);
  const processedResults = useRef<Map<string, {
    fileId: string;
    fileName: string;
    analysis: any; // Full analysis result from discipline-specific API
    disciplineHint?: string;
  }>>(new Map());

  // Initialize upload manager and worker bridge
  useEffect(() => {
    uploadManagerRef.current = new UploadManager({
      ...DEFAULT_UPLOAD_CONFIG,
      maxFiles
    });

    workerBridgeRef.current = new WorkerBridge({
      maxConcurrentFiles: 3,
      timeoutMs: 10 * 60 * 1000 // 10 minutes
    });

    const newSession = uploadManagerRef.current.createSession(autoLevelingEnabled);
    setSession(newSession);

    return () => {
      workerBridgeRef.current?.terminate();
      if (uploadManagerRef.current && newSession) {
        uploadManagerRef.current.cleanupSession(newSession.id);
      }
    };
  }, [maxFiles, autoLevelingEnabled]);

  // Handle file selection from dropzone
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (!uploadManagerRef.current || !session) return;

    setIsProcessing(true);

    try {
      const result = await uploadManagerRef.current.addFiles(session.id, files);

      // Log results
      if (result.duplicates.length > 0) {
        console.log('Duplicate files skipped:', result.duplicates);
      }
      if (result.errors.length > 0) {
        console.error('File validation errors:', result.errors);
      }

      // Start processing added files
      for (const fileInfo of result.added) {
        await processFile(fileInfo);
      }

      // Update session state
      const updatedSession = uploadManagerRef.current.getSession(session.id);
      if (updatedSession) {
        setSession({ ...updatedSession });
      }

    } catch (error) {
      console.error('Failed to add files:', error);
    }
  }, [session]);

  // Process individual file
  const processFile = useCallback(async (fileInfo: UploadFileInfo) => {
    if (!workerBridgeRef.current) return;

    const callbacks = {
      onProgress: (event: { progress: number }) => {
        // Update file progress
        fileInfo.progress = event.progress;
        setSession(prev => prev ? { ...prev } : null);
      },

      onDisciplineHint: (event: { disciplineHint: string }) => {
        fileInfo.disciplineHint = event.disciplineHint;
        setSession(prev => prev ? { ...prev } : null);
      },

      onSuccess: async (event: { lines: CsiLine[]; processedDoc: any; disciplineHint?: string }) => {
        fileInfo.status = FileUploadStatus.PROCESSING;
        setSession(prev => prev ? { ...prev } : null);

        try {
          // Use discipline-aware analysis routing with AI-native processedDoc
          const finalDiscipline = event.disciplineHint || fileInfo.disciplineHint || 'construction';
          const processedDoc = event.processedDoc; // Use the actual processed document from worker

          let analysisResult;

          // Route to appropriate API endpoint based on discipline
          if (finalDiscipline === 'design') {
            const response = await fetch('/api/claude/design', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ processedDoc })
            });
            if (!response.ok) throw new Error('Design analysis failed');
            const { analysis } = await response.json();
            analysisResult = analysis;
          } else if (finalDiscipline === 'trade') {
            const response = await fetch('/api/claude/trade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ processedDoc })
            });
            if (!response.ok) throw new Error('Trade analysis failed');
            const { analysis } = await response.json();
            analysisResult = analysis;
          } else {
            // Construction - use default endpoint
            const response = await fetch('/api/claude', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ processedDoc })
            });
            if (!response.ok) throw new Error('Construction analysis failed');
            const { analysis } = await response.json();
            analysisResult = analysis;
          }

          fileInfo.status = FileUploadStatus.COMPLETED;
          fileInfo.progress = 100;
          fileInfo.endTime = Date.now();

          // Store analysis result instead of raw lines
          processedResults.current.set(fileInfo.id, {
            fileId: fileInfo.id,
            fileName: fileInfo.file.name,
            analysis: analysisResult,
            disciplineHint: finalDiscipline
          });

          checkAllFilesComplete();
          setSession(prev => prev ? { ...prev } : null);

        } catch (error) {
          fileInfo.status = FileUploadStatus.ERROR;
          fileInfo.error = error instanceof Error ? error.message : 'Analysis failed';
          setSession(prev => prev ? { ...prev } : null);
        }
      },

      onError: (event: { message: string }) => {
        fileInfo.status = FileUploadStatus.ERROR;
        fileInfo.error = event.message;
        setSession(prev => prev ? { ...prev } : null);
      }
    };

    try {
      // Update status
      fileInfo.status = FileUploadStatus.UPLOADING;
      setSession(prev => prev ? { ...prev } : null);

      if (fileInfo.route === 'large') {
        // Use blob storage for large files
        const blobInfo = await createEphemeralObject(fileInfo.file);
        fileInfo.blobInfo = blobInfo;

        fileInfo.status = FileUploadStatus.PROCESSING;
        workerBridgeRef.current.parseFromUrl(
          fileInfo.id,
          blobInfo.getUrl,
          fileInfo.file.name,
          fileInfo.file.size,
          callbacks
        );
      } else {
        // Direct processing for small/medium files
        fileInfo.status = FileUploadStatus.PROCESSING;
        workerBridgeRef.current.parseFile(fileInfo.id, fileInfo.file, callbacks);
      }

    } catch (error) {
      fileInfo.status = FileUploadStatus.ERROR;
      fileInfo.error = error instanceof Error ? error.message : 'Unknown error';
      setSession(prev => prev ? { ...prev } : null);
    }
  }, [processedResults]);

  // Check if all files are complete and trigger callbacks
  const checkAllFilesComplete = useCallback(() => {
    if (!session) return;

    const files = Array.from(session.files.values());
    const completedFiles = files.filter(f => f.status === FileUploadStatus.COMPLETED);

    if (completedFiles.length === files.length && files.length > 0) {
      // All files processed
      const results = Array.from(processedResults.current.values());
      onFilesProcessed(results);

      // Trigger auto-leveling if enabled and multiple files
      if (autoLevelingEnabled && results.length >= 2) {
        onAutoLevelingReady?.();
      }

      setIsProcessing(false);
    }
  }, [session, autoLevelingEnabled, onFilesProcessed, onAutoLevelingReady]);

  // Handle file actions
  const handleCancelFile = useCallback((fileId: string) => {
    workerBridgeRef.current?.cancelFile(fileId);

    if (uploadManagerRef.current && session) {
      uploadManagerRef.current.cancelFile(session.id, fileId);
      const updatedSession = uploadManagerRef.current.getSession(session.id);
      if (updatedSession) {
        setSession({ ...updatedSession });
      }
    }
  }, [session]);

  const handleRetryFile = useCallback(async (fileId: string) => {
    if (!session) return;

    const fileInfo = session.files.get(fileId);
    if (fileInfo) {
      fileInfo.status = FileUploadStatus.QUEUED;
      fileInfo.progress = 0;
      fileInfo.error = undefined;
      fileInfo.abortController = new AbortController();

      await processFile(fileInfo);
    }
  }, [session, processFile]);

  const handleRemoveFile = useCallback((fileId: string) => {
    if (!session) return;

    // Cancel if processing
    handleCancelFile(fileId);

    // Remove from session
    session.files.delete(fileId);
    processedResults.current.delete(fileId);

    setSession(prev => prev ? { ...prev } : null);
  }, [session, handleCancelFile]);

  const getAggregateProgress = () => {
    if (!session || session.files.size === 0) return 0;

    const files = Array.from(session.files.values());
    const totalProgress = files.reduce((sum, file) => sum + file.progress, 0);
    return totalProgress / files.length;
  };

  const getFileArray = () => {
    return session ? Array.from(session.files.values()) : [];
  };

  const completedCount = getFileArray().filter(f => f.status === FileUploadStatus.COMPLETED).length;
  const totalFiles = getFileArray().length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Dropzone */}
      <UploadDropzone
        onFilesSelected={handleFilesSelected}
        disabled={isProcessing}
        maxFiles={maxFiles}
        currentFileCount={totalFiles}
      />

      {/* Queue Management */}
      {totalFiles > 0 && (
        <div className="space-y-4">
          {/* Aggregate Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Progress ({completedCount}/{totalFiles})
              </h3>

              {/* Auto-leveling toggle */}
              {totalFiles >= 2 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAutoLevelingEnabled(!autoLevelingEnabled)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                      autoLevelingEnabled
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {autoLevelingEnabled ? (
                      <span>▶️</span>
                    ) : (
                      <span>⏸️</span>
                    )}
                    <span>Auto-leveling {autoLevelingEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Overall progress bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getAggregateProgress()}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {isProcessing ? 'Processing files...' : completedCount === totalFiles ? 'All files completed' : 'Waiting for upload'}
                </span>
                <span>{Math.round(getAggregateProgress())}%</span>
              </div>
            </div>

            {/* Auto-leveling notice */}
            {autoLevelingEnabled && totalFiles >= 2 && completedCount === totalFiles && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  🚀 Ready for auto-leveling!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Bid comparison will start automatically when all files are processed
                </p>
              </div>
            )}
          </div>

          {/* File Queue */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900">File Queue</h4>
            <div className="space-y-3">
              {getFileArray().map((file) => (
                <UploadQueueItem
                  key={file.id}
                  file={file}
                  onCancel={handleCancelFile}
                  onRetry={handleRetryFile}
                  onRemove={handleRemoveFile}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}