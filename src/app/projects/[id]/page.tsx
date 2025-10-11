'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getProject,
  generateGanttData,
  generateProjectAnalytics,
  updateMilestone,
  awardBid
} from '@/lib/project-storage';
import { SavedProject, GanttData, ProjectAnalytics } from '@/types/project';
import ProjectDashboard from '@/components/project/ProjectDashboard';
import ProjectGanttChart from '@/components/project/ProjectGanttChart';
import ProjectBudgetTracker from '@/components/project/ProjectBudgetTracker';
import ProjectRFPManager from '@/components/project/ProjectRFPManager';
import ProjectTeamManager from '@/components/project/ProjectTeamManager';
import {
  ArrowLeft, BarChart3, Calendar, DollarSign, FileText,
  Users, Settings, TrendingUp, AlertCircle
} from 'lucide-react';

type TabType = 'dashboard' | 'timeline' | 'budget' | 'rfps' | 'team' | 'analytics';

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<SavedProject | null>(null);
  const [ganttData, setGanttData] = useState<GanttData | null>(null);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projectData = getProject(projectId);
      if (!projectData) {
        setError('Project not found');
        return;
      }

      setProject(projectData);

      // Generate Gantt chart data
      const gantt = generateGanttData(projectData);
      setGanttData(gantt);

      // Generate analytics
      const analyticsData = generateProjectAnalytics(projectId);
      setAnalytics(analyticsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      console.error('Error loading project:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const handleMilestoneUpdate = async (milestoneId: string, updates: Partial<SavedProject>) => {
    if (!project) return;

    try {
      const milestone = project.timeline.milestones.find(m => m.id === milestoneId);
      if (milestone) {
        const updatedMilestone = { ...milestone, ...updates };
        await updateMilestone(project.id, updatedMilestone);
        loadProject(); // Reload to get updated data
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const handleBidAward = async (rfpId: string, bidId: string) => {
    if (!project) return;

    try {
      await awardBid(project.id, rfpId, bidId);
      loadProject(); // Reload to get updated data
    } catch (error) {
      console.error('Error awarding bid:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'timeline', name: 'Timeline', icon: Calendar },
    { id: 'budget', name: 'Budget', icon: DollarSign },
    { id: 'rfps', name: 'RFPs & Bids', icon: FileText },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested project could not be found.'}</p>
          <button
            onClick={() => router.push('/projects')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'construction': return '🏗️';
      case 'design': return '📐';
      case 'trade': return '⚡';
      case 'mixed': return '🔧';
      default: return '🏗️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/projects')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="text-2xl font-bold text-blue-600">
                Levelr
              </div>
              <div className="ml-8 text-gray-400">/</div>
              <button
                onClick={() => router.push('/projects')}
                className="ml-8 text-gray-600 hover:text-blue-600"
              >
                Projects
              </button>
              <div className="ml-4 text-gray-400">/</div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Project Info Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getDisciplineIcon(project.discipline)}</span>
                <div>
                  <p className="text-sm text-gray-600">Project Type</p>
                  <p className="font-medium capitalize">{project.discipline} • {project.projectType.replace('_', ' ')}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{project.location.city}, {project.location.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-medium">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(project.budget.totalBudget)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Timeline</p>
                <p className="font-medium">
                  {new Date(project.timeline.startDate).toLocaleDateString()} - {new Date(project.timeline.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <ProjectDashboard
            project={project}
            analytics={analytics}
            onMilestoneUpdate={handleMilestoneUpdate}
            onBidAward={handleBidAward}
          />
        )}

        {activeTab === 'timeline' && ganttData && (
          <ProjectGanttChart
            project={project}
            ganttData={ganttData}
            onMilestoneUpdate={handleMilestoneUpdate}
          />
        )}

        {activeTab === 'budget' && (
          <ProjectBudgetTracker
            project={project}
            onBudgetUpdate={() => loadProject()}
          />
        )}

        {activeTab === 'rfps' && (
          <ProjectRFPManager
            project={project}
            onRFPUpdate={() => loadProject()}
            onBidAward={handleBidAward}
          />
        )}

        {activeTab === 'team' && (
          <ProjectTeamManager
            project={project}
            onTeamUpdate={() => loadProject()}
          />
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Analytics</h2>

              {/* Analytics will be implemented in a separate component */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{analytics.rfpMetrics.totalRFPs}</p>
                    <p className="text-gray-600">Total RFPs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{analytics.rfpMetrics.averageBidCount.toFixed(1)}</p>
                    <p className="text-gray-600">Avg Bids per RFP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{analytics.rfpMetrics.awardRate.toFixed(1)}%</p>
                    <p className="text-gray-600">Award Rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Coming Soon</h3>
                <p className="text-yellow-700">
                  Advanced analytics including budget variance charts, schedule performance indicators,
                  risk trend analysis, and predictive project completion forecasts.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}