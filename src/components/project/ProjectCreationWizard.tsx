'use client';

import React, { useState } from 'react';
import {
  ProjectWizardData,
  ProjectTemplate,
  BudgetCategory
} from '@/types/project';
import { DISCIPLINE_OPTIONS } from '@/types/rfp';
import { getProjectTemplates, createProjectFromWizard, saveProject } from '@/lib/project-storage';
import {
  Building2, Calendar, DollarSign, Users, FileText,
  CheckCircle, ArrowLeft, ArrowRight, Upload, X,
  MapPin, Target, Clock
} from 'lucide-react';
import DocumentUploadAnalysis from './DocumentUploadAnalysis';
import { DocumentAnalysisResult } from '@/lib/document-analysis';

interface ProjectCreationWizardProps {
  onComplete: (projectId: string) => void;
  onCancel: () => void;
}

type WizardStep = 'basics' | 'budget' | 'timeline' | 'team' | 'rfps' | 'documents' | 'review';

export default function ProjectCreationWizard({ onComplete, onCancel }: ProjectCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates] = useState<ProjectTemplate[]>(getProjectTemplates());
  const [documentAnalysisResult, setDocumentAnalysisResult] = useState<DocumentAnalysisResult | null>(null);

  const [wizardData, setWizardData] = useState<ProjectWizardData>({
    name: '',
    description: '',
    discipline: 'construction',
    projectType: 'commercial_office',
    priority: 'medium',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    totalBudget: 1000000,
    contingencyPercentage: 10,
    budgetCategories: ['rfp_budget', 'contingency', 'soft_costs'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    keyMilestones: ['Design Complete', 'Construction Start', 'Project Complete'],
    owner: {
      name: '',
      email: '',
      role: 'Project Owner',
      company: '',
      responsibility: ['Project Oversight'],
      permissions: ['admin']
    },
    additionalMembers: [],
    anticipatedRFPs: []
  });

  const steps: { id: WizardStep; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'basics', title: 'Project Basics', icon: Building2 },
    { id: 'budget', title: 'Budget Setup', icon: DollarSign },
    { id: 'timeline', title: 'Timeline & Milestones', icon: Calendar },
    { id: 'team', title: 'Team Setup', icon: Users },
    { id: 'rfps', title: 'Anticipated RFPs', icon: FileText },
    { id: 'documents', title: 'Documents', icon: Upload },
    { id: 'review', title: 'Review & Create', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const updateWizardData = (field: keyof ProjectWizardData, value: unknown) => {
    setWizardData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: keyof ProjectWizardData, field: string, value: unknown) => {
    setWizardData(prev => ({
      ...prev,
      [parent]: { ...(prev[parent] as Record<string, unknown>), [field]: value }
    }));
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return wizardData.name.trim() && wizardData.description.trim() && wizardData.location.city.trim();
      case 'budget':
        return wizardData.totalBudget > 0;
      case 'timeline':
        return wizardData.startDate && wizardData.endDate && new Date(wizardData.endDate) > new Date(wizardData.startDate);
      case 'team':
        return wizardData.owner.name.trim() && wizardData.owner.email.trim();
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const project = createProjectFromWizard(wizardData);
      const projectId = saveProject(project);
      onComplete(projectId);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = (template: ProjectTemplate) => {
    setWizardData(prev => ({
      ...prev,
      discipline: template.discipline,
      projectType: template.projectType,
      keyMilestones: template.defaultMilestones.map(m => m.name),
      budgetCategories: template.defaultBudgetCategories
    }));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const handleDocumentAnalysis = (updates: Partial<ProjectWizardData>, analysisResult: DocumentAnalysisResult) => {
    // Apply updates to wizard data
    setWizardData(prev => ({ ...prev, ...updates }));
    setDocumentAnalysisResult(analysisResult);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-600">
          Set up your project with comprehensive planning tools and AI-powered insights.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index: _index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const isAccessible = index <= currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => isAccessible && setCurrentStep(step.id)}
                  disabled={!isAccessible}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isAccessible
                      ? 'border-gray-300 text-gray-600 hover:border-gray-400'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </button>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-20 h-0.5 ml-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        {/* Step 1: Project Basics */}
        {currentStep === 'basics' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Project Basics</h2>

              {/* Template Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Start with a Template (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <p className="text-xs text-blue-600 capitalize">{template.discipline} • {template.estimatedDuration} days</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Discipline Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Project Discipline *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(DISCIPLINE_OPTIONS).map(([disciplineKey, discipline]) => (
                    <button
                      key={disciplineKey}
                      onClick={() => updateWizardData('discipline', disciplineKey)}
                      className={`p-4 rounded-lg border-2 transition-colors text-left ${
                        wizardData.discipline === disciplineKey
                          ? `border-${discipline.color}-500 bg-${discipline.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{discipline.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-1">{discipline.title}</h3>
                      <p className="text-sm text-gray-600">{discipline.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Type */}
              {wizardData.discipline && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Project Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {DISCIPLINE_OPTIONS[wizardData.discipline as keyof typeof DISCIPLINE_OPTIONS]?.subtypes.map((subtype) => (
                      <button
                        key={subtype.value}
                        onClick={() => updateWizardData('projectType', subtype.value)}
                        className={`p-4 rounded-lg border-2 transition-colors text-left ${
                          wizardData.projectType === subtype.value
                            ? `border-${DISCIPLINE_OPTIONS[wizardData.discipline as keyof typeof DISCIPLINE_OPTIONS]?.color || 'blue'}-500 bg-${DISCIPLINE_OPTIONS[wizardData.discipline as keyof typeof DISCIPLINE_OPTIONS]?.color || 'blue'}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{subtype.name}</h3>
                        <p className="text-sm text-gray-600">{subtype.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={wizardData.name}
                    onChange={(e) => updateWizardData('name', e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={wizardData.priority}
                    onChange={(e) => updateWizardData('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={wizardData.description}
                  onChange={(e) => updateWizardData('description', e.target.value)}
                  placeholder="Provide a detailed description of the project scope, objectives, and key requirements..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Project Location
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={wizardData.location.address}
                      onChange={(e) => updateNestedField('location', 'address', e.target.value)}
                      placeholder="Street address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={wizardData.location.city}
                      onChange={(e) => updateNestedField('location', 'city', e.target.value)}
                      placeholder="City *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={wizardData.location.state}
                      onChange={(e) => updateNestedField('location', 'state', e.target.value)}
                      placeholder="State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={wizardData.location.zipCode}
                      onChange={(e) => updateNestedField('location', 'zipCode', e.target.value)}
                      placeholder="ZIP Code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Budget Setup */}
        {currentStep === 'budget' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Budget Setup</h2>

              {/* Total Budget */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Project Budget *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={wizardData.totalBudget}
                    onChange={(e) => updateWizardData('totalBudget', parseInt(e.target.value) || 0)}
                    placeholder="1000000"
                    min="0"
                    step="10000"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Current value: {formatCurrency(wizardData.totalBudget)}
                </p>
              </div>

              {/* Contingency */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contingency Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={wizardData.contingencyPercentage}
                    onChange={(e) => updateWizardData('contingencyPercentage', parseInt(e.target.value) || 0)}
                    min="0"
                    max="30"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Contingency amount: {formatCurrency(wizardData.totalBudget * (wizardData.contingencyPercentage / 100))}
                </p>
              </div>

              {/* Budget Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Budget Categories
                </label>
                <div className="space-y-3">
                  {(['rfp_budget', 'contingency', 'soft_costs', 'hard_costs', 'other'] as BudgetCategory[]).map((category) => (
                    <label key={category} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={wizardData.budgetCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateWizardData('budgetCategories', [...wizardData.budgetCategories, category]);
                          } else {
                            updateWizardData('budgetCategories', wizardData.budgetCategories.filter(c => c !== category));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-900 capitalize">{category.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Timeline & Milestones */}
        {currentStep === 'timeline' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Timeline & Milestones</h2>

              {/* Project Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Start Date *
                  </label>
                  <input
                    type="date"
                    value={wizardData.startDate}
                    onChange={(e) => updateWizardData('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Completion Date *
                  </label>
                  <input
                    type="date"
                    value={wizardData.endDate}
                    onChange={(e) => updateWizardData('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Key Milestones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Key Milestones
                </label>
                <div className="space-y-3">
                  {wizardData.keyMilestones.map((milestone, index: _index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Target className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={milestone}
                        onChange={(e) => {
                          const newMilestones = [...wizardData.keyMilestones];
                          newMilestones[index] = e.target.value;
                          updateWizardData('keyMilestones', newMilestones);
                        }}
                        placeholder="Milestone name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newMilestones = wizardData.keyMilestones.filter((_, i) => i !== index);
                          updateWizardData('keyMilestones', newMilestones);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateWizardData('keyMilestones', [...wizardData.keyMilestones, ''])}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <Target className="h-4 w-4" />
                    <span>Add Milestone</span>
                  </button>
                </div>
              </div>

              {/* Duration Info */}
              {wizardData.startDate && wizardData.endDate && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Project Duration</h3>
                  </div>
                  <p className="text-blue-700 mt-1">
                    {Math.ceil((new Date(wizardData.endDate).getTime() - new Date(wizardData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    ({Math.ceil((new Date(wizardData.endDate).getTime() - new Date(wizardData.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Team Setup */}
        {currentStep === 'team' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Team Setup</h2>

              {/* Project Owner */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Owner *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={wizardData.owner.name}
                      onChange={(e) => updateNestedField('owner', 'name', e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={wizardData.owner.email}
                      onChange={(e) => updateNestedField('owner', 'email', e.target.value)}
                      placeholder="email@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={wizardData.owner.company}
                      onChange={(e) => updateNestedField('owner', 'company', e.target.value)}
                      placeholder="Company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={wizardData.owner.phone || ''}
                      onChange={(e) => updateNestedField('owner', 'phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Project Manager */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Manager (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={wizardData.projectManager?.name || ''}
                      onChange={(e) => {
                        if (!wizardData.projectManager) {
                          updateWizardData('projectManager', {
                            name: e.target.value,
                            email: '',
                            role: 'Project Manager',
                            company: '',
                            responsibility: ['Project Management'],
                            permissions: ['edit', 'rfp_management']
                          });
                        } else {
                          updateNestedField('projectManager', 'name', e.target.value);
                        }
                      }}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={wizardData.projectManager?.email || ''}
                      onChange={(e) => updateNestedField('projectManager', 'email', e.target.value)}
                      placeholder="email@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Anticipated RFPs */}
        {currentStep === 'rfps' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Anticipated RFPs</h2>
              <p className="text-gray-600 mb-6">
                Define the RFPs you expect to issue for this project. This helps with budget allocation and timeline planning.
              </p>

              <div className="space-y-6">
                {wizardData.anticipatedRFPs.map((rfp, index: _index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">RFP #{index + 1}</h3>
                      <button
                        onClick={() => {
                          const newRFPs = wizardData.anticipatedRFPs.filter((_, i) => i !== index);
                          updateWizardData('anticipatedRFPs', newRFPs);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">RFP Name</label>
                        <input
                          type="text"
                          value={rfp.name}
                          onChange={(e) => {
                            const newRFPs = [...wizardData.anticipatedRFPs];
                            newRFPs[index] = { ...rfp, name: e.target.value };
                            updateWizardData('anticipatedRFPs', newRFPs);
                          }}
                          placeholder="e.g., Electrical Systems Installation"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discipline</label>
                        <select
                          value={rfp.discipline}
                          onChange={(e) => {
                            const newRFPs = [...wizardData.anticipatedRFPs];
                            newRFPs[index] = { ...rfp, discipline: e.target.value as 'construction' | 'design' | 'trade' };
                            updateWizardData('anticipatedRFPs', newRFPs);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="construction">Construction</option>
                          <option value="design">Design Services</option>
                          <option value="trade">Trade Services</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Budget</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            value={rfp.estimatedBudget}
                            onChange={(e) => {
                              const newRFPs = [...wizardData.anticipatedRFPs];
                              newRFPs[index] = { ...rfp, estimatedBudget: parseInt(e.target.value) || 0 };
                              updateWizardData('anticipatedRFPs', newRFPs);
                            }}
                            placeholder="100000"
                            min="0"
                            step="1000"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expected Timeline</label>
                        <input
                          type="text"
                          value={rfp.timeline}
                          onChange={(e) => {
                            const newRFPs = [...wizardData.anticipatedRFPs];
                            newRFPs[index] = { ...rfp, timeline: e.target.value };
                            updateWizardData('anticipatedRFPs', newRFPs);
                          }}
                          placeholder="e.g., Month 3-4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const newRFP = {
                      name: '',
                      discipline: 'construction' as const,
                      estimatedBudget: 0,
                      timeline: ''
                    };
                    updateWizardData('anticipatedRFPs', [...wizardData.anticipatedRFPs, newRFP]);
                  }}
                  className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Add RFP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Documents */}
        {currentStep === 'documents' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Project Documents</h2>
              <p className="text-gray-600 mb-6">
                Upload project documents for AI analysis and automatic project information extraction.
              </p>

              <DocumentUploadAnalysis
                wizardData={wizardData}
                onAnalysisComplete={handleDocumentAnalysis}
              />
            </div>
          </div>
        )}

        {/* Step 7: Review & Create */}
        {currentStep === 'review' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review & Create Project</h2>

              {/* Document Analysis Summary */}
              {documentAnalysisResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Document Analysis Applied</h3>
                    <span className="text-sm text-blue-700">
                      ({documentAnalysisResult.confidence || 0}% confidence)
                    </span>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Project information has been automatically populated based on uploaded documents.
                    Review the details below and make any necessary adjustments before creating your project.
                  </p>
                </div>
              )}

              {/* Project Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Project Name</p>
                    <p className="font-medium">{wizardData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discipline</p>
                    <p className="font-medium capitalize">{wizardData.discipline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Budget</p>
                    <p className="font-medium">{formatCurrency(wizardData.totalBudget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{wizardData.location.city}, {wizardData.location.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">
                      {Math.ceil((new Date(wizardData.endDate).getTime() - new Date(wizardData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <p className="font-medium capitalize">{wizardData.priority}</p>
                  </div>
                </div>
              </div>

              {/* Milestones Summary */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Key Milestones</h3>
                <div className="space-y-2">
                  {wizardData.keyMilestones.filter(m => m.trim()).map((milestone, index: _index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RFPs Summary */}
              {wizardData.anticipatedRFPs.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Anticipated RFPs</h3>
                  <div className="space-y-3">
                    {wizardData.anticipatedRFPs.map((rfp, index: _index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-green-900">{rfp.name}</p>
                          <p className="text-sm text-green-700 capitalize">{rfp.discipline} • {rfp.timeline}</p>
                        </div>
                        <p className="font-medium text-green-900">{formatCurrency(rfp.estimatedBudget)}</p>
                      </div>
                    ))}
                    <div className="border-t border-green-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-green-900">Total RFP Budget</p>
                        <p className="font-semibold text-green-900">
                          {formatCurrency(wizardData.anticipatedRFPs.reduce((sum, rfp) => sum + rfp.estimatedBudget, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Summary */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Project Team</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">{wizardData.owner.name} (Owner)</p>
                      <p className="text-sm text-purple-700">{wizardData.owner.email}</p>
                    </div>
                  </div>
                  {wizardData.projectManager && wizardData.projectManager.name && (
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="font-medium text-purple-900">{wizardData.projectManager.name} (Project Manager)</p>
                        <p className="text-sm text-purple-700">{wizardData.projectManager.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={currentStepIndex > 0 ? prevStep : onCancel}
          className="flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStepIndex > 0 ? 'Previous' : 'Cancel'}
        </button>

        {currentStepIndex < steps.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
            {!isSubmitting && <CheckCircle className="h-4 w-4 ml-2" />}
          </button>
        )}
      </div>
    </div>
  );
}