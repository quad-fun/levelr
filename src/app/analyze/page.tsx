'use client';

import { useState } from 'react';
import DocumentUpload from '@/components/analysis/DocumentUpload';
import AnalysisResults from '@/components/analysis/AnalysisResults';
import ExportTools from '@/components/analysis/ExportTools';
import AnalysisHistory from '@/components/analysis/AnalysisHistory';
import BidLeveling from '@/components/analysis/BidLeveling';
import { analyzeDocument } from '@/lib/claude-client';
import { AnalysisResult } from '@/types/analysis';
import { saveAnalysis } from '@/lib/storage';
import { ProcessedDocument } from '@/lib/document-processor';

export default function AnalyzePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'leveling'>('upload');
  const [lastProcessedDoc, setLastProcessedDoc] = useState<{file: File, processedDoc: ProcessedDocument} | null>(null);

  const handleFileSelect = async (file: File, processedDoc: ProcessedDocument) => {
    setIsProcessing(true);
    setError(null);
    
    // Store the processed document for potential retry
    setLastProcessedDoc({ file, processedDoc });
    
    try {
      console.log('Starting analysis for:', file.name, 'Type:', processedDoc.fileType);
      
      const result = await analyzeDocument(processedDoc);
      setAnalysisResult(result);
      
      // Save analysis to localStorage for leveling database
      const analysisId = saveAnalysis(result);
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
    
    // Export functionality is handled by ExportTools component
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
      
      // Save analysis to localStorage for leveling database
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                ProLeveler
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/docs" 
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Documentation
              </a>
              {/* Pricing disabled for now */}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              New Analysis
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analysis History
            </button>
            <button
              onClick={() => setActiveTab('leveling')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'leveling' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bid Leveling
            </button>
          </div>
        </div>

        {activeTab === 'history' ? (
          <AnalysisHistory />
        ) : activeTab === 'leveling' ? (
          <BidLeveling />
        ) : !analysisResult ? (
          <div className="space-y-8">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Construction Bid Analysis
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload your bid document for instant AI-powered analysis. 
                We'll identify cost variances, risk factors, and provide expert recommendations.
              </p>
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
                <h3 className="font-semibold text-gray-900 mb-2">CSI Division Mapping</h3>
                <p className="text-sm text-gray-600">Automatically categorize costs by CSI divisions with market benchmarking</p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Risk Assessment</h3>
                <p className="text-sm text-gray-600">Identify potential cost overruns and missing scope items</p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Professional Reports</h3>
                <p className="text-sm text-gray-600">Generate detailed PDF and Excel reports for stakeholders</p>
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
            <AnalysisResults 
              analysis={analysisResult} 
              onExport={handleExport}
            />

            {/* Export Tools */}
            <ExportTools analysis={analysisResult} />
          </div>
        )}
      </div>
    </div>
  );
}