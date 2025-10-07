'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle } from 'lucide-react';
import { processDocument, ProcessedDocument, detectFileType } from '@/lib/document-processor';
import { upload } from '@vercel/blob/client';

interface DocumentUploadProps {
  onFileSelect: (file: File, processedDoc: ProcessedDocument, discipline: 'construction' | 'design' | 'trade') => void;
  isProcessing: boolean;
}

export default function DocumentUpload({ onFileSelect, isProcessing }: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  // Removed selectedDiscipline state as it's not needed - discipline is passed directly to callback
  const [showDisciplineSelection, setShowDisciplineSelection] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingProcessedDoc, setPendingProcessedDoc] = useState<ProcessedDocument | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setUploadProgress(null);
    
    try {
      console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', Math.round(file.size / (1024 * 1024)), 'MB');
      
      // For large files, use blob storage workflow
      if (file.size > 4 * 1024 * 1024) { // 4MB threshold
        console.log('Large file detected, using Vercel Blob client upload');
        
        setUploadProgress('Uploading large file...');
        
        // Use official Vercel Blob client upload with multipart for large files
        console.log('Starting blob upload...');
        const blob = await upload(file.name, file, {
          access: 'public',
          multipart: true, // Key for large files - splits into parts, uploads in parallel
          handleUploadUrl: '/api/blob/upload',
        });
        
        console.log('File uploaded to blob storage:', blob.url);
        setUploadProgress('Upload complete, verifying file...');
        
        // Wait a moment for blob to be fully available across Vercel's CDN
        console.log('Waiting for blob propagation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify blob is accessible before proceeding
        setUploadProgress('Verifying file accessibility...');
        try {
          const testResponse = await fetch(blob.url, { method: 'HEAD' });
          if (!testResponse.ok) {
            throw new Error(`Blob not yet accessible: ${testResponse.status}`);
          }
          console.log('Blob verified as accessible');
        } catch (error) {
          console.warn('Blob verification failed, proceeding anyway:', error);
        }
        
        setUploadProgress('File ready for analysis');
        
        // Create a processedDoc with blob URL reference
        const processedDoc: ProcessedDocument = {
          content: blob.url, // Store blob URL instead of file content
          fileType: detectFileType(file.name, file.type),
          fileName: file.name,
          isBase64: false,
          useBlobStorage: true // Flag to indicate blob storage usage
        };
        
        setUploadProgress(null); // Clear progress before analysis starts
        // Store processed document and show discipline selection
        setPendingFile(file);
        setPendingProcessedDoc(processedDoc);
        setShowDisciplineSelection(true);
        
      } else {
        // For smaller files, use original processing
        const processedDoc = await processDocument(file);
        
        console.log('Document processed successfully:', {
          fileType: processedDoc.fileType,
          isBase64: processedDoc.isBase64,
          contentLength: processedDoc.content.length
        });
        
        // Store processed document and show discipline selection
        setPendingFile(file);
        setPendingProcessedDoc(processedDoc);
        setShowDisciplineSelection(true);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file. Please try again.';
      setError(errorMessage);
      setUploadProgress(null); // Clear progress on error
      console.error('File processing error:', err);
    }
  }, [onFileSelect]);

  const handleDisciplineSelect = (discipline: 'construction' | 'design' | 'trade') => {
    if (pendingFile && pendingProcessedDoc) {
      setShowDisciplineSelection(false);
      onFileSelect(pendingFile, pendingProcessedDoc, discipline);
      // Reset pending state
      setPendingFile(null);
      setPendingProcessedDoc(null);
    }
  };

  const cancelDisciplineSelection = () => {
    setShowDisciplineSelection(false);
    setPendingFile(null);
    setPendingProcessedDoc(null);
    setUploadProgress(null);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file size (75MB limit for Vercel Pro)
    if (file.size > 75 * 1024 * 1024) {
      setError('File size must be less than 75MB. Please compress your file if it exceeds this limit.');
      return;
    }
    
    await processFile(file);
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Processing document...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload Project Document
            </p>
            <p className="text-gray-600 mb-4">
              Construction bids, design proposals, trade estimates & more
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Excel (.xlsx)</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">PDF (.pdf)</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Images (.jpg/.png)</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Text (.txt)</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Progress Indicator */}
      {uploadProgress && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <p className="text-blue-800 font-medium">Upload in Progress</p>
              <p className="text-blue-600 text-sm">{uploadProgress}</p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              <strong>Secure Processing:</strong> Documents are encrypted during AI analysis and immediately deleted. No financial data is retained after your session.
            </p>
          </div>
        </div>
      </div>

      {/* Discipline Selection Modal */}
      {showDisciplineSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Document Type</h3>
            <p className="text-gray-600 mb-6">
              Choose the type of document you're analyzing to ensure accurate analysis and comparison:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleDisciplineSelect('construction')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Construction</div>
                <div className="text-sm text-gray-600">General contractor bids, construction proposals, project estimates</div>
                <div className="text-xs text-blue-600 mt-1">→ Analyzed using CSI Division standards</div>
              </button>

              <button
                onClick={() => handleDisciplineSelect('design')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Design Services</div>
                <div className="text-sm text-gray-600">Architectural, engineering, MEP design proposals</div>
                <div className="text-xs text-blue-600 mt-1">→ Analyzed using AIA Phase standards</div>
              </button>

              <button
                onClick={() => handleDisciplineSelect('trade')}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Trade Services</div>
                <div className="text-sm text-gray-600">Electrical, plumbing, HVAC, specialty contractor bids</div>
                <div className="text-xs text-blue-600 mt-1">→ Analyzed using Technical Systems standards</div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={cancelDisciplineSelection}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}