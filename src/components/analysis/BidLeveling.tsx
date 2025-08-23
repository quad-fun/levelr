'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllAnalyses, SavedAnalysis } from '@/lib/storage';
import { calculateProjectRisk } from '@/lib/analysis/risk-analyzer';
import { CSI_DIVISIONS } from '@/lib/analysis/csi-analyzer';
import { exportBidLevelingToExcel, exportBidLevelingToPDF } from '@/lib/analysis/export-generator';
import { BarChart3, Download, DollarSign } from 'lucide-react';

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

  const loadAnalyses = () => {
    const savedAnalyses = getAllAnalyses();
    setAnalyses(savedAnalyses);
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

      {/* Bid Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Bids to Compare (up to 5)</h4>
        
        <div className="grid gap-3">
          {analyses.map((analysis) => (
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
                  {Object.entries(CSI_DIVISIONS).map(([code, division]) => {
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
        </>
      )}
    </div>
  );
}