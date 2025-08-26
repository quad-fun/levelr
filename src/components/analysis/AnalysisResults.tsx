'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/types/analysis';
import { CSI_DIVISIONS } from '@/lib/analysis/csi-analyzer';
import { analyzeMarketVariance } from '@/lib/analysis/market-analyzer';
import { calculateProjectRisk } from '@/lib/analysis/risk-analyzer';
import { Building, Calendar, DollarSign, AlertTriangle, CheckCircle, TrendingUp, ChevronDown, ChevronUp, Eye } from 'lucide-react';

interface AnalysisResultsProps {
  analysis: AnalysisResult;
  onExport?: () => void;
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const [showUncategorized, setShowUncategorized] = useState(false);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [showOverhead, setShowOverhead] = useState(false);
  const [showAllowances, setShowAllowances] = useState(false);
  const [showSubcontractors, setShowSubcontractors] = useState(false);

  const toggleDivision = (code: string) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedDivisions(newExpanded);
  };
  
  const projectRisk = calculateProjectRisk(
    Object.fromEntries(
      Object.entries(analysis.csi_divisions).map(([code, data]) => [code, data.cost])
    ),
    analysis.total_amount,
    analysis.uncategorizedTotal || 0,
    analysis // Pass full analysis for enhanced subcontractor validation
  );

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVarianceColor = (status: string) => {
    switch (status) {
      case 'ABOVE_MARKET': return 'text-red-600 bg-red-50 border-red-200';
      case 'BELOW_MARKET': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'MARKET_RATE': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Project Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Bid Analysis Results</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <Building className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Contractor</p>
              <p className="font-semibold">{analysis.contractor_name}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold">${analysis.total_amount.toLocaleString()}</p>
              {analysis.gross_sqft && (
                <p className="text-xs text-gray-600">
                  ${(analysis.total_amount / analysis.gross_sqft).toFixed(0)}/SF ({analysis.gross_sqft.toLocaleString()} SF)
                </p>
              )}
            </div>
          </div>
          
          {analysis.bid_date && (
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Bid Date</p>
                <p className="font-semibold">{new Date(analysis.bid_date).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
        
        {analysis.project_name && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Project</p>
            <p className="font-semibold text-lg">{analysis.project_name}</p>
          </div>
        )}
      </div>

      {/* Cost Coverage Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Cost Coverage Analysis</h3>
        
        {(() => {
          // Calculate comprehensive cost coverage
          const csiDivisionsCost = Object.values(analysis.csi_divisions).reduce((sum, div) => sum + div.cost, 0);
          const projectOverheadCost = analysis.project_overhead?.total_overhead || 0;
          const allowancesTotalCost = analysis.allowances_total || 0;
          const uncategorizedCost = analysis.uncategorizedTotal || 0;
          
          // Calculate subcontractor costs - avoid double counting with CSI divisions
          let separateSubcontractorCost = 0;
          let subcontractorCoveredByCSI = 0;
          if (analysis.subcontractors) {
            analysis.subcontractors.forEach(sub => {
              // Check if this subcontractor's divisions are covered in CSI divisions
              const csiCoveredAmount = sub.divisions.reduce((sum, divCode) => {
                const csiDiv = analysis.csi_divisions[divCode];
                return sum + (csiDiv?.cost || 0);
              }, 0);
              
              if (csiCoveredAmount > 0) {
                // Subcontractor is already counted in CSI divisions
                subcontractorCoveredByCSI += sub.total_amount;
              } else {
                // Subcontractor is separate from CSI breakdown
                separateSubcontractorCost += sub.total_amount;
              }
            });
          }
          
          const totalCoveredCost = csiDivisionsCost + projectOverheadCost + allowancesTotalCost + separateSubcontractorCost;
          const coveragePercentage = (totalCoveredCost / analysis.total_amount) * 100;
          const uncategorizedPercentage = (uncategorizedCost / analysis.total_amount) * 100;
          
          const getCoverageColor = (percentage: number) => {
            if (percentage >= 85) return 'text-green-600 bg-green-100';
            if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
            return 'text-red-600 bg-red-100';
          };
          
          return (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Coverage Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>CSI Divisions:</span>
                      <span className="font-medium">${csiDivisionsCost.toLocaleString()} ({((csiDivisionsCost / analysis.total_amount) * 100).toFixed(1)}%)</span>
                    </div>
                    {projectOverheadCost > 0 && (
                      <div className="flex justify-between">
                        <span>Project Overhead:</span>
                        <span className="font-medium">${projectOverheadCost.toLocaleString()} ({((projectOverheadCost / analysis.total_amount) * 100).toFixed(1)}%)</span>
                      </div>
                    )}
                    {allowancesTotalCost > 0 && (
                      <div className="flex justify-between">
                        <span>Allowances & Contingencies:</span>
                        <span className="font-medium">${allowancesTotalCost.toLocaleString()} ({((allowancesTotalCost / analysis.total_amount) * 100).toFixed(1)}%)</span>
                      </div>
                    )}
                    {separateSubcontractorCost > 0 && (
                      <div className="flex justify-between">
                        <span>Separate Subcontractors:</span>
                        <span className="font-medium">${separateSubcontractorCost.toLocaleString()} ({((separateSubcontractorCost / analysis.total_amount) * 100).toFixed(1)}%)</span>
                      </div>
                    )}
                    {subcontractorCoveredByCSI > 0 && (
                      <div className="flex justify-between text-gray-500 text-xs">
                        <span>Subcontractors in CSI (no double-count):</span>
                        <span>${subcontractorCoveredByCSI.toLocaleString()}</span>
                      </div>
                    )}
                    {uncategorizedCost > 0 && (
                      <div className="flex justify-between text-yellow-600">
                        <span>Uncategorized:</span>
                        <span className="font-medium">${uncategorizedCost.toLocaleString()} ({uncategorizedPercentage.toFixed(1)}%)</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Coverage Summary</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Total Coverage</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getCoverageColor(coveragePercentage)}`}>
                          {coveragePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            coveragePercentage >= 85 ? 'bg-green-500' :
                            coveragePercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(coveragePercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Covered:</strong> ${totalCoveredCost.toLocaleString()}</p>
                      <p><strong>Total Project:</strong> ${analysis.total_amount.toLocaleString()}</p>
                      {uncategorizedCost > 0 && (
                        <p className="text-yellow-600"><strong>Uncategorized:</strong> ${uncategorizedCost.toLocaleString()}</p>
                      )}
                    </div>
                    {coveragePercentage >= 85 && (
                      <p className="text-xs text-green-600 font-medium">✅ Excellent coverage - comprehensive cost breakdown</p>
                    )}
                    {coveragePercentage >= 70 && coveragePercentage < 85 && (
                      <p className="text-xs text-yellow-600 font-medium">⚠️ Good coverage - some costs may need further categorization</p>
                    )}
                    {coveragePercentage < 70 && (
                      <p className="text-xs text-red-600 font-medium">⚠️ Low coverage - potential missing costs or scope gaps</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Coverage includes CSI divisions, project overhead, allowances, and separate subcontractors. 
                      Prevents double-counting between CSI and subcontractor costs.
                    </p>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Risk Assessment</h3>
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(projectRisk.level)}`}>
              {projectRisk.level} RISK ({projectRisk.score}/100)
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  projectRisk.level === 'HIGH' ? 'bg-red-500' :
                  projectRisk.level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${projectRisk.score}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {projectRisk.factors.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Risk Factors:</h4>
            <ul className="space-y-2">
              {projectRisk.factors.map((factor, index) => (
                <li key={index} className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CSI Division Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">CSI Division Analysis</h3>
        
        <div className="space-y-4">
          {Object.entries(analysis.csi_divisions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([code, data]) => {
            const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
            const variance = analyzeMarketVariance(data.cost, analysis.total_amount, code);
            const percentage = ((data.cost / analysis.total_amount) * 100).toFixed(1);
            
            const isExpanded = expandedDivisions.has(code);
            const hasSubItems = data.sub_items && data.sub_items.length > 0;
            
            return (
              <div key={code} className={`border rounded-lg p-4 ${getVarianceColor(variance.status)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-semibold">
                        Division {code} - {division?.name || 'Unknown'}
                      </h4>
                      {hasSubItems && (
                        <button
                          onClick={() => toggleDivision(code)}
                          className="ml-2 p-1 rounded hover:bg-white hover:bg-opacity-50"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-sm opacity-75">{division?.description}</p>
                    {data.subcontractor && (
                      <p className="text-sm font-medium text-blue-600">
                        Subcontractor: {data.subcontractor}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${data.cost.toLocaleString()}</p>
                    <p className="text-sm">{percentage}% of total</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {variance.status === 'MARKET_RATE' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-sm font-medium">{variance.message}</span>
                  </div>
                  
                  {data.unit_cost && data.quantity && data.unit && (
                    <div className="text-sm">
                      {data.quantity.toLocaleString()} {data.unit} @ ${data.unit_cost.toFixed(2)}
                    </div>
                  )}
                </div>
                
                {variance.recommendation && (
                  <div className="mt-2 text-sm">
                    <strong>Recommendation:</strong> {variance.recommendation}
                  </div>
                )}

                {/* Expandable Sub-Items Section */}
                {hasSubItems && isExpanded && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Detailed Line Items:</h5>
                    <div className="space-y-2">
                      {data.sub_items!.map((item, index) => (
                        <div key={index} className="bg-white bg-opacity-60 rounded p-3 text-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{item.description}</p>
                              {item.subcontractor && (
                                <p className="text-xs text-blue-600">Sub: {item.subcontractor}</p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold">${item.cost.toLocaleString()}</p>
                              {item.unit_cost && item.quantity && item.unit && (
                                <p className="text-xs text-gray-600">
                                  {item.quantity.toLocaleString()} {item.unit} @ ${item.unit_cost.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.items.length > 0 && !hasSubItems && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Items:</p>
                    <p className="text-sm">{data.items.join(', ')}</p>
                  </div>
                )}

                {data.scope_notes && (
                  <div className="mt-2 text-sm">
                    <strong>Scope Notes:</strong> {data.scope_notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Soft Costs Section */}
      {analysis.softCosts && analysis.softCosts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">
                Soft Costs - ${(analysis.softCostsTotal || 0).toLocaleString()}
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({((analysis.softCostsTotal || 0) / analysis.total_amount * 100).toFixed(1)}% of total)
                </span>
              </h3>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-purple-800">
              <strong>Soft Costs:</strong> Administrative, professional, and non-construction expenses including design fees, permits, bonds, insurance, and professional services.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Itemized Soft Costs
            </h4>
            {analysis.softCosts.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.description}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold text-gray-900">${item.cost.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    {(item.cost / analysis.total_amount * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Overhead Section */}
      {analysis.project_overhead && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">
                Project Overhead - ${analysis.project_overhead.total_overhead.toLocaleString()}
              </h3>
            </div>
            <button
              onClick={() => setShowOverhead(!showOverhead)}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showOverhead ? (
                <>
                  <span className="mr-1">Hide Details</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="mr-1">Show Details</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {showOverhead && (
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.project_overhead.general_conditions && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">General Conditions</p>
                  <p className="text-lg font-bold">${analysis.project_overhead.general_conditions.toLocaleString()}</p>
                </div>
              )}
              {analysis.project_overhead.cm_fee && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">CM Fee</p>
                  <p className="text-lg font-bold">${analysis.project_overhead.cm_fee.toLocaleString()}</p>
                </div>
              )}
              {analysis.project_overhead.insurance && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Insurance</p>
                  <p className="text-lg font-bold">${analysis.project_overhead.insurance.toLocaleString()}</p>
                </div>
              )}
              {analysis.project_overhead.bonds && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Bonds</p>
                  <p className="text-lg font-bold">${analysis.project_overhead.bonds.toLocaleString()}</p>
                </div>
              )}
              {analysis.project_overhead.permits && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Permits</p>
                  <p className="text-lg font-bold">${analysis.project_overhead.permits.toLocaleString()}</p>
                </div>
              )}
              {analysis.project_overhead.supervision && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Supervision</p>
                  <p className="text-lg font-bold">${analysis.project_overhead.supervision.toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Allowances & Contingencies Section */}
      {analysis.allowances && analysis.allowances.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">
                Allowances & Contingencies - ${(analysis.allowances_total || 0).toLocaleString()}
              </h3>
            </div>
            <button
              onClick={() => setShowAllowances(!showAllowances)}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showAllowances ? (
                <>
                  <span className="mr-1">Hide Details</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="mr-1">Show Details</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {showAllowances && (
            <div className="space-y-3">
              {analysis.allowances.map((allowance, index) => {
                const typeColor = {
                  contingency: 'bg-red-50 border-red-200 text-red-800',
                  allowance: 'bg-blue-50 border-blue-200 text-blue-800',
                  hold: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                  tbd: 'bg-gray-50 border-gray-200 text-gray-800',
                  unit_price_allowance: 'bg-green-50 border-green-200 text-green-800'
                }[allowance.type] || 'bg-gray-50 border-gray-200 text-gray-800';

                return (
                  <div key={index} className={`border rounded-lg p-4 ${typeColor}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-semibold">{allowance.description}</h4>
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white bg-opacity-50">
                            {allowance.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        {allowance.scope_description && (
                          <p className="text-sm mt-1 opacity-75">{allowance.scope_description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${allowance.amount.toLocaleString()}</p>
                        {allowance.percentage_of_total && (
                          <p className="text-sm">{allowance.percentage_of_total.toFixed(1)}% of total</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subcontractors Section */}
      {analysis.subcontractors && analysis.subcontractors.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">
                Subcontractor Breakdown ({analysis.subcontractors.length} trades)
              </h3>
            </div>
            <button
              onClick={() => setShowSubcontractors(!showSubcontractors)}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showSubcontractors ? (
                <>
                  <span className="mr-1">Hide Details</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="mr-1">Show Details</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {showSubcontractors && (
            <div className="space-y-3">
              {analysis.subcontractors.map((sub, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{sub.name}</h4>
                      <p className="text-sm text-blue-600 font-medium">{sub.trade}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sub.divisions.map((div) => (
                          <span key={div} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Div {div}
                          </span>
                        ))}
                      </div>
                      {sub.scope_description && (
                        <p className="text-sm text-gray-600 mt-2">{sub.scope_description}</p>
                      )}
                      {sub.contact_info && (
                        <p className="text-xs text-gray-500 mt-1">{sub.contact_info}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl">${sub.total_amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        {((sub.total_amount / analysis.total_amount) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Uncategorized Costs Section */}
      {analysis.uncategorizedCosts && analysis.uncategorizedCosts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">
                Soft Costs & Uncategorized Items ({((analysis.uncategorizedTotal || 0) / analysis.total_amount * 100).toFixed(1)}% of total)
              </h3>
              {(analysis.uncategorizedTotal || 0) / analysis.total_amount > 0.25 && (
                <AlertTriangle className="h-5 w-5 text-yellow-500 ml-2" />
              )}
            </div>
            <button
              onClick={() => setShowUncategorized(!showUncategorized)}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showUncategorized ? (
                <>
                  <span className="mr-1">Hide Details</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="mr-1">Show Details</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-yellow-800">Total Uncategorized</h4>
              <div className="text-right">
                <p className="font-bold text-lg text-yellow-800">
                  ${(analysis.uncategorizedTotal || 0).toLocaleString()}
                </p>
                <p className="text-sm text-yellow-700">
                  {((analysis.uncategorizedTotal || 0) / analysis.total_amount * 100).toFixed(1)}% of project total
                </p>
              </div>
            </div>
            <p className="text-sm text-yellow-700">
              These costs couldn't be matched to specific CSI divisions using standard construction keywords.
            </p>
          </div>

          {showUncategorized && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Itemized Soft Costs & Uncategorized Items
              </h4>
              {analysis.uncategorizedCosts.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-gray-900">${item.cost.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {(item.cost / analysis.total_amount * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Why costs might be uncategorized:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Contingency allowances or reserves</li>
                  <li>• Non-construction items (permits, bonds, etc.)</li>
                  <li>• Specialty work not matching standard CSI keywords</li>
                  <li>• Vendor-specific or proprietary system names</li>
                  <li>• Administrative or soft costs</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional Information */}
      {(analysis.exclusions?.length || analysis.assumptions?.length || analysis.timeline) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {analysis.timeline && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                <p className="text-gray-700">{analysis.timeline}</p>
              </div>
            )}
            
            {analysis.exclusions?.length && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Exclusions</h4>
                <ul className="text-gray-700 space-y-1">
                  {analysis.exclusions.map((exclusion, index) => (
                    <li key={index}>• {exclusion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.assumptions?.length && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Assumptions</h4>
                <ul className="text-gray-700 space-y-1">
                  {analysis.assumptions.map((assumption, index) => (
                    <li key={index}>• {assumption}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}