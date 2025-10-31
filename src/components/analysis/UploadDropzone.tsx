// src/components/analysis/UploadDropzone.tsx

'use client';

import { useCallback, useState, useRef } from 'react';
// Simple upload component without external icon dependencies
import { getAcceptedFileTypes } from '@/lib/upload/mime';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  currentFileCount?: number;
  className?: string;
}

export default function UploadDropzone({
  onFilesSelected,
  disabled = false,
  maxFiles = 3,
  currentFileCount = 0,
  className = ''
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = maxFiles - currentFileCount;
  const canAddFiles = remainingSlots > 0 && !disabled;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canAddFiles) return;

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [canAddFiles]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    if (!canAddFiles) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files.slice(0, remainingSlots));
    }
  }, [canAddFiles, remainingSlots, onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files.slice(0, remainingSlots));
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [remainingSlots, onFilesSelected]);

  const handleClick = useCallback(() => {
    if (canAddFiles) {
      fileInputRef.current?.click();
    }
  }, [canAddFiles]);

  const getSupportedFormats = () => {
    return [
      { name: 'PDF Documents', ext: '.pdf', desc: 'Construction bids, proposals' },
      { name: 'Excel Spreadsheets', ext: '.xlsx, .xls', desc: 'Cost breakdowns, line items' },
      { name: 'CSV Files', ext: '.csv', desc: 'Structured cost data' },
      { name: 'Word Documents', ext: '.docx', desc: 'Proposals, specifications' }
    ];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging && canAddFiles
            ? 'border-blue-400 bg-blue-50'
            : canAddFiles
            ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptedFileTypes()}
          onChange={handleFileSelect}
          className="hidden"
          disabled={!canAddFiles}
        />

        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            {canAddFiles ? (
              <span className={`text-6xl ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}>
                📁
              </span>
            ) : (
              <span className="text-6xl text-gray-400">⚠️</span>
            )}
          </div>

          {/* Main Text */}
          <div>
            {canAddFiles ? (
              <>
                <p className="text-lg font-medium text-gray-900">
                  {isDragging ? 'Drop files here' : 'Upload documents'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag & drop files here, or{' '}
                  <span className="text-blue-600 font-medium">click to browse</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-600">
                  Maximum files reached
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {disabled ? 'Upload disabled' : `Remove some files to add more (${currentFileCount}/${maxFiles})`}
                </p>
              </>
            )}
          </div>

          {/* File Limits */}
          {canAddFiles && (
            <div className="space-y-2">
              <div className="flex justify-center space-x-4 text-xs text-gray-500">
                <span>Max {maxFiles} files</span>
                <span>•</span>
                <span>Up to 200MB each</span>
                <span>•</span>
                <span>{remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining</span>
              </div>

              {remainingSlots >= 2 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 Multi-file tip
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Upload 2+ files to automatically start bid leveling when processing completes
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Supported Formats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Supported file types</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {getSupportedFormats().map((format, index) => (
            <div key={index} className="flex items-start space-x-3">
              <span className="text-gray-400 mt-0.5 flex-shrink-0">📄</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{format.name}</p>
                <p className="text-xs text-gray-500">{format.ext}</p>
                <p className="text-xs text-gray-400 mt-1">{format.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <p className="text-sm text-green-800">
            <span className="font-medium">Secure processing:</span> Files are encrypted during analysis and immediately deleted after processing
          </p>
        </div>
      </div>
    </div>
  );
}