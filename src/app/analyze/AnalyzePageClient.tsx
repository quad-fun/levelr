'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MultiFileUpload from '@/components/analysis/MultiFileUpload';
import MultiDisciplineAnalysisResults from '@/components/analysis/MultiDisciplineAnalysisResults';
import ExportTools from '@/components/analysis/ExportTools';
// import AIAnalysisFlow from '@/components/analysis/AIAnalysisFlow'; // Replaced with integrated multi-file upload
import Artifacts from '@/components/analysis/Artifacts';
import AnalysisHistory from '@/components/analysis/AnalysisHistory';
import BidLeveling from '@/components/analysis/BidLeveling';
import RFPBuilder from '@/components/rfp/RFPBuilder';
import ProjectManager from '@/components/ecosystem/ProjectManager';
import { AuthDebug } from '@/components/debug/AuthDebug';
import { FeatureGate } from '@/components/common/FeatureGate';
import { AnalysisResult, BidArtifact } from '@/types/analysis';
import { getProject } from '@/lib/storage';
// import { ProcessedDocument } from '@/lib/document-processor'; // No longer needed with integrated upload
import { exportAnalysisToPDF, exportAnalysisToExcel } from '@/lib/analysis/exports';
import type { Flags } from '@/lib/flags';

interface AnalyzePageClientProps {
  flags: Flags;
  userId?: string;
  userTier?: string;
}

function AnalyzePageContent({ flags, userId: _userId, userTier: _userTier }: AnalyzePageClientProps) {
  const searchParams = useSearchParams();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'leveling' | 'rfp' | 'ecosystem'>('upload');
  const [projectContext, setProjectContext] = useState<{
    projectId: string;
    projectName: string;
    discipline: 'construction' | 'design' | 'trade';
    preselectedBids: string[];
  } | null>(null);
  const [selectedProjectForRFP, setSelectedProjectForRFP] = useState<{
    projectName: string;
    description: string;
    projectType: string;
    estimatedValue: number;
    location?: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
    };
    discipline?: 'construction' | 'design' | 'trade';
  } | null>(null);

  // AI-native flow state (now the only flow)
  // const [selectedFile, setSelectedFile] = useState<File | null>(null); // No longer needed with integrated multi-file upload
  const [aiArtifact, setAiArtifact] = useState<BidArtifact | null>(null);

  // Avoid unused variable warning
  if (selectedProjectForRFP) {
    // This variable is used in JSX below
  }

  // Handle URL parameters for project context
  useEffect(() => {
    const projectId = searchParams?.get('project');
    const bidsParam = searchParams?.get('bids');

    if (projectId && bidsParam) {
      try {
        const project = getProject(projectId);
        if (project) {
          const preselectedBids = bidsParam.split(',');
          setProjectContext({
            projectId,
            projectName: project.project.name,
            discipline: project.project.disciplines[0],
            preselectedBids
          });
          setActiveTab('leveling');
        }
      } catch (error) {
        console.error('Error loading project context:', error);
      }
    }
  }, [searchParams]);



  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
    // setSelectedFile(null); // No longer needed
    setAiArtifact(null);
  };

  // Multi-file upload handlers (now handled by session store automatically)
  const handleMultiFileProcessed = (results: Array<{
    fileId: string;
    fileName: string;
    analysis: AnalysisResult;
    disciplineHint?: string;
  }>) => {
    setError(null);

    // Set the first result as the primary analysis display
    if (results.length > 0) {
      const firstResult = results[0];
      setAnalysisResult(firstResult.analysis);
      setAiArtifact(null);
    }

    console.log(`✅ Multi-file processing complete: ${results.length} files`);
    console.log('📦 Artifacts are automatically stored in session store for leveling');
  };

  const handleAutoLevelingReady = () => {
    // Automatically switch to leveling tab when 2+ files are processed
    setActiveTab('leveling');
  };

  // Auto-leveling with debounced session store monitoring
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupSessionMonitoring = async () => {
      const { onSessionChange, getArtifacts, debugSessionContents, getBaseline } = await import('@/lib/analysis/sessionStore');
      const { debounce, debugAutoLeveling } = await import('@/lib/analysis/leveling');

      const debouncedAutoLevel = debounce(() => {
        const artifacts = getArtifacts();
        const baseline = getBaseline();
        console.log(`📊 Session changed: ${artifacts.length} artifacts`);

        // DEBUG: Full session inspection
        debugSessionContents();

        if (artifacts.length >= 2) {
          console.log('🚀 Auto-leveling triggered - switching to leveling tab');

          // DEBUG: Test auto-leveling logic
          debugAutoLeveling(artifacts, baseline);

          setActiveTab('leveling');
        } else {
          console.log('⏳ Waiting for more artifacts (need ≥2 for auto-leveling)');
        }
      }, 150); // 150ms debounce

      cleanup = onSessionChange(debouncedAutoLevel);
    };

    setupSessionMonitoring().catch(console.error);

    return () => cleanup?.();
  }, []);

  // Removed unused handlers - now handled by MultiFileUpload component

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Authentication Status */}
        <div className="mb-6">
          <AuthDebug />
        </div>

        {/* Debug Session Store */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={async () => {
              const { debugSessionContents, getArtifacts, getBaseline } = await import('@/lib/analysis/sessionStore');
              const { debugAutoLeveling } = await import('@/lib/analysis/leveling');

              console.log('🔧 MANUAL DEBUG TRIGGER:');
              const sessionState = debugSessionContents();
              const artifacts = getArtifacts();
              const baseline = getBaseline();

              console.log('🔧 Testing auto-leveling with current artifacts:');
              debugAutoLeveling(artifacts, baseline);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600"
          >
            🔍 Debug Session Store
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bid Analysis
            </button>
            <button
              onClick={() => setActiveTab('rfp')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rfp'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : flags.generateRfp
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!flags.generateRfp}
            >
              Generate RFP
              {!flags.generateRfp && (
                <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                  Locked
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ecosystem')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'ecosystem'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : flags.projectManagement
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!flags.projectManagement}
            >
              Project Management
              {!flags.projectManagement && (
                <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                  Locked
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : flags.analysisHistory
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!flags.analysisHistory}
            >
              Analysis History
              {!flags.analysisHistory && (
                <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                  Locked
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('leveling')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'leveling'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : flags.bidLeveling
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!flags.bidLeveling}
            >
              Bid Leveling
              {!flags.bidLeveling && (
                <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                  Locked
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'history' ? (
          <FeatureGate
            enabled={flags.analysisHistory}
            title="Analysis History"
            blurb="Search and browse all your past analyses. Create custom benchmarking datasets and track analysis trends over time."
          >
            <AnalysisHistory />
          </FeatureGate>
        ) : activeTab === 'leveling' ? (
          <FeatureGate
            enabled={flags.bidLeveling}
            title="Bid Leveling"
            blurb="Compare up to 5 bids side-by-side with automated variance detection. Get AI explanations for cost differences."
          >
            <BidLeveling flags={flags} projectContext={projectContext || undefined} />
          </FeatureGate>
        ) : activeTab === 'rfp' ? (
          <FeatureGate
            enabled={flags.generateRfp}
            title="Generate RFP"
            blurb="Create professional RFPs with AI-assisted scope writing, CSI division templates, and commercial terms."
          >
            <RFPBuilder
              onCancel={() => setActiveTab('upload')}
              onComplete={() => setActiveTab('ecosystem')}
              initialProjectData={selectedProjectForRFP || undefined}
            />
          </FeatureGate>
        ) : activeTab === 'ecosystem' ? (
          <FeatureGate
            enabled={flags.projectManagement}
            title="Project Management"
            blurb="Complete project lifecycle management with timelines, budgets, change orders, and team collaboration tools."
          >
            <ProjectManager
              onCreateRFP={(projectData) => {
                setSelectedProjectForRFP(projectData || null);
                setActiveTab('rfp');
              }}
              onAnalyzeProposal={() => setActiveTab('upload')}
            />
          </FeatureGate>
        ) : !analysisResult ? (
          <div className="space-y-8">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                AI-Powered Proposal Analysis
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload your proposal document for instant AI-powered analysis with automatic discipline detection.
                Supports construction, design services, and trade proposals with expert recommendations.
              </p>
            </div>

            {/* Multi-File Upload with integrated analysis */}
            {flags.multiFileUpload ? (
              <MultiFileUpload
                onFilesProcessed={handleMultiFileProcessed}
                onAutoLevelingReady={handleAutoLevelingReady}
                maxFiles={flags.uploadAutoLeveling ? 3 : 1}
                className="max-w-4xl mx-auto"
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Multi-file upload not available in your plan.</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                      <p className="mt-2 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={resetAnalysis}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Upload New Document
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Automatic Discipline Detection</h3>
                <p className="text-sm text-gray-600">AI automatically detects document type and applies the right analysis framework</p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Variance Analysis</h3>
                <p className="text-sm text-gray-600">Intelligent explanations for cost differences between competing proposals</p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Professional Reports</h3>
                <p className="text-sm text-gray-600">Comprehensive PDF and Excel exports with variance explanations and bid leveling</p>
              </div>
            </div>
          </div>
        ) : aiArtifact ? (
          <div className="space-y-8">
            {/* AI-Native Results Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI-Native Analysis Complete</h1>
                <p className="text-gray-600 mt-2">
                  Browser-first analysis with deterministic scoring - Review results and export when ready
                </p>
              </div>
              <button
                onClick={resetAnalysis}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Analyze Another Document
              </button>
            </div>

            {/* AI-Native Artifacts Display */}
            <Artifacts
              artifact={aiArtifact}
              insights={[]} // Could add AI insights in Pro mode
              onExport={(format: 'pdf' | 'excel' | 'json') => {
                try {
                  import('@/lib/analysis/exports').then(exports => {
                    if (format === 'pdf') {
                      exports.exportBidArtifactToPDF(aiArtifact);
                    } else if (format === 'excel') {
                      exports.exportBidArtifactToExcel(aiArtifact);
                    }
                  });
                } catch (error) {
                  console.error(`Error exporting ${format}:`, error);
                  alert(`Error exporting ${format}. Please try again.`);
                }
              }}
              onShare={() => {
                const shareData = {
                  title: `Analysis: ${aiArtifact.analysis.contractorName}`,
                  text: `Risk Score: ${aiArtifact.score.overall}/100 - ${aiArtifact.risks.length} risks detected`,
                  url: window.location.href
                };
                if (navigator.share) {
                  navigator.share(shareData);
                } else {
                  navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
                }
              }}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Legacy Results Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analysis Complete</h1>
                <p className="text-gray-600 mt-2">
                  Review the results below and export your report when ready
                </p>
              </div>
              <button
                onClick={resetAnalysis}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Analyze Another Document
              </button>
            </div>

            {/* Analysis Results */}
            {analysisResult?.discipline ? (
              <MultiDisciplineAnalysisResults
                analysis={analysisResult}
                onExport={(format) => {
                  if (!analysisResult) return;
                  try {
                    if (format === 'pdf') {
                      exportAnalysisToPDF(analysisResult);
                    } else if (format === 'excel') {
                      exportAnalysisToExcel(analysisResult);
                    }
                  } catch (error) {
                    console.error(`Error exporting ${format}:`, error);
                    alert(`Error exporting ${format}. Please try again.`);
                  }
                }}
              />
            ) : (
              <ExportTools analysis={analysisResult} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyzePageClient({ flags, userId, userTier }: AnalyzePageClientProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
      <AnalyzePageContent flags={flags} userId={userId} userTier={userTier} />
    </Suspense>
  );
}