'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/types/analysis';
import { exportAnalysisToPDF, exportAnalysisToExcel } from '@/lib/analysis/exports';
import { Download, FileText, Sheet, Lock } from 'lucide-react';
import type { Flags } from '@/lib/flags';

interface ExportToolsProps {
  analysis: AnalysisResult;
  flags?: Flags;
}

export default function ExportTools({ analysis, flags }: ExportToolsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const canExportBidAnalysis = flags?.exportBidAnalysis ?? false;
  const canExportBidLeveling = flags?.exportBidLeveling ?? false;

  // For bid analysis exports, we check the bid analysis export flag
  // For bid leveling exports, we check the bid leveling export flag
  const isAnalysis = analysis.discipline === 'construction' || analysis.discipline === 'design' || analysis.discipline === 'trade';
  const canExport = isAnalysis ? canExportBidAnalysis : canExportBidLeveling;

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      exportAnalysisToPDF(analysis);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      exportAnalysisToExcel(analysis);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Error exporting Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Download className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-xl font-bold text-gray-900">Export Analysis</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        Download your complete analysis report in your preferred format.
      </p>
      
      <div className="grid sm:grid-cols-2 gap-4">
        {canExport ? (
          <>
            <button
              onClick={handlePDFExport}
              disabled={isExporting}
              className="flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              {isExporting ? 'Exporting...' : 'Export PDF Report'}
            </button>

            <button
              onClick={handleExcelExport}
              disabled={isExporting}
              className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              <Sheet className="h-5 w-5 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Excel Data'}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold border-2 border-dashed border-gray-300">
              <Lock className="h-5 w-5 mr-2" />
              PDF Export (Pro)
            </div>

            <div className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold border-2 border-dashed border-gray-300">
              <Lock className="h-5 w-5 mr-2" />
              Excel Export (Pro)
            </div>
          </>
        )}
      </div>

      {!canExport && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h4 className="font-semibold text-blue-900">Upgrade for Exports</h4>
              <p className="text-sm text-blue-700 mt-1">
                Export functionality is available on Pro plans and above. Contact admin@shorewoodgrp.com for access.
              </p>
              <a
                href="/pricing"
                className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
              >
                View Plans →
              </a>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Security Note:</strong> Reports are generated locally in your browser and downloaded directly to your device. Document analysis uses secure cloud AI processing with immediate data deletion after analysis.
        </p>
      </div>
    </div>
  );
}