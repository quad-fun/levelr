'use client';

import React, { useState, useMemo } from 'react';
import { SavedProject } from '@/types/project';
import { Calendar, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GanttChartProps {
  project: SavedProject;
  onUpdate?: () => void;
}

type ViewMode = 'days' | 'weeks' | 'months';

export default function GanttChart({ project }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('weeks');

  // Calculate timeline dimensions
  const projectStart = useMemo(() => new Date(project.project.baselineSchedule.startDate), [project.project.baselineSchedule.startDate]);
  const projectEnd = useMemo(() => new Date(project.project.baselineSchedule.endDate), [project.project.baselineSchedule.endDate]);
  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));

  // Generate timeline columns based on view mode
  const timelineColumns = useMemo(() => {
    const columns = [];
    const current = new Date(projectStart);

    while (current <= projectEnd) {
      if (viewMode === 'days') {
        columns.push({
          date: new Date(current),
          label: current.getDate().toString(),
          isWeekend: current.getDay() === 0 || current.getDay() === 6
        });
        current.setDate(current.getDate() + 1);
      } else if (viewMode === 'weeks') {
        columns.push({
          date: new Date(current),
          label: `W${getWeekNumber(current)}`,
          isWeekend: false
        });
        current.setDate(current.getDate() + 7);
      } else {
        columns.push({
          date: new Date(current),
          label: current.toLocaleDateString('en-US', { month: 'short' }),
          isWeekend: false
        });
        current.setMonth(current.getMonth() + 1);
      }
    }
    return columns;
  }, [projectStart, projectEnd, viewMode]);

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const calculateBarPosition = (itemStart: string, itemEnd: string) => {
    const start = new Date(itemStart);
    const end = new Date(itemEnd);

    const startOffset = Math.max(0, (start.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const columnWidth = viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120;
    const pixelsPerDay = columnWidth / (viewMode === 'days' ? 1 : viewMode === 'weeks' ? 7 : 30);

    return {
      left: startOffset * pixelsPerDay,
      width: Math.max(duration * pixelsPerDay, 10) // Minimum 10px width
    };
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'delayed':
        return 'bg-red-500';
      case 'not-started':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const phases = project.project.currentSchedule.phases;
  const milestones = project.project.currentSchedule.milestones;

  const columnWidth = viewMode === 'days' ? 40 : viewMode === 'weeks' ? 80 : 120;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
            <span className="text-sm text-gray-600">
              {totalDays} days • {phases.length} phases • {milestones.length} milestones
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Controls */}
            <div className="flex rounded-lg border border-gray-300 p-1">
              {(['days', 'weeks', 'months'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode(viewMode === 'months' ? 'weeks' : viewMode === 'weeks' ? 'days' : 'days')}
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'days' ? 'weeks' : viewMode === 'weeks' ? 'months' : 'months')}
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('weeks')}
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded"
                title="Reset View"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Timeline Header */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {/* Task Name Column */}
              <div className="w-64 px-4 py-3 border-r border-gray-200 font-medium text-gray-900">
                Task
              </div>

              {/* Timeline Columns */}
              <div className="flex">
                {timelineColumns.map((col, index) => (
                  <div
                    key={index}
                    className={`px-2 py-3 border-r border-gray-200 text-center text-sm font-medium ${
                      col.isWeekend ? 'bg-gray-100 text-gray-500' : 'text-gray-700'
                    }`}
                    style={{ minWidth: `${columnWidth}px` }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phases */}
          <div className="divide-y divide-gray-100">
            {phases.map((phase) => (
              <div key={phase.id} className="relative">
                <div className="flex">
                  {/* Phase Name */}
                  <div className="w-64 px-4 py-4 border-r border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getPhaseColor(phase.status)}`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{phase.name}</p>
                        <p className="text-xs text-gray-600">{phase.status.replace('-', ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Area */}
                  <div className="flex-1 relative" style={{ height: '64px' }}>
                    {/* Grid Lines */}
                    {timelineColumns.map((_, index) => (
                      <div
                        key={index}
                        className="absolute top-0 bottom-0 border-r border-gray-100"
                        style={{ left: `${index * columnWidth}px` }}
                      ></div>
                    ))}

                    {/* Phase Bar */}
                    <div
                      className={`absolute top-4 h-6 rounded ${getPhaseColor(phase.status)} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                      style={calculateBarPosition(phase.startDate, phase.endDate)}
                      title={`${phase.name}: ${phase.startDate} - ${phase.endDate}`}
                    >
                      <div className="h-full flex items-center px-2">
                        <span className="text-white text-xs font-medium truncate">
                          {phase.name}
                        </span>
                      </div>
                    </div>

                    {/* Milestones for this phase */}
                    {milestones
                      .filter(milestone => phase.milestoneIds.includes(milestone.id))
                      .map((milestone) => {
                        const milestoneDate = new Date(milestone.date);
                        const dayOffset = (milestoneDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
                        const pixelsPerDay = columnWidth / (viewMode === 'days' ? 1 : viewMode === 'weeks' ? 7 : 30);

                        return (
                          <div
                            key={milestone.id}
                            className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                            style={{ left: `${dayOffset * pixelsPerDay}px` }}
                            title={`${milestone.name}: ${milestone.date}`}
                          >
                            <div className={`w-3 h-3 rotate-45 ${
                              milestone.status === 'completed' ? 'bg-green-600' :
                              milestone.status === 'in-progress' ? 'bg-blue-600' :
                              milestone.status === 'delayed' ? 'bg-red-600' :
                              'bg-gray-400'
                            }`}></div>
                            <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">
                              {milestone.name}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Delayed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <span>Not Started</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rotate-45"></div>
                <span>Milestones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}