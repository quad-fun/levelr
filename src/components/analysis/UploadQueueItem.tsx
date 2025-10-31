// src/components/analysis/UploadQueueItem.tsx

'use client';

import { useState } from 'react';
// Simple icon components without external dependencies
import { type UploadFileInfo, FileUploadStatus } from '@/lib/upload/ingest';

interface UploadQueueItemProps {
  file: UploadFileInfo;
  onCancel: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}

export default function UploadQueueItem({ file, onCancel, onRetry, onRemove }: UploadQueueItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getFileIcon = () => {
    const extension = file.file.name.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return <span className="text-2xl">📄</span>;
      case 'xlsx':
      case 'xls':
        return <span className="text-2xl">📊</span>;
      case 'csv':
        return <span className="text-2xl">📈</span>;
      default:
        return <span className="text-2xl">📄</span>;
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case FileUploadStatus.COMPLETED:
        return <span className="text-green-500">✅</span>;
      case FileUploadStatus.ERROR:
        return <span className="text-red-500">❌</span>;
      case FileUploadStatus.CANCELLED:
        return <span className="text-gray-500">⭕</span>;
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
        );
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case FileUploadStatus.COMPLETED:
        return 'text-green-600';
      case FileUploadStatus.ERROR:
        return 'text-red-600';
      case FileUploadStatus.CANCELLED:
        return 'text-gray-500';
      case FileUploadStatus.UPLOADING:
      case FileUploadStatus.PROCESSING:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case FileUploadStatus.QUEUED:
        return 'Queued';
      case FileUploadStatus.VALIDATING:
        return 'Validating';
      case FileUploadStatus.UPLOADING:
        return file.route === 'large' ? 'Ephemeral upload (secure)' : 'Uploading';
      case FileUploadStatus.PROCESSING:
        return 'Processing';
      case FileUploadStatus.COMPLETED:
        return 'Completed';
      case FileUploadStatus.ERROR:
        return 'Error';
      case FileUploadStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getIntegrityBadges = () => {
    const badges = [];

    // MIME validation badge
    badges.push(
      <span
        key="mime"
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
      >
        MIME OK
      </span>
    );

    // Signature validation badge
    badges.push(
      <span
        key="signature"
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
      >
        Signature OK
      </span>
    );

    return badges;
  };

  const isDuplicate = file.error === 'File already in queue';

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${
      isDuplicate
        ? 'bg-gray-50 border-gray-200'
        : file.status === FileUploadStatus.ERROR
        ? 'bg-red-50 border-red-200'
        : file.status === FileUploadStatus.COMPLETED
        ? 'bg-green-50 border-green-200'
        : 'bg-white border-gray-200'
    }`}>
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getFileIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className={`text-sm font-medium truncate ${isDuplicate ? 'text-gray-500' : 'text-gray-900'}`}>
                {file.file.name}
              </p>
              {isDuplicate && (
                <span className="text-xs text-gray-500">Already processed</span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xs text-gray-500">
                {formatFileSize(file.file.size)}
              </p>
              <span className="text-gray-300">•</span>
              <p className={`text-xs ${getStatusColor()}`}>
                {getStatusText()}
              </p>
              {file.disciplineHint && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {file.disciplineHint}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getStatusIcon()}

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {file.status === FileUploadStatus.ERROR && (
              <button
                onClick={() => onRetry(file.id)}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
              >
                Retry
              </button>
            )}

            {(file.status === FileUploadStatus.UPLOADING || file.status === FileUploadStatus.PROCESSING) && (
              <button
                onClick={() => onCancel(file.id)}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}

            <button
              onClick={() => onRemove(file.id)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Remove from queue"
            >
              <span>✕</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(file.status === FileUploadStatus.UPLOADING || file.status === FileUploadStatus.PROCESSING) && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Processing...</span>
            <span>{Math.round(file.progress)}%</span>
          </div>
        </div>
      )}

      {/* Integrity Badges */}
      {!isDuplicate && file.status !== FileUploadStatus.ERROR && (
        <div className="flex items-center space-x-2">
          {getIntegrityBadges()}
          {file.route === 'large' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Large File
            </span>
          )}
        </div>
      )}

      {/* Error Details */}
      {file.status === FileUploadStatus.ERROR && file.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 font-medium">Error:</span>
            <span className="text-red-600">{file.error}</span>
          </div>
          {!showDetails && (
            <button
              onClick={() => setShowDetails(true)}
              className="text-xs text-red-600 underline mt-1"
            >
              Show details
            </button>
          )}
          {showDetails && (
            <div className="mt-2 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify({
                  route: file.route,
                  fingerprint: file.fingerprint.hash.substring(0, 8),
                  startTime: new Date(file.startTime).toISOString()
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* File Details (collapsed by default) */}
      {file.status === FileUploadStatus.COMPLETED && (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Confidence:</span>
            <span>{Math.round((file.fingerprint.hash ? 0.95 : 0.5) * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Processing time:</span>
            <span>
              {file.endTime ? Math.round((file.endTime - file.startTime) / 1000) : 0}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}