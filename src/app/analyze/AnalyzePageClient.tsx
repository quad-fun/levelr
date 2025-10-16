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
import { analyzeDocument } from '@/lib/claude-client';
import { MultiDisciplineAnalyzer } from '@/lib/analysis/multi-discipline-analyzer';
import { calculateMultiDisciplineRisk } from '@/lib/analysis/risk-analyzer';
import { AnalysisResult, MarketVariance, RiskAssessment } from '@/types/analysis';
import { saveAnalysis, getProject } from '@/lib/storage';
import { ProcessedDocument } from '@/lib/document-processor';
import { exportAnalysisToPDF, exportAnalysisToExcel } from '@/lib/analysis/exports';
import { AccessIndicator } from '@/components/auth/AccessControl';
import type { Flags } from '@/lib/flags';

interface AnalyzePageClientProps {
  flags: Flags;
}

function AnalyzePageContent({ flags }: AnalyzePageClientProps) {
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

  // Same useEffect and handler logic from the original file...
  // [I'll need to copy the rest of the original analyze page content]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                Levelr
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true' && (
                <AccessIndicator />
              )}
              <a
                href="/docs"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                How To Guide
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Document Analysis
            </button>

            {flags.analysisHistory && (
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analysis History
              </button>
            )}

            {flags.bidLeveling && (
              <button
                onClick={() => setActiveTab('leveling')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leveling'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bid Leveling
              </button>
            )}

            {flags.generateRfp && (
              <button
                onClick={() => setActiveTab('rfp')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rfp'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Generate RFP
              </button>
            )}

            {flags.projectManagement && (
              <button
                onClick={() => setActiveTab('ecosystem')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ecosystem'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Project Management
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            {/* Document Upload and Analysis sections... */}
            <p>Document Analysis Content (implementation needed)</p>
          </div>
        )}

        {activeTab === 'history' && flags.analysisHistory && (
          <AnalysisHistory />
        )}

        {activeTab === 'leveling' && flags.bidLeveling && (
          <BidLeveling flags={flags} />
        )}

        {activeTab === 'rfp' && flags.generateRfp && (
          <RFPBuilder
            selectedProject={selectedProjectForRFP}
            onProjectSelect={setSelectedProjectForRFP}
          />
        )}

        {activeTab === 'ecosystem' && flags.projectManagement && (
          <ProjectManager />
        )}
      </main>
    </div>
  );
}

export default function AnalyzePageClient({ flags }: AnalyzePageClientProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
      <AnalyzePageContent flags={flags} />
    </Suspense>
  );
}