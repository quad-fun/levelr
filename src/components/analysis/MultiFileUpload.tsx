// src/components/analysis/MultiFileUpload.tsx

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
// Multi-file upload component with emoji icons
import { UploadManager, type UploadSession, type UploadFileInfo, DEFAULT_UPLOAD_CONFIG, FileUploadStatus } from '@/lib/upload/ingest';
import type { AnalysisResult } from '@/types/analysis';
import { WorkerBridge, type WorkerSuccessEvent, type WorkerProgressEvent, type WorkerErrorEvent } from '@/lib/workers/worker-bridge';
import { createEphemeralObject } from '@/lib/upload/blob-client';
import { processDocument, ProcessedDocument, detectFileType } from '@/lib/document-processor';
import UploadDropzone from './UploadDropzone';
import UploadQueueItem from './UploadQueueItem';

interface MultiFileUploadProps {
  onFilesProcessed: (results: Array<{
    fileId: string;
    fileName: string;
    analysis: AnalysisResult; // Full analysis result from discipline-specific API
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
    analysis: AnalysisResult; // Full analysis result from discipline-specific API
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

  // Smart discipline detection function
  const detectDisciplineFromFile = useCallback((file: File): string => {
    const fileName = file.name.toLowerCase();
    const disciplineKeywords = {
      construction: ['concrete', 'masonry', 'steel', 'framing', 'excavation', 'foundation', 'drywall', 'construction', 'builder', 'contractor'],
      design: ['schematic design', 'design development', 'aia', 'architectural', 'engineering', 'consultant', 'architect', 'design', 'proposal', 'arch', 'studio', 'firm'],
      trade: ['electrical', 'hvac', 'plumbing', 'mechanical', 'commissioning', 'controls', 'automation', 'electric', 'tech', 'systems']
    };

    const scores = { construction: 0, design: 0, trade: 0 };

    Object.entries(disciplineKeywords).forEach(([discipline, keywords]) => {
      keywords.forEach(keyword => {
        if (fileName.includes(keyword)) {
          scores[discipline as keyof typeof scores] += keyword.length;
        }
      });
    });

    const maxScore = Math.max(...Object.values(scores));
    const detectedDiscipline = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'construction';

    console.log(`🎯 Discipline detection for ${file.name}:`, scores, '→', detectedDiscipline);
    return detectedDiscipline;
  }, []);

  // AGGRESSIVE ARCHITECTURE REDESIGN: Smart file processing with proper routing
  const processFile = useCallback(async (fileInfo: UploadFileInfo) => {
    try {
      fileInfo.status = FileUploadStatus.UPLOADING;
      fileInfo.progress = 10;
      setSession(prev => prev ? { ...prev } : null);

      const fileType = detectFileType(fileInfo.file.name, fileInfo.file.type);
      const discipline = detectDisciplineFromFile(fileInfo.file);

      // Store discipline hint immediately
      fileInfo.disciplineHint = discipline;
      setSession(prev => prev ? { ...prev } : null);

      console.log(`🚀 Processing ${fileInfo.file.name} as ${fileType} (${discipline} discipline)`);

      let processedDoc: ProcessedDocument;

      // SMART ROUTING: Different processing paths based on file type
      if (fileType === 'pdf' || fileType === 'image') {
        // ROUTE 1: PDFs and Images → Direct main-thread processing (like single-file)
        console.log(`📄 Route 1: Main-thread processing for ${fileType}`);

        fileInfo.progress = 30;
        setSession(prev => prev ? { ...prev } : null);

        if (fileInfo.route === 'large') {
          // Large PDFs: Use blob storage + fetch pattern
          const blobInfo = await createEphemeralObject(fileInfo.file);
          fileInfo.blobInfo = blobInfo;

          fileInfo.progress = 50;
          setSession(prev => prev ? { ...prev } : null);

          processedDoc = {
            content: blobInfo.getUrl,
            fileType: fileType,
            fileName: fileInfo.file.name,
            isBase64: false,
            useBlobStorage: true
          };
        } else {
          // Small/medium PDFs: Direct processing
          fileInfo.progress = 50;
          setSession(prev => prev ? { ...prev } : null);

          processedDoc = await processDocument(fileInfo.file);
        }
      } else {
        // ROUTE 2: Structured data (Excel, CSV, Text) → Worker processing
        console.log(`📊 Route 2: Worker processing for ${fileType}`);

        return new Promise<void>((resolve, reject) => {
          const callbacks = {
            onProgress: (event: WorkerProgressEvent) => {
              fileInfo.progress = event.progress;
              setSession(prev => prev ? { ...prev } : null);
            },

            onSuccess: async (event: WorkerSuccessEvent) => {
              try {
                processedDoc = event.processedDoc as ProcessedDocument;
                console.log(`✅ Worker processing complete for ${fileInfo.file.name}`);
                await proceedToAnalysis();
                resolve();
              } catch (error) {
                reject(error);
              }
            },

            onError: (event: WorkerErrorEvent) => {
              reject(new Error(event.message));
            }
          };

          if (fileInfo.route === 'large') {
            createEphemeralObject(fileInfo.file).then(blobInfo => {
              fileInfo.blobInfo = blobInfo;
              workerBridgeRef.current?.parseFromUrl(
                fileInfo.id,
                blobInfo.getUrl,
                fileInfo.file.name,
                fileInfo.file.size,
                callbacks
              );
            }).catch(reject);
          } else {
            workerBridgeRef.current?.parseFile(fileInfo.id, fileInfo.file, callbacks);
          }
        });
      }

      // Proceed to analysis (for Route 1, Route 2 calls this in success callback)
      await proceedToAnalysis();

      async function proceedToAnalysis() {
        fileInfo.status = FileUploadStatus.PROCESSING;
        fileInfo.progress = 70;
        setSession(prev => prev ? { ...prev } : null);

        console.log(`🔍 File: ${fileInfo.file.name}`);
        console.log(`📊 Final discipline: ${discipline}`);
        console.log(`🎯 Routing to: ${discipline} analysis`);

        // Route to appropriate API endpoint
        let analysisResult: AnalysisResult;

        if (discipline === 'design') {
          console.log('✅ Routing to /api/claude/design');
          const response = await fetch('/api/claude/design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processedDoc })
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Design analysis failed: ${response.status} ${errorText}`);
          }
          const { analysis } = await response.json();
          analysisResult = analysis;
        } else if (discipline === 'trade') {
          console.log('✅ Routing to /api/claude/trade');
          const response = await fetch('/api/claude/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processedDoc })
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Trade analysis failed: ${response.status} ${errorText}`);
          }
          const { analysis } = await response.json();
          analysisResult = analysis;
        } else {
          console.log('✅ Routing to /api/claude (construction)');
          const response = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processedDoc })
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Construction analysis failed: ${response.status} ${errorText}`);
          }
          const { analysis } = await response.json();
          analysisResult = analysis;
        }

        // Success!
        fileInfo.status = FileUploadStatus.COMPLETED;
        fileInfo.progress = 100;
        fileInfo.endTime = Date.now();

        processedResults.current.set(fileInfo.id, {
          fileId: fileInfo.id,
          fileName: fileInfo.file.name,
          analysis: analysisResult,
          disciplineHint: discipline
        });

        checkAllFilesComplete();
        setSession(prev => prev ? { ...prev } : null);
      }

    } catch (error) {
      fileInfo.status = FileUploadStatus.ERROR;
      fileInfo.error = error instanceof Error ? error.message : 'Processing failed';
      setSession(prev => prev ? { ...prev } : null);
      console.error(`❌ File processing failed for ${fileInfo.file.name}:`, error);
    }
  }, [detectDisciplineFromFile]);

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
  // Only count files that are actively preventing new uploads (not completed or errored)
  const activeFiles = getFileArray().filter(f =>
    f.status !== FileUploadStatus.COMPLETED &&
    f.status !== FileUploadStatus.ERROR &&
    f.status !== FileUploadStatus.CANCELLED
  );
  const activeFileCount = activeFiles.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Dropzone */}
      <UploadDropzone
        onFilesSelected={handleFilesSelected}
        disabled={isProcessing}
        maxFiles={maxFiles}
        currentFileCount={activeFileCount}
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