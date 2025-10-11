'use client';

import React, { useState } from 'react';
import { SavedProject, GanttData } from '@/types/project';
import {
  Calendar, Target, CheckCircle, Play, Settings
} from 'lucide-react';

interface ProjectGanttChartProps {
  project: SavedProject;
  ganttData: GanttData;
  onMilestoneUpdate: (milestoneId: string, updates: Record<string, unknown>) => void;
}

export default function ProjectGanttChart({
  project: _project,
  ganttData,
  onMilestoneUpdate
}: ProjectGanttChartProps) {
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const formatDate = (date: Date) => date.toLocaleDateString();

  const getTaskColor = (task: Record<string, unknown>) => {
    if (task.type === 'milestone') return task.critical ? '#EF4444' : '#10B981';
    if (task.type === 'project') return '#3B82F6';
    return task.color || '#8B5CF6';
  };

  const calculateTimelinePosition = (date: Date) => {
    const projectStart = ganttData.projectStart;
    const projectEnd = ganttData.projectEnd;
    const totalDuration = projectEnd.getTime() - projectStart.getTime();
    const elapsed = date.getTime() - projectStart.getTime();
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  const calculateTaskWidth = (start: Date, end: Date) => {
    const projectStart = ganttData.projectStart;
    const projectEnd = ganttData.projectEnd;
    const totalDuration = projectEnd.getTime() - projectStart.getTime();
    const taskDuration = end.getTime() - start.getTime();
    return Math.max(1, (taskDuration / totalDuration) * 100);
  };

  const generateTimelineMarkers = () => {
    const markers = [];
    const start = new Date(ganttData.projectStart);
    const end = new Date(ganttData.projectEnd);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    let interval = 1;
    let unit = 'day';

    if (viewMode === 'weeks') {
      interval = 7;
      unit = 'week';
    } else if (viewMode === 'months') {
      interval = 30;
      unit = 'month';
    }

    for (let i = 0; i <= totalDays; i += interval) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      if (date <= end) {
        markers.push({
          date,
          position: calculateTimelinePosition(date),
          label: viewMode === 'days' ? date.getDate().toString() :
                 viewMode === 'weeks' ? `W${Math.ceil((i + 1) / 7)}` :
                 date.toLocaleDateString('en-US', { month: 'short' })
        });
      }
    }

    return markers;
  };

  const timelineMarkers = generateTimelineMarkers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Timeline</h2>
          <p className="text-gray-600 mt-1">
            Gantt chart view of milestones, RFPs, and critical path
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'days' | 'weeks' | 'months')}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
          <button className="flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Settings className="h-4 w-4 mr-1" />
            Options
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Timeline Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <h3 className="font-semibold text-gray-900">Task / Milestone</h3>
            </div>
            <div className="col-span-8">
              <div className="relative h-8">
                {/* Timeline markers */}
                {timelineMarkers.map((marker, index: _index) => (
                  <div
                    key={index}
                    className="absolute top-0 text-xs text-gray-600"
                    style={{ left: `${marker.position}%` }}
                  >
                    <div className="w-px h-8 bg-gray-300"></div>
                    <span className="absolute -bottom-5 left-0 transform -translate-x-1/2">
                      {marker.label}
                    </span>
                  </div>
                ))}

                {/* Today marker */}
                <div
                  className="absolute top-0 w-px h-8 bg-red-500"
                  style={{ left: `${calculateTimelinePosition(new Date())}%` }}
                >
                  <div className="absolute -top-1 left-0 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Rows */}
        <div className="max-h-96 overflow-y-auto">
          {ganttData.tasks.map((task, index: _index) => {
            const isSelected = selectedTask === task.id;
            const leftPosition = calculateTimelinePosition(task.start);
            const width = calculateTaskWidth(task.start, task.end);

            return (
              <div
                key={task.id}
                className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedTask(isSelected ? null : task.id)}
              >
                {/* Task Info */}
                <div className="col-span-4 flex items-center space-x-3">
                  {task.type === 'milestone' ? (
                    <Target className={`h-4 w-4 ${task.critical ? 'text-red-600' : 'text-green-600'}`} />
                  ) : task.type === 'project' ? (
                    <Calendar className="h-4 w-4 text-blue-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{task.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{formatDate(task.start)} - {formatDate(task.end)}</span>
                      {task.critical && (
                        <span className="px-1 py-0.5 bg-red-100 text-red-700 text-xs rounded">Critical</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gantt Bar */}
                <div className="col-span-8 relative h-8 flex items-center">
                  <div className="w-full h-2 bg-gray-200 rounded-full relative">
                    {/* Task bar */}
                    <div
                      className="absolute h-2 rounded-full flex items-center justify-center text-xs text-white font-medium"
                      style={{
                        left: `${leftPosition}%`,
                        width: `${width}%`,
                        backgroundColor: getTaskColor(task),
                        minWidth: '20px'
                      }}
                    >
                      {task.type === 'milestone' && (
                        <div
                          className="w-3 h-3 transform rotate-45 border-2 border-white"
                          style={{ backgroundColor: getTaskColor(task) }}
                        />
                      )}
                    </div>

                    {/* Progress bar */}
                    {task.progress > 0 && (
                      <div
                        className="absolute h-2 bg-green-600 rounded-full opacity-80"
                        style={{
                          left: `${leftPosition}%`,
                          width: `${(width * task.progress) / 100}%`
                        }}
                      />
                    )}

                    {/* Dependencies */}
                    {task.dependencies.map((depId, depIndex) => {
                      const depTask = ganttData.tasks.find(t => t.id === depId);
                      if (!depTask) return null;

                      const depEndPosition = calculateTimelinePosition(depTask.end);

                      return (
                        <svg
                          key={depIndex}
                          className="absolute top-0 left-0 w-full h-full pointer-events-none"
                          style={{ zIndex: 1 }}
                        >
                          <line
                            x1={`${depEndPosition}%`}
                            y1="50%"
                            x2={`${leftPosition}%`}
                            y2="50%"
                            stroke="#6B7280"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            markerEnd="url(#arrowhead)"
                          />
                        </svg>
                      );
                    })}
                  </div>

                  {/* Progress percentage */}
                  <span className="ml-3 text-sm text-gray-600">{task.progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Panel */}
      {selectedTask && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {(() => {
            const task = ganttData.tasks.find(t => t.id === selectedTask);
            if (!task) return null;

            return (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                    <p className="text-gray-600">
                      {task.type === 'milestone' ? 'Milestone' : task.type === 'project' ? 'Project' : 'Task'}
                      {task.critical && <span className="ml-2 text-red-600">(Critical Path)</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Start: {formatDate(task.start)}</p>
                      <p>End: {formatDate(task.end)}</p>
                      <p>Duration: {Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24))} days</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completion</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Dependencies</h4>
                    {task.dependencies.length === 0 ? (
                      <p className="text-sm text-gray-600">No dependencies</p>
                    ) : (
                      <div className="space-y-1">
                        {task.dependencies.map((depId) => {
                          const depTask = ganttData.tasks.find(t => t.id === depId);
                          return depTask ? (
                            <p key={depId} className="text-sm text-gray-600">• {depTask.name}</p>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {task.type === 'milestone' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Actions</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onMilestoneUpdate(task.id, { status: 'in_progress' })}
                          className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </button>
                        <button
                          onClick={() => onMilestoneUpdate(task.id, { status: 'completed', progress: 100 })}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-2 bg-blue-600 rounded"></div>
            <span>Project</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 transform rotate-45"></div>
            <span>Milestone</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 transform rotate-45"></div>
            <span>Critical Milestone</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-2 bg-purple-600 rounded"></div>
            <span>RFP</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-px h-4 bg-red-500"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-px bg-gray-400" style={{ borderTop: '1px dashed' }}></div>
            <span>Dependency</span>
          </div>
        </div>
      </div>

      {/* SVG definitions for arrow markers */}
      <svg width="0" height="0">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}