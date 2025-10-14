'use client';

import React, { useState } from 'react';
import { SavedProject, ProjectBid } from '@/types/project';
import { updateProjectBidStatus, addProjectBid, getAllAnalyses } from '@/lib/storage';
import type { SavedAnalysis } from '@/lib/storage';
import {
  TrendingUp, DollarSign, AlertTriangle,
  CheckCircle, Clock, Plus, Edit, FileText,
  Award, Users, MessageCircle, X, Star,
  Calendar, Phone, Mail, Building, Gavel,
  Download, Search
} from 'lucide-react';

interface BidManagerProps {
  project: SavedProject;
  onUpdate?: () => void;
}

export default function BidManager({ project, onUpdate }: BidManagerProps) {
  const [selectedBid, setSelectedBid] = useState<ProjectBid | null>(null);
  const [showAddBid, setShowAddBid] = useState(false);
  const [showAnalyzedBids, setShowAnalyzedBids] = useState(false);
  const [analyzedBids, setAnalyzedBids] = useState<SavedAnalysis[]>([]);
  const [newBid, setNewBid] = useState({
    contractorName: '',
    bidAmount: '',
    proposedDuration: '',
    yearsExperience: '',
    similarProjectsCount: '',
    contactEmail: '',
    contactPhone: '',
    bondingCapacity: '',
    notes: '',
    specialCapabilities: [] as string[]
  });

  // Load analyzed bids when component mounts or when showing analyzed bids
  React.useEffect(() => {
    if (showAnalyzedBids) {
      const allAnalyses = getAllAnalyses();
      setAnalyzedBids(allAnalyses);
    }
  }, [showAnalyzedBids]);

  // Handle bid status updates
  const handleBidStatusUpdate = (bidId: string, newStatus: ProjectBid['status']) => {
    updateProjectBidStatus(project.id, bidId, newStatus);
    onUpdate?.();
  };

  // Handle new bid submission
  const handleAddBid = () => {
    if (!newBid.contractorName || !newBid.bidAmount || !newBid.proposedDuration) {
      alert('Please fill in all required fields');
      return;
    }

    const bidData: Omit<ProjectBid, 'id'> = {
      contractorName: newBid.contractorName,
      bidAmount: parseFloat(newBid.bidAmount),
      proposedDuration: parseInt(newBid.proposedDuration),
      yearsExperience: parseInt(newBid.yearsExperience) || 0,
      similarProjectsCount: parseInt(newBid.similarProjectsCount) || 0,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'submitted',
      contactEmail: newBid.contactEmail || undefined,
      contactPhone: newBid.contactPhone || undefined,
      bondingCapacity: newBid.bondingCapacity ? parseFloat(newBid.bondingCapacity) : undefined,
      notes: newBid.notes || undefined,
      specialCapabilities: newBid.specialCapabilities
    };

    addProjectBid(project.id, bidData);

    // Reset form
    setNewBid({
      contractorName: '',
      bidAmount: '',
      proposedDuration: '',
      yearsExperience: '',
      similarProjectsCount: '',
      contactEmail: '',
      contactPhone: '',
      bondingCapacity: '',
      notes: '',
      specialCapabilities: []
    });

    setShowAddBid(false);
    onUpdate?.();
  };

  // Handle specialty capability input
  const handleAddCapability = (capability: string) => {
    if (capability.trim() && !newBid.specialCapabilities.includes(capability.trim())) {
      setNewBid({
        ...newBid,
        specialCapabilities: [...newBid.specialCapabilities, capability.trim()]
      });
    }
  };

  const handleRemoveCapability = (index: number) => {
    setNewBid({
      ...newBid,
      specialCapabilities: newBid.specialCapabilities.filter((_, i) => i !== index)
    });
  };

  // Import analyzed bid into project
  const handleImportAnalyzedBid = (analysis: SavedAnalysis) => {
    const bidData: Omit<ProjectBid, 'id'> = {
      contractorName: analysis.result.contractor_name,
      bidAmount: analysis.result.total_amount,
      proposedDuration: 90, // Default duration, could be enhanced with AI estimation
      yearsExperience: 5, // Default, could be enhanced with contractor database
      similarProjectsCount: 3, // Default, could be enhanced with contractor database
      submissionDate: analysis.timestamp.split('T')[0],
      status: 'submitted',
      specialCapabilities: [],
      notes: `Imported from analysis on ${new Date(analysis.timestamp).toLocaleDateString()}. Discipline: ${analysis.result.discipline}.`
    };

    addProjectBid(project.id, bidData);
    setShowAnalyzedBids(false);
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
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAnalyzedBids(true)}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Import from Analysis
            </button>
            <button
              onClick={() => setShowAddBid(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bid
            </button>
          </div>
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

      {/* Import from Analysis Modal */}
      {showAnalyzedBids && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Import Analyzed Bids</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Select analyzed bids from your bid analysis history to import into this project
                  </p>
                </div>
                <button
                  onClick={() => setShowAnalyzedBids(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {analyzedBids.length > 0 ? (
                <div className="space-y-4">
                  {analyzedBids.map((analysis) => {
                    const isAlreadyImported = bids.some(bid =>
                      bid.contractorName === analysis.result.contractor_name &&
                      Math.abs(bid.bidAmount - analysis.result.total_amount) < 100
                    );

                    return (
                      <div key={analysis.id} className={`border rounded-lg p-4 ${isAlreadyImported ? 'bg-gray-50 border-gray-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {analysis.result.contractor_name}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                analysis.result.discipline === 'construction' ? 'bg-blue-100 text-blue-800' :
                                analysis.result.discipline === 'design' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {analysis.result.discipline}
                              </span>
                              {isAlreadyImported && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                  Already Imported
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-500">Bid Amount:</span>
                                <p className="font-bold text-lg text-gray-900">
                                  {formatCurrency(analysis.result.total_amount)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Analyzed:</span>
                                <p className="font-medium">
                                  {formatDate(analysis.timestamp)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Project:</span>
                                <p className="font-medium">
                                  {analysis.result.project_name || 'Unnamed Project'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Risk Level:</span>
                                <p className={`font-medium ${
                                  analysis.riskAssessment?.level === 'HIGH' ? 'text-red-600' :
                                  analysis.riskAssessment?.level === 'MEDIUM' ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {analysis.riskAssessment?.level || analysis.comparisonData?.riskLevel || 'UNKNOWN'}
                                </p>
                              </div>
                            </div>

                            {analysis.result.project_name && (
                              <div className="bg-blue-50 rounded-md p-3 text-sm">
                                <p className="text-blue-700">
                                  <strong>Project:</strong> {analysis.result.project_name}
                                  {analysis.result.gross_sqft && (
                                    <span className="ml-2">• {analysis.result.gross_sqft.toLocaleString()} sq ft</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {!isAlreadyImported && (
                              <button
                                onClick={() => handleImportAnalyzedBid(analysis)}
                                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Import
                              </button>
                            )}
                            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                              <Search className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analyzed Bids Found</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't analyzed any bids yet. Use the main bid analysis tool to analyze contractor bids first.
                  </p>
                  <button
                    onClick={() => setShowAnalyzedBids(false)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {analyzedBids.length > 0 && (
                <div className="flex justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => setShowAnalyzedBids(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Bid Modal */}
      {showAddBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add New Bid</h3>
                <button
                  onClick={() => setShowAddBid(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAddBid(); }} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contractor Name *
                    </label>
                    <input
                      type="text"
                      value={newBid.contractorName}
                      onChange={(e) => setNewBid({ ...newBid, contractorName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Company Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bid Amount * ($)
                    </label>
                    <input
                      type="number"
                      value={newBid.bidAmount}
                      onChange={(e) => setNewBid({ ...newBid, bidAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Timeline and Experience */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration * (days)
                    </label>
                    <input
                      type="number"
                      value={newBid.proposedDuration}
                      onChange={(e) => setNewBid({ ...newBid, proposedDuration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years Experience
                    </label>
                    <input
                      type="number"
                      value={newBid.yearsExperience}
                      onChange={(e) => setNewBid({ ...newBid, yearsExperience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Similar Projects
                    </label>
                    <input
                      type="number"
                      value={newBid.similarProjectsCount}
                      onChange={(e) => setNewBid({ ...newBid, similarProjectsCount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={newBid.contactEmail}
                      onChange={(e) => setNewBid({ ...newBid, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contractor@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={newBid.contactPhone}
                      onChange={(e) => setNewBid({ ...newBid, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonding Capacity ($)
                  </label>
                  <input
                    type="number"
                    value={newBid.bondingCapacity}
                    onChange={(e) => setNewBid({ ...newBid, bondingCapacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Special Capabilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Capabilities
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newBid.specialCapabilities.map((capability, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {capability}
                        <button
                          type="button"
                          onClick={() => handleRemoveCapability(index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add capability and press Enter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCapability(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newBid.notes}
                    onChange={(e) => setNewBid({ ...newBid, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about this bid..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddBid(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bid
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bid Details Modal */}
      {selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    {getBidStatusIcon(selectedBid.status)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedBid.contractorName}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBidStatusColor(selectedBid.status)}`}>
                        {selectedBid.status.replace('-', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        Submitted {formatDate(selectedBid.submissionDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBid(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Bid Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Bid Amount</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(selectedBid.bidAmount)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  {lowestBid > 0 && selectedBid.bidAmount > lowestBid && (
                    <p className="text-xs text-red-600 mt-1">
                      +{(((selectedBid.bidAmount - lowestBid) / lowestBid) * 100).toFixed(1)}% above lowest
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Timeline</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedBid.proposedDuration} days</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Experience</p>
                      <p className="text-2xl font-bold text-purple-900">{selectedBid.yearsExperience} years</p>
                    </div>
                    <Building className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-700 mt-1">
                    {selectedBid.similarProjectsCount} similar projects
                  </p>
                </div>
              </div>

              {/* Contractor Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Contractor Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{selectedBid.contractorName}</span>
                    </div>
                    {selectedBid.contactEmail && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedBid.contactEmail}</span>
                      </div>
                    )}
                    {selectedBid.contactPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedBid.contactPhone}</span>
                      </div>
                    )}
                    {selectedBid.bondingCapacity && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Bonding Capacity:</span>
                        <span className="font-medium">{formatCurrency(selectedBid.bondingCapacity)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Project Qualifications</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium ml-1">{selectedBid.yearsExperience} years</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Similar Projects:</span>
                      <span className="font-medium ml-1">{selectedBid.similarProjectsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Proposed Duration:</span>
                      <span className="font-medium ml-1">{selectedBid.proposedDuration} days</span>
                    </div>
                    {selectedBid.specialCapabilities && selectedBid.specialCapabilities.length > 0 && (
                      <div>
                        <span className="text-gray-600">Special Capabilities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedBid.specialCapabilities.map((capability, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {capability}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBid.notes && (
                <div className="bg-yellow-50 rounded-lg p-4 mb-8">
                  <h4 className="font-semibold text-gray-900 mb-2">Bid Notes</h4>
                  <p className="text-gray-700">{selectedBid.notes}</p>
                </div>
              )}

              {/* Award Section */}
              {selectedBid.status === 'shortlisted' && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Gavel className="h-6 w-6 text-green-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Award Contract</h4>
                  </div>
                  <p className="text-gray-600 mb-4">
                    This bid is shortlisted for award. Review the details above and confirm to award the contract.
                  </p>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        handleBidStatusUpdate(selectedBid.id, 'awarded');
                        setSelectedBid(null);
                      }}
                      className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Award Contract
                    </button>
                    <button
                      onClick={() => handleBidStatusUpdate(selectedBid.id, 'rejected')}
                      className="flex items-center px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Bid
                    </button>
                  </div>
                </div>
              )}

              {/* Contract Information */}
              {selectedBid.status === 'awarded' && (
                <div className="bg-green-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Award className="h-6 w-6 text-green-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Contract Awarded</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Contract Value:</span>
                      <p className="font-bold text-lg text-green-900">{formatCurrency(selectedBid.bidAmount)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Contract Duration:</span>
                      <p className="font-medium">{selectedBid.proposedDuration} days</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-green-700">
                      <Star className="h-4 w-4 inline mr-1" />
                      Contract awarded to {selectedBid.contractorName}. Next steps: Generate contract documents and begin project coordination.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex space-x-2">
                  {selectedBid.status !== 'awarded' && (
                    <button
                      onClick={() => handleBidStatusUpdate(selectedBid.id, getNextBidStatus(selectedBid.status))}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      {getStatusActionLabel(selectedBid.status)}
                    </button>
                  )}
                  {selectedBid.status === 'awarded' && (
                    <button className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Contract
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectedBid(null)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
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