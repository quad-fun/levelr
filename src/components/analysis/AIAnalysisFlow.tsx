// src/components/analysis/AIAnalysisFlow.tsx

'use client';

import { useState, useRef, useCallback } from 'react';
import Timeline, { TimelineStage } from '@/components/analysis/Timeline';
import Artifacts from '@/components/analysis/Artifacts';
import { AnalysisOrchestrator } from '@/lib/ai/orchestrator';
import { ArtifactStorage } from '@/lib/storage';
import type { BidArtifact, CsiLine } from '@/types/analysis';
import type { Flags } from '@/lib/flags';

interface AIAnalysisFlowProps {
  file: File;
  flags: Flags;
  userId?: string;
  onComplete?: (artifact: BidArtifact) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function AIAnalysisFlow({
  file,
  flags,
  userId: _userId,
  onComplete,
  onError,
  onCancel
}: AIAnalysisFlowProps) {
  const getDisciplineAnalysisMessage = (discipline: string): string => {
    switch (discipline) {
      case 'design':
        return 'Analyzing AIA phases and design deliverables...';
      case 'trade':
        return 'Analyzing technical systems and equipment...';
      case 'construction':
      default:
        return 'Analyzing CSI divisions and construction risks...';
    }
  };


  const [stages, setStages] = useState<TimelineStage[]>(() => {
    // Start with generic stages before discipline detection
    return [
      {
        id: 'parsing',
        name: 'Parsing Document',
        status: 'pending' as const,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      {
        id: 'detecting',
        name: 'Detecting Document Type',
        status: 'pending' as const,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      },
      {
        id: 'analyzing',
        name: 'Running Analysis',
        status: 'pending' as const,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      },
      {
        id: 'scoring',
        name: 'Calculating Score',
        status: 'pending' as const,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    ];
  });

  const [artifact, setArtifact] = useState<BidArtifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const orchestratorRef = useRef<AnalysisOrchestrator | null>(null);
  const storageRef = useRef<ArtifactStorage | null>(null);

  const updateStage = useCallback((stageId: string, updates: Partial<TimelineStage>) => {
    setStages(prev => prev.map(stage =>
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  }, []);

  const parseDocumentWithWorker = useCallback(async (file: File): Promise<CsiLine[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        workerRef.current = new Worker('/workers/parser.worker.js');
      }

      const worker = workerRef.current;

      worker.onmessage = (event) => {
        const { type, data, error, progress } = event.data;

        if (type === 'progress') {
          updateStage('parsing', { progress: progress / 100 });
        } else if (type === 'success') {
          resolve(data.lines || []);
        } else if (type === 'error') {
          reject(new Error(error));
        }
      };

      worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Convert file to base64 for worker
      const reader = new FileReader();
      reader.onload = () => {
        worker.postMessage({
          type: 'parse',
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result
          }
        });
      };
      reader.readAsDataURL(file);
    });
  }, [updateStage]);

  const runAnalysis = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setError(null);

    try {
      // Initialize orchestrator and storage
      if (!orchestratorRef.current) {
        orchestratorRef.current = new AnalysisOrchestrator();
      }

      if (!storageRef.current) {
        const driver = flags.blobArtifactStorage ? 'blob' : 'local';
        storageRef.current = new ArtifactStorage(driver);
      }

      // Stage 1: Parse Document
      updateStage('parsing', {
        status: 'active',
        message: `Processing ${file.name}...`,
        progress: 0
      });

      const lines = await parseDocumentWithWorker(file);

      updateStage('parsing', {
        status: 'complete',
        message: `Extracted ${lines.length} line items`,
        duration: 2000
      });

      // Stage 2: Detect document type and run analysis
      updateStage('detecting', {
        status: 'active',
        message: 'Auto-detecting document type...',
        progress: 0
      });

      const analysisResult = await orchestratorRef.current.orchestrate(lines, {
        runId: `analysis-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        docIds: []
      });

      // Update stages based on detected discipline
      const detectedDiscipline = analysisResult.artifact.analysis.discipline;
      console.log(`🎯 Detected discipline: ${detectedDiscipline} - updating UI stages`);

      updateStage('detecting', {
        status: 'complete',
        message: `Detected ${detectedDiscipline} document`,
        duration: 1000
      });

      // Stage 3: Run discipline-specific analysis
      updateStage('analyzing', {
        status: 'active',
        message: getDisciplineAnalysisMessage(detectedDiscipline),
        progress: 0
      });

      await new Promise(resolve => setTimeout(resolve, 800)); // Let user see analysis

      updateStage('analyzing', {
        status: 'complete',
        message: `Found ${analysisResult.artifact.risks.length} risks`,
        duration: 1500
      });

      // Stage 4: Calculate Score
      updateStage('scoring', {
        status: 'active',
        message: 'Computing risk score...',
        progress: 0
      });

      await new Promise(resolve => setTimeout(resolve, 800)); // Let user see the scoring

      updateStage('scoring', {
        status: 'complete',
        message: `Risk score: ${analysisResult.artifact.score.overall}/100`,
        duration: 800
      });

      // Stage 5: Store Artifacts (if enabled)
      if (flags.blobArtifactStorage || flags.analysisHistory) {
        updateStage('storage', {
          status: 'active',
          message: 'Saving analysis results...',
          progress: 0
        });

        const storageResult = await storageRef.current.storeBidArtifact(analysisResult.artifact);

        updateStage('storage', {
          status: 'complete',
          message: storageResult.success ? 'Saved to cloud' : 'Saved locally',
          duration: 1200
        });
      } else {
        updateStage('storage', {
          status: 'complete',
          message: 'Skipped (local mode)',
          duration: 100
        });
      }

      setArtifact(analysisResult.artifact);
      onComplete?.(analysisResult.artifact);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      onError?.(errorMessage);

      // Mark current active stage as error
      setStages(prev => prev.map(stage =>
        stage.status === 'active' ? { ...stage, status: 'error' as const } : stage
      ));
    } finally {
      setIsRunning(false);
    }
  }, [file, flags, isRunning, onComplete, onError, updateStage, parseDocumentWithWorker]);

  // Auto-start analysis when component mounts
  React.useEffect(() => {
    if (!isRunning && !artifact && !error) {
      runAnalysis();
    }
  }, [runAnalysis, isRunning, artifact, error]);

  // Cleanup worker on unmount
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleExport = useCallback((format: 'pdf' | 'excel' | 'json') => {
    if (!artifact) return;

    // Import export functions dynamically to avoid server-side issues
    import('@/lib/analysis/exports').then(exports => {
      try {
        if (format === 'pdf') {
          exports.exportBidArtifactToPDF(artifact);
        } else if (format === 'excel') {
          exports.exportBidArtifactToExcel(artifact);
        } else if (format === 'json') {
          const blob = new Blob([JSON.stringify(artifact, null, 2)], {
            type: 'application/json'
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analysis-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error(`Export ${format} failed:`, error);
        setError(`Failed to export ${format}. Please try again.`);
      }
    });
  }, [artifact]);

  const handleShare = useCallback(() => {
    if (!artifact) return;

    const shareData = {
      title: `Analysis: ${artifact.analysis.contractorName}`,
      text: `Risk Score: ${artifact.score.overall}/100 - ${artifact.risks.length} risks detected`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      // Could show a toast here
    }
  }, [artifact]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Progress Timeline */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <Timeline stages={stages} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={runAnalysis}
              disabled={isRunning}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isRunning ? 'Retrying...' : 'Retry Analysis'}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {artifact && (
        <Artifacts
          artifact={artifact}
          insights={[]} // Could add AI insights in Pro mode
          onExport={handleExport}
          onShare={handleShare}
        />
      )}

      {/* Pro Mode Enhancement Notice */}
      {!flags.proModeEnabled && artifact && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Upgrade to Pro Mode</h3>
              <p className="mt-1 text-sm text-blue-700">
                Get AI-powered insights, variance explanations, and cloud storage for your analysis results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add React import for useEffect
import React from 'react';