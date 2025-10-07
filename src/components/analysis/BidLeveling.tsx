'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllAnalyses, SavedAnalysis } from '@/lib/storage';
import { calculateProjectRisk } from '@/lib/analysis/risk-analyzer';
import { CSI_DIVISIONS } from '@/lib/analysis/csi-analyzer';
import { exportBidLevelingToExcel, exportBidLevelingToPDF } from '@/lib/analysis/exports';
import { ComparativeAnalysis, AnalysisResult } from '@/types/analysis';
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
  const [activeDiscipline, setActiveDiscipline] = useState<'construction' | 'design' | 'trade'>('construction');
  const [comparativeAnalysis, setComparativeAnalysis] = useState<ComparativeAnalysis | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const loadAnalyses = () => {
    const savedAnalyses = getAllAnalyses();
    setAnalyses(savedAnalyses);
  };

  // Filter analyses by discipline
  const getFilteredAnalyses = () => {
    return analyses.filter(analysis => {
      const discipline = analysis.result.discipline || 'construction';
      return discipline === activeDiscipline;
    });
  };

  // Clear selected bids when switching disciplines
  const handleDisciplineChange = (discipline: 'construction' | 'design' | 'trade') => {
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

  // Get discipline-specific information for bid cards
  const getDisciplineInfo = (result: AnalysisResult) => {
    const discipline = result.discipline || 'construction';

    switch (discipline) {
      case 'design':
        const phaseCount = result.aia_phases ? Object.keys(result.aia_phases).length : 0;
        return `Phases: ${phaseCount}`;
      case 'trade':
        const systemCount = result.technical_systems ? Object.keys(result.technical_systems).length : 0;
        return `Systems: ${systemCount}`;
      case 'construction':
      default:
        const divisionCount = result.csi_divisions ? Object.keys(result.csi_divisions).length : 0;
        return `Divisions: ${divisionCount}`;
    }
  };

  // Get discipline-specific variance analysis title
  const getDisciplineVarianceTitle = () => {
    switch (activeDiscipline) {
      case 'design':
        return 'Phase-by-Phase Variance Analysis';
      case 'trade':
        return 'System-by-System Variance Analysis';
      case 'construction':
      default:
        return 'Division-by-Division Variance Analysis';
    }
  };

  // Get discipline-specific comparison matrix headers
  const getDisciplineIncludedHeader = () => {
    switch (activeDiscipline) {
      case 'design':
        return 'Phases Included';
      case 'trade':
        return 'Systems Included';
      case 'construction':
      default:
        return 'Divisions Included';
    }
  };

  const getDisciplineMissingHeader = () => {
    switch (activeDiscipline) {
      case 'design':
        return 'Missing Phases';
      case 'trade':
        return 'Missing Systems';
      case 'construction':
      default:
        return 'Missing Divisions';
    }
  };

  const getDisciplineItemName = () => {
    switch (activeDiscipline) {
      case 'design':
        return 'phases';
      case 'trade':
        return 'systems';
      case 'construction':
      default:
        return 'divisions';
    }
  };

  // Get discipline-specific column header for executive summary
  const getDisciplineColumnHeader = () => {
    switch (activeDiscipline) {
      case 'design':
        return 'Phases';
      case 'trade':
        return 'Systems';
      case 'construction':
      default:
        return 'Divisions';
    }
  };

  // Get discipline-specific count for executive summary
  const getDisciplineCount = (result: AnalysisResult) => {
    const discipline = result.discipline || 'construction';

    switch (discipline) {
      case 'design':
        return result.aia_phases ? Object.keys(result.aia_phases).length : 0;
      case 'trade':
        return result.technical_systems ? Object.keys(result.technical_systems).length : 0;
      case 'construction':
      default:
        return result.csi_divisions ? Object.keys(result.csi_divisions).length : 0;
    }
  };

  // Get actual included count from bid data (not comparative analysis data)
  const getDisciplineIncludedCount = (data: unknown, contractorName: string) => {
    // Find the actual bid data for this contractor
    const contractorBid = bidComparisons.find(comp => comp.analysis.result.contractor_name === contractorName);
    if (!contractorBid) return 0;

    return getDisciplineCount(contractorBid.analysis.result);
  };

  // Get discipline-appropriate missing display
  const getDisciplineMissingDisplay = (data: unknown, contractorName: string) => {
    // For design bids, we don't really have "missing phases" in the same way as CSI divisions
    // Most design proposals include all standard AIA phases
    const contractorBid = bidComparisons.find(comp => comp.analysis.result.contractor_name === contractorName);
    if (!contractorBid) {
      return <span className="text-sm text-gray-600">Unknown</span>;
    }

    const discipline = contractorBid.analysis.result.discipline || 'construction';

    if (discipline === 'design') {
      // For design, show if all standard phases are included
      const phaseCount = getDisciplineCount(contractorBid.analysis.result);
      const standardPhaseCount = 5; // SD, DD, CD, BN, CA

      if (phaseCount >= standardPhaseCount) {
        return <span className="text-sm text-green-600">All Standard Phases</span>;
      } else {
        return <span className="text-sm text-yellow-600">{standardPhaseCount - phaseCount} Phase(s) Missing</span>;
      }
    } else if (discipline === 'trade') {
      // For trade, similar logic for systems
      return <span className="text-sm text-green-600">Systems Complete</span>;
    } else {
      // For construction, use the original divisions logic
      const typedData = data as { missing_divisions: string[] };
      return typedData.missing_divisions?.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {typedData.missing_divisions.slice(0, 3).map((div: string, index: number) => (
            <span
              key={index}
              className="px-1 py-0.5 bg-red-100 text-red-600 text-xs rounded"
            >
              {div}
            </span>
          ))}
          {typedData.missing_divisions.length > 3 && (
            <span className="text-xs text-gray-500">
              +{typedData.missing_divisions.length - 3} more
            </span>
          )}
        </div>
      ) : (
        <span className="text-sm text-green-600">Complete</span>
      );
    }
  };

  // Render discipline-specific comparison views
  const renderDisciplineSpecificComparison = () => {
    if (bidComparisons.length === 0) return null;

    switch (activeDiscipline) {
      case 'construction':
        return renderConstructionComparison();
      case 'design':
        return renderDesignComparison();
      case 'trade':
        return renderTradeComparison();
      default:
        return renderConstructionComparison();
    }
  };

  // Construction: CSI Division Comparison
  const renderConstructionComparison = () => (
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
                  comp.analysis.result.csi_divisions && comp.analysis.result.csi_divisions[code]
                );

                if (!hasData) return null;

                return (
                  <tr key={code} className="border-b">
                    <td className="py-2 font-medium">
                      {code} - {division.name}
                    </td>
                    {bidComparisons.map((comp) => {
                      const divisionData = comp.analysis.result.csi_divisions && comp.analysis.result.csi_divisions[code];
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
  );

  // Design: AIA Phase Comparison
  const renderDesignComparison = () => {
    const aiaPhases = [
      { code: 'schematic_design', name: 'Schematic Design (SD)', typical: '15%' },
      { code: 'design_development', name: 'Design Development (DD)', typical: '20%' },
      { code: 'construction_documents', name: 'Construction Documents (CD)', typical: '40%' },
      { code: 'bidding_negotiation', name: 'Bidding/Negotiation (BN)', typical: '5%' },
      { code: 'construction_administration', name: 'Construction Administration (CA)', typical: '20%' }
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">AIA Phase Comparison</h4>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">AIA Phase</th>
                <th className="text-left py-2">Typical %</th>
                {bidComparisons.map((comp) => (
                  <th key={comp.analysis.id} className="text-left py-2">
                    {comp.analysis.result.contractor_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aiaPhases.map((phase) => {
                // Check if any bid has this phase
                const hasData = bidComparisons.some(comp =>
                  comp.analysis.result.aia_phases && comp.analysis.result.aia_phases[phase.code]
                );

                if (!hasData) return null;

                return (
                  <tr key={phase.code} className="border-b">
                    <td className="py-2 font-medium">{phase.name}</td>
                    <td className="py-2 text-sm text-gray-600">{phase.typical}</td>
                    {bidComparisons.map((comp) => {
                      const phaseData = comp.analysis.result.aia_phases && comp.analysis.result.aia_phases[phase.code];
                      const percentage = phaseData
                        ? ((phaseData.fee_amount / comp.analysis.result.total_amount) * 100).toFixed(1)
                        : '0.0';
                      const cost = phaseData?.fee_amount || 0;

                      return (
                        <td key={comp.analysis.id} className="py-2">
                          {cost > 0 ? (
                            <div>
                              <div className="font-medium">${cost.toLocaleString()}</div>
                              <div className="text-sm text-gray-600">{percentage}%</div>
                              {phaseData && phaseData.deliverables && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {phaseData.deliverables.length} deliverables
                                </div>
                              )}
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
    );
  };

  // Trade: Technical Systems Comparison
  const renderTradeComparison = () => {
    const technicalSystems = [
      { code: 'electrical_power', name: 'Electrical Power Distribution', icon: '⚡' },
      { code: 'lighting_systems', name: 'Lighting Systems', icon: '💡' },
      { code: 'mechanical_hvac', name: 'HVAC Systems', icon: '🌡️' },
      { code: 'plumbing_systems', name: 'Plumbing Systems', icon: '🚰' },
      { code: 'fire_protection', name: 'Fire Protection', icon: '🔥' },
      { code: 'technology_systems', name: 'Technology Systems', icon: '📱' },
      { code: 'specialty_systems', name: 'Specialty Systems', icon: '⚙️' }
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Technical Systems Comparison</h4>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Technical System</th>
                {bidComparisons.map((comp) => (
                  <th key={comp.analysis.id} className="text-left py-2">
                    {comp.analysis.result.contractor_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {technicalSystems.map((system) => {
                // Check if any bid has this system
                const hasData = bidComparisons.some(comp =>
                  comp.analysis.result.technical_systems && comp.analysis.result.technical_systems[system.code]
                );

                if (!hasData) return null;

                return (
                  <tr key={system.code} className="border-b">
                    <td className="py-2 font-medium">
                      <div className="flex items-center">
                        <span className="mr-2">{system.icon}</span>
                        {system.name}
                      </div>
                    </td>
                    {bidComparisons.map((comp) => {
                      const systemData = comp.analysis.result.technical_systems && comp.analysis.result.technical_systems[system.code];
                      const percentage = systemData
                        ? ((systemData.total_cost / comp.analysis.result.total_amount) * 100).toFixed(1)
                        : '0.0';
                      const cost = systemData?.total_cost || 0;

                      return (
                        <td key={comp.analysis.id} className="py-2">
                          {cost > 0 ? (
                            <div>
                              <div className="font-medium">${cost.toLocaleString()}</div>
                              <div className="text-sm text-gray-600">{percentage}%</div>
                              {systemData && systemData.specifications && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {systemData.specifications.length} equipment items
                                </div>
                              )}
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
    );
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
            { key: 'construction', label: 'Construction', icon: '🏗️', desc: 'CSI Division Analysis' },
            { key: 'design', label: 'Design Services', icon: '📐', desc: 'AIA Phase Analysis' },
            { key: 'trade', label: 'Trade Services', icon: '⚡', desc: 'Technical Systems Analysis' }
          ].map((discipline) => (
            <button
              key={discipline.key}
              onClick={() => handleDisciplineChange(discipline.key as 'construction' | 'design' | 'trade')}
              className={`flex-1 flex flex-col items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeDiscipline === discipline.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={discipline.desc}
            >
              <div className="flex items-center mb-1">
                <span className="mr-2">{discipline.icon}</span>
                {discipline.label}
              </div>
              <div className="text-xs text-gray-500">{discipline.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Bid Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Select {activeDiscipline.charAt(0).toUpperCase() + activeDiscipline.slice(1)} Proposals to Compare (up to 5)
        </h4>
        
        {getFilteredAnalyses().length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">
              {activeDiscipline === 'construction' ? '🏗️' :
               activeDiscipline === 'design' ? '📐' :
               activeDiscipline === 'trade' ? '⚡' : '📊'}
            </div>
            <h5 className="text-lg font-semibold text-gray-900 mb-2">
              No {activeDiscipline} proposals available
            </h5>
            <p className="text-gray-600">
              Upload and analyze {activeDiscipline} proposals to compare them here.
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
                        {getDisciplineInfo(analysis.result)}
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
                    <th className="text-left py-2">{getDisciplineColumnHeader()}</th>
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
                      <td className="py-2">{getDisciplineCount(comp.analysis.result)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discipline-Specific Comparison */}
          {renderDisciplineSpecificComparison()}

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

              {/* Discipline-Specific Variance Analysis */}
              {comparativeAnalysis.division_comparisons && Object.keys(comparativeAnalysis.division_comparisons).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {getDisciplineVarianceTitle()}
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
                          <th className="text-left py-2">{getDisciplineIncludedHeader()}</th>
                          <th className="text-left py-2">{getDisciplineMissingHeader()}</th>
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
                                {getDisciplineIncludedCount(data, contractor)} {getDisciplineItemName()}
                              </span>
                            </td>
                            <td className="py-2">
                              {getDisciplineMissingDisplay(data, contractor)}
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