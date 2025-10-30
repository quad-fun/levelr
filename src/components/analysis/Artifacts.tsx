// src/components/analysis/Artifacts.tsx

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileBarChart, Download, Share2, Eye } from 'lucide-react';
import type { BidArtifact, Risk } from '@/types/analysis';

interface ArtifactsProps {
  artifact: BidArtifact;
  insights?: string[];
  onExport?: (format: 'pdf' | 'excel' | 'json') => void;
  onShare?: () => void;
  className?: string;
}

export default function Artifacts({
  artifact,
  insights = [],
  onExport,
  onShare,
  className = ''
}: ArtifactsProps) {
  const [activeTab, setActiveTab] = useState('risks');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (severity: number) => {
    if (severity >= 4) return 'text-red-600 bg-red-50 border-red-200';
    if (severity >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {artifact.analysis.contractorName}
            </h2>
            <p className="text-gray-600">
              {formatCurrency(artifact.analysis.totalAmount)} • {artifact.meta.fileName}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {onShare && (
              <button
                onClick={onShare}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 border rounded-md hover:border-blue-300"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            )}

            {onExport && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onExport('pdf')}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  <Download className="h-4 w-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => onExport('excel')}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md"
                >
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Score Display */}
        <div className="mt-4 flex items-center space-x-4">
          <div className={`px-3 py-2 rounded-lg ${getScoreColor(artifact.score.overall)}`}>
            <div className="text-sm font-medium">
              Risk Score: {artifact.score.overall}/100
            </div>
            <div className="text-xs opacity-75">
              {artifact.score.overall >= 70 ? 'Low Risk' :
               artifact.score.overall >= 40 ? 'Medium Risk' : 'High Risk'}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <span className="font-medium">{artifact.risks.length}</span> risks detected
          </div>

          <div className="text-sm text-gray-600">
            <span className="font-medium">{artifact.parsing.lines.length}</span> line items
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0">
          <TabsTrigger
            value="risks"
            className="flex items-center space-x-2 px-4 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Risks ({artifact.risks.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="breakdown"
            className="flex items-center space-x-2 px-4 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none"
          >
            <FileBarChart className="h-4 w-4" />
            <span>Cost Breakdown</span>
          </TabsTrigger>

          <TabsTrigger
            value="insights"
            className="flex items-center space-x-2 px-4 py-3 border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none"
          >
            <Eye className="h-4 w-4" />
            <span>Insights ({insights.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Risks Tab */}
        <TabsContent value="risks" className="p-6 space-y-4">
          {artifact.risks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No risks detected in this analysis
            </div>
          ) : (
            <div className="space-y-3">
              {artifact.risks.map((risk) => (
                <div
                  key={risk.id}
                  className={`p-4 rounded-lg border ${getRiskColor(risk.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium px-2 py-1 bg-white bg-opacity-60 rounded">
                          {risk.category}
                        </span>
                        <span className="text-xs opacity-75">
                          Severity: {risk.severity}/5
                        </span>
                      </div>

                      <h4 className="font-medium mb-1">{risk.title}</h4>
                      <p className="text-sm opacity-90 mb-2">{risk.description}</p>

                      {risk.explanation && (
                        <p className="text-sm italic opacity-80 mb-2">
                          Impact: {risk.explanation}
                        </p>
                      )}

                      {risk.evidence.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium mb-1">Evidence:</p>
                          <ul className="text-xs opacity-75 space-y-1">
                            {risk.evidence.map((evidence, idx) => (
                              <li key={idx} className="flex items-start space-x-1">
                                <span>•</span>
                                <span>{evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {risk.recommendation && (
                        <div className="mt-2 p-2 bg-white bg-opacity-40 rounded text-xs">
                          <strong>Recommendation:</strong> {risk.recommendation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cost Breakdown Tab */}
        <TabsContent value="breakdown" className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">CSI Division Breakdown</h3>

            <div className="space-y-2">
              {Object.entries(artifact.analysis.csiBreakdown)
                .sort(([, a], [, b]) => b.cost - a.cost)
                .map(([division, data]) => (
                  <div key={division} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Division {division}</span>
                        {data.subcontractor && (
                          <span className="text-xs text-gray-600">({data.subcontractor})</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {data.items.slice(0, 2).join(', ')}
                        {data.items.length > 2 && ` +${data.items.length - 2} more`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(data.cost)}</p>
                      <p className="text-xs text-gray-600">
                        {Math.round((data.cost / artifact.analysis.totalAmount) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Key Insights</h3>

            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No insights generated for this analysis
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{insight}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Analysis Metadata */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Analysis Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Parse Confidence:</span>
                  <span className="ml-1">
                    {Math.round(artifact.parsing.parseConfidence * 100)}%
                  </span>
                </div>
                <div>
                  <span className="font-medium">Score Confidence:</span>
                  <span className="ml-1">
                    {Math.round(artifact.score.confidence * 100)}%
                  </span>
                </div>
                <div>
                  <span className="font-medium">Total Pages:</span>
                  <span className="ml-1">{artifact.parsing.totalPages}</span>
                </div>
                <div>
                  <span className="font-medium">Version:</span>
                  <span className="ml-1">{artifact.meta.version}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}