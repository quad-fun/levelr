'use client';

import { useState } from 'react';
import { RFPProject, PROJECT_TYPE_TEMPLATES, DISCIPLINE_OPTIONS, DISCIPLINE_DELIVERY_METHODS } from '@/types/rfp';
import { 
  MapPin, Calendar, DollarSign, Building2, FileText, 
  Clock, Truck, Settings
} from 'lucide-react';

interface ProjectSetupWizardProps {
  project: RFPProject;
  onUpdate: (updates: Partial<RFPProject>) => void;
}

export default function ProjectSetupWizard({ project, onUpdate }: ProjectSetupWizardProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'timeline' | 'delivery'>('basics');

  const updateProject = (field: keyof RFPProject, value: unknown) => {
    onUpdate({ [field]: value });
  };

  const updateNestedField = (parent: keyof RFPProject, field: string, value: unknown) => {
    const parentObj = project[parent] as Record<string, unknown>;
    onUpdate({ [parent]: { ...parentObj, [field]: value } });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const tabs = [
    { id: 'basics', name: 'Project Basics', icon: Building2 },
    { id: 'timeline', name: 'Timeline', icon: Calendar },
    { id: 'delivery', name: 'Delivery Method', icon: Settings }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Setup</h2>
        <p className="text-gray-600">
          Define the basic project information, timeline, and delivery approach for your RFP.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'basics' | 'timeline' | 'delivery')}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
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
      {activeTab === 'basics' && (
        <div className="space-y-8">
          {/* Discipline Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Service Discipline *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(DISCIPLINE_OPTIONS).map(([disciplineKey, discipline]) => (
                <button
                  key={disciplineKey}
                  onClick={() => updateProject('discipline', disciplineKey)}
                  className={`p-6 rounded-lg border-2 transition-colors text-left ${
                    project.discipline === disciplineKey
                      ? `border-${discipline.color}-500 bg-${discipline.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-3">{discipline.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{discipline.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{discipline.description}</p>
                  <div className="space-y-1">
                    {discipline.subtypes.slice(0, 3).map((subtype, index) => (
                      <div key={index} className="text-xs text-gray-500">
                        • {subtype.name}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Project Subtype Selection (based on selected discipline) */}
          {project.discipline && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Project Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DISCIPLINE_OPTIONS[project.discipline as keyof typeof DISCIPLINE_OPTIONS]?.subtypes.map((subtype, index) => (
                  <button
                    key={index}
                    onClick={() => updateProject('projectType', subtype.value)}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      project.projectType === subtype.value
                        ? `border-${DISCIPLINE_OPTIONS[project.discipline as keyof typeof DISCIPLINE_OPTIONS].color}-500 bg-${DISCIPLINE_OPTIONS[project.discipline as keyof typeof DISCIPLINE_OPTIONS].color}-50`
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

          {/* Project Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={project.projectName}
                onChange={(e) => updateProject('projectName', e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Project Value *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={project.estimatedValue}
                  onChange={(e) => updateProject('estimatedValue', parseInt(e.target.value) || 0)}
                  placeholder="1000000"
                  min="0"
                  step="10000"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Current value: {formatCurrency(project.estimatedValue)}
              </p>
            </div>
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description *
            </label>
            <textarea
              value={project.description}
              onChange={(e) => updateProject('description', e.target.value)}
              placeholder="Provide a detailed description of the project scope, objectives, and key requirements..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={project.location.address}
                  onChange={(e) => updateNestedField('location', 'address', e.target.value)}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={project.location.city}
                  onChange={(e) => updateNestedField('location', 'city', e.target.value)}
                  placeholder="City *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={project.location.state}
                  onChange={(e) => updateNestedField('location', 'state', e.target.value)}
                  placeholder="State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={project.location.zipCode}
                  onChange={(e) => updateNestedField('location', 'zipCode', e.target.value)}
                  placeholder="ZIP Code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="flex items-center text-lg font-medium text-blue-900 mb-2">
              <Clock className="h-5 w-5 mr-2" />
              Project Timeline
            </h3>
            <p className="text-blue-700 text-sm">
              Set realistic deadlines for your RFP process. These dates will be included in your RFP documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFP Issue Date
              </label>
              <input
                type="date"
                value={project.timeline.rfpIssueDate}
                onChange={(e) => updateNestedField('timeline', 'rfpIssueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Questions Deadline
              </label>
              <input
                type="date"
                value={project.timeline.questionsDeadline}
                onChange={(e) => updateNestedField('timeline', 'questionsDeadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal Deadline
              </label>
              <input
                type="date"
                value={project.timeline.proposalDeadline}
                onChange={(e) => updateNestedField('timeline', 'proposalDeadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Award Date
              </label>
              <input
                type="date"
                value={project.timeline.awardDate}
                onChange={(e) => updateNestedField('timeline', 'awardDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Construction Start
              </label>
              <input
                type="date"
                value={project.timeline.constructionStart}
                onChange={(e) => updateNestedField('timeline', 'constructionStart', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Completion
              </label>
              <input
                type="date"
                value={project.timeline.completion}
                onChange={(e) => updateNestedField('timeline', 'completion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'delivery' && (
        <div className="space-y-8">
          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <Truck className="inline h-4 w-4 mr-1" />
              Project Delivery Method
            </label>
            <div className="space-y-4">
              {project.discipline && DISCIPLINE_DELIVERY_METHODS[project.discipline as keyof typeof DISCIPLINE_DELIVERY_METHODS]?.map((method) => (
                <label key={method.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={method.value}
                    checked={project.scopeDefinition.deliveryMethod === method.value}
                    onChange={(e) => updateNestedField('scopeDefinition', 'deliveryMethod', e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{method.title}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Contract Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <FileText className="inline h-4 w-4 mr-1" />
              Contract Type
            </label>
            <div className="space-y-4">
              {[
                {
                  value: 'lump_sum',
                  title: 'Lump Sum',
                  description: 'Fixed price for defined scope of work'
                },
                {
                  value: 'unit_price',
                  title: 'Unit Price',
                  description: 'Payment based on actual quantities and unit rates'
                },
                {
                  value: 'cost_plus',
                  title: 'Cost Plus Fee',
                  description: 'Reimbursable costs plus fixed or percentage fee'
                }
              ].map((contract) => (
                <label key={contract.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="contractType"
                    value={contract.value}
                    checked={project.scopeDefinition.contractType === contract.value}
                    onChange={(e) => updateNestedField('scopeDefinition', 'contractType', e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{contract.title}</p>
                    <p className="text-sm text-gray-600">{contract.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Project Type</p>
            <p className="font-medium">
              {project.discipline && project.projectSubtype
                ? DISCIPLINE_OPTIONS[project.discipline]?.subtypes.find((s) => s.value === project.projectSubtype)?.name
                : PROJECT_TYPE_TEMPLATES[project.projectType]?.name || 'Not selected'
              }
            </p>
          </div>
          <div>
            <p className="text-gray-600">Estimated Value</p>
            <p className="font-medium">{formatCurrency(project.estimatedValue)}</p>
          </div>
          <div>
            <p className="text-gray-600">Delivery Method</p>
            <p className="font-medium capitalize">
              {project.scopeDefinition.deliveryMethod.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}