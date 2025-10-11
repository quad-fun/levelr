'use client';

import React, { useState } from 'react';
import { SavedProject } from '@/types/project';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  PieChart, BarChart, Target, Plus, Edit
} from 'lucide-react';

interface ProjectBudgetTrackerProps {
  project: SavedProject;
  onBudgetUpdate: () => void;
}

export default function ProjectBudgetTracker({ project, onBudgetUpdate: _onBudgetUpdate }: ProjectBudgetTrackerProps) {
  const [activeView, setActiveView] = useState<'overview' | 'breakdown' | 'cashflow' | 'forecasting'>('overview');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getBudgetHealth = () => {
    const utilization = project.budget.totalBudget > 0 ? (project.budget.spentBudget / project.budget.totalBudget) * 100 : 0;
    if (utilization > 95) return { status: 'critical', color: 'red', message: 'Budget exceeded' };
    if (utilization > 85) return { status: 'warning', color: 'yellow', message: 'Budget at risk' };
    if (utilization > 70) return { status: 'caution', color: 'orange', message: 'Monitor closely' };
    return { status: 'healthy', color: 'green', message: 'On track' };
  };

  const budgetHealth = getBudgetHealth();

  const calculateVariance = () => {
    const planned = project.budget.allocatedBudget;
    const actual = project.budget.spentBudget;
    const variance = planned - actual;
    const percentageVariance = planned > 0 ? (variance / planned) * 100 : 0;
    return { variance, percentageVariance };
  };

  const { variance, percentageVariance } = calculateVariance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Tracking</h2>
          <p className="text-gray-600 mt-1">
            Monitor project finances, track spending, and forecast completion costs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Edit className="h-4 w-4 mr-2" />
            Adjust Budget
          </button>
        </div>
      </div>

      {/* Budget Health Alert */}
      {budgetHealth.status !== 'healthy' && (
        <div className={`bg-${budgetHealth.color}-50 border border-${budgetHealth.color}-200 rounded-lg p-4`}>
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`h-5 w-5 text-${budgetHealth.color}-600`} />
            <div>
              <h3 className={`font-semibold text-${budgetHealth.color}-900`}>Budget Alert</h3>
              <p className={`text-${budgetHealth.color}-700`}>{budgetHealth.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: DollarSign },
            { id: 'breakdown', name: 'Category Breakdown', icon: PieChart },
            { id: 'cashflow', name: 'Cash Flow', icon: BarChart },
            { id: 'forecasting', name: 'Forecasting', icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as 'overview' | 'breakdown' | 'cashflow' | 'forecasting')}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
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
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.budget.totalBudget)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Spent</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.budget.spentBudget)}</p>
                  <p className="text-sm text-gray-500">
                    {project.budget.totalBudget > 0 ? ((project.budget.spentBudget / project.budget.totalBudget) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.budget.totalBudget - project.budget.spentBudget)}</p>
                  <p className="text-sm text-gray-500">Available to spend</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Variance</p>
                  <p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {percentageVariance >= 0 ? '+' : ''}{percentageVariance.toFixed(1)}%
                  </p>
                </div>
                {variance >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Utilization</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overall Progress</span>
                <span className="text-sm font-medium">
                  {formatCurrency(project.budget.spentBudget)} / {formatCurrency(project.budget.totalBudget)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    (project.budget.spentBudget / project.budget.totalBudget) * 100 > 90
                      ? 'bg-red-600'
                      : (project.budget.spentBudget / project.budget.totalBudget) * 100 > 75
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, (project.budget.spentBudget / project.budget.totalBudget) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* RFP Budget Allocation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">RFP Budget Allocation</h3>
            <div className="space-y-4">
              {project.rfps.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No RFPs created yet</p>
                  <p className="text-sm text-gray-500">RFP budgets will appear here once created</p>
                </div>
              ) : (
                project.rfps.map((rfp) => {
                  const awardedBid = rfp.bids.find(bid => bid.awarded);
                  const utilization = rfp.allocatedBudget > 0 ? ((awardedBid?.bidAmount || 0) / rfp.allocatedBudget) * 100 : 0;

                  return (
                    <div key={rfp.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{rfp.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{rfp.discipline} • {rfp.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(rfp.allocatedBudget)}</p>
                          <p className="text-sm text-gray-600">
                            {awardedBid ? formatCurrency(awardedBid.bidAmount) : 'Not awarded'}
                          </p>
                        </div>
                      </div>

                      {awardedBid && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Awarded vs Budget</span>
                            <span className={utilization > 100 ? 'text-red-600' : 'text-green-600'}>
                              {utilization.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${utilization > 100 ? 'bg-red-600' : 'bg-green-600'}`}
                              style={{ width: `${Math.min(100, utilization)}%` }}
                            />
                          </div>
                          {utilization > 100 && (
                            <p className="text-xs text-red-600">
                              Over budget by {formatCurrency(awardedBid.bidAmount - rfp.allocatedBudget)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown Tab */}
      {activeView === 'breakdown' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget by Category</h3>
            <div className="space-y-4">
              {project.budget.breakdown.map((category, index: _index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900 capitalize">{category.category.replace('_', ' ')}</h4>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(category.allocated)}</p>
                      <p className="text-sm text-gray-600">{category.percentOfTotal.toFixed(1)}% of total</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Spent: {formatCurrency(category.spent)}</span>
                      <span className="text-gray-600">Remaining: {formatCurrency(category.remaining)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          category.allocated > 0 && (category.spent / category.allocated) > 0.9
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`}
                        style={{
                          width: `${category.allocated > 0 ? Math.min(100, (category.spent / category.allocated) * 100) : 0}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {category.allocated > 0 ? ((category.spent / category.allocated) * 100).toFixed(1) : 0}% utilized
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Tab */}
      {activeView === 'cashflow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Cash Flow Projection</h3>
            <div className="bg-yellow-50 rounded-lg p-6">
              <h4 className="font-semibold text-yellow-900 mb-2">Coming Soon</h4>
              <p className="text-yellow-700">
                Cash flow visualization showing monthly inflow and outflow projections based on project timeline and RFP awards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Forecasting Tab */}
      {activeView === 'forecasting' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget Forecasting</h3>
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">AI-Powered Forecasting</h4>
              <p className="text-blue-700">
                Advanced budget forecasting using machine learning to predict project completion costs,
                identify potential overruns, and suggest cost optimization strategies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}