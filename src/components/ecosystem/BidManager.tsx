'use client';

import React, { useState } from 'react';
import { SavedProject, ProjectBid } from '@/types/project';
import { updateProjectBidStatus } from '@/lib/storage';
import {
  TrendingUp, DollarSign, AlertTriangle,
  CheckCircle, Clock, Plus, Edit, FileText,
  Award, Users, MessageCircle
} from 'lucide-react';

interface BidManagerProps {
  project: SavedProject;
  onUpdate?: () => void;
}

export default function BidManager({ project, onUpdate }: BidManagerProps) {
  const [selectedBid, setSelectedBid] = useState<ProjectBid | null>(null);
  const [showAddBid, setShowAddBid] = useState(false);

  // Handle bid status updates
  const handleBidStatusUpdate = (bidId: string, newStatus: ProjectBid['status']) => {
    updateProjectBidStatus(project.id, bidId, newStatus);
    onUpdate?.();
  };

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

  const getBidStatusIcon = (status: ProjectBid['status']) => {
    switch (status) {
      case 'awarded':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'under-review':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'shortlisted':
        return <CheckCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBidStatusColor = (status: ProjectBid['status']) => {
    switch (status) {
      case 'awarded':
        return 'bg-green-100 text-green-800';
      case 'under-review':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextBidStatus = (currentStatus: ProjectBid['status']): ProjectBid['status'] => {
    switch (currentStatus) {
      case 'submitted':
        return 'under-review';
      case 'under-review':
        return 'shortlisted';
      case 'shortlisted':
        return 'awarded';
      case 'awarded':
        return 'submitted'; // Allow reset
      case 'rejected':
        return 'under-review'; // Allow re-review
      default:
        return 'under-review';
    }
  };

  const getStatusActionLabel = (status: ProjectBid['status']): string => {
    switch (status) {
      case 'submitted':
        return 'Start Review';
      case 'under-review':
        return 'Shortlist';
      case 'shortlisted':
        return 'Award';
      case 'awarded':
        return 'Reset';
      case 'rejected':
        return 'Re-Review';
      default:
        return 'Update';
    }
  };

  const bids = project.project.bids || [];
  const totalBidValue = bids.reduce((sum, bid) => sum + bid.bidAmount, 0);
  const averageBid = bids.length > 0 ? totalBidValue / bids.length : 0;
  const lowestBid = bids.length > 0 ? Math.min(...bids.map(b => b.bidAmount)) : 0;
  const awardedBids = bids.filter(bid => bid.status === 'awarded');
  const totalAwardedValue = awardedBids.reduce((sum, bid) => sum + bid.bidAmount, 0);

  return (
    <div className="space-y-6">
      {/* Bid Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Bid Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Bids</p>
                <p className="text-2xl font-bold text-blue-900">{bids.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Average Bid</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(averageBid)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Lowest Bid</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(lowestBid)}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Awarded Value</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(totalAwardedValue)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Submitted Bids</h3>
          <button
            onClick={() => setShowAddBid(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bid
          </button>
        </div>
      </div>

      {/* Bids List */}
      {bids.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y divide-gray-200">
            {bids.map((bid) => {
              const varianceFromLow = lowestBid > 0 ? ((bid.bidAmount - lowestBid) / lowestBid) * 100 : 0;

              return (
                <div key={bid.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getBidStatusIcon(bid.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{bid.contractorName}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBidStatusColor(bid.status)}`}>
                            {bid.status.replace('-', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Bid Amount:</span>
                            <p className="font-bold text-lg text-gray-900">
                              {formatCurrency(bid.bidAmount)}
                            </p>
                            {varianceFromLow > 0 && (
                              <p className="text-xs text-red-600">
                                +{varianceFromLow.toFixed(1)}% above lowest
                              </p>
                            )}
                          </div>

                          <div>
                            <span className="text-gray-500">Submitted:</span>
                            <p className="font-medium">
                              {formatDate(bid.submissionDate)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {bid.bondingCapacity ? `${formatCurrency(bid.bondingCapacity)} bonding` : 'No bonding info'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">Experience:</span>
                            <p className="font-medium">
                              {bid.yearsExperience} years
                            </p>
                            <p className="text-xs text-gray-600">
                              {bid.similarProjectsCount} similar projects
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">Timeline:</span>
                            <p className="font-medium">
                              {bid.proposedDuration} days
                            </p>
                            {bid.notes && (
                              <p className="text-xs text-gray-600 truncate" title={bid.notes}>
                                {bid.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {bid.specialCapabilities && bid.specialCapabilities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {bid.specialCapabilities.map((capability, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {capability}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleBidStatusUpdate(bid.id, getNextBidStatus(bid.status))}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-colors"
                        title={`${getStatusActionLabel(bid.status)} this bid`}
                      >
                        {getStatusActionLabel(bid.status)}
                      </button>

                      <button
                        onClick={() => setSelectedBid(bid)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded transition-colors">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Notes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bids Submitted</h3>
          <p className="text-gray-600 mb-6">
            Track contractor bids, proposals, and award decisions for this project.
          </p>
          <button
            onClick={() => setShowAddBid(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Bid
          </button>
        </div>
      )}

      {/* Add Bid Modal - Placeholder */}
      {showAddBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Bid</h3>
              <p className="text-gray-600 mb-6">
                Bid entry form coming soon...
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddBid(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bid Details Modal - Placeholder */}
      {selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedBid.contractorName} - Bid Details
              </h3>
              <p className="text-gray-600 mb-6">
                Detailed bid review interface coming soon...
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedBid(null)}
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