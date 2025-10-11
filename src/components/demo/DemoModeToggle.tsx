'use client';

import React, { useState, useEffect } from 'react';
import {
  isDemoModeEnabled,
  enableDemoMode,
  disableDemoMode
} from '@/lib/demo-data';
import {
  Play, Square, Database, AlertCircle, CheckCircle,
  Zap, BarChart3, FileText, Users, Settings
} from 'lucide-react';

interface DemoModeToggleProps {
  onToggle?: (enabled: boolean) => void;
  variant?: 'full' | 'compact' | 'button';
  className?: string;
}

export default function DemoModeToggle({
  onToggle,
  variant = 'full',
  className = ''
}: DemoModeToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setIsEnabled(isDemoModeEnabled());
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      if (isEnabled) {
        disableDemoMode();
        setIsEnabled(false);
        onToggle?.(false);
      } else {
        enableDemoMode();
        setIsEnabled(true);
        onToggle?.(true);
      }

      // Force a page reload to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Error toggling demo mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Compact button version
  if (variant === 'button') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isEnabled
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : isEnabled ? (
          <Square className="h-4 w-4 mr-2" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        {isEnabled ? 'Exit Demo' : 'Demo Mode'}
      </button>
    );
  }

  // Compact version
  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              isEnabled ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {isEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Database className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Demo Mode {isEnabled ? 'Active' : 'Available'}
              </h3>
              <p className="text-sm text-gray-600">
                {isEnabled
                  ? 'Viewing sample project data'
                  : 'Load sample data to explore features'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Loading...' : isEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    );
  }

  // Full version with details
  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              isEnabled ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {isEnabled ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Database className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Demo Mode {isEnabled ? 'Active' : 'Available'}
              </h3>
              <p className="text-gray-600">
                {isEnabled
                  ? 'Currently viewing sample project data with realistic scenarios'
                  : 'Load comprehensive demo data to explore all project management features'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isEnabled
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <div className="flex items-center">
                  {isEnabled ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Disable Demo Mode
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Enable Demo Mode
                    </>
                  )}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Demo Content Preview */}
      {!isEnabled && (
        <div className="px-6 py-4">
          <h4 className="font-medium text-gray-900 mb-4">What's Included in Demo Mode</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900">Sample Projects</h5>
                <p className="text-sm text-gray-600">
                  2 realistic projects: Downtown Office Complex (active) and Riverside Residential (planning)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900">RFPs & Bids</h5>
                <p className="text-sm text-gray-600">
                  Multiple RFPs with bid responses, evaluations, and awarded contracts
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900">Team Management</h5>
                <p className="text-sm text-gray-600">
                  Complete project teams with roles, permissions, and responsibilities
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900">Analytics & Insights</h5>
                <p className="text-sm text-gray-600">
                  Performance metrics, budget trends, and risk assessments
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Information */}
      {isEnabled && (
        <div className="px-6 py-4 bg-green-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Demo Mode Active</h4>
              <p className="text-sm text-green-700 mt-1">
                You're currently viewing sample data. All changes are temporary and will be lost when demo mode is disabled.
                Your actual project data remains untouched.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Demo Data Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700">Projects</h5>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Downtown Office Complex ($45M)</li>
                <li>• Riverside Residential ($25M)</li>
                <li>• Complete timelines & milestones</li>
                <li>• Budget tracking & analytics</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700">RFPs & Bids</h5>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• General construction RFP</li>
                <li>• MEP systems procurement</li>
                <li>• Elevator systems (pending)</li>
                <li>• Realistic bid comparisons</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700">Team & Analytics</h5>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Project owners & managers</li>
                <li>• Architects & engineers</li>
                <li>• Performance metrics</li>
                <li>• Risk assessments</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}