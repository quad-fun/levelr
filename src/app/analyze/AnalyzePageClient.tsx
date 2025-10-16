'use client';

import { useState, Suspense } from 'react';
import AnalysisHistory from '@/components/analysis/AnalysisHistory';
import BidLeveling from '@/components/analysis/BidLeveling';
import ProjectManager from '@/components/ecosystem/ProjectManager';
import { AccessIndicator } from '@/components/auth/AccessControl';
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate RFP</h2>
            <p className="text-gray-600">RFP Builder implementation in progress...</p>
          </div>
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