'use client';

import React, { useState } from 'react';
import { SavedProject, PHASE_STATUS_COLORS, MILESTONE_STATUS_COLORS, ProjectMilestone, ProjectPhase } from '@/types/project';
import { updateMilestoneStatus, updatePhaseStatus } from '@/lib/storage';
import {
  Calendar, Clock, Plus, Edit, Trash2, CheckCircle,
  AlertTriangle, Play, ArrowRight, RotateCcw
} from 'lucide-react';

interface TimelineManagerProps {
  project: SavedProject;
  onUpdate?: () => void;
}

export default function TimelineManager({ project, onUpdate }: TimelineManagerProps) {
  const [viewMode, setViewMode] = useState<'gantt' | 'list' | 'calendar'>('list');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddPhase, setShowAddPhase] = useState(false);

  // Handle status updates
  const handleMilestoneStatusUpdate = (milestoneId: string, newStatus: ProjectMilestone['status']) => {
    updateMilestoneStatus(project.id, milestoneId, newStatus);
    onUpdate?.();
  };

  const handlePhaseStatusUpdate = (phaseId: string, newStatus: ProjectPhase['status']) => {
    updatePhaseStatus(project.id, phaseId, newStatus);
    onUpdate?.();
  };

  const getNextStatus = (currentStatus: string): string => {
    switch (currentStatus) {
      case 'not-started':
        return 'in-progress';
      case 'in-progress':
        return 'completed';
      case 'delayed':
        return 'in-progress';
      case 'completed':
        return 'not-started'; // Allow reset
      default:
        return 'in-progress';
    }
  };

  const getStatusAction = (currentStatus: string): { label: string; icon: React.ComponentType<{ className?: string }>; color: string } => {
    switch (currentStatus) {
      case 'not-started':
        return { label: 'Start', icon: Play, color: 'text-green-600 hover:text-green-700' };
      case 'in-progress':
        return { label: 'Complete', icon: CheckCircle, color: 'text-blue-600 hover:text-blue-700' };
      case 'delayed':
        return { label: 'Resume', icon: Play, color: 'text-yellow-600 hover:text-yellow-700' };
      case 'completed':
        return { label: 'Reset', icon: RotateCcw, color: 'text-gray-600 hover:text-gray-700' };
      default:
        return { label: 'Update', icon: ArrowRight, color: 'text-gray-600 hover:text-gray-700' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysFromNow = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Play className="h-5 w-5 text-blue-600" />;
      case 'delayed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getDateStatus = (dateString: string, status: string) => {
    const daysFromNow = getDaysFromNow(dateString);

    if (status === 'completed') return 'completed';
    if (daysFromNow < 0) return 'overdue';
    if (daysFromNow <= 7) return 'due-soon';
    return 'upcoming';
  };

  const getDateStatusColor = (dateStatus: string) => {
    switch (dateStatus) {
      case 'completed':
        return 'text-green-600';
      case 'overdue':
        return 'text-red-600';
      case 'due-soon':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const totalPhases = project.project.currentSchedule.phases.length;
  const completedPhases = project.project.currentSchedule.phases.filter(p => p.status === 'completed').length;
  const totalMilestones = project.project.currentSchedule.milestones.length;
  const completedMilestones = project.project.currentSchedule.milestones.filter(m => m.status === 'completed').length;

  const projectProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const phaseProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

  const renderListView = () => (
    <div className="space-y-8">
      {/* Project Timeline Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Project Timeline Overview</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Start: {formatDate(project.project.baselineSchedule.startDate)}</span>
            <span>•</span>
            <span>End: {formatDate(project.project.baselineSchedule.endDate)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{projectProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${projectProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {completedMilestones} of {totalMilestones} milestones completed
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Phase Progress</span>
              <span className="text-sm text-gray-600">{phaseProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${phaseProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {completedPhases} of {totalPhases} phases completed
            </p>
          </div>
        </div>
      </div>

      {/* Project Phases */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Project Phases</h3>
          <button
            onClick={() => setShowAddPhase(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Phase
          </button>
        </div>

        {project.project.currentSchedule.phases.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {project.project.currentSchedule.phases.map((phase) => {
              const dateStatus = getDateStatus(phase.endDate, phase.status);
              const daysFromEnd = getDaysFromNow(phase.endDate);

              return (
                <div key={phase.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(phase.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{phase.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${PHASE_STATUS_COLORS[phase.status]}`}>
                            {phase.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{phase.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <p className="font-medium">
                              {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                            </p>
                            {dateStatus === 'overdue' && (
                              <p className="text-red-600 text-xs">
                                Overdue by {Math.abs(daysFromEnd)} days
                              </p>
                            )}
                            {dateStatus === 'due-soon' && (
                              <p className="text-yellow-600 text-xs">
                                Due in {daysFromEnd} days
                              </p>
                            )}
                          </div>

                          <div>
                            <span className="text-gray-500">Budget:</span>
                            <p className="font-medium">
                              ${phase.budgetAllocated.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              ${phase.budgetUsed.toLocaleString()} used
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">Progress:</span>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    phase.status === 'completed' ? 'bg-green-600' :
                                    phase.status === 'in-progress' ? 'bg-blue-600' :
                                    phase.status === 'delayed' ? 'bg-red-600' :
                                    'bg-gray-400'
                                  }`}
                                  style={{
                                    width: `${
                                      phase.status === 'completed' ? 100 :
                                      phase.status === 'in-progress' ? 50 :
                                      phase.status === 'delayed' ? 75 :
                                      0
                                    }%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">
                                {phase.status === 'completed' ? '100' :
                                 phase.status === 'in-progress' ? '50' :
                                 phase.status === 'delayed' ? '75' :
                                 '0'}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {(() => {
                        const action = getStatusAction(phase.status);
                        const ActionIcon = action.icon;
                        return (
                          <button
                            onClick={() => handlePhaseStatusUpdate(phase.id, getNextStatus(phase.status) as ProjectPhase['status'])}
                            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${action.color} border border-gray-300 hover:border-gray-400`}
                            title={`${action.label} this phase`}
                          >
                            <ActionIcon className="h-4 w-4 mr-1" />
                            {action.label}
                          </button>
                        );
                      })()}
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Phases Defined</h3>
            <p className="text-gray-600 mb-6">
              Break your project into phases to better track progress and manage resources.
            </p>
            <button
              onClick={() => setShowAddPhase(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Phase
            </button>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
          <button
            onClick={() => setShowAddMilestone(true)}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </button>
        </div>

        {project.project.currentSchedule.milestones.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {project.project.currentSchedule.milestones.map((milestone) => {
              const dateStatus = getDateStatus(milestone.date, milestone.status);
              const daysFromDate = getDaysFromNow(milestone.date);

              return (
                <div key={milestone.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(milestone.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm">
                          <span className={`font-medium ${getDateStatusColor(dateStatus)}`}>
                            {formatDate(milestone.date)}
                          </span>
                          {dateStatus === 'overdue' && (
                            <span className="text-red-600">
                              Overdue by {Math.abs(daysFromDate)} days
                            </span>
                          )}
                          {dateStatus === 'due-soon' && (
                            <span className="text-yellow-600">
                              Due in {daysFromDate} days
                            </span>
                          )}
                          {milestone.dependencies.length > 0 && (
                            <span className="text-gray-500">
                              {milestone.dependencies.length} dependencies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${MILESTONE_STATUS_COLORS[milestone.status]}`}>
                        {milestone.status.replace('-', ' ')}
                      </span>
                      {(() => {
                        const action = getStatusAction(milestone.status);
                        const ActionIcon = action.icon;
                        return (
                          <button
                            onClick={() => handleMilestoneStatusUpdate(milestone.id, getNextStatus(milestone.status) as ProjectMilestone['status'])}
                            className={`flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${action.color} border border-gray-300 hover:border-gray-400`}
                            title={`${action.label} this milestone`}
                          >
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {action.label}
                          </button>
                        );
                      })()}
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones Defined</h3>
            <p className="text-gray-600 mb-6">
              Add key milestones to track important project deliverables and deadlines.
            </p>
            <button
              onClick={() => setShowAddMilestone(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Milestone
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Project Timeline</h2>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'gantt'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Gantt Chart
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'list' && renderListView()}

      {viewMode === 'gantt' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gantt Chart View</h3>
          <p className="text-gray-600">Interactive Gantt chart coming soon...</p>
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar View</h3>
          <p className="text-gray-600">Calendar timeline view coming soon...</p>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Milestone</h3>
              <p className="text-gray-600 mb-6">
                Milestone management interface coming soon...
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddMilestone(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Phase Modal */}
      {showAddPhase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Phase</h3>
              <p className="text-gray-600 mb-6">
                Phase management interface coming soon...
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddPhase(false)}
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