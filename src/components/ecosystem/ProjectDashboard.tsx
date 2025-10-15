'use client';

import React, { useState, useEffect } from 'react';
import {
  getAllRFPs,
  linkRFPToProject,
  getProjectChangeOrders
} from '@/lib/storage';
import { SavedProject, PHASE_STATUS_COLORS, MILESTONE_STATUS_COLORS } from '@/types/project';
import { SavedRFP } from '@/types/rfp';
import BudgetTracker from './BudgetTracker';
import TimelineManager from './TimelineManager';
import BidManager from './BidManager';
import {
  ArrowLeft, Calendar, DollarSign, TrendingUp,
  FileText, Award, Plus, Settings, BarChart3,
  Building2, Palette, Zap, Eye,
  Download, Link
} from 'lucide-react';

interface ProjectDashboardProps {
  project: SavedProject;
  onBack: () => void;
  onUpdate: () => void;
  onCreateRFP?: () => void;
  onAnalyzeProposal?: () => void;
}

type DashboardTab = 'overview' | 'budget' | 'timeline' | 'rfps' | 'bids' | 'reports';

export default function ProjectDashboard({
  project,
  onBack,
  onUpdate,
  onCreateRFP,
  onAnalyzeProposal
}: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [relatedRFPs, setRelatedRFPs] = useState<SavedRFP[]>([]);
  const [availableRFPs, setAvailableRFPs] = useState<SavedRFP[]>([]);
  const [changeOrders, setChangeOrders] = useState<{ id: string; title: string; requestedDate: string; status: string }[]>([]);
  const [showLinkRFP, setShowLinkRFP] = useState(false);

  useEffect(() => {
    const loadRelatedData = () => {
      // Load RFPs linked to this project
      const allRFPs = getAllRFPs();
      const linkedRFPs = allRFPs.filter(rfp => project.project.rfpIds.includes(rfp.id));
      const unlinkedRFPs = allRFPs.filter(rfp =>
        !project.project.rfpIds.includes(rfp.id) &&
        project.project.disciplines.includes(rfp.project.discipline)
      );

      setRelatedRFPs(linkedRFPs);
      setAvailableRFPs(unlinkedRFPs);

      // Load analyses for awarded bids would go here if needed
      // const allAnalyses = getAllAnalyses();
      // const awardedAnalysisIds = project.project.awardedBids.map(bid => bid.analysisId);
      // const linkedAnalyses = allAnalyses.filter(analysis => awardedAnalysisIds.includes(analysis.id));

      // Load change orders
      const projectChangeOrders = getProjectChangeOrders(project.project.id);
      setChangeOrders(projectChangeOrders);
    };

    loadRelatedData();
  }, [project]);

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'construction': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'design': return <Palette className="h-4 w-4 text-purple-600" />;
      case 'trade': return <Zap className="h-4 w-4 text-green-600" />;
      default: return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'LOW';
    if (score < 70) return 'MEDIUM';
    return 'HIGH';
  };

  const handleLinkRFP = (rfpId: string) => {
    linkRFPToProject(project.project.id, rfpId);
    onUpdate();
    setShowLinkRFP(false);
  };

  // Award bid functionality would be implemented here
  // const handleAwardBid = (analysisId: string, rfpId: string) => {
  //   const analysis = getAllAnalyses().find(a => a.id === analysisId);
  //   if (!analysis) return;
  //
  //   const bidData = {
  //     rfpId,
  //     analysisId,
  //     contractorName: analysis.result.contractor_name,
  //     originalBudget: 0,
  //     awardedAmount: analysis.result.total_amount,
  //     awardDate: new Date().toISOString(),
  //     discipline: analysis.result.discipline,
  //     status: 'awarded' as const,
  //     contractType: 'lump_sum' as const,
  //     notes: 'Awarded from analysis'
  //   };
  //
  //   awardBidToProject(project.project.id, bidData);
  //   onUpdate();
  // };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'budget', name: 'Budget', icon: DollarSign },
    { id: 'timeline', name: 'Timeline', icon: Calendar },
    { id: 'rfps', name: 'RFPs', icon: FileText },
    { id: 'bids', name: 'Bids & Awards', icon: Award },
    { id: 'reports', name: 'Reports', icon: TrendingUp }
  ];

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              {project.project.disciplines.map(discipline => (
                <span key={discipline}>{getDisciplineIcon(discipline)}</span>
              ))}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.project.name}</h2>
              <p className="text-gray-600">{project.project.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full capitalize ${
              project.project.status === 'planning' ? 'bg-gray-100 text-gray-800' :
              project.project.status === 'bidding' ? 'bg-yellow-100 text-yellow-800' :
              project.project.status === 'pre-construction' ? 'bg-blue-100 text-blue-800' :
              project.project.status === 'active' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {project.project.status.replace('-', ' ')}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(project.metrics.riskScore)}`}>
              {getRiskLevel(project.metrics.riskScore)} RISK
            </span>
          </div>
        </div>

        {project.project.location && project.project.location.city && (
          <p className="text-sm text-gray-600">
            📍 {project.project.location.address}, {project.project.location.city}, {project.project.location.state}
          </p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.metrics.totalBudget)}</p>
              <p className="text-sm text-gray-600">{formatCurrency(project.metrics.committedBudget)} committed</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">{project.metrics.completionPercentage.toFixed(0)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.metrics.completionPercentage}%` }}
                ></div>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">RFPs</p>
              <p className="text-2xl font-bold text-gray-900">{project.metrics.totalRfps}</p>
              <p className="text-sm text-gray-600">{project.metrics.awardedBids} awarded</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Schedule</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.metrics.scheduleVariance === 0 ? 'On Track' :
                 project.metrics.scheduleVariance > 0 ? `${project.metrics.scheduleVariance}d Late` :
                 `${Math.abs(project.metrics.scheduleVariance)}d Early`}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(project.project.baselineSchedule.endDate).toLocaleDateString()}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Current Phase & Next Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Phase</h3>
          {project.project.currentSchedule.phases.length > 0 ? (
            <div className="space-y-3">
              {project.project.currentSchedule.phases
                .filter(phase => phase.status === 'in-progress')
                .slice(0, 1)
                .map(phase => (
                <div key={phase.id} className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{phase.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${PHASE_STATUS_COLORS[phase.status]}`}>
                      {phase.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span>Budget: {formatCurrency(phase.budgetAllocated)}</span>
                    <span>{new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {project.project.currentSchedule.phases.every(phase => phase.status !== 'in-progress') && (
                <p className="text-gray-600">No active phase</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No phases defined</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
          {project.project.currentSchedule.milestones.length > 0 ? (
            <div className="space-y-3">
              {project.project.currentSchedule.milestones
                .filter(milestone => milestone.status === 'upcoming')
                .slice(0, 3)
                .map(milestone => (
                <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                    <p className="text-sm text-gray-600">{new Date(milestone.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${MILESTONE_STATUS_COLORS[milestone.status]}`}>
                    {milestone.status}
                  </span>
                </div>
              ))}
              {project.project.currentSchedule.milestones.every(milestone => milestone.status !== 'upcoming') && (
                <p className="text-gray-600">No upcoming milestones</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No milestones defined</p>
          )}
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {changeOrders.slice(0, 3).map(co => (
              <div key={co.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{co.title}</p>
                  <p className="text-sm text-gray-600">{new Date(co.requestedDate).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  co.status === 'approved' ? 'bg-green-100 text-green-800' :
                  co.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {co.status}
                </span>
              </div>
            ))}
            {changeOrders.length === 0 && (
              <p className="text-gray-600">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {onCreateRFP && (
              <button
                onClick={onCreateRFP}
                className="flex items-center justify-center p-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create RFP
              </button>
            )}
            {onAnalyzeProposal && (
              <button
                onClick={onAnalyzeProposal}
                className="flex items-center justify-center p-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Analyze Bid
              </button>
            )}
            <button
              onClick={() => setShowLinkRFP(true)}
              className="flex items-center justify-center p-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Link className="h-4 w-4 mr-2" />
              Link RFP
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className="flex items-center justify-center p-3 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Linked RFPs */}
      {relatedRFPs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Linked RFPs</h3>
            <button
              onClick={() => setActiveTab('rfps')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All RFPs →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedRFPs.slice(0, 3).map(rfp => (
              <div key={rfp.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{rfp.project.projectName}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    rfp.project.discipline === 'construction' ? 'bg-blue-100 text-blue-800' :
                    rfp.project.discipline === 'design' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rfp.project.discipline}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{rfp.project.projectType}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Budget: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(rfp.project.estimatedValue)}</span>
                  <span>{new Date(rfp.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          {relatedRFPs.length > 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setActiveTab('rfps')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View {relatedRFPs.length - 3} more RFPs →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderRFPsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Project RFPs</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowLinkRFP(true)}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Link className="h-4 w-4 mr-2" />
            Link Existing RFP
          </button>
          {onCreateRFP && (
            <button
              onClick={onCreateRFP}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New RFP
            </button>
          )}
        </div>
      </div>

      {relatedRFPs.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RFP Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimated Value
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
              {relatedRFPs.map(rfp => (
                <tr key={rfp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rfp.project.projectName}</div>
                      <div className="text-sm text-gray-500">{rfp.project.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      rfp.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      rfp.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rfp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(rfp.project.estimatedValue)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {rfp.receivedBids?.length || 0} received
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
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
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No RFPs Linked</h3>
          <p className="text-gray-600 mb-6">
            Link existing RFPs or create new ones to manage your project bidding process.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setShowLinkRFP(true)}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Link className="h-4 w-4 mr-2" />
              Link Existing RFP
            </button>
            {onCreateRFP && (
              <button
                onClick={onCreateRFP}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New RFP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Link RFP Modal */}
      {showLinkRFP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Link Existing RFP</h3>
            </div>
            <div className="p-6">
              {availableRFPs.length > 0 ? (
                <div className="space-y-3">
                  {availableRFPs.map(rfp => (
                    <div key={rfp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <h4 className="font-medium text-gray-900">{rfp.project.projectName}</h4>
                        <p className="text-sm text-gray-600">{rfp.project.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm text-gray-500">
                            {formatCurrency(rfp.project.estimatedValue)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rfp.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            rfp.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rfp.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLinkRFP(rfp.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Link
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No compatible RFPs available to link.
                </p>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLinkRFP(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Projects
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
              {project.project.disciplines.map(discipline => (
                <span key={discipline}>{getDisciplineIcon(discipline)}</span>
              ))}
            </div>
              <h1 className="text-2xl font-bold text-gray-900">{project.project.name}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${
              project.project.status === 'planning' ? 'bg-gray-100 text-gray-800' :
              project.project.status === 'bidding' ? 'bg-yellow-100 text-yellow-800' :
              project.project.status === 'pre-construction' ? 'bg-blue-100 text-blue-800' :
              project.project.status === 'active' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {project.project.status.replace('-', ' ')}
            </span>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
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
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'budget' && (
          <BudgetTracker
            project={project}
            onUpdate={onUpdate}
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineManager
            project={project}
            onUpdate={onUpdate}
          />
        )}
        {activeTab === 'rfps' && renderRFPsTab()}
        {activeTab === 'bids' && (
          <BidManager
            project={project}
            onUpdate={onUpdate}
          />
        )}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Reports</h3>
            <p className="text-gray-600">Project reporting interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}