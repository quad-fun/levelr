'use client';

import React, { useState } from 'react';
import { SavedProject, ProjectRFP, ProjectBid } from '@/types/project';
import {
  FileText, Plus, Eye, Award, Users, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  DollarSign, Star, BarChart3
} from 'lucide-react';

interface ProjectRFPManagerProps {
  project: SavedProject;
  onRFPUpdate: () => void;
  onBidAward: (rfpId: string, bidId: string) => void;
}

export default function ProjectRFPManager({ project, onRFPUpdate, onBidAward }: ProjectRFPManagerProps) {
  const [selectedRFP, setSelectedRFP] = useState<ProjectRFP | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'awarded' | 'all'>('active');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'responses_received': return 'bg-yellow-100 text-yellow-800';
      case 'evaluated': return 'bg-purple-100 text-purple-800';
      case 'awarded': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'construction': return '🏗️';
      case 'design': return '📐';
      case 'trade': return '⚡';
      default: return '📄';
    }
  };

  const filteredRFPs = project.rfps.filter(rfp => {
    switch (activeTab) {
      case 'active': return rfp.status !== 'awarded' && rfp.status !== 'cancelled';
      case 'awarded': return rfp.status === 'awarded';
      case 'all': return true;
      default: return true;
    }
  });

  const getRFPProgress = (rfp: ProjectRFP) => {
    const steps = ['draft', 'issued', 'responses_received', 'evaluated', 'awarded'];
    const currentIndex = steps.indexOf(rfp.status);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const calculateBidStatistics = (rfp: ProjectRFP) => {
    if (rfp.bids.length === 0) return null;

    const amounts = rfp.bids.map(bid => bid.bidAmount);
    const lowest = Math.min(...amounts);
    const highest = Math.max(...amounts);
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

    return { lowest, highest, average, spread: highest - lowest };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RFP & Bid Management</h2>
          <p className="text-gray-600 mt-1">
            Manage project RFPs, track responses, and award contracts
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Plus className="h-4 w-4 mr-2" />
            Create RFP
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'active', name: 'Active RFPs', count: project.rfps.filter(r => r.status !== 'awarded' && r.status !== 'cancelled').length },
            { id: 'awarded', name: 'Awarded', count: project.rfps.filter(r => r.status === 'awarded').length },
            { id: 'all', name: 'All RFPs', count: project.rfps.length }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* RFP List */}
      <div className="space-y-4">
        {filteredRFPs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'active' ? 'No active RFPs' :
               activeTab === 'awarded' ? 'No awarded RFPs' : 'No RFPs created'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'active' ? 'Create your first RFP to start the procurement process.' :
               activeTab === 'awarded' ? 'Awarded RFPs will appear here once contracts are awarded.' :
               'Create your first RFP to get started.'}
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Create RFP
            </button>
          </div>
        ) : (
          filteredRFPs.map((rfp) => {
            const bidStats = calculateBidStatistics(rfp);
            const progress = getRFPProgress(rfp);
            const isOverdue = new Date(rfp.responseDeadline) < new Date() && rfp.status === 'issued';

            return (
              <div key={rfp.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* RFP Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getDisciplineIcon(rfp.discipline)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rfp.name}</h3>
                        <p className="text-gray-600 text-sm">{rfp.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="capitalize">{rfp.discipline}</span>
                          <span>•</span>
                          <span>{formatCurrency(rfp.allocatedBudget)} budget</span>
                          <span>•</span>
                          <span>{rfp.bids.length} bid{rfp.bids.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(rfp.status)}`}>
                        {rfp.status.replace('_', ' ')}
                      </span>
                      {isOverdue && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">RFP Progress</span>
                      <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Issue Date</p>
                        <p className="font-medium">{formatDate(rfp.issueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Response Deadline</p>
                        <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                          {formatDate(rfp.responseDeadline)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Award Date</p>
                        <p className="font-medium">
                          {rfp.awardDate ? formatDate(rfp.awardDate) : 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bid Statistics */}
                  {bidStats && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Bid Analysis</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Lowest Bid</p>
                          <p className="font-semibold text-green-600">{formatCurrency(bidStats.lowest)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Highest Bid</p>
                          <p className="font-semibold text-red-600">{formatCurrency(bidStats.highest)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Average</p>
                          <p className="font-semibold text-blue-600">{formatCurrency(bidStats.average)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Spread</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(bidStats.spread)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bids List */}
                  {rfp.bids.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Received Bids</h4>
                      {rfp.bids.slice(0, 3).map((bid) => (
                        <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{bid.bidderName}</h5>
                              <p className="text-sm text-gray-600">
                                Submitted: {formatDate(bid.submissionDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(bid.riskLevel)}`}>
                              {bid.riskLevel} risk
                            </span>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatCurrency(bid.bidAmount)}</p>
                              {bid.totalScore > 0 && (
                                <p className="text-sm text-gray-600">{bid.totalScore}/100 score</p>
                              )}
                            </div>
                            {bid.awarded ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : rfp.status === 'responses_received' && (
                              <button
                                onClick={() => onBidAward(rfp.id, bid.id)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                              >
                                Award
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {rfp.bids.length > 3 && (
                        <button
                          onClick={() => setSelectedRFP(rfp)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View all {rfp.bids.length} bids
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedRFP(rfp)}
                        className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      {rfp.status === 'draft' && (
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                          Issue RFP
                        </button>
                      )}
                      {rfp.status === 'responses_received' && (
                        <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200">
                          Evaluate Bids
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed RFP Modal */}
      {selectedRFP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">{selectedRFP.name}</h3>
                <button
                  onClick={() => setSelectedRFP(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* RFP Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">RFP Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discipline:</span>
                      <span className="capitalize">{selectedRFP.discipline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span>{formatCurrency(selectedRFP.allocatedBudget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Responses:</span>
                      <span>{selectedRFP.expectedResponses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Received:</span>
                      <span>{selectedRFP.receivedResponses}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span>{formatDate(selectedRFP.issueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Deadline:</span>
                      <span>{formatDate(selectedRFP.responseDeadline)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Evaluation Deadline:</span>
                      <span>{formatDate(selectedRFP.evaluationDeadline)}</span>
                    </div>
                    {selectedRFP.awardDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Award Date:</span>
                        <span>{formatDate(selectedRFP.awardDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* All Bids */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">All Bids ({selectedRFP.bids.length})</h4>
                {selectedRFP.bids.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No bids received yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedRFP.bids.map((bid) => (
                      <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{bid.bidderName}</h5>
                            <p className="text-sm text-gray-600">Submitted: {formatDate(bid.submissionDate)}</p>
                            {bid.notes && (
                              <p className="text-sm text-gray-600 mt-1">{bid.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(bid.riskLevel)}`}>
                              {bid.riskLevel} risk
                            </span>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatCurrency(bid.bidAmount)}</p>
                              <p className="text-sm text-gray-600">Rank #{bid.rank}</p>
                            </div>
                            {bid.awarded ? (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium text-green-600">Awarded</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  onBidAward(selectedRFP.id, bid.id);
                                  setSelectedRFP(null);
                                }}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                              >
                                Award Contract
                              </button>
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
        </div>
      )}
    </div>
  );
}