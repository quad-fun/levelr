'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAllRFPs, 
  getAllAnalyses, 
  linkBidToRFP,
  getMarketIntelligence
} from '@/lib/storage';
import { SavedRFP } from '@/types/rfp';
import { SavedAnalysis } from '@/lib/storage';
import { 
  Building2, FileText, Users, TrendingUp, 
  DollarSign, CheckCircle,
  Palette, Zap, BarChart3, Search,
  Eye, Download, Link, Plus
} from 'lucide-react';

interface ProjectEcosystemProps {
  onCreateRFP?: () => void;
  onAnalyzeProposal?: () => void;
}

export default function ProjectEcosystem({ onCreateRFP, onAnalyzeProposal }: ProjectEcosystemProps) {
  const [rfps, setRfps] = useState<SavedRFP[]>([]);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [marketIntel, setMarketIntel] = useState<{ averageProjectValue: number; disciplineBreakdown: Record<string, number> } | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'rfps' | 'analyses' | 'matching'>('overview');
  const [filterDiscipline, setFilterDiscipline] = useState<'all' | 'construction' | 'design' | 'trade'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedRfps = getAllRFPs();
    const savedAnalyses = getAllAnalyses();
    const intelligence = getMarketIntelligence();
    
    setRfps(savedRfps);
    setAnalyses(savedAnalyses);
    setMarketIntel(intelligence);
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'construction': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'design': return <Palette className="h-4 w-4 text-purple-600" />;
      case 'trade': return <Zap className="h-4 w-4 text-green-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case 'construction': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'design': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'trade': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLinkAnalysisToRFP = (rfpId: string, analysisId: string) => {
    try {
      linkBidToRFP(rfpId, analysisId);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to link analysis to RFP:', error);
    }
  };

  const filteredRfps = rfps.filter(rfp => {
    const disciplineMatch = filterDiscipline === 'all' || rfp.project.discipline === filterDiscipline;
    const searchMatch = searchTerm === '' || 
      rfp.project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return disciplineMatch && searchMatch;
  });

  const filteredAnalyses = analyses.filter(analysis => {
    const disciplineMatch = filterDiscipline === 'all' || analysis.result.discipline === filterDiscipline;
    const searchMatch = searchTerm === '' || 
      analysis.result.contractor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analysis.result.project_name && analysis.result.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return disciplineMatch && searchMatch;
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'rfps', name: 'RFPs', icon: FileText },
    { id: 'analyses', name: 'Analyses', icon: TrendingUp },
    { id: 'matching', name: 'RFP Matching', icon: Link }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Ecosystem</h1>
        <p className="text-gray-600">
          Manage your complete project lifecycle across all disciplines - from RFP creation to proposal analysis.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value as 'all' | 'construction' | 'design' | 'trade')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Disciplines</option>
            <option value="construction">Construction</option>
            <option value="design">Design Services</option>
            <option value="trade">Trade Services</option>
          </select>
        </div>

        <div className="flex gap-2">
          {onCreateRFP && (
            <button
              onClick={onCreateRFP}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create RFP
            </button>
          )}
          {onAnalyzeProposal && (
            <button
              onClick={onAnalyzeProposal}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Analyze Proposal
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as typeof activeView)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
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

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total RFPs</p>
                  <p className="text-2xl font-bold text-gray-900">{rfps.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Analyses</p>
                  <p className="text-2xl font-bold text-gray-900">{analyses.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Project Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {marketIntel?.averageProjectValue ? formatCurrency(marketIntel.averageProjectValue) : '$0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rfps.filter(rfp => rfp.status === 'issued').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Discipline Breakdown */}
          {marketIntel?.disciplineBreakdown && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Discipline Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(marketIntel.disciplineBreakdown).map(([discipline, count]) => (
                  <div key={discipline} className="flex items-center space-x-3">
                    {getDisciplineIcon(discipline)}
                    <div>
                      <p className="font-medium capitalize">{discipline}</p>
                      <p className="text-sm text-gray-600">{String(count)} projects</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent RFPs</h3>
              <div className="space-y-3">
                {rfps.slice(0, 5).map((rfp) => (
                  <div key={rfp.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDisciplineIcon(rfp.project.discipline)}
                      <div>
                        <p className="font-medium text-gray-900">{rfp.project.projectName}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(rfp.project.estimatedValue)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rfp.status)}`}>
                      {rfp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h3>
              <div className="space-y-3">
                {analyses.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDisciplineIcon(analysis.result.discipline)}
                      <div>
                        <p className="font-medium text-gray-900">{analysis.result.contractor_name}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(analysis.result.total_amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {analysis.riskAssessment && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          analysis.riskAssessment.level === 'HIGH' ? 'bg-red-100 text-red-800' :
                          analysis.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {analysis.riskAssessment.level}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RFPs Tab */}
      {activeView === 'rfps' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Request for Proposals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discipline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proposals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRfps.map((rfp) => (
                    <tr key={rfp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rfp.project.projectName}
                          </div>
                          <div className="text-sm text-gray-500">{rfp.project.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDisciplineColor(rfp.project.discipline)}`}>
                          {getDisciplineIcon(rfp.project.discipline)}
                          <span className="ml-1 capitalize">{rfp.project.discipline}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(rfp.project.estimatedValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rfp.status)}`}>
                          {rfp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rfp.receivedBids?.length || 0} received
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analyses Tab */}
      {activeView === 'analyses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Proposal Analyses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contractor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discipline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coverage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnalyses.map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {analysis.result.contractor_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {analysis.result.project_name || 'No project name'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDisciplineColor(analysis.result.discipline)}`}>
                          {getDisciplineIcon(analysis.result.discipline)}
                          <span className="ml-1 capitalize">{analysis.result.discipline}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(analysis.result.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {analysis.riskAssessment ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            analysis.riskAssessment.level === 'HIGH' ? 'bg-red-100 text-red-800' :
                            analysis.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {analysis.riskAssessment.level}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(analysis.result.categorizationPercentage || 0).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RFP Matching Tab */}
      {activeView === 'matching' && (
        <RFPMatchingInterface 
          rfps={filteredRfps} 
          analyses={filteredAnalyses} 
          onLinkAnalysisToRFP={handleLinkAnalysisToRFP}
        />
      )}
    </div>
  );
}

// RFP Matching Component
function RFPMatchingInterface({ 
  rfps, 
  analyses, 
  onLinkAnalysisToRFP 
}: { 
  rfps: SavedRFP[];
  analyses: SavedAnalysis[];
  onLinkAnalysisToRFP: (rfpId: string, analysisId: string) => void;
}) {
  const [selectedRFP, setSelectedRFP] = useState<string>('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('');

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'construction': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'design': return <Palette className="h-4 w-4 text-purple-600" />;
      case 'trade': return <Zap className="h-4 w-4 text-green-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleLinkProposals = () => {
    if (selectedRFP && selectedAnalysis) {
      onLinkAnalysisToRFP(selectedRFP, selectedAnalysis);
      setSelectedRFP('');
      setSelectedAnalysis('');
    }
  };

  const getSuggestedMatches = (rfp: SavedRFP) => {
    return analyses.filter(analysis => 
      analysis.result.discipline === rfp.project.discipline &&
      Math.abs(analysis.result.total_amount - rfp.project.estimatedValue) < rfp.project.estimatedValue * 0.5
    );
  };

  return (
    <div className="space-y-8">
      {/* Manual Linking Interface */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Link Analysis to RFP</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select RFP</label>
            <select 
              value={selectedRFP}
              onChange={(e) => setSelectedRFP(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an RFP...</option>
              {rfps.map(rfp => (
                <option key={rfp.id} value={rfp.id}>
                  {rfp.project.projectName} ({rfp.project.discipline}) - {formatCurrency(rfp.project.estimatedValue)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Analysis</label>
            <select 
              value={selectedAnalysis}
              onChange={(e) => setSelectedAnalysis(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an analysis...</option>
              {analyses.map(analysis => (
                <option key={analysis.id} value={analysis.id}>
                  {analysis.result.contractor_name} ({analysis.result.discipline}) - {formatCurrency(analysis.result.total_amount)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleLinkProposals}
          disabled={!selectedRFP || !selectedAnalysis}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
        >
          <Link className="h-4 w-4 mr-2" />
          Link Analysis to RFP
        </button>
      </div>

      {/* Suggested Matches */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Suggested Matches</h3>
        
        <div className="space-y-6">
          {rfps.slice(0, 5).map(rfp => {
            const suggestedMatches = getSuggestedMatches(rfp);
            
            if (suggestedMatches.length === 0) return null;

            return (
              <div key={rfp.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getDisciplineIcon(rfp.project.discipline)}
                    <div>
                      <h4 className="font-medium text-gray-900">{rfp.project.projectName}</h4>
                      <p className="text-sm text-gray-600">
                        {rfp.project.discipline} • {formatCurrency(rfp.project.estimatedValue)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {suggestedMatches.length} potential matches
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestedMatches.map(analysis => (
                    <div key={analysis.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm text-gray-900">
                          {analysis.result.contractor_name}
                        </p>
                        {analysis.riskAssessment && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            analysis.riskAssessment.level === 'HIGH' ? 'bg-red-100 text-red-700' :
                            analysis.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {analysis.riskAssessment.level}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {formatCurrency(analysis.result.total_amount)}
                      </p>
                      <button
                        onClick={() => onLinkAnalysisToRFP(rfp.id, analysis.id)}
                        className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors"
                      >
                        Link to RFP
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Existing Links */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Existing Links</h3>
        
        <div className="space-y-4">
          {rfps
            .filter(rfp => rfp.receivedBids && rfp.receivedBids.length > 0)
            .map(rfp => (
              <div key={rfp.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getDisciplineIcon(rfp.project.discipline)}
                  <div>
                    <p className="font-medium text-gray-900">{rfp.project.projectName}</p>
                    <p className="text-sm text-gray-600">
                      {rfp.receivedBids?.length || 0} linked analyses
                    </p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}