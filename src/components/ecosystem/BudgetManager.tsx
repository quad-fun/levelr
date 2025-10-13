'use client';

import React, { useState } from 'react';
import { SavedProject, BudgetAllocation } from '@/types/project';
import { updateBudgetAllocation } from '@/lib/storage';
import {
  DollarSign, TrendingUp, TrendingDown,
  CheckCircle, Edit, Save, X, Calculator, BarChart3
} from 'lucide-react';

interface BudgetManagerProps {
  project: SavedProject;
  onUpdate?: () => void;
}

export default function BudgetManager({ project, onUpdate }: BudgetManagerProps) {
  const [editingAllocation, setEditingAllocation] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<BudgetAllocation>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const handleEditStart = (allocation: BudgetAllocation) => {
    setEditingAllocation(allocation.id);
    setEditedValues({
      actualAmount: allocation.actualAmount,
      status: allocation.status,
      notes: allocation.notes || ''
    });
  };

  const handleEditSave = (allocationId: string) => {
    if (editedValues.actualAmount !== undefined) {
      // Calculate variance
      const allocation = project.project.budgetAllocations.find(a => a.id === allocationId);
      if (allocation) {
        const variance = editedValues.actualAmount - allocation.allocatedAmount;
        updateBudgetAllocation(project.id, allocationId, {
          ...editedValues,
          variance
        });
        onUpdate?.();
      }
    }
    setEditingAllocation(null);
    setEditedValues({});
  };

  const handleEditCancel = () => {
    setEditingAllocation(null);
    setEditedValues({});
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case 'construction':
        return 'bg-blue-100 text-blue-800';
      case 'design':
        return 'bg-green-100 text-green-800';
      case 'trade':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: BudgetAllocation['status']) => {
    switch (status) {
      case 'committed':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'over-budget':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    } else if (variance < 0) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-gray-600" />;
  };

  const budgetAllocations = project.project.budgetAllocations || [];
  const totalAllocated = budgetAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
  const totalActual = budgetAllocations.reduce((sum, alloc) => sum + alloc.actualAmount, 0);
  const totalVariance = totalActual - totalAllocated;
  const totalVariancePercent = totalAllocated > 0 ? (totalVariance / totalAllocated) * 100 : 0;

  // Group allocations by discipline
  const allocationsByDiscipline = budgetAllocations.reduce((acc, allocation) => {
    if (!acc[allocation.discipline]) {
      acc[allocation.discipline] = [];
    }
    acc[allocation.discipline].push(allocation);
    return acc;
  }, {} as Record<string, BudgetAllocation[]>);

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Budget</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(project.project.totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Allocated</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAllocated)}</p>
                <p className="text-xs text-green-700">
                  {formatPercentage(totalAllocated / project.project.totalBudget)} of total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Actual Spend</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalActual)}</p>
                <p className="text-xs text-purple-700">
                  {formatPercentage(totalActual / project.project.totalBudget)} of total
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg p-4 ${totalVariance >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="flex items-center">
              {totalVariance >= 0 ? (
                <TrendingUp className="h-8 w-8 text-red-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-600" />
              )}
              <div className="ml-3">
                <p className={`text-sm font-medium ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Variance
                </p>
                <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                  {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
                </p>
                <p className={`text-xs ${totalVariance >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {totalVariancePercent >= 0 ? '+' : ''}{totalVariancePercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Allocations by Discipline */}
      {Object.entries(allocationsByDiscipline).map(([discipline, allocations]) => (
        <div key={discipline} className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {discipline} Budget
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDisciplineColor(discipline)}`}>
                {allocations.length} allocation{allocations.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {allocations.map((allocation) => (
              <div key={allocation.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{allocation.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(allocation.status)}`}>
                        {allocation.status.replace('-', ' ')}
                      </span>
                    </div>

                    {editingAllocation === allocation.id ? (
                      // Editing mode
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Actual Amount
                            </label>
                            <input
                              type="number"
                              value={editedValues.actualAmount || 0}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, actualAmount: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              value={editedValues.status || allocation.status}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, status: e.target.value as BudgetAllocation['status'] }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="open">Open</option>
                              <option value="committed">Committed</option>
                              <option value="over-budget">Over Budget</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={editedValues.notes || ''}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, notes: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Add notes..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleEditCancel}
                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md transition-colors"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditSave(allocation.id)}
                            className="flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Allocated:</span>
                          <p className="font-bold text-lg text-gray-900">
                            {formatCurrency(allocation.allocatedAmount)}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">Actual:</span>
                          <p className="font-bold text-lg text-gray-900">
                            {formatCurrency(allocation.actualAmount)}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">Variance:</span>
                          <div className="flex items-center space-x-1">
                            {getVarianceIcon(allocation.variance)}
                            <p className={`font-bold text-lg ${
                              allocation.variance > 0 ? 'text-red-600' :
                              allocation.variance < 0 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {allocation.variance >= 0 ? '+' : ''}{formatCurrency(allocation.variance)}
                            </p>
                          </div>
                          <p className={`text-xs ${
                            allocation.variance > 0 ? 'text-red-600' :
                            allocation.variance < 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {allocation.allocatedAmount > 0 ?
                              `${allocation.variance >= 0 ? '+' : ''}${((allocation.variance / allocation.allocatedAmount) * 100).toFixed(1)}%` :
                              '0%'
                            }
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">Category:</span>
                          <p className="font-medium text-gray-900 capitalize">
                            {allocation.category.replace('_', ' ')}
                          </p>
                          {allocation.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {allocation.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {editingAllocation !== allocation.id && (
                    <button
                      onClick={() => handleEditStart(allocation)}
                      className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {budgetAllocations.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Allocations</h3>
          <p className="text-gray-600">
            Budget allocations will be automatically generated based on project templates and RFP awards.
          </p>
        </div>
      )}
    </div>
  );
}