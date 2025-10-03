'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllAnalyses, SavedAnalysis } from '@/lib/storage';
import { calculateProjectRisk } from '@/lib/analysis/risk-analyzer';
import { CSI_DIVISIONS } from '@/lib/analysis/csi-analyzer';
import { exportBidLevelingToExcel, exportBidLevelingToPDF } from '@/lib/analysis/exports';
import { ComparativeAnalysis } from '@/types/analysis';
import { BarChart3, Download, DollarSign, Search, AlertTriangle, CheckCircle } from 'lucide-react';

interface BidComparison {
  analysis: SavedAnalysis;
  risk: {
    score: number;
    level: string;
    factors: string[];
  };
  rank: number;
  varianceFromLow: number;
}

export default function BidLeveling() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedBids, setSelectedBids] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'risk' | 'date'>('price');
  const [bidComparisons, setBidComparisons] = useState<BidComparison[]>([]);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [activeDiscipline, setActiveDiscipline] = useState<'all' | 'construction' | 'design' | 'trade'>('all');
  const [comparativeAnalysis, setComparativeAnalysis] = useState<ComparativeAnalysis | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const loadAnalyses = () => {
    const savedAnalyses = getAllAnalyses();
    setAnalyses(savedAnalyses);
  };

  // Filter analyses by discipline
  const getFilteredAnalyses = () => {
    if (activeDiscipline === 'all') return analyses;

    return analyses.filter(analysis => {
      const discipline = analysis.result.discipline || 'construction';
      return discipline === activeDiscipline;
    });
  };

  // Clear selected bids when switching disciplines
  const handleDisciplineChange = (discipline: 'all' | 'construction' | 'design' | 'trade') => {
    setActiveDiscipline(discipline);
    setSelectedBids([]); // Reset selection when changing disciplines
  };

  const calculateComparisons = useCallback(() => {
    const selectedAnalyses = analyses.filter(a => selectedBids.includes(a.id));
    
    const comparisons = selectedAnalyses.map(analysis => {
      const risk = calculateProjectRisk(
        Object.fromEntries(
          Object.entries(analysis.result.csi_divisions).map(([code, data]) => [code, data.cost])
        ),
        analysis.result.total_amount,
        analysis.result.uncategorizedTotal || 0,
        analysis.result
      );
      
      return {
        analysis,
        risk,
        rank: 0, // Will be calculated after sorting
        varianceFromLow: 0 // Will be calculated after sorting
      };
    });

    // Sort based on selected criteria
    comparisons.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.analysis.result.total_amount - b.analysis.result.total_amount;
        case 'risk':
          return a.risk.score - b.risk.score;
        case 'date':
          return new Date(b.analysis.timestamp).getTime() - new Date(a.analysis.timestamp).getTime();
        default:
          return 0;
      }
    });

    // Calculate ranks and variance from low bid
    const lowBid = comparisons[0]?.analysis.result.total_amount || 0;
    comparisons.forEach((comp, index) => {
      comp.rank = index + 1;
      comp.varianceFromLow = lowBid > 0 ? ((comp.analysis.result.total_amount - lowBid) / lowBid) * 100 : 0;
    });

    setBidComparisons(comparisons);
  }, [selectedBids, analyses, sortBy]);

  useEffect(() => {
    loadAnalyses();
  }, []);

  useEffect(() => {
    if (selectedBids.length > 0) {
      calculateComparisons();
    }
  }, [selectedBids, analyses, sortBy, calculateComparisons]);

  const toggleBidSelection = (bidId: string) => {
    if (selectedBids.includes(bidId)) {
      setSelectedBids(selectedBids.filter(id => id !== bidId));
    } else if (selectedBids.length < 5) {
      setSelectedBids([...selectedBids, bidId]);
    }
  };

  const handleExportLeveling = () => {
    if (bidComparisons.length === 0) return;

    // Convert bidComparisons back to SavedAnalysis array for the export functions
    const selectedAnalyses = bidComparisons.map(comp => comp.analysis);

    if (exportFormat === 'pdf') {
      exportBidLevelingToPDF(selectedAnalyses);
    } else {
      exportBidLevelingToExcel(selectedAnalyses);
    }
  };

  const performComparativeAnalysis = async () => {
    if (selectedBids.length < 2) return;

    setIsLoadingComparison(true);
    setComparisonError(null);

    try {
      // Get the selected analyses
      const selectedAnalyses = analyses
        .filter(a => selectedBids.includes(a.id))
        .map(a => a.result);

      // Check if at least 2 bids have detailed summaries
      const bidsWithSummaries = selectedAnalyses.filter(bid =>
        bid.detailed_summary && bid.detailed_summary.length > 1000
      );

      if (bidsWithSummaries.length < 2) {
        setComparisonError(
          `Only ${bidsWithSummaries.length} of ${selectedAnalyses.length} selected bids have detailed summaries. ` +
          'Please re-analyze older bids to generate summaries, or select different bids.'
        );
        setIsLoadingComparison(false);
        return;
      }

      // Call the comparative analysis API
      const response = await fetch('/api/leveling/compare', {
        method: 'PUT', // Use PUT endpoint that accepts full analysis data
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyses: selectedAnalyses,
          comparison_focus: 'comprehensive'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Comparative analysis failed');
      }

      const result = await response.json();
      setComparativeAnalysis(result.analysis);
      console.log('✅ Comparative analysis completed:', result.metadata);

    } catch (error) {
      console.error('Comparative analysis error:', error);
      setComparisonError(
        error instanceof Error
          ? error.message
          : 'Failed to perform comparative analysis. Please try again.'
      );
    } finally {
      setIsLoadingComparison(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-green-600 bg-green-50';
    if (variance <= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bids Available for Leveling</h3>
        <p className="text-gray-600">
          Analyze at least 2 bids to start comparing and leveling them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Bid Leveling & Comparison
          </h3>
          {bidComparisons.length > 0 && (
            <div className="flex items-center space-x-3">
              {bidComparisons.length >= 2 && (
                <button
                  onClick={performComparativeAnalysis}
                  disabled={isLoadingComparison}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  {isLoadingComparison ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Explain Variances
                    </>
                  )}
                </button>
              )}
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf')}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="excel">Excel Report</option>
                <option value="pdf">PDF Report</option>
              </select>
              <button
                onClick={handleExportLeveling}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'risk' | 'date')}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="price">Total Price</option>
              <option value="risk">Risk Score</option>
              <option value="date">Date</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Selected: {selectedBids.length}/5 bids
          </div>
        </div>
      </div>

      {/* Discipline Tabs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Filter by Discipline</h4>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All Disciplines', icon: '📊' },
            { key: 'construction', label: 'Construction', icon: '🏗️' },
            { key: 'design', label: 'Design Services', icon: '📐' },
            { key: 'trade', label: 'Trade Services', icon: '⚡' }
          ].map((discipline) => (
            <button
              key={discipline.key}
              onClick={() => handleDisciplineChange(discipline.key as 'all' | 'construction' | 'design' | 'trade')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeDiscipline === discipline.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{discipline.icon}</span>
              {discipline.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bid Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Select {activeDiscipline === 'all' ? 'Bids' : `${activeDiscipline.charAt(0).toUpperCase() + activeDiscipline.slice(1)} Proposals`} to Compare (up to 5)
        </h4>
        
        {getFilteredAnalyses().length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">
              {activeDiscipline === 'construction' ? '🏗️' :
               activeDiscipline === 'design' ? '📐' :
               activeDiscipline === 'trade' ? '⚡' : '📊'}
            </div>
            <h5 className="text-lg font-semibold text-gray-900 mb-2">
              No {activeDiscipline === 'all' ? 'analyses' : `${activeDiscipline} proposals`} available
            </h5>
            <p className="text-gray-600">
              {activeDiscipline === 'all'
                ? 'Analyze some documents first to start comparing bids.'
                : `Upload and analyze ${activeDiscipline} proposals to compare them here.`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {getFilteredAnalyses().map((analysis) => (
              <div
                key={analysis.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedBids.includes(analysis.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => toggleBidSelection(analysis.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={selectedBids.includes(analysis.id)}
                        onChange={() => {}} // Handled by parent onClick
                        className="mr-3"
                      />
                      <h5 className="font-semibold text-gray-900">
                        {analysis.result.contractor_name}
                      </h5>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                        analysis.result.discipline === 'design' ? 'bg-purple-100 text-purple-700' :
                        analysis.result.discipline === 'trade' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {analysis.result.discipline === 'design' ? '📐 Design' :
                         analysis.result.discipline === 'trade' ? '⚡ Trade' :
                         '🏗️ Construction'}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${analysis.result.total_amount.toLocaleString()}
                      </div>
                      <div>
                        Divisions: {Object.keys(analysis.result.csi_divisions).length}
                      </div>
                      <div>
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </div>
                      <div>
                        {analysis.result.project_name || 'No project name'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {bidComparisons.length > 0 && (
        <>
          {/* Executive Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Rank</th>
                    <th className="text-left py-2">Contractor</th>
                    <th className="text-left py-2">Total Amount</th>
                    <th className="text-left py-2">Variance from Low</th>
                    <th className="text-left py-2">Risk Level</th>
                    <th className="text-left py-2">Divisions</th>
                  </tr>
                </thead>
                <tbody>
                  {bidComparisons.map((comp) => (
                    <tr key={comp.analysis.id} className="border-b">
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          comp.rank === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          #{comp.rank}
                        </span>
                      </td>
                      <td className="py-2 font-medium">{comp.analysis.result.contractor_name}</td>
                      <td className="py-2">${comp.analysis.result.total_amount.toLocaleString()}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-sm ${getVarianceColor(comp.varianceFromLow)}`}>
                          {comp.varianceFromLow === 0 ? 'Base' : `+${comp.varianceFromLow.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-sm ${getRiskColor(comp.risk.level)}`}>
                          {comp.risk.level} ({comp.risk.score}/100)
                        </span>
                      </td>
                      <td className="py-2">{Object.keys(comp.analysis.result.csi_divisions).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CSI Division Comparison */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">CSI Division Comparison</h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Division</th>
                    {bidComparisons.map((comp) => (
                      <th key={comp.analysis.id} className="text-left py-2">
                        {comp.analysis.result.contractor_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(CSI_DIVISIONS)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([code, division]) => {
                    // Check if any bid has this division
                    const hasData = bidComparisons.some(comp => 
                      comp.analysis.result.csi_divisions[code]
                    );
                    
                    if (!hasData) return null;
                    
                    return (
                      <tr key={code} className="border-b">
                        <td className="py-2 font-medium">
                          {code} - {division.name}
                        </td>
                        {bidComparisons.map((comp) => {
                          const divisionData = comp.analysis.result.csi_divisions[code];
                          const percentage = divisionData 
                            ? ((divisionData.cost / comp.analysis.result.total_amount) * 100).toFixed(1)
                            : '0.0';
                          const cost = divisionData?.cost || 0;
                          
                          return (
                            <td key={comp.analysis.id} className="py-2">
                              {cost > 0 ? (
                                <div>
                                  <div className="font-medium">${cost.toLocaleString()}</div>
                                  <div className="text-sm text-gray-600">{percentage}%</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Not included</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparative Analysis Results */}
          {comparisonError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-red-800 mb-1">
                    Comparative Analysis Error
                  </h5>
                  <p className="text-sm text-red-700">{comparisonError}</p>
                </div>
              </div>
            </div>
          )}

          {comparativeAnalysis && (
            <>
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-purple-600 mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    Comparative Analysis Results
                  </h4>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">
                    {comparativeAnalysis.summary}
                  </p>
                </div>
              </div>

              {/* Major Differences */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Differences Between Bids
                </h4>
                <div className="grid gap-3">
                  {comparativeAnalysis.major_differences.map((difference, index) => (
                    <div
                      key={index}
                      className="flex items-start p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{difference}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scope Gaps */}
              {comparativeAnalysis.scope_gaps && comparativeAnalysis.scope_gaps.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Scope Gaps & Missing Items
                  </h4>
                  <div className="grid gap-4">
                    {comparativeAnalysis.scope_gaps.map((gap, index) => (
                      <div
                        key={index}
                        className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                      >
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-2">
                              {gap.description}
                            </h5>
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Affected Bids:</strong> {gap.affected_bids.join(', ')}
                            </div>
                            <div className="text-sm text-gray-700">
                              <strong>Estimated Impact:</strong> {gap.estimated_impact}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Explanations */}
              {comparativeAnalysis.pricing_explanations && comparativeAnalysis.pricing_explanations.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Pricing Variance Explanations
                  </h4>
                  <div className="grid gap-3">
                    {comparativeAnalysis.pricing_explanations.map((explanation, index) => (
                      <div
                        key={index}
                        className="flex items-start p-4 bg-green-50 rounded-lg"
                      >
                        <DollarSign className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Division-by-Division Analysis */}
              {comparativeAnalysis.division_comparisons && Object.keys(comparativeAnalysis.division_comparisons).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Division-by-Division Variance Analysis
                  </h4>
                  <div className="space-y-6">
                    {Object.entries(comparativeAnalysis.division_comparisons).map(([division, analysis]) => (
                      <div
                        key={division}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h5 className="font-semibold text-gray-900 mb-3">
                          Division {division} - {CSI_DIVISIONS[division as keyof typeof CSI_DIVISIONS]?.name || 'Unknown Division'}
                        </h5>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="text-sm font-medium text-gray-700 mb-2">
                              Variance Explanation
                            </h6>
                            <p className="text-sm text-gray-600 mb-4">
                              {analysis.variance_explanation}
                            </p>

                            {analysis.scope_differences && analysis.scope_differences.length > 0 && (
                              <>
                                <h6 className="text-sm font-medium text-gray-700 mb-2">
                                  Scope Differences
                                </h6>
                                <ul className="text-sm text-gray-600 list-disc list-inside mb-4">
                                  {analysis.scope_differences.map((diff, index) => (
                                    <li key={index}>{diff}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>

                          <div>
                            {analysis.missing_in_bids && analysis.missing_in_bids.length > 0 && (
                              <>
                                <h6 className="text-sm font-medium text-gray-700 mb-2">
                                  Missing in Bids
                                </h6>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {analysis.missing_in_bids.map((contractor, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                                    >
                                      {contractor}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}

                            {analysis.pricing_outliers && analysis.pricing_outliers.length > 0 && (
                              <>
                                <h6 className="text-sm font-medium text-gray-700 mb-2">
                                  Pricing Outliers
                                </h6>
                                <div className="flex flex-wrap gap-2">
                                  {analysis.pricing_outliers.map((contractor, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded"
                                    >
                                      {contractor}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bid Comparison Matrix */}
              {comparativeAnalysis.bid_comparison_matrix && Object.keys(comparativeAnalysis.bid_comparison_matrix).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Bid Comparison Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Contractor</th>
                          <th className="text-left py-2">Total Amount</th>
                          <th className="text-left py-2">Divisions Included</th>
                          <th className="text-left py-2">Missing Divisions</th>
                          <th className="text-left py-2">Risk Factors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(comparativeAnalysis.bid_comparison_matrix).map(([contractor, data]) => (
                          <tr key={contractor} className="border-b">
                            <td className="py-2 font-medium">{contractor}</td>
                            <td className="py-2">${data.total_amount.toLocaleString()}</td>
                            <td className="py-2">
                              <span className="text-sm text-gray-600">
                                {data.divisions_included.length} divisions
                              </span>
                            </td>
                            <td className="py-2">
                              {data.missing_divisions.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {data.missing_divisions.slice(0, 3).map((div, index) => (
                                    <span
                                      key={index}
                                      className="px-1 py-0.5 bg-red-100 text-red-600 text-xs rounded"
                                    >
                                      {div}
                                    </span>
                                  ))}
                                  {data.missing_divisions.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{data.missing_divisions.length - 3} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-green-600">Complete</span>
                              )}
                            </td>
                            <td className="py-2">
                              <span className="text-sm text-gray-600">
                                {data.risk_factors.length} factors
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}