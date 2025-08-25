'use client';

import { useState, useEffect } from 'react';
import { getAllAnalyses, getMarketIntelligence, deleteAnalysis, SavedAnalysis } from '@/lib/storage';
import { calculateProjectRisk } from '@/lib/analysis/risk-analyzer';
import { exportAnalysisToPDF, exportAnalysisToExcel } from '@/lib/analysis/export-generator';
import { formatDistanceToNow } from 'date-fns';
import { 
  Trash2, TrendingUp, BarChart3, Building, Calendar, DollarSign, AlertTriangle, 
  FileText, Users, Download, ChevronDown, 
  ChevronUp, Target, TrendingDown, Award, Clock, Sheet, Flag
} from 'lucide-react';

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [marketIntel, setMarketIntel] = useState(getMarketIntelligence());

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = () => {
    const savedAnalyses = getAllAnalyses();
    setAnalyses(savedAnalyses);
    setMarketIntel(getMarketIntelligence());
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      deleteAnalysis(id);
      loadAnalyses();
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-100 border-red-300';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'LOW': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getDocumentQualityIcon = (quality?: string) => {
    switch (quality) {
      case 'professional_typed': return <Award className="h-4 w-4 text-green-600" />;
      case 'scanned': return <FileText className="h-4 w-4 text-yellow-600" />;
      case 'handwritten': return <FileText className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateCoveragePercentage = (analysis: SavedAnalysis) => {
    const csiTotal = Object.values(analysis.result.csi_divisions).reduce((sum, div) => sum + div.cost, 0);
    const softCostsTotal = analysis.result.softCostsTotal || 0;
    const uncategorizedTotal = analysis.result.uncategorizedTotal || 0;
    const totalCovered = csiTotal + softCostsTotal + uncategorizedTotal;
    return (totalCovered / analysis.result.total_amount) * 100;
  };

  const getTop5CostCategories = (analysis: SavedAnalysis) => {
    const categories = Object.entries(analysis.result.csi_divisions).map(([code, data]) => ({
      code,
      name: `Division ${code}`,
      cost: data.cost,
      percentage: (data.cost / analysis.result.total_amount) * 100
    }));
    
    // Add soft costs if present
    if (analysis.result.softCostsTotal && analysis.result.softCostsTotal > 0) {
      categories.push({
        code: 'SOFT',
        name: 'Soft Costs',
        cost: analysis.result.softCostsTotal,
        percentage: (analysis.result.softCostsTotal / analysis.result.total_amount) * 100
      });
    }

    // Add uncategorized if present
    if (analysis.result.uncategorizedTotal && analysis.result.uncategorizedTotal > 0) {
      categories.push({
        code: 'UNC',
        name: 'Uncategorized',
        cost: analysis.result.uncategorizedTotal,
        percentage: (analysis.result.uncategorizedTotal / analysis.result.total_amount) * 100
      });
    }

    return categories.sort((a, b) => b.cost - a.cost).slice(0, 5);
  };

  const getSubcontractorSummary = (analysis: SavedAnalysis) => {
    const subs = analysis.result.subcontractors || [];
    const totalSubAmount = subs.reduce((sum, sub) => sum + sub.total_amount, 0);
    const csiTotal = Object.values(analysis.result.csi_divisions).reduce((sum, div) => sum + div.cost, 0);
    const selfPerformedRatio = csiTotal > 0 ? ((csiTotal - totalSubAmount) / csiTotal) * 100 : 0;
    
    return {
      count: subs.length,
      largestSub: subs.length > 0 ? subs.reduce((max, sub) => sub.total_amount > max.total_amount ? sub : max) : null,
      selfPerformedRatio: Math.max(0, selfPerformedRatio)
    };
  };

  const handleExportPDF = async (analysis: SavedAnalysis) => {
    setIsExporting(`${analysis.id}-pdf`);
    try {
      exportAnalysisToPDF(analysis.result);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async (analysis: SavedAnalysis) => {
    setIsExporting(`${analysis.id}-excel`);
    try {
      exportAnalysisToExcel(analysis.result);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Error exporting Excel. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis History</h3>
        <p className="text-gray-600">
          Analyze your first bid to start building your comprehensive project intelligence database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Intelligence Dashboard */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Market Intelligence Dashboard
        </h3>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center bg-blue-50 rounded-lg p-4">
            <BarChart3 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{marketIntel.totalProjects}</p>
            <p className="text-sm text-gray-600">Projects Analyzed</p>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-4">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              ${(marketIntel.averageProjectValue / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-600">Avg Project Value</p>
          </div>
          <div className="text-center bg-purple-50 rounded-lg p-4">
            <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {Object.keys(marketIntel.divisionBenchmarks).length}
            </p>
            <p className="text-sm text-gray-600">CSI Divisions</p>
          </div>
          <div className="text-center bg-orange-50 rounded-lg p-4">
            <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">
              {Object.values(marketIntel.riskDistribution).reduce((sum, count) => sum + count, 0)}
            </p>
            <p className="text-sm text-gray-600">Risk Assessments</p>
          </div>
        </div>

        {/* Risk Distribution Visualization */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Portfolio Risk Distribution</h4>
          <div className="flex flex-wrap gap-6">
            {Object.entries(marketIntel.riskDistribution).map(([level, count]) => (
              <div key={level} className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${
                  level === 'HIGH' ? 'bg-red-500' :
                  level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {level}: {count} projects ({((count / marketIntel.totalProjects) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comprehensive Analysis History */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Project Analysis History ({analyses.length})
        </h3>
        
        {analyses.map((analysis) => {
          const coveragePercentage = calculateCoveragePercentage(analysis);
          const top5Categories = getTop5CostCategories(analysis);
          const subSummary = getSubcontractorSummary(analysis);
          const riskData = calculateProjectRisk(
            Object.fromEntries(Object.entries(analysis.result.csi_divisions).map(([code, data]) => [code, data.cost])),
            analysis.result.total_amount,
            analysis.result.uncategorizedTotal || 0,
            analysis.result
          );

          return (
            <div key={analysis.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Analysis Header - Always Visible */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedAnalysis(
                  selectedAnalysis?.id === analysis.id ? null : analysis
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-gray-600 mr-3" />
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {analysis.result.contractor_name}
                          </h4>
                          {analysis.result.project_name && (
                            <p className="text-sm text-gray-600">{analysis.result.project_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedAnalysis?.id === analysis.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(analysis.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Executive Summary Cards */}
                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                      {/* Total Value */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">TOTAL</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ${analysis.result.total_amount.toLocaleString()}
                        </p>
                        {analysis.result.gross_sqft && (
                          <p className="text-xs text-gray-600">
                            ${(analysis.result.total_amount / analysis.result.gross_sqft).toFixed(0)}/SF
                          </p>
                        )}
                      </div>

                      {/* Risk Assessment */}
                      <div className={`border rounded-lg p-3 ${getRiskColor(riskData.level)}`}>
                        <div className="flex items-center justify-between">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="text-xs font-medium">RISK</span>
                        </div>
                        <p className="text-lg font-bold mt-1">{riskData.level}</p>
                        <p className="text-xs opacity-75">{riskData.score}/100</p>
                      </div>

                      {/* Coverage Quality */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <Target className="h-5 w-5 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">COVERAGE</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {coveragePercentage.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-600">Cost Coverage</p>
                      </div>

                      {/* Document Quality */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          {getDocumentQualityIcon(analysis.result.document_quality)}
                          <span className="text-xs text-gray-600 font-medium">QUALITY</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                          {analysis.result.document_quality?.replace('_', ' ') || 'Unknown'}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Quick Metrics Bar */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        <span>{Object.keys(analysis.result.csi_divisions).length} CSI Divisions</span>
                      </div>
                      {subSummary.count > 0 && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{subSummary.count} Subcontractors</span>
                        </div>
                      )}
                      {analysis.result.allowances && analysis.result.allowances.length > 0 && (
                        <div className="flex items-center">
                          <Flag className="h-4 w-4 mr-1" />
                          <span>{analysis.result.allowances.length} Allowances</span>
                        </div>
                      )}
                      {analysis.result.timeline && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{analysis.result.timeline}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Analysis Dashboard */}
              {selectedAnalysis?.id === analysis.id && (
                <div className="border-t border-gray-200">
                  {/* Financial Breakdown Section */}
                  <div className="p-6 bg-gray-50">
                    <h5 className="font-bold text-gray-900 mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Financial Breakdown & Market Intelligence
                    </h5>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Top 5 Cost Categories */}
                      <div className="bg-white rounded-lg p-4 border">
                        <h6 className="font-semibold text-gray-900 mb-3">Top Cost Categories</h6>
                        <div className="space-y-2">
                          {top5Categories.map((category, index) => {
                            const benchmark = marketIntel.divisionBenchmarks[category.code];
                            const isAboveMarket = benchmark && category.percentage > benchmark.average * 1.2;
                            const isBelowMarket = benchmark && category.percentage < benchmark.average * 0.8;
                            
                            return (
                              <div key={category.code} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${
                                    index === 0 ? 'bg-blue-500' :
                                    index === 1 ? 'bg-green-500' :
                                    index === 2 ? 'bg-yellow-500' :
                                    index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                                  }`}></div>
                                  <span className="text-sm">{category.name}</span>
                                  {isAboveMarket && <TrendingUp className="h-3 w-3 text-red-500 ml-1" />}
                                  {isBelowMarket && <TrendingDown className="h-3 w-3 text-green-500 ml-1" />}
                                </div>
                                <div className="text-right">
                                  <span className="font-medium">${category.cost.toLocaleString()}</span>
                                  <span className="text-xs text-gray-500 block">{category.percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Subcontractor Analysis */}
                      <div className="bg-white rounded-lg p-4 border">
                        <h6 className="font-semibold text-gray-900 mb-3">Subcontractor Analysis</h6>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Trades:</span>
                            <span className="font-medium">{subSummary.count}</span>
                          </div>
                          {subSummary.largestSub && (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Largest Sub:</span>
                                <span className="font-medium">{subSummary.largestSub.name}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Amount:</span>
                                <span className="text-sm">${subSummary.largestSub.total_amount.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Self-Performed:</span>
                            <span className="font-medium">{subSummary.selfPerformedRatio.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Factors & Red Flags */}
                    {riskData.factors.length > 0 && (
                      <div className="mt-6 bg-white rounded-lg p-4 border">
                        <h6 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                          Risk Factors & Market Intelligence
                        </h6>
                        <div className="space-y-2">
                          {riskData.factors.slice(0, 5).map((factor, index) => (
                            <div key={index} className="flex items-start">
                              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expandable Project Details */}
                  <div className="p-6 space-y-4">
                    <h5 className="font-bold text-gray-900 mb-4">Project Details & Analysis</h5>

                    {/* CSI Divisions Breakdown */}
                    {Object.keys(analysis.result.csi_divisions).length > 0 && (
                      <div className="border rounded-lg">
                        <button
                          onClick={() => toggleSection('csiDivisions')}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium flex items-center">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            CSI Divisions Breakdown ({Object.keys(analysis.result.csi_divisions).length})
                          </span>
                          {expandedSection === 'csiDivisions' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </button>
                        {expandedSection === 'csiDivisions' && (
                          <div className="border-t p-4 space-y-2 max-h-64 overflow-y-auto">
                            {Object.entries(analysis.result.csi_divisions).map(([code, data]) => (
                              <div key={code} className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                                <div className="flex-1">
                                  <span className="text-sm font-medium">Division {code}</span>
                                  {data.subcontractor && (
                                    <p className="text-xs text-gray-600">Sub: {data.subcontractor}</p>
                                  )}
                                  {data.items && data.items.length > 0 && (
                                    <p className="text-xs text-gray-500">{data.items.join(', ')}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="font-medium">${data.cost.toLocaleString()}</span>
                                  <span className="text-xs text-gray-500 block">
                                    {((data.cost / analysis.result.total_amount) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subcontractor Details */}
                    {analysis.result.subcontractors && analysis.result.subcontractors.length > 0 && (
                      <div className="border rounded-lg">
                        <button
                          onClick={() => toggleSection('subcontractors')}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Subcontractor Details ({analysis.result.subcontractors.length})
                          </span>
                          {expandedSection === 'subcontractors' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </button>
                        {expandedSection === 'subcontractors' && (
                          <div className="border-t p-4 space-y-3 max-h-64 overflow-y-auto">
                            {analysis.result.subcontractors.map((sub, index) => (
                              <div key={index} className="bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium">{sub.name}</p>
                                    <p className="text-sm text-gray-600">{sub.trade}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">${sub.total_amount.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">
                                      {((sub.total_amount / analysis.result.total_amount) * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {sub.divisions.map((div) => (
                                    <span key={div} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                      Div {div}
                                    </span>
                                  ))}
                                </div>
                                {sub.scope_description && (
                                  <p className="text-xs text-gray-600">{sub.scope_description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Soft Costs Details */}
                    {analysis.result.softCosts && analysis.result.softCosts.length > 0 && (
                      <div className="border rounded-lg">
                        <button
                          onClick={() => toggleSection('softCosts')}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Soft Costs Breakdown (${(analysis.result.softCostsTotal || 0).toLocaleString()})
                          </span>
                          {expandedSection === 'softCosts' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </button>
                        {expandedSection === 'softCosts' && (
                          <div className="border-t p-4 space-y-2 max-h-48 overflow-y-auto">
                            {analysis.result.softCosts.map((cost, index) => (
                              <div key={index} className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded">
                                <span className="text-sm">{cost.description}</span>
                                <div className="text-right">
                                  <span className="font-medium">${cost.cost.toLocaleString()}</span>
                                  <span className="text-xs text-gray-500 block">
                                    {((cost.cost / analysis.result.total_amount) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Allowances & Contingencies */}
                    {analysis.result.allowances && analysis.result.allowances.length > 0 && (
                      <div className="border rounded-lg">
                        <button
                          onClick={() => toggleSection('allowances')}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium flex items-center">
                            <Flag className="h-4 w-4 mr-2" />
                            Allowances & Contingencies (${(analysis.result.allowances_total || 0).toLocaleString()})
                          </span>
                          {expandedSection === 'allowances' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </button>
                        {expandedSection === 'allowances' && (
                          <div className="border-t p-4 space-y-2 max-h-48 overflow-y-auto">
                            {analysis.result.allowances.map((allowance, index) => (
                              <div key={index} className="bg-yellow-50 rounded p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium">{allowance.description}</span>
                                  <span className="px-2 py-1 text-xs bg-white rounded capitalize">
                                    {allowance.type.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    {allowance.scope_description}
                                  </span>
                                  <div className="text-right">
                                    <span className="font-bold">${allowance.amount.toLocaleString()}</span>
                                    {allowance.percentage_of_total && (
                                      <span className="text-xs text-gray-500 block">
                                        {allowance.percentage_of_total.toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Project Information */}
                    {(analysis.result.exclusions?.length || analysis.result.assumptions?.length) && (
                      <div className="border rounded-lg">
                        <button
                          onClick={() => toggleSection('projectInfo')}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Project Information & Assumptions
                          </span>
                          {expandedSection === 'projectInfo' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </button>
                        {expandedSection === 'projectInfo' && (
                          <div className="border-t p-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              {analysis.result.exclusions?.length && (
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2">Exclusions</h6>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {analysis.result.exclusions.map((exclusion, index) => (
                                      <li key={index}>• {exclusion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.result.assumptions?.length && (
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2">Assumptions</h6>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {analysis.result.assumptions.map((assumption, index) => (
                                      <li key={index}>• {assumption}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center mb-3">
                        <Download className="h-4 w-4 text-blue-600 mr-2" />
                        <h6 className="font-medium text-gray-900">Export Analysis</h6>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Download your complete analysis report in your preferred format.
                      </p>
                      
                      <div className="grid sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleExportPDF(analysis)}
                          disabled={isExporting === `${analysis.id}-pdf`}
                          className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded font-medium transition-colors text-sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {isExporting === `${analysis.id}-pdf` ? 'Exporting...' : 'Export PDF Report'}
                        </button>
                        
                        <button
                          onClick={() => handleExportExcel(analysis)}
                          disabled={isExporting === `${analysis.id}-excel`}
                          className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded font-medium transition-colors text-sm"
                        >
                          <Sheet className="h-4 w-4 mr-2" />
                          {isExporting === `${analysis.id}-excel` ? 'Exporting...' : 'Export Excel Data'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}