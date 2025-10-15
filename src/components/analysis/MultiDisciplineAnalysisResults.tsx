'use client';

import React, { useState } from 'react';
import { AnalysisResult, MarketVariance, RiskAssessment } from '@/types/analysis';
import {
  FileText, DollarSign, AlertTriangle, CheckCircle,
  Building, Palette, Zap, TrendingUp, TrendingDown,
  Calendar, User, Layers, Target,
  BarChart3, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { analyzeMarketVariance } from '@/lib/analysis/market-analyzer';
import { CSI_DIVISIONS } from '@/lib/analysis/csi-analyzer';

interface MultiDisciplineAnalysisResultsProps {
  analysis: AnalysisResult;
  marketVariance?: MarketVariance;
  riskAssessment?: RiskAssessment;
  onExport?: (format: 'pdf' | 'excel') => void;
}

export default function MultiDisciplineAnalysisResults({
  analysis,
  marketVariance,
  riskAssessment,
  onExport
}: MultiDisciplineAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'scope' | 'soft-costs' | 'commercial' | 'risk'>('overview');

  const getDisciplineConfig = (discipline: string) => {
    const configs = {
      construction: {
        title: 'Construction Analysis',
        icon: Building,
        color: 'blue',
        scopeLabel: 'CSI Divisions'
      },
      design: {
        title: 'Design Services Analysis',
        icon: Palette,
        color: 'purple',
        scopeLabel: 'AIA Phases'
      },
      trade: {
        title: 'Trade Services Analysis',
        icon: Zap,
        color: 'green',
        scopeLabel: 'Technical Systems'
      }
    };
    return configs[discipline as keyof typeof configs] || configs.construction;
  };

  const disciplineConfig = getDisciplineConfig(analysis.discipline);
  const DisciplineIcon = disciplineConfig.icon;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getVarianceIcon = (variance?: MarketVariance) => {
    if (!variance) return <BarChart3 className="h-4 w-4 text-gray-500" />;
    
    switch (variance.status) {
      case 'ABOVE_MARKET':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'BELOW_MARKET':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      case 'MARKET_RATE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'scope', name: disciplineConfig.scopeLabel, icon: disciplineConfig.icon },
    { id: 'soft-costs', name: analysis.discipline === 'design' ? 'Uncategorized' : 'Soft Costs', icon: Building },
    { id: 'commercial', name: 'Commercial', icon: DollarSign },
    { id: 'risk', name: 'Risk Analysis', icon: Shield }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className={`bg-${disciplineConfig.color}-600 text-white px-6 py-4 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DisciplineIcon className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">{disciplineConfig.title}</h2>
              <p className="text-blue-100">{analysis.contractor_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(analysis.total_amount)}</p>
            <p className="text-blue-100">{analysis.project_name || 'Project Analysis'}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {getVarianceIcon(marketVariance)}
          </div>
          <p className="text-sm text-gray-600">Market Position</p>
          <p className="font-semibold">
            {marketVariance?.status.replace('_', ' ') || 'Unknown'}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className={`h-4 w-4 ${analysis.categorizationPercentage && analysis.categorizationPercentage > 80 ? 'text-green-500' : 'text-yellow-500'}`} />
          </div>
          <p className="text-sm text-gray-600">Coverage</p>
          <p className="font-semibold">
            {formatPercentage(analysis.categorizationPercentage || 0)}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className={`h-4 w-4 ${riskAssessment ? getRiskColor(riskAssessment.level).split(' ')[0] : 'text-gray-500'}`} />
          </div>
          <p className="text-sm text-gray-600">Risk Level</p>
          <p className="font-semibold">{riskAssessment?.level || 'Unknown'}</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-sm text-gray-600">Quality</p>
          <p className="font-semibold capitalize">
            {analysis.document_quality?.replace('_', ' ') || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? `border-${disciplineConfig.color}-500 text-${disciplineConfig.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            analysis={analysis} 
            marketVariance={marketVariance}
            _riskAssessment={riskAssessment}
            _disciplineConfig={disciplineConfig}
          />
        )}
        
        {activeTab === 'scope' && (
          <ScopeTab 
            analysis={analysis} 
            _disciplineConfig={disciplineConfig}
          />
        )}
        
        {activeTab === 'soft-costs' && (
          <SoftCostsTab
            analysis={analysis}
            _disciplineConfig={disciplineConfig}
          />
        )}

        {activeTab === 'commercial' && (
          <CommercialTab
            analysis={analysis}
            _disciplineConfig={disciplineConfig}
          />
        )}
        
        {activeTab === 'risk' && (
          <RiskTab 
            analysis={analysis}
            riskAssessment={riskAssessment}
            _disciplineConfig={disciplineConfig}
          />
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{analysis.proposal_date || 'Date unknown'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{analysis.contractor_name}</span>
          </div>
        </div>
        
        {onExport && (
          <div className="flex space-x-2">
            <button
              onClick={() => onExport('pdf')}
              className={`px-4 py-2 bg-${disciplineConfig.color}-600 hover:bg-${disciplineConfig.color}-700 text-white rounded-lg font-medium transition-colors`}
            >
              Export PDF
            </button>
            <button
              onClick={() => onExport('excel')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Export Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ 
  analysis, 
  marketVariance, 
  _riskAssessment, 
  _disciplineConfig 
}: {
  analysis: AnalysisResult;
  marketVariance?: MarketVariance;
  _riskAssessment?: RiskAssessment;
  _disciplineConfig: { title: string; icon: React.ComponentType<{ className?: string }>; color: string; scopeLabel: string };
}) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      {/* Market Analysis */}
      {marketVariance && (
        <div className={`rounded-lg p-4 border-l-4 ${
          marketVariance.status === 'ABOVE_MARKET' ? 'bg-red-50 border-red-400' :
          marketVariance.status === 'BELOW_MARKET' ? 'bg-blue-50 border-blue-400' :
          'bg-green-50 border-green-400'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              marketVariance.status === 'ABOVE_MARKET' ? 'bg-red-100' :
              marketVariance.status === 'BELOW_MARKET' ? 'bg-blue-100' :
              'bg-green-100'
            }`}>
              {marketVariance.status === 'ABOVE_MARKET' ? <TrendingUp className="h-5 w-5 text-red-600" /> :
               marketVariance.status === 'BELOW_MARKET' ? <TrendingDown className="h-5 w-5 text-blue-600" /> :
               <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Market Analysis</h3>
              <p className="text-sm text-gray-700">{marketVariance.message}</p>
              <p className="text-xs text-gray-600 mt-1">{marketVariance.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Total Value</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(analysis.total_amount)}</p>
          {analysis.gross_sqft && (
            <p className="text-sm text-gray-600">
              {formatCurrency(analysis.total_amount / analysis.gross_sqft)} per sq ft
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Coverage</h4>
          <p className="text-2xl font-bold text-gray-900">
            {(analysis.categorizationPercentage || 0).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Scope categorization</p>
        </div>

        {analysis.project_overhead && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Overhead</h4>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(analysis.project_overhead.total_overhead)}
            </p>
            <p className="text-sm text-gray-600">
              {((analysis.project_overhead.total_overhead / analysis.total_amount) * 100).toFixed(1)}% of total
            </p>
          </div>
        )}
      </div>

      {/* Timeline & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Project Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Discipline:</span>
              <span className="font-medium capitalize">{analysis.discipline}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Proposal Date:</span>
              <span className="font-medium">{analysis.proposal_date || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Document Quality:</span>
              <span className="font-medium capitalize">{analysis.document_quality?.replace('_', ' ') || 'Unknown'}</span>
            </div>
            {analysis.gross_sqft && (
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Area:</span>
                <span className="font-medium">{analysis.gross_sqft.toLocaleString()} sq ft</span>
              </div>
            )}
          </div>
        </div>

        {analysis.timeline && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">{analysis.timeline}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Scope Tab Component
function ScopeTab({
  analysis,
  _disciplineConfig
}: {
  analysis: AnalysisResult;
  _disciplineConfig: { title: string; icon: React.ComponentType<{ className?: string }>; color: string; scopeLabel: string };
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getVarianceColor = (status: string) => {
    switch (status) {
      case 'BELOW_MARKET': return 'border-green-200 bg-green-50';
      case 'MARKET_RATE': return 'border-gray-200 bg-gray-50';
      case 'ABOVE_MARKET': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getVarianceIcon = (variance: { status: string } | undefined) => {
    if (!variance) return <Target className="h-4 w-4 text-gray-500" />;

    switch (variance.status) {
      case 'BELOW_MARKET':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'MARKET_RATE':
        return <Target className="h-4 w-4 text-gray-600" />;
      case 'ABOVE_MARKET':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  if (analysis.discipline === 'construction') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">CSI Division Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(analysis.csi_divisions)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([divisionCode, division]) => {
            const csiDivision = CSI_DIVISIONS[divisionCode as keyof typeof CSI_DIVISIONS];
            const variance = analyzeMarketVariance(division.cost, analysis.total_amount, divisionCode);
            const percentage = ((division.cost / analysis.total_amount) * 100).toFixed(1);

            const isExpanded = expandedSections.has(`csi-${divisionCode}`);
            const hasItems = Array.isArray(division.items) && division.items.length > 0;
            const hasSubItems = division.sub_items && division.sub_items.length > 0;

            return (
              <div key={divisionCode} className={`border rounded-lg p-4 ${getVarianceColor(variance.status)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        {getVarianceIcon(variance)}
                      </div>
                      <h4 className="font-semibold">
                        Division {divisionCode} - {csiDivision?.name || 'Unknown'}
                      </h4>
                      {(hasItems || hasSubItems) && (
                        <button
                          onClick={() => toggleSection(`csi-${divisionCode}`)}
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
                    <p className="text-sm opacity-75">{csiDivision?.description}</p>
                    {division.subcontractor && (
                      <p className="text-sm font-medium text-blue-600">
                        Subcontractor: {division.subcontractor}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(division.cost)}</p>
                    <p className="text-sm text-gray-600">{percentage}%</p>
                    {variance.message && (
                      <p className="text-xs text-gray-500 mt-1">{variance.message}</p>
                    )}
                  </div>
                </div>

                {/* Expandable Items Section */}
                {(hasItems || hasSubItems) && isExpanded && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      {hasSubItems ? 'Detailed Line Items:' : 'Items:'}
                    </h5>
                    <div className="space-y-2">
                      {hasSubItems ? (
                        division.sub_items!.map((item, index) => (
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
                                <p className="font-semibold">{formatCurrency(item.cost)}</p>
                                {item.unit && item.quantity && (
                                  <p className="text-xs text-gray-600">
                                    {item.quantity} {item.unit}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        division.items.map((item, index) => (
                          <div key={index} className="bg-white bg-opacity-60 rounded p-2 text-sm">
                            <p className="font-medium text-gray-900">{item}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {division.scope_notes && (
                  <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                    {division.scope_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Uncategorized Costs Section - Debug */}
        {(() => {
          console.log('🔍 Construction uncategorized debug:', {
            uncategorizedCosts: analysis.uncategorizedCosts,
            isArray: Array.isArray(analysis.uncategorizedCosts),
            length: analysis.uncategorizedCosts?.length,
            uncategorizedTotal: analysis.uncategorizedTotal
          });
          return null;
        })()}
        {((analysis.uncategorizedCosts && analysis.uncategorizedCosts.length > 0) || (analysis.uncategorizedTotal && analysis.uncategorizedTotal > 0)) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Uncategorized Construction Items</h3>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-orange-800">Items Not Mapped to CSI Divisions</h4>
                  <p className="text-sm text-orange-700">Construction work that couldn't be categorized into standard divisions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-800">{formatCurrency(analysis.uncategorizedTotal || 0)}</p>
                  <p className="text-sm text-orange-600">
                    {((analysis.uncategorizedTotal || 0) / analysis.total_amount * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
              {analysis.uncategorizedCosts && Array.isArray(analysis.uncategorizedCosts) && analysis.uncategorizedCosts.length > 0 ? (
                <div className="space-y-2">
                  {analysis.uncategorizedCosts.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-orange-100">
                      <span className="text-sm text-gray-900">{item.description}</span>
                      <span className="text-sm font-medium text-orange-800">{formatCurrency(item.cost)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-orange-600 py-4">
                  <p className="text-sm">
                    Individual uncategorized items are not available, but total uncategorized amount is calculated above.
                  </p>
                  <p className="text-xs text-orange-500 mt-1">
                    This may indicate uncategorized costs were calculated through validation rather than direct parsing
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (analysis.discipline === 'design' && analysis.aia_phases) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">AIA Phase Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(analysis.aia_phases).map(([phaseKey, phase]) => (
            <div key={phaseKey} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium capitalize">{phase.phase_name.replace(/_/g, ' ')}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {Array.isArray(phase.deliverables) ? phase.deliverables.length : 0} deliverables
                  </p>
                  {Array.isArray(phase.deliverables) && phase.deliverables.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {phase.deliverables.map((deliverable, index) => (
                        <div key={index} className="bg-white bg-opacity-60 rounded p-2 text-sm">
                          <p className="font-medium text-gray-900">{deliverable.description}</p>
                          {deliverable.quantity && deliverable.unit && (
                            <p className="text-xs text-gray-600">{deliverable.quantity} {deliverable.unit}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(phase.fee_amount)}</p>
                  <p className="text-sm text-gray-600">{phase.percentage_of_total}% of fee</p>
                </div>
              </div>
              {phase.scope_notes && (
                <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                  {phase.scope_notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Uncategorized Costs Section */}
        {analysis.uncategorizedCosts && analysis.uncategorizedCosts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Uncategorized Design Items</h3>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-orange-800">Items Not Mapped to AIA Phases</h4>
                  <p className="text-sm text-orange-700">Design services that couldn't be categorized into standard phases</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-800">{formatCurrency(analysis.uncategorizedTotal || 0)}</p>
                  <p className="text-sm text-orange-600">
                    {((analysis.uncategorizedTotal || 0) / analysis.total_amount * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
              {analysis.uncategorizedCosts && Array.isArray(analysis.uncategorizedCosts) && analysis.uncategorizedCosts.length > 0 ? (
                <div className="space-y-2">
                  {analysis.uncategorizedCosts.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-orange-100">
                      <span className="text-sm text-gray-900">{item.description}</span>
                      <span className="text-sm font-medium text-orange-800">{formatCurrency(item.cost)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-orange-600 py-4">
                  <p className="text-sm">
                    Individual uncategorized items are not available, but total uncategorized amount is calculated above.
                  </p>
                  <p className="text-xs text-orange-500 mt-1">
                    This may indicate uncategorized costs were calculated through validation rather than direct parsing
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (analysis.discipline === 'trade' && analysis.technical_systems) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Technical Systems Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(analysis.technical_systems)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([systemKey, system]) => (
            <div key={systemKey} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{system.system_name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{system.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(system.total_cost)}</p>
                </div>
              </div>
              
              {system.specifications.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Equipment & Specifications:</h5>
                  <div className="space-y-1">
                    {system.specifications.map((spec, idx) => (
                      <div key={idx} className="bg-white bg-opacity-60 rounded p-2 text-sm">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900 flex-1">{spec.description}</p>
                          <p className="font-semibold text-gray-900 ml-2">{formatCurrency(spec.total_cost)}</p>
                        </div>
                        {spec.quantity && (
                          <p className="text-xs text-gray-600">Qty: {spec.quantity}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {system.scope_notes && (
                <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                  {system.scope_notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Uncategorized Costs Section */}
        {analysis.uncategorizedCosts && analysis.uncategorizedCosts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Uncategorized Trade Items</h3>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-orange-800">Items Not Mapped to Technical Systems</h4>
                  <p className="text-sm text-orange-700">Trade services that couldn't be categorized into standard systems</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-800">{formatCurrency(analysis.uncategorizedTotal || 0)}</p>
                  <p className="text-sm text-orange-600">
                    {((analysis.uncategorizedTotal || 0) / analysis.total_amount * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
              {analysis.uncategorizedCosts && Array.isArray(analysis.uncategorizedCosts) && analysis.uncategorizedCosts.length > 0 ? (
                <div className="space-y-2">
                  {analysis.uncategorizedCosts.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-orange-100">
                      <span className="text-sm text-gray-900">{item.description}</span>
                      <span className="text-sm font-medium text-orange-800">{formatCurrency(item.cost)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-orange-600 py-4">
                  <p className="text-sm">
                    Individual uncategorized items are not available, but total uncategorized amount is calculated above.
                  </p>
                  <p className="text-xs text-orange-500 mt-1">
                    This may indicate uncategorized costs were calculated through validation rather than direct parsing
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center text-gray-500 py-8">
      <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No scope data available for this {analysis.discipline} proposal.</p>
    </div>
  );
}

// Soft Costs Tab Component
function SoftCostsTab({
  analysis,
  _disciplineConfig
}: {
  analysis: AnalysisResult;
  _disciplineConfig: { title: string; icon: React.ComponentType<{ className?: string }>; color: string; scopeLabel: string };
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  // Debug logging to understand soft costs data
  console.log('🔍 SoftCostsTab Debug:', {
    softCosts: analysis.softCosts,
    softCostsType: typeof analysis.softCosts,
    isArray: Array.isArray(analysis.softCosts),
    length: analysis.softCosts?.length,
    softCostsTotal: analysis.softCostsTotal,
    hasTotal: (analysis.softCostsTotal || 0) > 0
  });

  // Show soft costs section if we have either items or a total > 0
  const hasValidSoftCosts = (analysis.softCosts && Array.isArray(analysis.softCosts) && analysis.softCosts.length > 0) ||
                           (analysis.softCostsTotal && analysis.softCostsTotal > 0);

  if (!hasValidSoftCosts) {
    return (
      <div className="text-center text-gray-500 py-12">
        <Building className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <h3 className="text-lg font-medium mb-2">No Soft Costs Identified</h3>
        <p className="text-sm">
          This analysis did not identify any soft costs such as design fees, permits, bonds, or professional services.
        </p>
        <div className="mt-4 text-xs text-gray-400">
          <p>Soft costs typically represent 3-15% of total project cost</p>
        </div>
      </div>
    );
  }

  const softCostsTotal = analysis.softCostsTotal || 0;
  const softCostsPercentage = ((softCostsTotal / analysis.total_amount) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Soft Costs Overview */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Building className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Soft Costs Summary
              </h3>
              <p className="text-sm text-purple-800">
                Administrative, professional, and non-construction expenses
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(softCostsTotal)}
            </p>
            <p className="text-sm text-purple-700">
              {softCostsPercentage}% of total project cost
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-900">
              {(analysis.softCosts && Array.isArray(analysis.softCosts)) ? analysis.softCosts.length : 0}
            </p>
            <p className="text-sm text-purple-700">Soft Cost Items</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-900">
              {analysis.gross_sqft ? `$${(softCostsTotal / analysis.gross_sqft).toFixed(0)}` : '—'}
            </p>
            <p className="text-sm text-purple-700">Cost per SF</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-900">
              {(analysis.softCosts && Array.isArray(analysis.softCosts) && analysis.softCosts.length > 0)
                ? formatCurrency(softCostsTotal / analysis.softCosts.length)
                : formatCurrency(softCostsTotal)}
            </p>
            <p className="text-sm text-purple-700">
              {(analysis.softCosts && Array.isArray(analysis.softCosts) && analysis.softCosts.length > 0)
                ? 'Average Item Cost' : 'Total Cost'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Soft Costs Breakdown */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Itemized Soft Costs</h4>
        {analysis.softCosts && Array.isArray(analysis.softCosts) && analysis.softCosts.length > 0 ? (
          <div className="space-y-3">
            {analysis.softCosts.map((item, index) => (
              <div key={index} className="bg-white border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{item.description}</h5>
                    <p className="text-sm text-gray-600">
                      {((item.cost / analysis.total_amount) * 100).toFixed(1)}% of total project cost
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(item.cost)}</p>
                    {analysis.gross_sqft && (
                      <p className="text-sm text-gray-600">
                        ${(item.cost / analysis.gross_sqft).toFixed(2)}/SF
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
            <p className="text-sm">
              Individual soft cost items are not available, but total soft costs are calculated: {formatCurrency(softCostsTotal)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This may indicate soft costs were identified through validation rather than direct parsing
            </p>
          </div>
        )}
      </div>

      {/* Soft Costs Guidelines */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">Soft Costs Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium mb-2">Typical Soft Costs Include:</p>
            <ul className="space-y-1">
              <li>• Design and engineering fees</li>
              <li>• Permits and approvals</li>
              <li>• Legal and professional services</li>
              <li>• Insurance and bonds</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Industry Benchmarks:</p>
            <ul className="space-y-1">
              <li>• Residential: 8-15% of total cost</li>
              <li>• Commercial: 10-20% of total cost</li>
              <li>• Infrastructure: 15-25% of total cost</li>
              <li>• Your project: <strong>{softCostsPercentage}%</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Commercial Tab Component
function CommercialTab({ 
  analysis, 
  _disciplineConfig 
}: {
  analysis: AnalysisResult;
  _disciplineConfig: { title: string; icon: React.ComponentType<{ className?: string }>; color: string; scopeLabel: string };
}) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Cost Structure</h4>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span>Base Amount:</span>
              <span className="font-medium">{formatCurrency(analysis.base_bid_amount || analysis.total_amount)}</span>
            </div>
            {analysis.project_overhead && (
              <div className="flex justify-between py-2 border-b">
                <span>Overhead:</span>
                <span className="font-medium">{formatCurrency(analysis.project_overhead.total_overhead)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 font-bold text-lg border-t-2">
              <span>Total:</span>
              <span>{formatCurrency(analysis.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Allowances */}
        {analysis.allowances && analysis.allowances.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Allowances & Contingencies</h4>
            <div className="space-y-2">
              {analysis.allowances.map((allowance, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span className="text-sm">{allowance.description}:</span>
                  <span className="text-sm font-medium">{formatCurrency(allowance.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t font-medium">
                <span>Total Allowances:</span>
                <span>{formatCurrency(analysis.allowances_total || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assumptions & Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis.assumptions && analysis.assumptions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Assumptions</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
              {analysis.assumptions.map((assumption, idx) => (
                <li key={idx}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.exclusions && analysis.exclusions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Exclusions</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
              {analysis.exclusions.map((exclusion, idx) => (
                <li key={idx}>{exclusion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Risk Tab Component
function RiskTab({ 
  analysis, 
  riskAssessment, 
  _disciplineConfig 
}: {
  analysis: AnalysisResult;
  riskAssessment?: RiskAssessment;
  _disciplineConfig: { title: string; icon: React.ComponentType<{ className?: string }>; color: string; scopeLabel: string };
}) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {riskAssessment ? (
        <>
          <div className={`rounded-lg p-4 border ${getRiskColor(riskAssessment.level)}`}>
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Risk Assessment: {riskAssessment.level}</h3>
                <p className="text-sm opacity-75">Risk Score: {riskAssessment.score}/100</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Risk Factors</h4>
            <ul className="space-y-2">
              {riskAssessment.factors.map((factor, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span className="text-sm text-gray-700">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Risk analysis not available for this proposal.</p>
        </div>
      )}

      {/* Document Quality Assessment */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Document Quality</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium capitalize">
                {analysis.document_quality?.replace('_', ' ') || 'Unknown Quality'}
              </p>
              <p className="text-sm text-gray-600">
                {analysis.document_quality === 'professional_typed' ? 'Well-formatted, typed document with clear structure' :
                 analysis.document_quality === 'scanned' ? 'Scanned document, may have OCR artifacts' :
                 analysis.document_quality === 'handwritten' ? 'Handwritten or poor quality document' :
                 'Document quality could not be determined'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}