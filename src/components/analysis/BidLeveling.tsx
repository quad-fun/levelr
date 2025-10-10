'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllAnalyses, SavedAnalysis } from '@/lib/storage';
import { calculateProjectRisk } from '@/lib/analysis/risk-analyzer';
import { CSI_DIVISIONS, LEVELING_LABELS } from '@/lib/analysis/csi-analyzer';
import { exportBidLevelingToExcel, exportBidLevelingToPDF } from '@/lib/analysis/exports';
import { ComparativeAnalysis, AnalysisResult } from '@/types/analysis';
import { BarChart3, Download, DollarSign, Search, AlertTriangle, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';

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

interface VarianceExplanation {
  key: string;
  short: string;
  long?: string;
  at: string;
  model?: string;
}

// ExplainCell component for inline variance explanations
function ExplainCell({
  itemCode,
  itemName,
  discipline,
  bidComparisons,
  selectedBids
}: {
  itemCode: string;
  itemName: string;
  discipline: 'construction' | 'design' | 'trade';
  bidComparisons: BidComparison[];
  selectedBids: string[];
}) {
  const [explanation, setExplanation] = useState<VarianceExplanation | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('right');

  const enableInlineExplanations = process.env.NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS !== 'false';

  if (!enableInlineExplanations || selectedBids.length < 2) {
    return null;
  }

  const onOpen = async () => {
    if (explanation || isLoading) return;

    setIsLoading(true);
    try {
      // Build row data based on discipline
      const getCostForItem = (comp: BidComparison) => {
        switch (discipline) {
          case 'construction':
            return comp.analysis.result.csi_divisions?.[itemCode]?.cost || 0;
          case 'design':
            return comp.analysis.result.aia_phases?.[itemCode]?.fee_amount || 0;
          case 'trade':
            return comp.analysis.result.technical_systems?.[itemCode]?.total_cost || 0;
          default:
            return 0;
        }
      };

      const costs = bidComparisons.map(getCostForItem);
      const rows = [{
        division: itemCode,
        scopePath: itemName,
        discipline,
        bids: Object.fromEntries(
          bidComparisons.map((comp, index) => [
            comp.analysis.result.contractor_name,
            costs[index]
          ])
        ),
        varianceAbs: Math.max(...costs) - Math.min(...costs),
        variancePct: 0 // Will be calculated server-side
      }];

      const contractorNames = bidComparisons.map(comp => comp.analysis.result.contractor_name);
      const response = await fetch('/api/variance/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows,
          selectedBids: contractorNames.sort(), // Ensure consistent ordering
          maxChars: 280
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const exp: VarianceExplanation = await response.json();
      setExplanation(exp);

      // Cache the explanation in browser localStorage for export use
      try {
        const cacheKey = `levelr_variance_cache_${exp.key}`;
        const cacheEntry = {
          data: exp,
          expiry: Date.now() + (14 * 24 * 60 * 60 * 1000) // 14 days
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        console.log(`💾 Cached individual explanation in browser: ${exp.key}`);
      } catch (error) {
        console.warn('Failed to cache individual explanation:', error);
      }
    } catch (error) {
      console.error('Failed to get variance explanation:', error);
      setExplanation({
        key: 'error',
        short: 'Unable to generate explanation',
        long: 'Unable to generate explanation at this time. Please try again later.',
        at: new Date().toISOString(),
        model: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean, event?: React.MouseEvent) => {
    setIsOpen(open);
    if (open) {
      // Smart positioning: check if we're close to the right edge of screen
      if (event) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const tooltipWidth = 320; // 80 * 4 (w-80 in pixels)
        const spaceOnRight = window.innerWidth - rect.right;
        const spaceOnLeft = rect.left;

        // If not enough space on the right (320px), position left
        if (spaceOnRight < tooltipWidth && spaceOnLeft > tooltipWidth) {
          setTooltipPosition('left');
        } else {
          setTooltipPosition('right');
        }
      }
      onOpen();
    }
  };

  const getTitle = () => {
    switch (discipline) {
      case 'construction':
        return `Division ${itemCode} Variance`;
      case 'design':
        return `${itemName} Phase Variance`;
      case 'trade':
        return `${itemName} System Variance`;
      default:
        return `${itemName} Variance`;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => handleOpenChange(!isOpen, e)}
        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
        title="Explain variance differences"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <HelpCircle className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-8 z-50 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg ${
          tooltipPosition === 'left' ? 'right-0' : 'left-0'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <h6 className="text-sm font-medium text-gray-900">
              {getTitle()}
            </h6>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="text-sm text-gray-700">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Analyzing variance...
              </div>
            ) : explanation ? (
              <div>
                <div className="mb-2">
                  {showExpanded ? explanation.long : explanation.short}
                </div>
                {explanation.long && explanation.long !== explanation.short && (
                  <button
                    onClick={() => setShowExpanded(!showExpanded)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    {showExpanded ? 'Show less' : 'Keep reading →'}
                  </button>
                )}
              </div>
            ) : (
              'No explanation available'
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BidLeveling() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedBids, setSelectedBids] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'risk' | 'date'>('price');
  const [bidComparisons, setBidComparisons] = useState<BidComparison[]>([]);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [activeDiscipline, setActiveDiscipline] = useState<'construction' | 'design' | 'trade'>('construction');
  const [comparativeAnalysis] = useState<ComparativeAnalysis | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [bulkVarianceExplanations, setBulkVarianceExplanations] = useState<VarianceExplanation[]>([]);

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
      exportBidLevelingToPDF(selectedAnalyses, activeDiscipline);
    } else {
      exportBidLevelingToExcel(selectedAnalyses, activeDiscipline);
    }
  };


  const performComparativeAnalysis = async () => {
    if (selectedBids.length < 2) return;

    setIsLoadingComparison(true);
    setComparisonError(null);

    try {
      console.log('🚀 Starting bulk variance analysis for all divisions/phases');

      // Get the selected bid comparisons
      const selectedComparisons = bidComparisons.filter(comp =>
        selectedBids.includes(comp.analysis.id)
      );

      if (selectedComparisons.length < 2) {
        setComparisonError('Please select at least 2 bids for comparison.');
        setIsLoadingComparison(false);
        return;
      }

      // Determine which items to analyze based on discipline
      let itemsToAnalyze: string[] = [];

      if (activeDiscipline === 'construction') {
        // Get all CSI divisions that appear in at least 2 bids
        const allDivisions = new Set<string>();
        selectedComparisons.forEach(comp => {
          if (comp.analysis.result.csi_divisions) {
            Object.keys(comp.analysis.result.csi_divisions).forEach(div => allDivisions.add(div));
          }
        });
        itemsToAnalyze = Array.from(allDivisions);
      } else if (activeDiscipline === 'design') {
        // Get all AIA phases that appear in at least 2 bids
        const allPhases = new Set<string>();
        selectedComparisons.forEach(comp => {
          if (comp.analysis.result.aia_phases) {
            Object.keys(comp.analysis.result.aia_phases).forEach(phase => allPhases.add(phase));
          }
        });
        itemsToAnalyze = Array.from(allPhases);
      } else if (activeDiscipline === 'trade') {
        // Get all technical systems that appear in at least 2 bids
        const allSystems = new Set<string>();
        selectedComparisons.forEach(comp => {
          if (comp.analysis.result.technical_systems) {
            Object.keys(comp.analysis.result.technical_systems).forEach(sys => allSystems.add(sys));
          }
        });
        itemsToAnalyze = Array.from(allSystems);
      }

      console.log(`📊 Analyzing ${itemsToAnalyze.length} items across ${selectedComparisons.length} bids`);

      // Generate variance explanations for each item
      let successCount = 0;
      let errorCount = 0;

      for (const itemCode of itemsToAnalyze) {
        try {
          // Get item name and costs for each bid
          let itemName = itemCode;
          const costs: number[] = [];

          selectedComparisons.forEach(comp => {
            let cost = 0;
            switch (activeDiscipline) {
              case 'construction':
                cost = comp.analysis.result.csi_divisions?.[itemCode]?.cost || 0;
                itemName = LEVELING_LABELS[itemCode] || itemCode;
                break;
              case 'design':
                cost = comp.analysis.result.aia_phases?.[itemCode]?.fee_amount || 0;
                itemName = comp.analysis.result.aia_phases?.[itemCode]?.phase_name || itemCode;
                break;
              case 'trade':
                cost = comp.analysis.result.technical_systems?.[itemCode]?.total_cost || 0;
                itemName = comp.analysis.result.technical_systems?.[itemCode]?.system_name || itemCode;
                break;
            }
            costs.push(cost);
          });

          // Skip if all costs are zero or less than 2 bids have this item
          const nonZeroCosts = costs.filter(c => c > 0);
          if (nonZeroCosts.length < 2) {
            continue;
          }

          // Build row data for variance explanation
          const rows = [{
            division: itemCode,
            scopePath: itemName,
            discipline: activeDiscipline,
            bids: Object.fromEntries(
              selectedComparisons.map((comp, index) => [
                comp.analysis.result.contractor_name,
                costs[index]
              ])
            ),
            varianceAbs: Math.max(...costs) - Math.min(...costs),
            variancePct: 0 // Will be calculated server-side
          }];

          // Call variance explanation API
          const contractorNames = selectedComparisons.map(comp => comp.analysis.result.contractor_name);
          const response = await fetch('/api/variance/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rows,
              selectedBids: contractorNames.sort(), // Ensure consistent ordering
              maxChars: 280
            })
          });

          if (response.ok) {
            const explanation = await response.json();
            console.log(`✅ Generated explanation for ${itemCode}: ${explanation.short.substring(0, 50)}...`);

            // Cache the explanation in browser localStorage for export use
            try {
              const cacheKey = `levelr_variance_cache_${explanation.key}`;
              const cacheEntry = {
                data: explanation,
                expiry: Date.now() + (14 * 24 * 60 * 60 * 1000) // 14 days
              };
              localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
              console.log(`💾 Cached explanation in browser: ${explanation.key}`);
            } catch (error) {
              console.warn('Failed to cache explanation:', error);
            }

            successCount++;
          } else {
            console.warn(`❌ Failed to generate explanation for ${itemCode}: ${response.status}`);
            errorCount++;
          }

        } catch (error) {
          console.warn(`❌ Error generating explanation for ${itemCode}:`, error);
          errorCount++;
        }
      }

      console.log(`🎉 Bulk analysis complete: ${successCount} explanations generated, ${errorCount} errors`);

      if (successCount > 0) {
        // Load all generated explanations from localStorage and display in UI
        const allExplanations: VarianceExplanation[] = [];
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('levelr_variance_cache_')) {
              const cached = localStorage.getItem(key);
              if (cached) {
                const parsedCache = JSON.parse(cached);
                if (Date.now() <= parsedCache.expiry) {
                  allExplanations.push(parsedCache.data);
                }
              }
            }
          }
          setBulkVarianceExplanations(allExplanations);
        } catch (error) {
          console.warn('Error loading explanations for display:', error);
        }

        setComparisonError(null);
        console.log(`✅ Successfully generated ${successCount} variance explanations. They will be included in Excel exports.`);
      } else {
        setComparisonError('Failed to generate variance explanations. Please check the console for details.');
      }

    } catch (error) {
      console.error('Bulk variance analysis error:', error);
      setComparisonError(
        error instanceof Error ? error.message : 'Analysis failed. Please try again.'
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

  // Calculate design phase variance analysis
  const calculateDesignPhaseVariance = () => {
    if (bidComparisons.length < 2 || activeDiscipline !== 'design') return null;

    const allPhases = new Set<string>();
    const phaseVariances: { [phase: string]: {
      phase_name: string;
      percentages: number[];
      contractors: string[];
      average: number;
      min: number;
      max: number;
      variance: number;
      assessment: string;
    } } = {};

    // Collect all AIA phases across all bids
    bidComparisons.forEach(comp => {
      if (comp.analysis.result.aia_phases) {
        Object.keys(comp.analysis.result.aia_phases).forEach(phase => allPhases.add(phase));
      }
    });

    // Calculate variance for each phase
    allPhases.forEach(phaseKey => {
      const phaseData: { percentage: number; contractor: string; phaseName: string }[] = [];

      bidComparisons.forEach(comp => {
        const phaseInfo = comp.analysis.result.aia_phases?.[phaseKey];
        if (phaseInfo) {
          phaseData.push({
            percentage: phaseInfo.percentage_of_total,
            contractor: comp.analysis.result.contractor_name,
            phaseName: phaseInfo.phase_name
          });
        } else {
          phaseData.push({
            percentage: 0,
            contractor: comp.analysis.result.contractor_name,
            phaseName: phaseKey
          });
        }
      });

      const percentages = phaseData.map(d => d.percentage);
      const validPercentages = percentages.filter(p => p > 0);
      const average = validPercentages.length > 0 ? validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length : 0;
      const min = validPercentages.length > 0 ? Math.min(...validPercentages) : 0;
      const max = validPercentages.length > 0 ? Math.max(...validPercentages) : 0;
      const variance = max - min;

      // Generate assessment
      let assessment = '';
      if (variance > 15) assessment = 'HIGH VARIANCE - Significant differences in phase scope or fee allocation';
      else if (variance > 8) assessment = 'MODERATE VARIANCE - Some differences in phase approach';
      else if (validPercentages.length === bidComparisons.length) assessment = 'CONSISTENT - All proposals include this phase with similar allocations';
      else assessment = 'PARTIAL COVERAGE - Not all proposals include this phase';

      phaseVariances[phaseKey] = {
        phase_name: phaseData[0]?.phaseName || phaseKey,
        percentages,
        contractors: phaseData.map(d => d.contractor),
        average,
        min,
        max,
        variance,
        assessment
      };
    });

    return phaseVariances;
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
              {process.env.NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS !== 'false' && bidComparisons.length >= 2 && (
                <th className="text-left py-2 w-16">Why?</th>
              )}
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
                    {process.env.NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS !== 'false' && bidComparisons.length >= 2 && (
                      <td className="py-2">
                        <ExplainCell
                          itemCode={code}
                          itemName={division.name}
                          discipline="construction"
                          bidComparisons={bidComparisons}
                          selectedBids={selectedBids}
                        />
                      </td>
                    )}
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
                {process.env.NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS !== 'false' && bidComparisons.length >= 2 && (
                  <th className="text-left py-2 w-16">Why?</th>
                )}
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
                    {process.env.NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS !== 'false' && bidComparisons.length >= 2 && (
                      <td className="py-2">
                        <ExplainCell
                          itemCode={phase.code}
                          itemName={phase.name}
                          discipline="design"
                          bidComparisons={bidComparisons}
                          selectedBids={selectedBids}
                        />
                      </td>
                    )}
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
                {process.env.NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS !== 'false' && bidComparisons.length >= 2 && (
                  <th className="text-left py-2 w-16">Why?</th>
                )}
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
                    {process.env.NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS !== 'false' && bidComparisons.length >= 2 && (
                      <td className="py-2">
                        <ExplainCell
                          itemCode={system.code}
                          itemName={system.name}
                          discipline="trade"
                          bidComparisons={bidComparisons}
                          selectedBids={selectedBids}
                        />
                      </td>
                    )}
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

          {/* Bulk Variance Explanations */}
          {bulkVarianceExplanations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Search className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">
                  AI-Generated Variance Explanations
                </h4>
                <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                  {bulkVarianceExplanations.length} explanations
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                AI analysis explains why costs differ between {activeDiscipline === 'construction' ? 'CSI divisions' : activeDiscipline === 'design' ? 'AIA phases' : 'technical systems'} across selected bids.
              </div>

              <div className="grid gap-4">
                {bulkVarianceExplanations
                  .filter(exp => exp.model !== 'fallback' && !exp.short.includes('Unable to'))
                  .sort((a, b) => {
                    // Extract division/phase number for sorting
                    const extractNumber = (key: string) => {
                      const match = key.match(/^(\d+)/);
                      return match ? parseInt(match[1]) : 999;
                    };
                    return extractNumber(a.key) - extractNumber(b.key);
                  })
                  .map((explanation) => {
                    // Parse the explanation key to get division/phase info
                    const keyParts = explanation.key.split('_');
                    const itemCode = keyParts[0] || 'Unknown';

                    // Get item name based on discipline
                    let itemName = itemCode;
                    if (activeDiscipline === 'construction') {
                      itemName = LEVELING_LABELS[itemCode] || `Division ${itemCode}`;
                    } else if (activeDiscipline === 'design') {
                      // For design, try to find the actual phase name from the bid data
                      const phaseInfo = bidComparisons[0]?.analysis.result.aia_phases?.[itemCode];
                      itemName = phaseInfo?.phase_name || itemCode;
                    } else if (activeDiscipline === 'trade') {
                      // For trade, try to find the actual system name from the bid data
                      const systemInfo = bidComparisons[0]?.analysis.result.technical_systems?.[itemCode];
                      itemName = systemInfo?.system_name || itemCode;
                    }

                    return (
                      <div key={explanation.key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-1">
                              {activeDiscipline === 'construction' && `Division ${itemCode}: `}
                              {itemName}
                            </h5>
                            <div className="text-xs text-gray-500">
                              Generated {new Date(explanation.at).toLocaleString()} • {explanation.model || 'AI Analysis'}
                            </div>
                          </div>
                          <div className="flex items-center ml-4">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                              {activeDiscipline === 'construction' ? 'CSI' : activeDiscipline === 'design' ? 'AIA' : 'Tech'}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-700 leading-relaxed">
                          {explanation.short}
                        </div>

                        {explanation.long && explanation.long !== explanation.short && (
                          <details className="mt-3">
                            <summary className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                              Show detailed analysis →
                            </summary>
                            <div className="mt-2 text-sm text-gray-600 leading-relaxed border-l-2 border-blue-200 pl-3">
                              {explanation.long}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })}
              </div>

              {bulkVarianceExplanations.filter(exp => exp.model === 'fallback' || exp.short.includes('Unable to')).length > 0 && (
                <div className="mt-4 text-xs text-gray-500">
                  {bulkVarianceExplanations.filter(exp => exp.model === 'fallback' || exp.short.includes('Unable to')).length} explanations could not be generated due to API limitations.
                </div>
              )}
            </div>
          )}

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
              {activeDiscipline === 'design' ? (
                (() => {
                  const designPhaseVariance = calculateDesignPhaseVariance();
                  return designPhaseVariance && Object.keys(designPhaseVariance).length > 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        {getDisciplineVarianceTitle()}
                      </h4>
                      <div className="space-y-6">
                        {Object.entries(designPhaseVariance)
                          .sort(([a], [b]) => {
                            // Standard AIA phase order
                            const phaseOrder = ['SD', 'DD', 'CD', 'BN', 'CA'];
                            const aIndex = phaseOrder.indexOf(a);
                            const bIndex = phaseOrder.indexOf(b);
                            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                            if (aIndex !== -1) return -1;
                            if (bIndex !== -1) return 1;
                            return a.localeCompare(b);
                          })
                          .map(([phaseKey, variance]) => (
                          <div
                            key={phaseKey}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <h5 className="font-semibold text-gray-900 mb-3">
                              {phaseKey} - {variance.phase_name}
                            </h5>

                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-2">
                                  Phase Statistics
                                </h6>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>Average: {variance.average.toFixed(1)}%</p>
                                  <p>Range: {variance.min.toFixed(1)}% - {variance.max.toFixed(1)}%</p>
                                  <p>Variance: {variance.variance.toFixed(1)} percentage points</p>
                                </div>
                              </div>

                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-2">
                                  Firm Allocations
                                </h6>
                                <div className="space-y-1 text-sm text-gray-600">
                                  {variance.contractors.map((contractor, index) => (
                                    <div key={index} className="flex justify-between">
                                      <span className="truncate mr-2">{contractor}:</span>
                                      <span className="font-medium">
                                        {variance.percentages[index] > 0 ? `${variance.percentages[index].toFixed(1)}%` : 'Not included'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-2">
                                  Assessment
                                </h6>
                                <div className={`p-3 rounded text-sm ${
                                  variance.variance > 15 ? 'bg-red-50 text-red-700' :
                                  variance.variance > 8 ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-green-50 text-green-700'
                                }`}>
                                  {variance.assessment}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()
              ) : (
                // Construction and Trade variance analysis (existing logic)
                comparativeAnalysis?.division_comparisons && Object.keys(comparativeAnalysis.division_comparisons).length > 0 && (
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
                )
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