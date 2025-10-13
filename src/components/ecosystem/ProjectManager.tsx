'use client';

import React, { useState, useEffect } from 'react';
import {
  getAllProjects,
  getProject,
  deleteProject,
  getProjectIntelligence
} from '@/lib/storage';
import { SavedProject, PROJECT_STATUS_COLORS } from '@/types/project';
import ProjectCreator from './ProjectCreator';
import ProjectDashboard from './ProjectDashboard';
import {
  Plus, Search, Building2, DollarSign,
  TrendingUp, Eye, Trash2,
  Clock, Palette, Zap
} from 'lucide-react';

interface ProjectManagerProps {
  onCreateRFP?: (projectData?: {
    projectName: string;
    description: string;
    projectType: string;
    estimatedValue: number;
    location?: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
    };
    discipline?: 'construction' | 'design' | 'trade';
  }) => void;
  onAnalyzeProposal?: () => void;
}

export default function ProjectManager({ onCreateRFP, onAnalyzeProposal }: ProjectManagerProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'planning' | 'bidding' | 'pre-construction' | 'active' | 'completed'>('all');
  const [filterDiscipline, setFilterDiscipline] = useState<'all' | 'construction' | 'design' | 'trade'>('all');
  const [intelligence, setIntelligence] = useState<{
    totalProjects: number;
    averageProjectValue: number;
    averageDuration: number;
    disciplineBreakdown: Record<string, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const savedProjects = getAllProjects();
      const projectIntel = getProjectIntelligence();

      setProjects(savedProjects);
      setIntelligence(projectIntel);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectCreated = (projectId: string) => {
    setShowCreator(false);
    loadData();

    // Automatically open the newly created project
    const newProject = getProject(projectId);
    if (newProject) {
      setSelectedProject(newProject);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      deleteProject(id);
      loadData();

      // Close the project dashboard if it was the deleted project
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    }
  };

  const handleProjectUpdate = () => {
    loadData();
    // Refresh the selected project if one is open
    if (selectedProject) {
      const updatedProject = getProject(selectedProject.id);
      setSelectedProject(updatedProject);
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'construction': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'design': return <Palette className="h-4 w-4 text-purple-600" />;
      case 'trade': return <Zap className="h-4 w-4 text-green-600" />;
      default: return <Building2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case 'construction': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'design': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'trade': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDisciplineIcons = (disciplines: string[]) => {
    return disciplines.map((discipline, index) => (
      <span key={discipline} className={`inline-flex ${index > 0 ? 'ml-1' : ''}`}>
        {getDisciplineIcon(discipline)}
      </span>
    ));
  };


  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'LOW';
    if (score < 70) return 'MEDIUM';
    return 'HIGH';
  };

  const filteredProjects = projects.filter(project => {
    const statusMatch = filterStatus === 'all' || project.project.status === filterStatus;
    const disciplineMatch = filterDiscipline === 'all' || project.project.disciplines.includes(filterDiscipline);
    const searchMatch = searchTerm === '' ||
      project.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project.description.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && disciplineMatch && searchMatch;
  });

  if (showCreator) {
    return (
      <ProjectCreator
        onProjectCreated={handleProjectCreated}
        onCancel={() => setShowCreator(false)}
      />
    );
  }

  if (selectedProject) {
    return (
      <ProjectDashboard
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onUpdate={handleProjectUpdate}
        onCreateRFP={onCreateRFP ? () => {
          // Convert project data to RFP format and pass to callback
          const projectData = {
            projectName: selectedProject.project.name,
            description: selectedProject.project.description,
            projectType: selectedProject.project.projectType,
            estimatedValue: selectedProject.project.totalBudget,
            location: selectedProject.project.location ? {
              address: selectedProject.project.location.address,
              city: selectedProject.project.location.city,
              state: selectedProject.project.location.state,
              zipCode: selectedProject.project.location.zipCode
            } : undefined,
            discipline: selectedProject.project.disciplines.length > 0 ?
              selectedProject.project.disciplines[0] as 'construction' | 'design' | 'trade' : 'construction'
          };
          onCreateRFP(projectData);
        } : undefined}
        onAnalyzeProposal={onAnalyzeProposal}
      />
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Management</h1>
        <p className="text-gray-600">
          Manage your complete pre-construction project lifecycle with integrated RFP and bid management.
        </p>
      </div>

      {/* Stats Cards */}
      {intelligence && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{intelligence.totalProjects}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Project Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(intelligence.averageProjectValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(intelligence.averageDuration)} days
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.project.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'planning' | 'bidding' | 'pre-construction' | 'active' | 'completed')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="bidding">Bidding</option>
            <option value="pre-construction">Pre-Construction</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value as 'all' | 'construction' | 'design' | 'trade')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Disciplines</option>
            <option value="construction">Construction</option>
            <option value="design">Design Services</option>
            <option value="trade">Trade Services</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreator(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {projects.length === 0 ? 'No Projects Yet' : 'No Projects Found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {projects.length === 0
              ? 'Create your first project to start managing your pre-construction workflow.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => setShowCreator(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((savedProject) => {
            const project = savedProject.project;
            const metrics = savedProject.metrics;

            return (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedProject(savedProject)}
              >
                {/* Project Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {getDisciplineIcons(project.disciplines)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.disciplines.map(discipline => (
                            <span key={discipline} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDisciplineColor(discipline)}`}>
                              <span className="capitalize">{discipline}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(savedProject);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>

                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${PROJECT_STATUS_COLORS[project.status]}`}>
                      {project.status.replace('-', ' ')}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(metrics.riskScore)}`}>
                      {getRiskLevel(metrics.riskScore)} RISK
                    </span>
                  </div>
                </div>

                {/* Project Metrics */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(project.totalBudget)}</p>
                      <p className="text-xs text-gray-600">
                        {formatCurrency(metrics.committedBudget)} committed
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</p>
                      <p className="text-lg font-semibold text-gray-900">{metrics.completionPercentage.toFixed(0)}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${metrics.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{metrics.totalRfps}</p>
                      <p className="text-xs text-gray-600">RFPs</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{metrics.awardedBids}</p>
                      <p className="text-xs text-gray-600">Awards</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {project.currentSchedule.milestones.filter(m => m.status === 'completed').length}
                      </p>
                      <p className="text-xs text-gray-600">Milestones</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-4 text-gray-500">
                      {metrics.budgetVariance !== 0 && (
                        <span className={`flex items-center ${metrics.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {Math.abs(metrics.budgetVariance).toFixed(1)}%
                        </span>
                      )}
                      {metrics.scheduleVariance !== 0 && (
                        <span className={`flex items-center ${metrics.scheduleVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.abs(metrics.scheduleVariance)}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}