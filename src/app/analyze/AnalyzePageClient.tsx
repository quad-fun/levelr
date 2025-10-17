'use client';

import { useState, Suspense } from 'react';
import AnalysisHistory from '@/components/analysis/AnalysisHistory';
import BidLeveling from '@/components/analysis/BidLeveling';
import ProjectManager from '@/components/ecosystem/ProjectManager';
import { AccessIndicator } from '@/components/auth/AccessControl';
import { FeatureGate } from '@/components/common/FeatureGate';
import { Navigation } from '@/components/layout/Navigation';
import type { Flags } from '@/lib/flags';

interface AnalyzePageClientProps {
  flags: Flags;
}

function AnalyzePageContent({ flags }: AnalyzePageClientProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'leveling' | 'rfp' | 'ecosystem'>('upload');

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

      {/* Main Navigation */}
      <Navigation flags={flags} currentPath="/analyze" />

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

            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : flags.analysisHistory
                  ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  : 'border-transparent text-gray-400 cursor-not-allowed'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leveling'
                  ? 'border-blue-500 text-blue-600'
                  : flags.bidLeveling
                  ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  : 'border-transparent text-gray-400 cursor-not-allowed'
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

            <button
              onClick={() => setActiveTab('rfp')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rfp'
                  ? 'border-blue-500 text-blue-600'
                  : flags.generateRfp
                  ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  : 'border-transparent text-gray-400 cursor-not-allowed'
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
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ecosystem'
                  ? 'border-blue-500 text-blue-600'
                  : flags.projectManagement
                  ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  : 'border-transparent text-gray-400 cursor-not-allowed'
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

        {activeTab === 'history' && (
          <FeatureGate
            enabled={flags.analysisHistory}
            title="Analysis History"
            blurb="Search and browse all your past analyses. Create custom benchmarking datasets and track analysis trends over time."
          >
            <AnalysisHistory />
          </FeatureGate>
        )}

        {activeTab === 'leveling' && (
          <FeatureGate
            enabled={flags.bidLeveling}
            title="Bid Leveling"
            blurb="Compare up to 5 bids side-by-side with automated variance detection. Get AI explanations for cost differences."
          >
            <BidLeveling flags={flags} />
          </FeatureGate>
        )}

        {activeTab === 'rfp' && (
          <FeatureGate
            enabled={flags.generateRfp}
            title="Generate RFP"
            blurb="Create professional RFPs with AI-assisted scope writing, CSI division templates, and commercial terms."
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Generate RFP</h2>
              <p className="text-gray-600">RFP Builder implementation in progress...</p>
            </div>
          </FeatureGate>
        )}

        {activeTab === 'ecosystem' && (
          <FeatureGate
            enabled={flags.projectManagement}
            title="Project Management"
            blurb="Complete project lifecycle management with timelines, budgets, change orders, and team collaboration tools."
          >
            <ProjectManager />
          </FeatureGate>
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