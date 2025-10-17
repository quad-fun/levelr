'use client';

import { useState } from 'react';
import { Switch } from '@headlessui/react';

interface FeatureFlagControlsProps {
  currentFlags: Record<string, boolean>;
}

export function FeatureFlagControls({ currentFlags }: FeatureFlagControlsProps) {
  const [flags, setFlags] = useState(currentFlags);
  const [isSaving, setIsSaving] = useState(false);

  const flagCategories = {
    'Platform Features': [
      { key: 'auth', label: 'Authentication', description: 'Enable Clerk authentication system' },
      { key: 'payments', label: 'Payments', description: 'Enable Stripe billing and subscriptions' },
      { key: 'usageLimits', label: 'Usage Limits', description: 'Enforce analysis usage limits' },
      { key: 'teams', label: 'Teams', description: 'Team collaboration features' },
      { key: 'inlineExplanations', label: 'Inline Explanations', description: 'Variance explanation tooltips' }
    ],
    'Analysis Modules': [
      { key: 'bidAnalysis', label: 'Bid Analysis', description: 'Core construction bid analysis' },
      { key: 'designAnalysis', label: 'Design Analysis', description: 'AIA phase analysis for design services' },
      { key: 'tradeAnalysis', label: 'Trade Analysis', description: 'Technical systems analysis for trades' },
      { key: 'summaryGeneration', label: 'Summary Generation', description: 'Detailed summary generation' }
    ],
    'Advanced Features': [
      { key: 'generateRfp', label: 'Generate RFP', description: 'AI-assisted RFP creation' },
      { key: 'projectManagement', label: 'Project Management', description: 'Project lifecycle management' },
      { key: 'analysisHistory', label: 'Analysis History', description: 'Historical analysis browsing' },
      { key: 'bidLeveling', label: 'Bid Leveling', description: 'Side-by-side bid comparison' }
    ],
    'Bid Leveling Features': [
      { key: 'blVarianceExplanation', label: 'Variance Explanations', description: 'AI explanations for cost differences' },
      { key: 'blVarianceAnalysis', label: 'Variance Analysis', description: 'Statistical variance analysis' },
      { key: 'blComparativeAnalysis', label: 'Comparative Analysis', description: 'Advanced comparison features' }
    ],
    'Export Features': [
      { key: 'exportBidAnalysis', label: 'Export Bid Analysis', description: 'PDF/Excel export for analysis' },
      { key: 'exportBidLeveling', label: 'Export Bid Leveling', description: 'PDF/Excel export for leveling' },
      { key: 'exportRfp', label: 'Export RFP', description: 'PDF/Excel export for RFPs' }
    ],
    'Technical': [
      { key: 'blobStorage', label: 'Blob Storage', description: 'Large file blob storage handling' }
    ]
  };

  const updateFlag = (key: string, value: boolean) => {
    setFlags(prev => ({ ...prev, [key]: value }));
  };

  const saveFlags = async () => {
    setIsSaving(true);
    try {
      // Save flags to cookie for client-side override
      const encoded = btoa(JSON.stringify(flags));
      document.cookie = `ff=${encoded}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

      // Refresh the page to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Error saving flags:', error);
      alert('Error saving flags. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetFlags = () => {
    // Clear the override cookie
    document.cookie = 'ff=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    window.location.reload();
  };

  const applyPreset = (preset: string) => {
    const presets: Record<string, Partial<Record<string, boolean>>> = {
      'starter': {
        payments: true,
        usageLimits: true,
        teams: false,
        inlineExplanations: false,
        bidAnalysis: true,
        designAnalysis: false,
        tradeAnalysis: false,
        summaryGeneration: true,
        bidLeveling: true,
        blVarianceExplanation: false,
        blVarianceAnalysis: true,
        blComparativeAnalysis: false,
        exportBidAnalysis: false,
        exportBidLeveling: false,
        exportRfp: false,
        generateRfp: true,
        projectManagement: false,
        analysisHistory: true,
        blobStorage: true,
      },
      'pro': {
        payments: true,
        usageLimits: false,
        teams: false,
        inlineExplanations: true,
        bidAnalysis: true,
        designAnalysis: true,
        tradeAnalysis: true,
        summaryGeneration: true,
        bidLeveling: true,
        blVarianceExplanation: true,
        blVarianceAnalysis: true,
        blComparativeAnalysis: true,
        exportBidAnalysis: true,
        exportBidLeveling: true,
        exportRfp: true,
        generateRfp: true,
        projectManagement: false,
        analysisHistory: true,
        blobStorage: true,
      },
      'demo': {
        // Show everything but limit functionality
        auth: false,
        payments: false,
        usageLimits: false,
        teams: false,
        inlineExplanations: true,
        bidAnalysis: true,
        designAnalysis: true,
        tradeAnalysis: true,
        summaryGeneration: true,
        bidLeveling: true,
        blVarianceExplanation: true,
        blVarianceAnalysis: true,
        blComparativeAnalysis: true,
        exportBidAnalysis: false, // Demo users can't export
        exportBidLeveling: false,
        exportRfp: false,
        generateRfp: true,
        projectManagement: true,
        analysisHistory: true,
        blobStorage: true,
      }
    };

    const presetFlags = presets[preset];
    if (presetFlags) {
      setFlags(prev => {
        const updated = { ...prev };
        Object.entries(presetFlags).forEach(([key, value]) => {
          if (value !== undefined) {
            updated[key] = value;
          }
        });
        return updated;
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Presets */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Presets</h3>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => applyPreset('starter')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Starter Tier
          </button>
          <button
            onClick={() => applyPreset('pro')}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Pro Tier
          </button>
          <button
            onClick={() => applyPreset('demo')}
            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Demo Mode
          </button>
          <button
            onClick={resetFlags}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Reset to Default
          </button>
        </div>
      </div>

      {/* Individual Flag Controls */}
      {Object.entries(flagCategories).map(([category, categoryFlags]) => (
        <div key={category} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
          <div className="space-y-4">
            {categoryFlags.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-600">{description}</div>
                </div>
                <Switch
                  checked={flags[key] || false}
                  onChange={(checked) => updateFlag(key, checked)}
                  className={`${
                    flags[key] ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      flags[key] ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save Button */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Apply Changes</h3>
            <p className="text-sm text-gray-600">Changes will be saved as browser overrides and applied immediately</p>
          </div>
          <button
            onClick={saveFlags}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}