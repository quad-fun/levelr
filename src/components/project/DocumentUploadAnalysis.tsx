'use client';

import React, { useState, useCallback } from 'react';
import {
  Upload, X, FileText, AlertCircle, CheckCircle,
  Loader2, Download, Eye, Sparkles
} from 'lucide-react';
import {
  DocumentFile,
  DocumentAnalysisResult,
  analyzeDocument,
  analyzeMultipleDocuments,
  applyAnalysisToWizard,
  isFileTypeSupported
} from '@/lib/document-analysis';
import { ProjectWizardData } from '@/types/project';

interface DocumentUploadAnalysisProps {
  wizardData: ProjectWizardData;
  onAnalysisComplete: (updates: Partial<ProjectWizardData>, analysisResult: DocumentAnalysisResult) => void;
  className?: string;
}

export default function DocumentUploadAnalysis({
  wizardData,
  onAnalysisComplete,
  className = ''
}: DocumentUploadAnalysisProps) {
  const [uploadedFiles, setUploadedFiles] = useState<DocumentFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    setError(null);

    // Filter supported file types
    const supportedFiles = files.filter(file => {
      if (!isFileTypeSupported(file)) {
        setError(`Unsupported file type: ${file.name}`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError(`File too large: ${file.name} (max 50MB)`);
        return false;
      }
      return true;
    });

    if (supportedFiles.length === 0) return;

    const newDocumentFiles: DocumentFile[] = supportedFiles.map(file => ({ file }));
    setUploadedFiles(prev => [...prev, ...newDocumentFiles]);

    // Start analysis
    await analyzeFiles(supportedFiles);
  };

  const analyzeFiles = async (files: File[]) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      let result: DocumentAnalysisResult;

      if (files.length === 1) {
        result = await analyzeDocument(files[0]);
      } else {
        result = await analyzeMultipleDocuments(files);
      }

      setAnalysisResult(result);

      // Apply analysis to wizard data
      const updates = applyAnalysisToWizard(result, wizardData);
      onAnalysisComplete(updates, result);

    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Failed to analyze documents. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));

    // Re-analyze remaining files if any
    const remainingFiles = uploadedFiles.filter((_, i) => i !== index).map(df => df.file);
    if (remainingFiles.length > 0) {
      analyzeFiles(remainingFiles);
    } else {
      setAnalysisResult(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    if (confidence >= 40) return 'Low Confidence';
    return 'Very Low Confidence';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isAnalyzing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Documents...</h3>
            <p className="text-gray-600">AI is extracting project information</p>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Project Documents</h3>
            <p className="text-gray-600 mb-4">
              Project overviews, specifications, drawings, or any relevant documents
            </p>
            <div className="flex items-center justify-center space-x-4">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Choose Files
              </label>
              <span className="text-gray-500">or drag and drop</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Supported: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV (max 50MB each)
            </p>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Upload Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Uploaded Documents</h3>
          {uploadedFiles.map((documentFile, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{documentFile.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(documentFile.file.size)} • {documentFile.file.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Sparkles className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">AI Analysis Complete</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-sm font-medium ${getConfidenceColor(analysisResult.confidence || 0)}`}>
                  {getConfidenceLabel(analysisResult.confidence || 0)}
                </span>
                <span className="text-sm text-blue-700">
                  ({analysisResult.confidence || 0}% confidence)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {analysisResult.projectName && (
              <div>
                <span className="font-medium text-gray-700">Project Name:</span>
                <p className="text-gray-900">{analysisResult.projectName}</p>
              </div>
            )}

            {analysisResult.discipline && (
              <div>
                <span className="font-medium text-gray-700">Discipline:</span>
                <p className="text-gray-900 capitalize">{analysisResult.discipline}</p>
              </div>
            )}

            {analysisResult.estimatedBudget && (
              <div>
                <span className="font-medium text-gray-700">Estimated Budget:</span>
                <p className="text-gray-900">
                  ${analysisResult.estimatedBudget.toLocaleString()}
                </p>
              </div>
            )}

            {analysisResult.location?.city && (
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <p className="text-gray-900">
                  {analysisResult.location.city}
                  {analysisResult.location.state && `, ${analysisResult.location.state}`}
                </p>
              </div>
            )}

            {analysisResult.timeline?.duration && (
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <p className="text-gray-900">{analysisResult.timeline.duration} months</p>
              </div>
            )}

            {analysisResult.anticipatedRFPs && analysisResult.anticipatedRFPs.length > 0 && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Anticipated RFPs:</span>
                <ul className="list-disc list-inside text-gray-900 mt-1">
                  {analysisResult.anticipatedRFPs.slice(0, 3).map((rfp, index) => (
                    <li key={index}>{rfp.name} ({rfp.discipline})</li>
                  ))}
                  {analysisResult.anticipatedRFPs.length > 3 && (
                    <li className="text-gray-600">+ {analysisResult.anticipatedRFPs.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4" />
              <span>Project information has been automatically populated in the wizard steps above.</span>
            </div>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">How Document Analysis Works</h3>
            <p className="text-gray-700 text-sm mt-1">
              Our AI analyzes your documents to extract project details like name, location, budget, timeline,
              and potential RFPs. The extracted information is automatically filled into the previous wizard steps.
              Review and adjust the information as needed before creating your project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}