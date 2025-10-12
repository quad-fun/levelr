'use client';

import React, { useState } from 'react';
import { SavedProject } from '@/types/project';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Plus, Edit, Trash2, BarChart3, PieChart
} from 'lucide-react';

interface BudgetTrackerProps {
  project: SavedProject;
  onUpdate?: () => void;
}

export default function BudgetTracker({ project }: BudgetTrackerProps) {
  const [showAddAllocation, setShowAddAllocation] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getVarianceColor = (variance: number) => {
    if (variance > 10) return 'text-red-600 bg-red-100';
    if (variance > 5) return 'text-yellow-600 bg-yellow-100';
    if (variance < -5) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const totalCommitted = project.project.budgetAllocations.reduce((sum, allocation) => sum + allocation.committedAmount, 0);
  const remainingBudget = project.project.totalBudget - totalCommitted;
  const overallVariance = ((totalCommitted - project.project.totalBudget) / project.project.totalBudget) * 100;

  return (
    <div className="space-y-8">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.project.totalBudget)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Committed</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommitted)}</p>
              <p className="text-sm text-gray-600">
                {((totalCommitted / project.project.totalBudget) * 100).toFixed(1)}% of budget
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(remainingBudget)}</p>
              <p className="text-sm text-gray-600">
                {((remainingBudget / project.project.totalBudget) * 100).toFixed(1)}% available
              </p>
            </div>
            <PieChart className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Variance</p>
              <div className="flex items-center">
                <p className={`text-2xl font-bold ${overallVariance > 0 ? 'text-red-600' : overallVariance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {overallVariance > 0 ? '+' : ''}{overallVariance.toFixed(1)}%
                </p>
                {getVarianceIcon(overallVariance) && (
                  <span className="ml-2">{getVarianceIcon(overallVariance)}</span>
                )}
              </div>
            </div>
            {overallVariance > 10 ? (
              <AlertTriangle className="h-8 w-8 text-red-600" />
            ) : (
              <TrendingUp className="h-8 w-8 text-orange-600" />
            )}
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Utilization</h3>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div
              className="bg-blue-600 h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
              style={{ width: `${Math.min((totalCommitted / project.project.totalBudget) * 100, 100)}%` }}
            >
              <span className="text-white text-sm font-medium">
                {((totalCommitted / project.project.totalBudget) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>$0</span>
            <span>{formatCurrency(project.project.totalBudget)}</span>
          </div>
        </div>
      </div>

      {/* Budget Allocations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Budget Allocations</h3>
          <button
            onClick={() => setShowAddAllocation(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Allocation
          </button>
        </div>

        {project.project.budgetAllocations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discipline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Committed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.project.budgetAllocations.map((allocation) => {
                  const variancePercent = allocation.allocatedAmount > 0
                    ? ((allocation.committedAmount - allocation.allocatedAmount) / allocation.allocatedAmount) * 100
                    : 0;

                  return (
                    <tr key={allocation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{allocation.name}</div>
                          <div className="text-sm text-gray-500">{allocation.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800">
                          {allocation.discipline}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(allocation.allocatedAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(allocation.committedAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(allocation.actualAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVarianceColor(variancePercent)}`}>
                          {getVarianceIcon(variancePercent)}
                          <span className="ml-1">
                            {variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          allocation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          allocation.status === 'committed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {allocation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Allocations</h3>
            <p className="text-gray-600 mb-6">
              Start by creating budget allocations to track your project spending by category.
            </p>
            <button
              onClick={() => setShowAddAllocation(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Allocation
            </button>
          </div>
        )}
      </div>

      {/* Change Orders Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{project.project.awardedBids.length}</p>
            <p className="text-sm text-gray-600">Awarded Contracts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(project.project.awardedBids.reduce((sum, bid) => sum + bid.awardedAmount, 0))}
            </p>
            <p className="text-sm text-gray-600">Total Awarded Amount</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600">Pending Change Orders</p>
          </div>
        </div>
      </div>

      {/* Add Allocation Modal Placeholder */}
      {showAddAllocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Budget Allocation</h3>
              <p className="text-gray-600 mb-6">
                Budget allocation management interface coming soon...
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddAllocation(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}