'use client';

import React, { useState } from 'react';
import { SavedProject } from '@/types/project';
import {
  BarChart3, Download,
  Calendar, DollarSign, AlertTriangle
} from 'lucide-react';

interface ProjectReportsProps {
  project: SavedProject;
  onUpdate?: () => void;
}

export default function ProjectReports({ project }: ProjectReportsProps) {
  const [selectedReport, setSelectedReport] = useState<'overview' | 'budget' | 'schedule' | 'risk'>('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate project metrics
  const totalPhases = project.project.currentSchedule.phases.length;
  const completedPhases = project.project.currentSchedule.phases.filter(p => p.status === 'completed').length;
  const totalMilestones = project.project.currentSchedule.milestones.length;
  const completedMilestones = project.project.currentSchedule.milestones.filter(m => m.status === 'completed').length;

  const totalBudget = project.project.totalBudget;
  const budgetAllocations = project.project.budgetAllocations || [];
  const totalAllocated = budgetAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
  const totalActual = budgetAllocations.reduce((sum, alloc) => sum + alloc.actualAmount, 0);
  const totalVariance = totalActual - totalAllocated;

  // const bids = project.project.bids || [];
  // const awardedBids = bids.filter(bid => bid.status === 'awarded');
  // const pendingBids = bids.filter(bid => bid.status === 'submitted' || bid.status === 'under-review');

  const overallProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const scheduleHealth = project.metrics.scheduleVariance <= 0 ? 'On Time' :
                         project.metrics.scheduleVariance <= 14 ? 'Minor Delay' : 'Major Delay';
  const budgetHealth = Math.abs(project.metrics.budgetVariance) <= 5 ? 'On Budget' :
                      project.metrics.budgetVariance > 5 ? 'Over Budget' : 'Under Budget';

  const riskLevel = project.metrics.riskScore < 30 ? 'LOW' :
                    project.metrics.riskScore < 70 ? 'MEDIUM' : 'HIGH';

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Overall Progress</p>
                <p className="text-2xl font-bold text-blue-900">{formatPercentage(overallProgress)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Budget Status</p>
                <p className="text-2xl font-bold text-green-900">{budgetHealth}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Schedule Status</p>
                <p className="text-2xl font-bold text-yellow-900">{scheduleHealth}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className={`rounded-lg p-4 ${
            riskLevel === 'LOW' ? 'bg-green-50' :
            riskLevel === 'MEDIUM' ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  riskLevel === 'LOW' ? 'text-green-600' :
                  riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                }`}>Risk Level</p>
                <p className={`text-2xl font-bold ${
                  riskLevel === 'LOW' ? 'text-green-900' :
                  riskLevel === 'MEDIUM' ? 'text-yellow-900' : 'text-red-900'
                }`}>{riskLevel}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${
                riskLevel === 'LOW' ? 'text-green-600' :
                riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Schedule Progress</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Phases Completed</span>
                <span>{completedPhases} of {totalPhases}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Milestones Completed</span>
                <span>{completedMilestones} of {totalMilestones}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Budget Overview</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Budget:</span>
              <span className="font-medium">{formatCurrency(totalBudget)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Allocated:</span>
              <span className="font-medium">{formatCurrency(totalAllocated)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Actual Spend:</span>
              <span className="font-medium">{formatCurrency(totalActual)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm font-medium text-gray-900">Variance:</span>
              <span className={`font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Timeline */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Start Date:</span>
            <p className="font-medium">{formatDate(project.project.baselineSchedule.startDate)}</p>
          </div>
          <div>
            <span className="text-gray-600">Planned End:</span>
            <p className="font-medium">{formatDate(project.project.baselineSchedule.endDate)}</p>
          </div>
          <div>
            <span className="text-gray-600">Current End:</span>
            <p className={`font-medium ${project.metrics.scheduleVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatDate(project.project.currentSchedule.endDate)}
              {project.metrics.scheduleVariance > 0 && (
                <span className="text-xs ml-1">({project.metrics.scheduleVariance} days late)</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBudgetReport = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Budget Breakdown</h4>
          {budgetAllocations.map((allocation) => (
            <div key={allocation.id} className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{allocation.name}</span>
              <span className="font-medium">{formatCurrency(allocation.allocatedAmount)}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Spending Progress</h4>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {formatPercentage(totalAllocated > 0 ? (totalActual / totalAllocated) * 100 : 0)}
            </div>
            <p className="text-gray-600">of allocated budget spent</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScheduleReport = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Analysis</h3>
      <div className="space-y-4">
        {project.project.currentSchedule.phases.map((phase) => (
          <div key={phase.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900">{phase.name}</h5>
              <span className={`px-2 py-1 text-xs rounded-full ${
                phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                phase.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                phase.status === 'delayed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {phase.status.replace('-', ' ')}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRiskReport = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-2 ${
            riskLevel === 'LOW' ? 'text-green-600' :
            riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {project.metrics.riskScore}
          </div>
          <p className="text-gray-600">Risk Score</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {formatPercentage(Math.abs(project.metrics.budgetVariance))}
          </div>
          <p className="text-gray-600">Budget Risk</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {Math.abs(project.metrics.scheduleVariance)}
          </div>
          <p className="text-gray-600">Schedule Risk (days)</p>
        </div>
      </div>
    </div>
  );

  const reports = [
    { id: 'overview', name: 'Project Overview', icon: BarChart3 },
    { id: 'budget', name: 'Budget Report', icon: DollarSign },
    { id: 'schedule', name: 'Schedule Report', icon: Calendar },
    { id: 'risk', name: 'Risk Assessment', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Report Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Project Reports</h2>
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>

        <div className="flex space-x-1">
          {reports.map((report) => {
            const IconComponent = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id as 'overview' | 'budget' | 'schedule' | 'risk')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedReport === report.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {report.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && renderOverviewReport()}
      {selectedReport === 'budget' && renderBudgetReport()}
      {selectedReport === 'schedule' && renderScheduleReport()}
      {selectedReport === 'risk' && renderRiskReport()}
    </div>
  );
}