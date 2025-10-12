'use client';

import React, { useState } from 'react';
import {
  saveProject,
  getAllRFPs,
  linkRFPToProject
} from '@/lib/storage';
import {
  ProjectEcosystem,
  ProjectCreationData,
  DEFAULT_PROJECT_TEMPLATES,
  DISCIPLINE_TEMPLATES,
  ProjectDiscipline
} from '@/types/project';
import { DISCIPLINE_OPTIONS } from '@/types/rfp';
import {
  ChevronLeft, ChevronRight, Check, Building2,
  MapPin, Palette, Zap, X
} from 'lucide-react';

interface ProjectCreatorProps {
  onProjectCreated: (projectId: string) => void;
  onCancel: () => void;
}

interface CreationStep {
  id: number;
  title: string;
  description: string;
}

const CREATION_STEPS: CreationStep[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Define your project fundamentals'
  },
  {
    id: 2,
    title: 'Budget & Timeline',
    description: 'Set budget and schedule parameters'
  },
  {
    id: 3,
    title: 'RFP Integration',
    description: 'Link existing or create new RFPs'
  },
  {
    id: 4,
    title: 'Review & Create',
    description: 'Confirm details and create project'
  }
];

export default function ProjectCreator({ onProjectCreated, onCancel }: ProjectCreatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [creationData, setCreationData] = useState<ProjectCreationData>({
    basicInfo: {
      name: '',
      description: '',
      disciplines: ['construction'], // Changed to array
      projectType: '',
      totalBudget: 1000000,
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: ''
      }
    },
    schedule: {
      startDate: '',
      endDate: '',
      phases: [],
      milestones: []
    },
    budget: {
      allocations: []
    },
    rfps: {
      createNew: false,
      linkExisting: [],
      generateFromTemplate: false
    }
  });

  const getDisciplineIcon = (discipline: ProjectDiscipline) => {
    switch (discipline) {
      case 'construction': return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'design': return <Palette className="h-5 w-5 text-purple-600" />;
      case 'trade': return <Zap className="h-5 w-5 text-green-600" />;
    }
  };

  const updateBasicInfo = (field: string, value: unknown) => {
    setCreationData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [field]: value
      }
    }));
  };

  const updateLocation = (field: string, value: string) => {
    setCreationData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        location: {
          ...prev.basicInfo.location!,
          [field]: value
        }
      }
    }));
  };

  const updateSchedule = (field: string, value: unknown) => {
    setCreationData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }));
  };

  const updateRFPSettings = (field: string, value: unknown) => {
    setCreationData(prev => ({
      ...prev,
      rfps: {
        ...prev.rfps,
        [field]: value
      }
    }));
  };

  const generateScheduleFromTemplate = (disciplines: ProjectDiscipline[], projectType: string) => {
    // Find the matching project template
    const projectTemplate = DEFAULT_PROJECT_TEMPLATES.find(t => t.projectType === projectType);

    if (projectTemplate && creationData.schedule.startDate) {
      const startDate = new Date(creationData.schedule.startDate);
      const endDate = new Date(startDate.getTime() + projectTemplate.estimatedDuration * 24 * 60 * 60 * 1000);

      // Collect all discipline templates for this project
      const allPhases: typeof creationData.schedule.phases = [];
      const allMilestones: typeof creationData.schedule.milestones = [];
      const allAllocations: typeof creationData.budget.allocations = [];

      let phaseIndex = 0;
      let milestoneIndex = 0;

      // For each discipline, get its template and add to the project
      disciplines.forEach(discipline => {
        const disciplineTemplates = DISCIPLINE_TEMPLATES[discipline];
        if (disciplineTemplates && disciplineTemplates.length > 0) {
          const disciplineTemplate = disciplineTemplates[0]; // Use first template for each discipline

          // Add phases from this discipline
          disciplineTemplate.defaultPhases.forEach(phase => {
            const phaseStart = new Date(startDate.getTime() + (phaseIndex * (projectTemplate.estimatedDuration / (disciplines.length * 4))) * 24 * 60 * 60 * 1000);
            const phaseEnd = new Date(phaseStart.getTime() + (projectTemplate.estimatedDuration / (disciplines.length * 4)) * 24 * 60 * 60 * 1000);

            allPhases.push({
              ...phase,
              startDate: phaseStart.toISOString().split('T')[0],
              endDate: phaseEnd.toISOString().split('T')[0],
              budgetAllocated: phase.budgetAllocated * creationData.basicInfo.totalBudget * (disciplineTemplate.budgetPercentage || 0.33),
              milestoneIds: []
            });
            phaseIndex++;
          });

          // Add milestones from this discipline
          disciplineTemplate.defaultMilestones.forEach(milestone => {
            const milestoneDate = new Date(startDate.getTime() + ((milestoneIndex + 1) * (projectTemplate.estimatedDuration / (disciplines.length * 6))) * 24 * 60 * 60 * 1000);

            allMilestones.push({
              ...milestone,
              date: milestoneDate.toISOString().split('T')[0]
            });
            milestoneIndex++;
          });

          // Add budget allocations from this discipline
          disciplineTemplate.defaultBudgetAllocations.forEach(allocation => {
            allAllocations.push({
              ...allocation,
              allocatedAmount: allocation.allocatedAmount * creationData.basicInfo.totalBudget * (disciplineTemplate.budgetPercentage || 0.33),
              committedAmount: 0
            });
          });
        }
      });

      updateSchedule('endDate', endDate.toISOString().split('T')[0]);
      updateSchedule('phases', allPhases);
      updateSchedule('milestones', allMilestones);
      setCreationData(prev => ({
        ...prev,
        budget: {
          allocations: allAllocations
        }
      }));
    }
  };

  const handleCreateProject = async () => {
    setIsCreating(true);

    try {
      // Create the project ecosystem object
      const projectEcosystem: Omit<ProjectEcosystem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: creationData.basicInfo.name,
        description: creationData.basicInfo.description,
        disciplines: creationData.basicInfo.disciplines,
        projectType: creationData.basicInfo.projectType,
        totalBudget: creationData.basicInfo.totalBudget,
        location: creationData.basicInfo.location,
        baselineSchedule: {
          startDate: creationData.schedule.startDate,
          endDate: creationData.schedule.endDate,
          milestones: creationData.schedule.milestones.map((m, index) => ({
            ...m,
            id: `milestone_${index + 1}`
          })),
          phases: creationData.schedule.phases.map((p, index) => ({
            ...p,
            id: `phase_${index + 1}`,
            budgetUsed: 0
          }))
        },
        currentSchedule: {
          startDate: creationData.schedule.startDate,
          endDate: creationData.schedule.endDate,
          milestones: creationData.schedule.milestones.map((m, index) => ({
            ...m,
            id: `milestone_${index + 1}`
          })),
          phases: creationData.schedule.phases.map((p, index) => ({
            ...p,
            id: `phase_${index + 1}`,
            budgetUsed: 0
          }))
        },
        status: 'planning',
        rfpIds: [],
        awardedBids: [],
        budgetAllocations: creationData.budget.allocations.map((a, index) => ({
          ...a,
          id: `allocation_${index + 1}`,
          actualAmount: 0,
          variance: 0,
          linkedRfpIds: []
        }))
      };

      // Save the project
      const projectId = saveProject(projectEcosystem as ProjectEcosystem);

      // Link existing RFPs if selected
      if (creationData.rfps.linkExisting.length > 0) {
        creationData.rfps.linkExisting.forEach(rfpId => {
          linkRFPToProject(projectId, rfpId);
        });
      }

      onProjectCreated(projectId);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return creationData.basicInfo.name.trim() !== '' &&
               creationData.basicInfo.description.trim() !== '' &&
               creationData.basicInfo.projectType !== '';
      case 2:
        return creationData.schedule.startDate !== '' &&
               creationData.schedule.endDate !== '' &&
               new Date(creationData.schedule.endDate) > new Date(creationData.schedule.startDate);
      case 3:
        return true; // RFP integration is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderBudgetTimelineStep();
      case 3:
        return renderRFPIntegrationStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
        <input
          type="text"
          value={creationData.basicInfo.name}
          onChange={(e) => updateBasicInfo('name', e.target.value)}
          placeholder="Enter project name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          value={creationData.basicInfo.description}
          onChange={(e) => updateBasicInfo('description', e.target.value)}
          placeholder="Describe your project"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Discipline *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(DISCIPLINE_OPTIONS).map(([key, option]) => (
            <button
              key={key}
              onClick={() => {
                updateBasicInfo('disciplines', [key as ProjectDiscipline]);
                updateBasicInfo('projectType', ''); // Reset project type when discipline changes
              }}
              className={`p-4 border rounded-lg text-left transition-colors ${
                creationData.basicInfo.disciplines.includes(key as ProjectDiscipline)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center mb-2">
                {getDisciplineIcon(key as ProjectDiscipline)}
                <span className="ml-2 font-medium">{option.title}</span>
              </div>
              <p className="text-sm text-gray-600">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {creationData.basicInfo.disciplines.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Type *</label>
          <select
            value={creationData.basicInfo.projectType}
            onChange={(e) => updateBasicInfo('projectType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select project type...</option>
            {DISCIPLINE_OPTIONS[creationData.basicInfo.disciplines[0] as ProjectDiscipline]?.subtypes.map(subtype => (
              <option key={subtype.value} value={subtype.value}>
                {subtype.name} - {subtype.description}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={creationData.basicInfo.totalBudget}
            onChange={(e) => updateBasicInfo('totalBudget', Number(e.target.value))}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Optional Location */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Project Location (Optional)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={creationData.basicInfo.location?.address || ''}
              onChange={(e) => updateLocation('address', e.target.value)}
              placeholder="Street address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="text"
            value={creationData.basicInfo.location?.city || ''}
            onChange={(e) => updateLocation('city', e.target.value)}
            placeholder="City"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={creationData.basicInfo.location?.state || ''}
            onChange={(e) => updateLocation('state', e.target.value)}
            placeholder="State"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderBudgetTimelineStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Start Date *</label>
          <input
            type="date"
            value={creationData.schedule.startDate}
            onChange={(e) => updateSchedule('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project End Date *</label>
          <input
            type="date"
            value={creationData.schedule.endDate}
            onChange={(e) => updateSchedule('endDate', e.target.value)}
            min={creationData.schedule.startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {creationData.basicInfo.projectType && creationData.schedule.startDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Use Template Schedule</h4>
              <p className="text-sm text-blue-700">
                Generate phases, milestones, and budget allocations based on {creationData.basicInfo.disciplines.join(', ')} best practices.
              </p>
            </div>
            <button
              onClick={() => generateScheduleFromTemplate(creationData.basicInfo.disciplines, creationData.basicInfo.projectType)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {creationData.schedule.phases.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Project Phases</h4>
          <div className="space-y-3">
            {creationData.schedule.phases.map((phase, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">{phase.name}</h5>
                    <p className="text-sm text-gray-600">{phase.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${(phase.budgetAllocated).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {creationData.schedule.milestones.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Key Milestones</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {creationData.schedule.milestones.map((milestone, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-gray-900">{milestone.name}</h5>
                <p className="text-sm text-gray-600">{new Date(milestone.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRFPIntegrationStep = () => {
    const existingRFPs = getAllRFPs().filter(rfp =>
      creationData.basicInfo.disciplines.includes(rfp.project.discipline)
    );

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">RFP Integration Options</h4>
          <p className="text-sm text-blue-700">
            Connect your project to RFPs for seamless bid management and budget tracking.
          </p>
        </div>

        {existingRFPs.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Link Existing RFPs</h4>
            <div className="space-y-3">
              {existingRFPs.map(rfp => (
                <label key={rfp.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={creationData.rfps.linkExisting.includes(rfp.id)}
                    onChange={(e) => {
                      const currentLinks = creationData.rfps.linkExisting;
                      if (e.target.checked) {
                        updateRFPSettings('linkExisting', [...currentLinks, rfp.id]);
                      } else {
                        updateRFPSettings('linkExisting', currentLinks.filter(id => id !== rfp.id));
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{rfp.project.projectName}</h5>
                    <p className="text-sm text-gray-600">{rfp.project.description}</p>
                    <div className="flex items-center mt-1 space-x-4">
                      <span className="text-xs text-gray-500">
                        ${rfp.project.estimatedValue.toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rfp.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        rfp.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rfp.status}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={creationData.rfps.createNew}
              onChange={(e) => updateRFPSettings('createNew', e.target.checked)}
              className="mr-3"
            />
            <div>
              <span className="font-medium text-gray-900">Create RFPs after project setup</span>
              <p className="text-sm text-gray-600">
                Jump directly to RFP creation once your project is established.
              </p>
            </div>
          </label>
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Ready to Create Project</h4>
          <p className="text-sm text-green-700">
            Review the details below and click "Create Project" to get started.
          </p>
        </div>

        {/* Basic Info Review */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Project Overview</h4>
          <div className="bg-white border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{creationData.basicInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discipline:</span>
              <span className="font-medium capitalize">{creationData.basicInfo.disciplines.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">
                {DISCIPLINE_OPTIONS[creationData.basicInfo.disciplines[0] as ProjectDiscipline]?.subtypes
                  .find(t => t.value === creationData.basicInfo.projectType)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Budget:</span>
              <span className="font-medium">{formatCurrency(creationData.basicInfo.totalBudget)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">
                {creationData.schedule.startDate} to {creationData.schedule.endDate}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Review */}
        {creationData.schedule.phases.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              Project Structure ({creationData.schedule.phases.length} phases, {creationData.schedule.milestones.length} milestones)
            </h4>
            <div className="bg-white border rounded-lg p-4">
              <div className="space-y-2">
                {creationData.schedule.phases.map((phase, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{phase.name}</span>
                    <span>{formatCurrency(phase.budgetAllocated)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RFP Integration Review */}
        {(creationData.rfps.linkExisting.length > 0 || creationData.rfps.createNew) && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">RFP Integration</h4>
            <div className="bg-white border rounded-lg p-4 space-y-2">
              {creationData.rfps.linkExisting.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Existing RFPs:</span>
                  <span className="font-medium">{creationData.rfps.linkExisting.length} linked</span>
                </div>
              )}
              {creationData.rfps.createNew && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Post-creation:</span>
                  <span className="font-medium">Create new RFPs</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4">
            {CREATION_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  currentStep === step.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : currentStep > step.id
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                {index < CREATION_STEPS.length - 1 && (
                  <div className={`w-8 h-px ml-2 transition-colors ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {CREATION_STEPS[currentStep - 1].title}
            </h2>
            <p className="text-gray-600">
              {CREATION_STEPS[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNext()}
                className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleCreateProject}
                disabled={isCreating || !canProceedToNext()}
                className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}