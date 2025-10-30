// src/components/analysis/Timeline.tsx

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, FileText, Target, Shield, Download } from 'lucide-react';

export interface TimelineStage {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  progress?: number; // 0-1
  message?: string;
  duration?: number; // milliseconds
  icon: React.ComponentType<{ className?: string }>;
}

interface TimelineProps {
  stages: TimelineStage[];
  className?: string;
}

const DEFAULT_STAGES: TimelineStage[] = [
  {
    id: 'parsing',
    name: 'Parsing Document',
    status: 'pending',
    icon: FileText
  },
  {
    id: 'normalizing',
    name: 'Normalizing Data',
    status: 'pending',
    icon: Target
  },
  {
    id: 'detecting',
    name: 'Running Detectors',
    status: 'pending',
    icon: AlertCircle
  },
  {
    id: 'scoring',
    name: 'Calculating Score',
    status: 'pending',
    icon: Shield
  },
  {
    id: 'exports',
    name: 'Preparing Exports',
    status: 'pending',
    icon: Download
  }
];

export default function Timeline({ stages = DEFAULT_STAGES, className = '' }: TimelineProps) {
  const [animatedStages, setAnimatedStages] = useState<TimelineStage[]>(stages);

  // Animate stage transitions
  useEffect(() => {
    setAnimatedStages(stages);
  }, [stages]);

  const getStageIcon = (stage: TimelineStage) => {
    const { icon: Icon } = stage;

    switch (stage.status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return (
          <div className="relative">
            <Icon className="h-5 w-5 text-blue-500 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-30" />
          </div>
        );
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageColor = (stage: TimelineStage) => {
    switch (stage.status) {
      case 'complete':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'active':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressBar = (stage: TimelineStage) => {
    if (stage.status === 'complete') {
      return <div className="w-full h-1 bg-green-500 rounded-full" />;
    }

    if (stage.status === 'active' && stage.progress !== undefined) {
      return (
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.round(stage.progress * 100)}%` }}
          />
        </div>
      );
    }

    return <div className="w-full h-1 bg-gray-200 rounded-full" />;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Analysis Progress</h3>
        <div className="text-sm text-gray-500">
          {animatedStages.filter(s => s.status === 'complete').length} of {animatedStages.length} complete
        </div>
      </div>

      <div className="space-y-2">
        {animatedStages.map((stage, index) => (
          <div
            key={stage.id}
            className={`
              relative p-3 rounded-lg border transition-all duration-300 ease-in-out
              ${getStageColor(stage)}
              ${stage.status === 'active' ? 'transform scale-[1.02] shadow-md' : ''}
            `}
          >
            {/* Connection line to next stage */}
            {index < animatedStages.length - 1 && (
              <div
                className={`
                  absolute left-6 top-full w-0.5 h-2 transition-colors duration-300
                  ${stage.status === 'complete' ? 'bg-green-300' : 'bg-gray-300'}
                `}
              />
            )}

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getStageIcon(stage)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{stage.name}</p>
                  {stage.duration && stage.status === 'complete' && (
                    <span className="text-xs opacity-75">
                      {formatDuration(stage.duration)}
                    </span>
                  )}
                </div>

                {stage.message && (
                  <p className="text-xs opacity-75 mt-1 truncate">
                    {stage.message}
                  </p>
                )}

                {(stage.status === 'active' || stage.status === 'complete') && (
                  <div className="mt-2">
                    {getProgressBar(stage)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall progress indicator */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-medium">
            {Math.round((animatedStages.filter(s => s.status === 'complete').length / animatedStages.length) * 100)}%
          </span>
        </div>
        <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(animatedStages.filter(s => s.status === 'complete').length / animatedStages.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}