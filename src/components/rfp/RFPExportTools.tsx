'use client';

import { useState } from 'react';
import { RFPProject } from '@/types/rfp';
import { saveRFP, updateRFPStatus } from '@/lib/storage';
import { generateRFPDocument, downloadFile, RFPExportOptions } from '@/lib/export/rfp-document-generator';
import { 
  Download, FileText, Sheet, Mail, CheckCircle, 
  AlertCircle, Share2, Printer, Copy
} from 'lucide-react';

interface RFPExportToolsProps {
  project: RFPProject;
  rfpId: string | null;
  onComplete?: (rfpId: string) => void;
}

export default function RFPExportTools({ project, rfpId, onComplete }: RFPExportToolsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportOptions] = useState<RFPExportOptions>({
    format: 'pdf',
    sections: ['all'],
    includeEvaluationSheets: true,
    includeScopeMatrix: true
  });

  const handleExport = async (format: 'pdf' | 'word' | 'excel') => {
    setIsExporting(format);
    
    try {
      // Save RFP if not already saved
      let finalRFPId = rfpId;
      if (!finalRFPId) {
        finalRFPId = saveRFP(project);
      }
      
      // Update RFP status to issued
      if (finalRFPId) {
        updateRFPStatus(finalRFPId, 'issued');
      }
      
      // Generate the document
      const options: RFPExportOptions = {
        ...exportOptions,
        format
      };
      
      const blob = await generateRFPDocument(project, options);
      
      // Generate filename
      const projectNameSlug = project.projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'word' ? 'docx' : format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `rfp-${projectNameSlug}-${timestamp}.${extension}`;
      
      // Download the file
      downloadFile(blob, filename);
      
      if (onComplete && finalRFPId) {
        onComplete(finalRFPId);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const selectedDivisions = project.scopeDefinition.csiDivisions ? Object.keys(project.scopeDefinition.csiDivisions) : [];
  const totalSpecifications = project.scopeDefinition.csiDivisions 
    ? Object.values(project.scopeDefinition.csiDivisions).reduce((total, div) => total + div.specifications.length, 0)
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Export & Distribute</h2>
        <p className="text-gray-600">
          Generate professional RFP documents and distribute to potential contractors.
        </p>
      </div>

      {/* RFP Readiness Check */}
      <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">RFP Readiness Check</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-gray-700">Project information complete</span>
          </div>
          
          <div className="flex items-center">
            {selectedDivisions.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            )}
            <span className="text-gray-700">
              Scope defined ({selectedDivisions.length} divisions, {totalSpecifications} specifications)
            </span>
          </div>
          
          <div className="flex items-center">
            {project.commercialTerms.insuranceRequirements.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            )}
            <span className="text-gray-700">
              Commercial terms defined ({project.commercialTerms.insuranceRequirements.length} insurance requirements)
            </span>
          </div>
          
          <div className="flex items-center">
            {project.submissionRequirements.evaluationCriteria.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            )}
            <span className="text-gray-700">
              Evaluation criteria set ({project.submissionRequirements.evaluationCriteria.length} criteria)
            </span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Export Formats</h3>
          
          {/* PDF Export */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">PDF Document</h4>
                <p className="text-gray-600 text-sm mt-1 mb-4">
                  Complete RFP document with professional formatting, ready for distribution to contractors.
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Professional layout with cover page</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Complete scope breakdown by CSI division</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Terms, qualifications, and evaluation criteria</span>
                  </div>
                </div>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting === 'pdf'}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isExporting === 'pdf' ? (
                    'Generating PDF...'
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Word Export */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">Word Document</h4>
                <p className="text-gray-600 text-sm mt-1 mb-4">
                  Editable format for further customization and company branding.
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Fully editable format</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Easy to add company branding</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Compatible with collaboration tools</span>
                  </div>
                </div>
                <button
                  onClick={() => handleExport('word')}
                  disabled={isExporting === 'word'}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isExporting === 'word' ? (
                    'Generating Word...'
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Word
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Excel Export */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Sheet className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">Excel Workbook</h4>
                <p className="text-gray-600 text-sm mt-1 mb-4">
                  Detailed scope matrix, evaluation sheets, and bid comparison templates.
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>CSI division scope matrix</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Evaluation criteria scoring sheets</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Bid comparison templates</span>
                  </div>
                </div>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={isExporting === 'excel'}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isExporting === 'excel' ? (
                    'Generating Excel...'
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Distribution Tools */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Distribution Tools</h3>
          
          {/* Email Distribution */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">Email Distribution</h4>
                <p className="text-gray-600 text-sm mt-1 mb-4">
                  Send RFP directly to your contractor email list with tracking.
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Automated email delivery</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Read receipts and tracking</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>Customizable email templates</span>
                  </div>
                </div>
                <button 
                  onClick={() => alert('Email distribution feature coming soon! Export PDF/Word for manual distribution.')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Set Up Distribution
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Share2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">Quick Actions</h4>
                <p className="text-gray-600 text-sm mt-1 mb-4">
                  Additional tools for RFP management.
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Current View
                  </button>
                  <button 
                    onClick={() => {
                      const rfpUrl = `${window.location.origin}/rfp/${rfpId || 'preview'}`;
                      navigator.clipboard.writeText(rfpUrl);
                      alert('RFP link copied to clipboard!');
                    }}
                    className="w-full flex items-center justify-center px-3 py-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-300 rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy RFP Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">RFP Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Project Name</p>
            <p className="font-medium">{project.projectName}</p>
          </div>
          <div>
            <p className="text-gray-600">CSI Divisions</p>
            <p className="font-medium">{selectedDivisions.length} selected</p>
          </div>
          <div>
            <p className="text-gray-600">Proposal Deadline</p>
            <p className="font-medium">
              {new Date(project.timeline.proposalDeadline).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Estimated Value</p>
            <p className="font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(project.estimatedValue)}
            </p>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">RFP Ready for Distribution</span>
            </div>
            <p className="text-sm text-gray-500">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}