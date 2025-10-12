'use client';

import React, { useState, useEffect } from 'react';
import { SavedProject, GanttTask, GanttChartConfig } from '@/types/project';
import { Calendar, ZoomIn, ZoomOut, Settings, Download, Maximize2 } from 'lucide-react';

interface GanttChartProps {
  project: SavedProject;
}

export default function GanttChart({ project }: GanttChartProps) {
  const [config, setConfig] = useState<GanttChartConfig>({
    showCriticalPath: true,
    showMilestones: true,
    showDependencies: true,
    timeUnit: 'week',
    startDate: new Date(project.project.baselineSchedule.startDate),
    endDate: new Date(project.project.baselineSchedule.endDate)
  });

  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);


  useEffect(() => {
    const generateGanttTasks = () => {
      const ganttTasks: GanttTask[] = [];

      // Add phases as tasks
      project.project.currentSchedule.phases.forEach((phase, index) => {
        const progress = phase.status === 'completed' ? 100 :
                        phase.status === 'in-progress' ? 50 :
                        phase.status === 'delayed' ? 25 : 0;

        ganttTasks.push({
          id: phase.id,
          name: phase.name,
          start: new Date(phase.startDate),
          end: new Date(phase.endDate),
          progress,
          dependencies: [],
          type: 'phase',
          color: getPhaseColor(phase.status),
          linkedEntityId: phase.id,
          critical: index === 0 || phase.status === 'delayed'
        });
      });

      // Add milestones as tasks
      project.project.currentSchedule.milestones.forEach(milestone => {
        const progress = milestone.status === 'completed' ? 100 :
                        milestone.status === 'in-progress' ? 50 : 0;

        ganttTasks.push({
          id: milestone.id,
          name: milestone.name,
          start: new Date(milestone.date),
          end: new Date(milestone.date),
          progress,
          dependencies: milestone.dependencies,
          type: 'milestone',
          color: getMilestoneColor(milestone.status),
          linkedEntityId: milestone.id,
          critical: milestone.status === 'delayed'
        });
      });

      setTasks(ganttTasks);
    };

    generateGanttTasks();
  }, [project]);

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'delayed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in-progress': return '#2563eb';
      case 'delayed': return '#dc2626';
      default: return '#4b5563';
    }
  };

  const getTimelineUnits = () => {
    const start = config.startDate;
    const end = config.endDate;
    const units = [];

    if (config.timeUnit === 'day') {
      const current = new Date(start);
      while (current <= end) {
        units.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (config.timeUnit === 'week') {
      const current = new Date(start);
      // Start from beginning of week
      current.setDate(current.getDate() - current.getDay());
      while (current <= end) {
        units.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }
    } else if (config.timeUnit === 'month') {
      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      while (current <= end) {
        units.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
    }

    return units;
  };

  const getTaskPosition = (task: GanttTask) => {
    const totalDuration = config.endDate.getTime() - config.startDate.getTime();
    const taskStart = Math.max(task.start.getTime(), config.startDate.getTime());
    const taskEnd = Math.min(task.end.getTime(), config.endDate.getTime());

    const leftPercent = ((taskStart - config.startDate.getTime()) / totalDuration) * 100;
    const widthPercent = ((taskEnd - taskStart) / totalDuration) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 0.5)}%`
    };
  };

  const timelineUnits = getTimelineUnits();
  const rowHeight = 40;
  const headerHeight = 60;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 bg-white z-50 p-8' : ''}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gantt Chart</h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={config.showCriticalPath}
                onChange={(e) => setConfig(prev => ({ ...prev, showCriticalPath: e.target.checked }))}
                className="mr-2"
              />
              Critical Path
            </label>
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={config.showMilestones}
                onChange={(e) => setConfig(prev => ({ ...prev, showMilestones: e.target.checked }))}
                className="mr-2"
              />
              Milestones
            </label>
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={config.showDependencies}
                onChange={(e) => setConfig(prev => ({ ...prev, showDependencies: e.target.checked }))}
                className="mr-2"
              />
              Dependencies
            </label>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <select
            value={config.timeUnit}
            onChange={(e) => setConfig(prev => ({ ...prev, timeUnit: e.target.value as 'day' | 'week' | 'month' }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>

          <div className="flex items-center space-x-1">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Download className="h-4 w-4" />
          </button>

          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings className="h-4 w-4" />
          </button>

          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
            >
              Exit Fullscreen
            </button>
          )}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {tasks.length > 0 ? (
          <div className="flex">
            {/* Task Names Column */}
            <div className="w-80 border-r border-gray-200 bg-gray-50">
              {/* Header */}
              <div
                className="border-b border-gray-200 px-4 py-3 bg-gray-100 font-medium text-gray-900"
                style={{ height: headerHeight }}
              >
                Task Name
              </div>

              {/* Task Rows */}
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="border-b border-gray-200 px-4 py-2 flex items-center hover:bg-gray-100 transition-colors"
                  style={{ height: rowHeight }}
                >
                  <div className="flex items-center space-x-2">
                    {task.type === 'milestone' ? (
                      <div
                        className="w-3 h-3 transform rotate-45 border-2"
                        style={{ borderColor: task.color, backgroundColor: task.color }}
                      />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: task.color }}
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {task.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Column */}
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Timeline Header */}
                <div
                  className="border-b border-gray-200 bg-gray-100 flex"
                  style={{ height: headerHeight }}
                >
                  {timelineUnits.map((unit, index) => (
                    <div
                      key={index}
                      className="flex-1 border-r border-gray-200 px-2 py-3 text-xs text-gray-600 text-center"
                    >
                      {config.timeUnit === 'day' && unit.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {config.timeUnit === 'week' && `Week ${Math.ceil((unit.getTime() - config.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`}
                      {config.timeUnit === 'month' && unit.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  ))}
                </div>

                {/* Timeline Body */}
                <div className="relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex">
                    {timelineUnits.map((_, index) => (
                      <div
                        key={index}
                        className="flex-1 border-r border-gray-100"
                      />
                    ))}
                  </div>

                  {/* Task Bars */}
                  {tasks.map((task) => {
                    const position = getTaskPosition(task);

                    return (
                      <div
                        key={task.id}
                        className="relative border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        style={{ height: rowHeight }}
                      >
                        {task.type === 'milestone' ? (
                          // Milestone Diamond
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rotate-45 border-2 z-10"
                            style={{
                              left: position.left,
                              borderColor: task.color,
                              backgroundColor: task.color
                            }}
                            title={`${task.name} - ${task.start.toLocaleDateString()}`}
                          />
                        ) : (
                          // Task Bar
                          <div
                            className="absolute top-2 bottom-2 rounded-sm flex items-center px-2 z-10 cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                              left: position.left,
                              width: position.width,
                              backgroundColor: task.color
                            }}
                            title={`${task.name} - ${task.progress}% complete`}
                          >
                            {/* Progress Bar */}
                            <div
                              className="absolute inset-0 bg-white bg-opacity-30 rounded-sm"
                              style={{ width: `${task.progress}%` }}
                            />

                            {/* Task Label */}
                            <span className="text-xs text-white font-medium truncate relative z-10">
                              {parseFloat(position.width) > 10 ? task.name : ''}
                            </span>

                            {/* Critical Path Indicator */}
                            {config.showCriticalPath && task.critical && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                          </div>
                        )}

                        {/* Dependencies */}
                        {config.showDependencies && task.dependencies.length > 0 && (
                          <div className="absolute top-1/2 left-0 w-2 h-px bg-gray-400" />
                        )}
                      </div>
                    );
                  })}

                  {/* Today Line */}
                  <div className="absolute inset-y-0 border-l-2 border-red-500 pointer-events-none">
                    <div
                      style={{
                        left: `${((new Date().getTime() - config.startDate.getTime()) / (config.endDate.getTime() - config.startDate.getTime())) * 100}%`
                      }}
                    >
                      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
                      <div className="absolute top-0 left-0 text-xs text-red-600 font-medium transform -translate-x-1/2 -translate-y-6">
                        Today
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Data</h3>
            <p className="text-gray-600">
              Add phases and milestones to your project to visualize the timeline.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-blue-600 rounded-sm" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-green-600 rounded-sm" />
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-red-600 rounded-sm" />
              <span>Delayed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-gray-600 rounded-sm" />
              <span>Not Started</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 transform rotate-45" />
              <span>Milestone</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Critical</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-px h-4 bg-red-500" />
              <span>Today</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}