'use client';

import React, { useState } from 'react';
import { AnalysisResult, MarketVariance, RiskAssessment } from '@/types/analysis';
import { 
  FileText, DollarSign, AlertTriangle, CheckCircle, 
  Building, Palette, Zap, TrendingUp, TrendingDown, 
  Calendar, User, Layers, Target,
  BarChart3, Shield
} from 'lucide-react';

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
    { id: 'soft-costs', name: 'Soft Costs', icon: Building },
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

  if (analysis.discipline === 'construction') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">CSI Division Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(analysis.csi_divisions)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([divisionCode, division]) => (
            <div key={divisionCode} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">Division {divisionCode}</h4>
                  <p className="text-sm text-gray-600">{division.items.join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(division.cost)}</p>
                  {division.estimatedPercentage && (
                    <p className="text-sm text-gray-600">{division.estimatedPercentage.toFixed(1)}%</p>
                  )}
                </div>
              </div>
              {division.scope_notes && (
                <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                  {division.scope_notes}
                </p>
              )}
            </div>
          ))}
        </div>
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
                  <p className="text-sm text-gray-600">
                    {phase.deliverables.map(d => d.description).join(', ')}
                  </p>
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
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Equipment:</h5>
                  <div className="space-y-1">
                    {system.specifications.slice(0, 3).map((spec, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{spec.description}</span>
                        <span>{formatCurrency(spec.total_cost)}</span>
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

  if (!analysis.softCosts || analysis.softCosts.length === 0) {
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
            <p className="text-2xl font-bold text-purple-900">{analysis.softCosts.length}</p>
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
              {formatCurrency(softCostsTotal / analysis.softCosts.length)}
            </p>
            <p className="text-sm text-purple-700">Average Item Cost</p>
          </div>
        </div>
      </div>

      {/* Detailed Soft Costs Breakdown */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Itemized Soft Costs</h4>
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