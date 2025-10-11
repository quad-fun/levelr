'use client';

import React, { useState } from 'react';
import { SavedProject, ProjectAnalytics, MilestoneStatus } from '@/types/project';
import {
  BarChart3, Calendar, DollarSign, FileText, Users, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Target, Award,
  ArrowUp, ArrowDown, Minus, MapPin, Building2
} from 'lucide-react';

interface ProjectDashboardProps {
  project: SavedProject;
  analytics: ProjectAnalytics | null;
  onMilestoneUpdate: (milestoneId: string, updates: unknown) => void;
  onBidAward: (rfpId: string, bidId: string) => void;
}

export default function ProjectDashboard({
  project,
  analytics: _analytics,
  onMilestoneUpdate: _onMilestoneUpdate,
  onBidAward: _onBidAward
}: ProjectDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  // Calculate key metrics
  const calculateOverallProgress = () => {
    const completedMilestones = project.timeline.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = project.timeline.milestones.length;
    return totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  };

  const getBudgetUtilization = () => {
    return project.budget.totalBudget > 0 ? (project.budget.spentBudget / project.budget.totalBudget) * 100 : 0;
  };

  const getUpcomingMilestones = () => {
    return project.timeline.milestones.filter(m =>
      m.status === 'pending' &&
      new Date(m.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
  };

  const getActiveRFPs = () => {
    return project.rfps.filter(rfp => rfp.status === 'issued' || rfp.status === 'responses_received');
  };

  const getRecentBids = () => {
    const allBids = project.rfps.flatMap(rfp =>
      rfp.bids.map(bid => ({ ...bid, rfpName: rfp.name, rfpId: rfp.id }))
    );
    return allBids
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
      .slice(0, 5);
  };

  const getRiskAlerts = () => {
    const alerts = [];

    // Budget risk
    const budgetUtilization = getBudgetUtilization();
    if (budgetUtilization > 80) {
      alerts.push({
        type: 'budget',
        level: budgetUtilization > 95 ? 'critical' : 'warning',
        message: `Budget utilization at ${budgetUtilization.toFixed(1)}%`
      });
    }

    // Schedule risk
    const overdueMilestones = project.timeline.milestones.filter(m =>
      m.status !== 'completed' && new Date(m.dueDate) < new Date()
    );
    if (overdueMilestones.length > 0) {
      alerts.push({
        type: 'schedule',
        level: overdueMilestones.length > 2 ? 'critical' : 'warning',
        message: `${overdueMilestones.length} overdue milestone${overdueMilestones.length > 1 ? 's' : ''}`
      });
    }

    // RFP risk
    const overdueRFPs = project.rfps.filter(rfp =>
      rfp.status === 'issued' && new Date(rfp.responseDeadline) < new Date()
    );
    if (overdueRFPs.length > 0) {
      alerts.push({
        type: 'rfp',
        level: 'warning',
        message: `${overdueRFPs.length} RFP${overdueRFPs.length > 1 ? 's' : ''} past deadline`
      });
    }

    return alerts;
  };

  const overallProgress = calculateOverallProgress();
  const budgetUtilization = getBudgetUtilization();
  const upcomingMilestones = getUpcomingMilestones();
  const activeRFPs = getActiveRFPs();
  const recentBids = getRecentBids();
  const riskAlerts = getRiskAlerts();

  const getMilestoneStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time overview of {project.name} performance and status
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as 'week' | 'month' | 'quarter')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-900">Risk Alerts</h3>
          </div>
          <div className="space-y-2">
            {riskAlerts.map((alert, index: _index) => (
              <div key={index} className={`flex items-center space-x-2 ${
                alert.level === 'critical' ? 'text-red-800' : 'text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  alert.level === 'critical' ? 'bg-red-600' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Progress */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Progress</h3>
            </div>
            {getChangeIndicator(overallProgress, 0)}
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{overallProgress.toFixed(1)}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {project.timeline.milestones.filter(m => m.status === 'completed').length} of {project.timeline.milestones.length} milestones
          </p>
        </div>

        {/* Budget Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Budget</h3>
            </div>
            {getChangeIndicator(project.budget.spentBudget, 0)}
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.budget.totalBudget - project.budget.spentBudget)}</p>
            <p className="text-sm text-gray-600">Remaining</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                budgetUtilization > 90 ? 'bg-red-600' : budgetUtilization > 75 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${budgetUtilization}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {budgetUtilization.toFixed(1)}% utilized
          </p>
        </div>

        {/* Active RFPs */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Active RFPs</h3>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{activeRFPs.length}</p>
          </div>
          <p className="text-sm text-gray-600">
            {project.rfps.filter(rfp => rfp.status === 'awarded').length} awarded • {project.rfps.length} total
          </p>
        </div>

        {/* Team Size */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Team</h3>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">
              {project.team.members.length + (project.team.projectManager ? 2 : 1)}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Active members
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Milestones & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Milestones */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Milestones</h3>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              {upcomingMilestones.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming milestones in the next 30 days</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMilestones.slice(0, 5).map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getMilestoneStatusIcon(milestone.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                          <p className="text-sm text-gray-600">Due: {formatDate(milestone.dueDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{milestone.progress}%</p>
                          <div className="w-16 bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full"
                              style={{ width: `${milestone.progress}%` }}
                            />
                          </div>
                        </div>
                        {milestone.critical && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Bids */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bids</h3>
                <Award className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              {recentBids.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No bids received yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBids.map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{bid.bidderName}</h4>
                        <p className="text-sm text-gray-600">{bid.rfpName}</p>
                        <p className="text-xs text-gray-500">Submitted: {formatDate(bid.submissionDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(bid.bidAmount)}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            bid.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                            bid.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {bid.riskLevel} risk
                          </span>
                          {bid.awarded && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Stats & Actions */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{project.discipline} • {project.projectType.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{project.location.city}, {project.location.state}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">
                    {Math.ceil((new Date(project.timeline.endDate).getTime() - new Date(project.timeline.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Project Manager</p>
                  <p className="font-medium">
                    {project.team.projectManager?.name || project.team.owner.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Create New RFP</span>
                </div>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Add Milestone</span>
                </div>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Generate Report</span>
                </div>
              </button>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Breakdown</h3>
            <div className="space-y-3">
              {project.budget.breakdown.map((category, index: _index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{category.category.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">{category.percentOfTotal.toFixed(1)}% of total</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(category.allocated)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(category.remaining)} remaining</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}