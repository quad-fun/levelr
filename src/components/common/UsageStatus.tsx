'use client';

import { useState, useEffect } from 'react';
import { BarChart, Clock, AlertTriangle } from 'lucide-react';

interface UsageStatusProps {
  userId?: string;
}

interface UsageInfo {
  tier: string;
  currentUsage: number;
  limit: string | number;
  remaining: string | number;
  canAnalyze: boolean;
  isUnlimited: boolean;
  monthKey: string;
}

export function UsageStatus({ userId }: UsageStatusProps) {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && process.env.NODE_ENV === 'development') {
      fetchUsageInfo();
    }
  }, [userId]);

  const fetchUsageInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dev/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageInfo(data.usageInfo);
      }
    } catch (error) {
      console.error('Failed to fetch usage info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId || process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!usageInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (usageInfo.isUnlimited) return 'text-green-600';
    if (!usageInfo.canAnalyze) return 'text-red-600';
    if (usageInfo.currentUsage >= (usageInfo.limit as number) * 0.8) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getIcon = () => {
    if (!usageInfo.canAnalyze) return <AlertTriangle className="w-4 h-4" />;
    if (usageInfo.isUnlimited) return <BarChart className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={getStatusColor()}>
            {getIcon()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {usageInfo.isUnlimited ? 'Unlimited' : `${usageInfo.currentUsage}/${usageInfo.limit}`} analyses
            </div>
            <div className="text-xs text-gray-500">
              {usageInfo.tier.charAt(0).toUpperCase() + usageInfo.tier.slice(1)} plan • {usageInfo.monthKey}
            </div>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="flex space-x-2">
            <button
              onClick={fetchUsageInfo}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={async () => {
                try {
                  await fetch('/api/dev/usage', { method: 'DELETE' });
                  fetchUsageInfo();
                } catch (error) {
                  console.error('Failed to reset usage:', error);
                }
              }}
              className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {!usageInfo.canAnalyze && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            Usage limit reached. <a href="/pricing" className="underline hover:no-underline">Upgrade to Pro</a> for unlimited access.
          </p>
        </div>
      )}
    </div>
  );
}