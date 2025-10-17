'use client';

import { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import { ProcessedDocument } from '@/lib/document-processor';
import { UsageLimitModal } from '../common/UsageLimitModal';
import { UsageStatus } from '../common/UsageStatus';
import { FileText, Loader2, AlertCircle } from 'lucide-react';

interface DocumentAnalyzerProps {
  userId?: string;
  userTier?: string;
}

export default function DocumentAnalyzer({ userId, userTier: _userTier }: DocumentAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{tier?: string, currentUsage?: number, limit?: number}>({});

  const handleFileSelect = (file: File, _processedDoc: ProcessedDocument) => {
    setSelectedFile(file);
    setError(null);
    setAnalysis(null);
  };

  const analyzeDocument = async (processedDoc: ProcessedDocument) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Determine which API endpoint to use based on discipline detection
      // For now, we'll use the main Claude API endpoint
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processedDocument: processedDoc
        })
      });

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.reason === 'limit_exceeded') {
          // Show usage limit modal
          setUsageInfo({
            tier: errorData.tier,
            currentUsage: 3, // Will be dynamic in real implementation
            limit: 3
          });
          setShowUsageLimitModal(true);
          return;
        } else {
          setError('Access denied: ' + (errorData.message || 'Feature not available on your plan'));
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysis(result.analysis);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    // For this demo, we'll create a simple processed document
    // In a real implementation, this would come from the DocumentUpload component
    const processedDoc: ProcessedDocument = {
      fileName: selectedFile.name,
      fileType: 'pdf', // Use valid FileType
      content: 'Demo content for usage limit testing',
      isBase64: false,
      useBlobStorage: false
    };

    await analyzeDocument(processedDoc);
  };

  return (
    <div className="space-y-6">
      {/* Usage Status (Dev Only) */}
      {userId && (
        <UsageStatus userId={userId} />
      )}

      {/* Document Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Document Analysis</h2>
        <DocumentUpload
          onFileSelect={handleFileSelect}
          isProcessing={isAnalyzing}
        />
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h3>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Ready for analysis
                </p>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Document'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Analysis Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis !== null && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showUsageLimitModal}
        onClose={() => setShowUsageLimitModal(false)}
        tier={usageInfo.tier}
        currentUsage={usageInfo.currentUsage}
        limit={usageInfo.limit}
      />
    </div>
  );
}