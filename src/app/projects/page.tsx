'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllProjects,
  searchProjects
} from '@/lib/project-storage';
import { SavedProject, ProjectFilter, ProjectStatus, ProjectPriority } from '@/types/project';
import ProjectCreationWizard from '@/components/project/ProjectCreationWizard';
import DemoModeToggle from '@/components/demo/DemoModeToggle';
import {
  Building2, Plus, Search, Filter, Calendar, DollarSign,
  Users, MapPin, TrendingUp, AlertTriangle,
  Eye, Edit, Archive, MoreHorizontal, Target
} from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProjectFilter>({});

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    // Apply search and filters
    const result = searchProjects(searchQuery, filters);
    setFilteredProjects(result.projects);
  }, [searchQuery, filters, projects]);

  const loadProjects = () => {
    setIsLoading(true);
    try {
      const allProjects = getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = (projectId: string) => {
    setShowCreateWizard(false);
    loadProjects();
    router.push(`/projects/${projectId}`);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: ProjectPriority) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-600';
      case 'medium': return 'bg-blue-100 text-blue-600';
      case 'high': return 'bg-orange-100 text-orange-600';
      case 'critical': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'construction': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'design': return <Target className="h-4 w-4 text-purple-600" />;
      case 'trade': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'mixed': return <Users className="h-4 w-4 text-orange-600" />;
      default: return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateProjectProgress = (project: SavedProject) => {
    const completedMilestones = project.timeline.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = project.timeline.milestones.length;
    return totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  };

  const getProjectStats = () => {
    const totalBudget = projects.reduce((sum, p) => sum + p.budget.totalBudget, 0);
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const upcomingMilestones = projects.reduce((count, p) => {
      const upcoming = p.timeline.milestones.filter(m =>
        m.status === 'pending' &&
        new Date(m.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );
      return count + upcoming.length;
    }, 0);

    return { totalBudget, activeProjects, upcomingMilestones };
  };

  const stats = getProjectStats();

  if (showCreateWizard) {
    return (
      <ProjectCreationWizard
        onComplete={handleCreateProject}
        onCancel={() => setShowCreateWizard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                Levelr
              </div>
              <div className="ml-8 text-gray-400">/</div>
              <div className="ml-8">
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/analyze')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Back to Analysis
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Mode Toggle */}
        <div className="mb-8">
          <DemoModeToggle variant="compact" onToggle={loadProjects} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Milestones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingMilestones}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                showFilters
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>

          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status?.[0] || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    status: e.target.value ? [e.target.value as ProjectStatus] : undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discipline</label>
                <select
                  value={filters.discipline?.[0] || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    discipline: e.target.value ? [e.target.value as 'construction' | 'design' | 'trade'] : undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Disciplines</option>
                  <option value="construction">Construction</option>
                  <option value="design">Design</option>
                  <option value="trade">Trade</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority?.[0] || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priority: e.target.value ? [e.target.value as ProjectPriority] : undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({})}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {projects.length === 0 ? (
              <div>
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">Create your first project to get started with comprehensive project management.</p>
                <button
                  onClick={() => setShowCreateWizard(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div>
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const progress = calculateProjectProgress(project);
              const upcomingMilestones = project.timeline.milestones.filter(m =>
                m.status === 'pending' &&
                new Date(m.dueDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              );

              return (
                <div key={project.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getDisciplineIcon(project.discipline)}
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center text-gray-500 text-sm">
                        <MapPin className="h-3 w-3 mr-1" />
                        {project.location.city}, {project.location.state}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Budget Info */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Budget</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(project.budget.totalBudget)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Spent: {formatCurrency(project.budget.spentBudget)}</span>
                        <span>
                          {project.budget.totalBudget > 0
                            ? Math.round((project.budget.spentBudget / project.budget.totalBudget) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">RFPs</p>
                        <p className="font-medium">{project.rfps.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Team</p>
                        <p className="font-medium">{project.team.members.length + 1}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Start Date</p>
                        <p className="font-medium">{new Date(project.timeline.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium">
                          {Math.ceil((new Date(project.timeline.endDate).getTime() - new Date(project.timeline.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>

                    {/* Upcoming Milestones Alert */}
                    {upcomingMilestones.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            {upcomingMilestones.length} milestone{upcomingMilestones.length > 1 ? 's' : ''} due soon
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}