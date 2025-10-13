'use client';

import React, { useState, useEffect } from 'react';
import { SavedProject, ProjectChangeOrder } from '@/types/project';
import { getProjectChangeOrders, updateChangeOrderStatus } from '@/lib/storage';
import {
  FileText, AlertTriangle,
  CheckCircle, Clock, Plus, Eye, TrendingUp
} from 'lucide-react';

interface ChangeOrderManagerProps {
  project: SavedProject;
  onUpdate?: () => void;
}

export default function ChangeOrderManager({ project, onUpdate }: ChangeOrderManagerProps) {
  const [changeOrders, setChangeOrders] = useState<ProjectChangeOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProjectChangeOrder | null>(null);
  const [showAddOrder, setShowAddOrder] = useState(false);

  useEffect(() => {
    const orders = getProjectChangeOrders(project.id);
    setChangeOrders(orders);
  }, [project.id]);

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

  const handleStatusUpdate = (orderId: string, newStatus: ProjectChangeOrder['status']) => {
    const approvedDate = newStatus === 'approved' ? new Date().toISOString().split('T')[0] : undefined;
    updateChangeOrderStatus(orderId, newStatus, approvedDate);

    // Refresh change orders
    const updatedOrders = getProjectChangeOrders(project.id);
    setChangeOrders(updatedOrders);
    onUpdate?.();
  };

  const getStatusIcon = (status: ProjectChangeOrder['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ProjectChangeOrder['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: ProjectChangeOrder['status']): ProjectChangeOrder['status'] => {
    switch (currentStatus) {
      case 'pending':
        return 'approved';
      case 'approved':
        return 'rejected';
      case 'rejected':
        return 'pending';
      default:
        return 'approved';
    }
  };

  const getStatusActionLabel = (status: ProjectChangeOrder['status']): string => {
    switch (status) {
      case 'pending':
        return 'Approve';
      case 'approved':
        return 'Reject';
      case 'rejected':
        return 'Reconsider';
      default:
        return 'Update';
    }
  };

  const totalChangeOrderValue = changeOrders.reduce((sum, order) => sum + (order.budgetImpact || order.amount || 0), 0);
  const approvedChangeOrderValue = changeOrders
    .filter(order => order.status === 'approved')
    .reduce((sum, order) => sum + (order.budgetImpact || order.amount || 0), 0);
  const pendingChangeOrderValue = changeOrders
    .filter(order => order.status === 'pending')
    .reduce((sum, order) => sum + (order.budgetImpact || order.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Change Orders Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Order Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">{changeOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Approved Value</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(approvedChangeOrderValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Pending Value</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(pendingChangeOrderValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalChangeOrderValue)}</p>
                <p className="text-xs text-purple-700">
                  {project.project.totalBudget > 0 ?
                    `${((totalChangeOrderValue / project.project.totalBudget) * 100).toFixed(1)}% of budget` :
                    'No baseline budget'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Change Orders</h3>
          <button
            onClick={() => setShowAddOrder(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Change Order
          </button>
        </div>
      </div>

      {/* Change Orders List */}
      {changeOrders.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y divide-gray-200">
            {changeOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{order.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3">{order.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="font-bold text-lg">
                            <span className={(order.budgetImpact || order.amount || 0) >= 0 ? 'text-red-600' : 'text-green-600'}>
                              {(order.budgetImpact || order.amount || 0) >= 0 ? '+' : ''}{formatCurrency(order.budgetImpact || order.amount || 0)}
                            </span>
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">Requested:</span>
                          <p className="font-medium">
                            {formatDate(order.requestedDate)}
                          </p>
                          <p className="text-xs text-gray-600">
                            by {order.requestedBy}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">Category:</span>
                          <p className="font-medium capitalize">
                            {(order.category || order.discipline || 'general').replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-600">
                            Priority: {order.priority || 'medium'}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">Impact:</span>
                          <p className="font-medium">
                            {order.scheduleImpact} days
                          </p>
                          {order.approvedDate && (
                            <p className="text-xs text-gray-600">
                              Approved: {formatDate(order.approvedDate)}
                            </p>
                          )}
                        </div>
                      </div>

                      {order.reason && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Reason: </span>
                            {order.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-colors"
                      title={`${getStatusActionLabel(order.status)} this change order`}
                    >
                      {getStatusActionLabel(order.status)}
                    </button>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Change Orders</h3>
          <p className="text-gray-600 mb-6">
            Track project changes, scope adjustments, and cost modifications here.
          </p>
          <button
            onClick={() => setShowAddOrder(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Change Order
          </button>
        </div>
      )}

      {/* Add Change Order Modal - Placeholder */}
      {showAddOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Change Order</h3>
              <p className="text-gray-600 mb-6">
                Change order creation form coming soon...
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddOrder(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Order Details Modal - Placeholder */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedOrder.title} - Details
              </h3>
              <p className="text-gray-600 mb-6">
                Detailed change order review interface coming soon...
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
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