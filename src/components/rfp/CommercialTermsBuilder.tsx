'use client';

import { useState } from 'react';
import { RFPProject, InsuranceRequirement, EvaluationCriterion } from '@/types/rfp';
import { 
  DollarSign, Shield, Award, FileCheck, 
  Plus, Minus, CreditCard, Percent
} from 'lucide-react';

interface CommercialTermsBuilderProps {
  project: RFPProject;
  onUpdate: (updates: Partial<RFPProject>) => void;
}

export default function CommercialTermsBuilder({ project, onUpdate }: CommercialTermsBuilderProps) {
  const [activeTab, setActiveTab] = useState<'pricing' | 'qualifications' | 'submission' | 'insurance'>('pricing');

  const updateCommercialTerms = (field: keyof RFPProject['commercialTerms'], value: unknown) => {
    onUpdate({
      commercialTerms: {
        ...project.commercialTerms,
        [field]: value
      }
    });
  };

  const updateQualificationCriteria = (field: keyof RFPProject['qualificationCriteria'], value: unknown) => {
    onUpdate({
      qualificationCriteria: {
        ...project.qualificationCriteria,
        [field]: value
      }
    });
  };

  const updateSubmissionRequirements = (field: keyof RFPProject['submissionRequirements'], value: unknown) => {
    onUpdate({
      submissionRequirements: {
        ...project.submissionRequirements,
        [field]: value
      }
    });
  };

  const addInsuranceRequirement = () => {
    const newRequirement: InsuranceRequirement = {
      type: 'general_liability',
      minimumAmount: 1000000,
      description: '',
      additionalInsureds: []
    };
    
    updateCommercialTerms('insuranceRequirements', [
      ...project.commercialTerms.insuranceRequirements,
      newRequirement
    ]);
  };

  const updateInsuranceRequirement = (index: number, field: keyof InsuranceRequirement, value: unknown) => {
    const updated = [...project.commercialTerms.insuranceRequirements];
    updated[index] = { ...updated[index], [field]: value };
    updateCommercialTerms('insuranceRequirements', updated);
  };

  const removeInsuranceRequirement = (index: number) => {
    const updated = project.commercialTerms.insuranceRequirements.filter((_, i) => i !== index);
    updateCommercialTerms('insuranceRequirements', updated);
  };

  const addEvaluationCriterion = () => {
    const newCriterion: EvaluationCriterion = {
      category: '',
      weight: 0,
      description: ''
    };
    
    updateSubmissionRequirements('evaluationCriteria', [
      ...project.submissionRequirements.evaluationCriteria,
      newCriterion
    ]);
  };

  const updateEvaluationCriterion = (index: number, field: keyof EvaluationCriterion, value: unknown) => {
    const updated = [...project.submissionRequirements.evaluationCriteria];
    updated[index] = { ...updated[index], [field]: value };
    updateSubmissionRequirements('evaluationCriteria', updated);
  };

  const removeEvaluationCriterion = (index: number) => {
    const updated = project.submissionRequirements.evaluationCriteria.filter((_, i) => i !== index);
    updateSubmissionRequirements('evaluationCriteria', updated);
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
    { id: 'pricing', name: 'Pricing & Payment', icon: DollarSign },
    { id: 'insurance', name: 'Insurance & Bonds', icon: Shield },
    { id: 'qualifications', name: 'Qualifications', icon: Award },
    { id: 'submission', name: 'Submission Requirements', icon: FileCheck }
  ];

  const totalEvaluationWeight = project.submissionRequirements.evaluationCriteria
    .reduce((sum, criterion) => sum + criterion.weight, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Commercial Terms</h2>
        <p className="text-gray-600">
          Define pricing structure, qualification requirements, and submission criteria for your RFP.
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
                  onClick={() => setActiveTab(tab.id as 'pricing' | 'qualifications' | 'submission' | 'insurance')}
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

      {/* Pricing & Payment Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-8">
          {/* Pricing Structure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <CreditCard className="inline h-4 w-4 mr-1" />
              Pricing Structure
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
                },
                {
                  value: 'hybrid',
                  title: 'Hybrid',
                  description: 'Combination of lump sum and unit price elements'
                }
              ].map((pricing) => (
                <label key={pricing.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="pricingStructure"
                    value={pricing.value}
                    checked={project.commercialTerms.pricingStructure === pricing.value}
                    onChange={(e) => updateCommercialTerms('pricingStructure', e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{pricing.title}</p>
                    <p className="text-sm text-gray-600">{pricing.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Schedule
              </label>
              <select
                value={project.commercialTerms.paymentSchedule}
                onChange={(e) => updateCommercialTerms('paymentSchedule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly Progress Payments</option>
                <option value="milestone">Milestone-Based Payments</option>
                <option value="custom">Custom Payment Schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="inline h-4 w-4 mr-1" />
                Retainage Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={project.commercialTerms.retainage}
                  onChange={(e) => updateCommercialTerms('retainage', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="20"
                  step="0.5"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Typical range: 5-10%</p>
            </div>
          </div>

          {/* Bonding Requirements */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={project.commercialTerms.bondingRequired}
                onChange={(e) => updateCommercialTerms('bondingRequired', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Performance and Payment Bonds Required</span>
            </label>
            <p className="text-sm text-gray-500 ml-6">
              Typically required for projects over $100,000
            </p>
          </div>

          {/* Change Order Procedures */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Change Order Procedures
            </label>
            <textarea
              value={project.commercialTerms.changeOrderProcedures}
              onChange={(e) => updateCommercialTerms('changeOrderProcedures', e.target.value)}
              rows={4}
              placeholder="Describe the process for handling change orders, including approval authority, documentation requirements, and pricing methodology..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Insurance & Bonds Tab */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              <Shield className="inline h-5 w-5 mr-2" />
              Insurance Requirements
            </h3>
            <button
              onClick={addInsuranceRequirement}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Insurance
            </button>
          </div>

          <div className="space-y-4">
            {project.commercialTerms.insuranceRequirements.map((requirement, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Type
                    </label>
                    <select
                      value={requirement.type}
                      onChange={(e) => updateInsuranceRequirement(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general_liability">General Liability</option>
                      <option value="workers_comp">Workers Compensation</option>
                      <option value="auto">Commercial Auto</option>
                      <option value="umbrella">Umbrella</option>
                      <option value="professional">Professional Liability</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Amount
                    </label>
                    <input
                      type="number"
                      value={requirement.minimumAmount}
                      onChange={(e) => updateInsuranceRequirement(index, 'minimumAmount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(requirement.minimumAmount)}
                    </p>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => removeInsuranceRequirement(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description & Additional Requirements
                  </label>
                  <textarea
                    value={requirement.description}
                    onChange={(e) => updateInsuranceRequirement(index, 'description', e.target.value)}
                    rows={2}
                    placeholder="Additional requirements, waiver of subrogation, primary and non-contributory, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Qualifications Tab */}
      {activeTab === 'qualifications' && (
        <div className="space-y-8">
          {/* Experience Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Years of Experience
              </label>
              <input
                type="number"
                value={project.qualificationCriteria.minimumExperience}
                onChange={(e) => updateQualificationCriteria('minimumExperience', parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Annual Revenue
              </label>
              <input
                type="number"
                value={project.qualificationCriteria.minimumAnnualRevenue}
                onChange={(e) => updateQualificationCriteria('minimumAnnualRevenue', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(project.qualificationCriteria.minimumAnnualRevenue)}
              </p>
            </div>
          </div>

          {/* Required Project Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Project Types & Experience
            </label>
            <textarea
              value={project.qualificationCriteria.requiredProjectTypes.join('\n')}
              onChange={(e) => updateQualificationCriteria('requiredProjectTypes', 
                e.target.value.split('\n').filter(type => type.trim()))}
              rows={3}
              placeholder="Enter required project types (one per line)&#10;Example:&#10;Commercial office buildings&#10;LEED certified projects&#10;Projects over $5M"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Key Personnel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Personnel Requirements
            </label>
            <textarea
              value={project.qualificationCriteria.keyPersonnelRequirements.join('\n')}
              onChange={(e) => updateQualificationCriteria('keyPersonnelRequirements', 
                e.target.value.split('\n').filter(req => req.trim()))}
              rows={4}
              placeholder="Enter key personnel requirements (one per line)&#10;Example:&#10;Licensed project manager&#10;OSHA 30-hour certified superintendent&#10;LEED AP on project team"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Safety & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safety Requirements
              </label>
              <textarea
                value={project.qualificationCriteria.safetyRequirements.join('\n')}
                onChange={(e) => updateQualificationCriteria('safetyRequirements', 
                  e.target.value.split('\n').filter(req => req.trim()))}
                rows={3}
                placeholder="Safety requirements (one per line)&#10;Example:&#10;EMR below 1.0&#10;OSHA 10-hour minimum for workers"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Certifications
              </label>
              <textarea
                value={project.qualificationCriteria.certificationRequirements.join('\n')}
                onChange={(e) => updateQualificationCriteria('certificationRequirements', 
                  e.target.value.split('\n').filter(cert => cert.trim()))}
                rows={3}
                placeholder="Required certifications (one per line)&#10;Example:&#10;State contractor license&#10;Minority-owned business certification"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submission Requirements Tab */}
      {activeTab === 'submission' && (
        <div className="space-y-8">
          {/* Proposal Components */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technical Proposal Requirements
              </label>
              <textarea
                value={project.submissionRequirements.technicalProposal.join('\n')}
                onChange={(e) => updateSubmissionRequirements('technicalProposal', 
                  e.target.value.split('\n').filter(req => req.trim()))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commercial Proposal Requirements
              </label>
              <textarea
                value={project.submissionRequirements.commercialProposal.join('\n')}
                onChange={(e) => updateSubmissionRequirements('commercialProposal', 
                  e.target.value.split('\n').filter(req => req.trim()))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualification Requirements
              </label>
              <textarea
                value={project.submissionRequirements.qualifications.join('\n')}
                onChange={(e) => updateSubmissionRequirements('qualifications', 
                  e.target.value.split('\n').filter(req => req.trim()))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* References & Presentation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of References Required
              </label>
              <input
                type="number"
                value={project.submissionRequirements.references}
                onChange={(e) => updateSubmissionRequirements('references', parseInt(e.target.value) || 0)}
                min="0"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={project.submissionRequirements.presentationRequired}
                  onChange={(e) => updateSubmissionRequirements('presentationRequired', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Presentation Required</span>
              </label>
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Evaluation Criteria
              </h3>
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${
                  totalEvaluationWeight === 100 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Total Weight: {totalEvaluationWeight}%
                </span>
                <button
                  onClick={addEvaluationCriterion}
                  className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Criterion
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {project.submissionRequirements.evaluationCriteria.map((criterion, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={criterion.category}
                        onChange={(e) => updateEvaluationCriterion(index, 'category', e.target.value)}
                        placeholder="e.g., Technical Approach"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight (%)
                      </label>
                      <input
                        type="number"
                        value={criterion.weight}
                        onChange={(e) => updateEvaluationCriterion(index, 'weight', parseInt(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-start space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={criterion.description}
                          onChange={(e) => updateEvaluationCriterion(index, 'description', e.target.value)}
                          rows={2}
                          placeholder="Describe how this criterion will be evaluated"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => removeEvaluationCriterion(index)}
                        className="text-red-600 hover:text-red-700 p-2 mt-6"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalEvaluationWeight !== 100 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm">
                  ⚠️ Evaluation criteria weights should total 100%. Currently: {totalEvaluationWeight}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}