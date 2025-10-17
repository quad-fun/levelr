'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DocumentUpload from '@/components/analysis/DocumentUpload';
import AnalysisResults from '@/components/analysis/AnalysisResults';
import MultiDisciplineAnalysisResults from '@/components/analysis/MultiDisciplineAnalysisResults';
import ExportTools from '@/components/analysis/ExportTools';
import AnalysisHistory from '@/components/analysis/AnalysisHistory';
import BidLeveling from '@/components/analysis/BidLeveling';
import RFPBuilder from '@/components/rfp/RFPBuilder';
import ProjectManager from '@/components/ecosystem/ProjectManager';
import { AuthDebug } from '@/components/debug/AuthDebug';
import { FeatureGate } from '@/components/common/FeatureGate';
import { analyzeDocument } from '@/lib/claude-client';
import { MultiDisciplineAnalyzer } from '@/lib/analysis/multi-discipline-analyzer';
import { calculateMultiDisciplineRisk } from '@/lib/analysis/risk-analyzer';
import { AnalysisResult, MarketVariance, RiskAssessment } from '@/types/analysis';
import { saveAnalysis, getProject } from '@/lib/storage';
import { ProcessedDocument } from '@/lib/document-processor';
import { exportAnalysisToPDF, exportAnalysisToExcel } from '@/lib/analysis/exports';
import type { Flags } from '@/lib/flags';

interface AnalyzePageClientProps {
  flags: Flags;
  userId?: string;
  userTier?: string;
}

function AnalyzePageContent({ flags, userId: _userId, userTier: _userTier }: AnalyzePageClientProps) {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'leveling' | 'rfp' | 'ecosystem'>('upload');
  const [lastProcessedDoc, setLastProcessedDoc] = useState<{file: File, processedDoc: ProcessedDocument} | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<'construction' | 'design' | 'trade'>('construction');
  const [marketVariance, setMarketVariance] = useState<MarketVariance | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [useMultiDisciplineAnalysis] = useState(true);
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

  const handleFileSelect = async (file: File, processedDoc: ProcessedDocument) => {
    setIsProcessing(true);
    setError(null);

    setLastProcessedDoc({ file, processedDoc });

    try {
      console.log('Starting analysis for:', file.name, 'Type:', processedDoc.fileType, 'Discipline:', selectedDiscipline);

      let result: AnalysisResult;

      if (useMultiDisciplineAnalysis) {
        if (selectedDiscipline === 'construction') {
          result = await analyzeDocument(processedDoc);
          result.discipline = 'construction';
        } else if (selectedDiscipline === 'design' && !flags.designAnalysis) {
          // Show upgrade prompt but allow the analysis for demo purposes
          setError('Design analysis requires Pro tier. This is a demo analysis - upgrade to save and export results.');
          result = await analyzeDocument(processedDoc); // Use construction analysis as fallback
          result.discipline = 'design';
        } else if (selectedDiscipline === 'trade' && !flags.tradeAnalysis) {
          // Show upgrade prompt but allow the analysis for demo purposes
          setError('Trade analysis requires Pro tier. This is a demo analysis - upgrade to save and export results.');
          result = await analyzeDocument(processedDoc); // Use construction analysis as fallback
          result.discipline = 'trade';
        } else {
          result = await MultiDisciplineAnalyzer.analyzeProposal(
            processedDoc,
            selectedDiscipline,
            {
              projectType: 'general',
              estimatedValue: 0
            }
          );
        }

        if (selectedDiscipline === 'construction') {
          setMarketVariance(null);
        } else {
          setMarketVariance(null);
        }

        setRiskAssessment(calculateMultiDisciplineRisk(result));

      } else {
        if (selectedDiscipline === 'construction') {
          result = await analyzeDocument(processedDoc);
          result.discipline = 'construction';
        } else if (selectedDiscipline === 'design') {
          const response = await fetch('/api/claude/design', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processedDoc })
          });
          if (!response.ok) throw new Error(`Design analysis failed: ${response.statusText}`);
          const data = await response.json();
          result = data.result;
        } else {
          const response = await fetch('/api/claude/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processedDoc })
          });
          if (!response.ok) throw new Error(`Trade analysis failed: ${response.statusText}`);
          const data = await response.json();
          result = data.result;
        }
        setMarketVariance(null);
        setRiskAssessment(null);
      }

      setAnalysisResult(result);

      const analysisId = saveAnalysis(result, marketVariance || undefined, riskAssessment || undefined);
      console.log('Analysis saved with ID:', analysisId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      console.error('Analysis error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!analysisResult) return;
    console.log('Exporting analysis...');
  };

  const retryAnalysis = async () => {
    if (!lastProcessedDoc) {
      setError('No document to retry. Please upload a new document.');
      return;
    }

    const { file, processedDoc } = lastProcessedDoc;
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Retrying analysis for:', file.name, 'Type:', processedDoc.fileType);

      const result = await analyzeDocument(processedDoc);
      setAnalysisResult(result);

      const analysisId = saveAnalysis(result);
      console.log('Analysis saved with ID:', analysisId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      console.error('Analysis retry error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
    setLastProcessedDoc(null);
    setMarketVariance(null);
    setRiskAssessment(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Authentication Status */}
        <div className="mb-6">
          <AuthDebug />
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
                Multi-Discipline Proposal Analysis
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload your proposal document for instant AI-powered analysis.
                Support for construction, design services, and trade proposals with expert recommendations.
              </p>
            </div>

            {/* Discipline Selector */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Type</h3>
                  <p className="text-gray-600">Select the type of analysis for your proposal document.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDiscipline === 'construction'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="discipline"
                          value="construction"
                          checked={selectedDiscipline === 'construction'}
                          onChange={(e) => setSelectedDiscipline(e.target.value as 'construction' | 'design' | 'trade')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-2xl">🏗️</span>
                            <h4 className="font-semibold text-gray-900">Construction</h4>
                          </div>
                          <p className="text-sm text-gray-600">General contracting and construction projects - CSI Divisions</p>
                        </div>
                      </label>

                      <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDiscipline === 'design'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="discipline"
                          value="design"
                          checked={selectedDiscipline === 'design'}
                          onChange={(e) => setSelectedDiscipline(e.target.value as 'construction' | 'design' | 'trade')}
                          className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-2xl">📐</span>
                            <h4 className="font-semibold text-gray-900">Design Services</h4>
                            {!flags.designAnalysis && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Pro</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Architecture and engineering services - AIA Phases</p>
                        </div>
                      </label>

                      <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDiscipline === 'trade'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="discipline"
                          value="trade"
                          checked={selectedDiscipline === 'trade'}
                          onChange={(e) => setSelectedDiscipline(e.target.value as 'construction' | 'design' | 'trade')}
                          className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-2xl">⚡</span>
                            <h4 className="font-semibold text-gray-900">Trade Services</h4>
                            {!flags.tradeAnalysis && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Pro</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Specialty trade services - Technical Systems</p>
                        </div>
                      </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Component */}
            <DocumentUpload
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
            />

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
                  <div className="mt-4 space-x-3">
                    {lastProcessedDoc && (
                      <button
                        onClick={retryAnalysis}
                        disabled={isProcessing}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? 'Retrying...' : 'Try Again'}
                      </button>
                    )}
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
                <h3 className="font-semibold text-gray-900 mb-2">Multi-Discipline Analysis</h3>
                <p className="text-sm text-gray-600">CSI divisions for construction, AIA phases for design, and technical systems for trade services</p>
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
        ) : (
          <div className="space-y-8">
            {/* Results Header */}
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
            {useMultiDisciplineAnalysis && analysisResult?.discipline ? (
              <MultiDisciplineAnalysisResults
                analysis={analysisResult}
                marketVariance={marketVariance || undefined}
                riskAssessment={riskAssessment || undefined}
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
              <>
                <AnalysisResults
                  analysis={analysisResult}
                  onExport={handleExport}
                />
                <ExportTools analysis={analysisResult} />
              </>
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