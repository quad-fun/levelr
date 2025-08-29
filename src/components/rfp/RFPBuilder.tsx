'use client';

import { useState, useEffect } from 'react';
import { RFPProject, DEFAULT_EVALUATION_CRITERIA, DEFAULT_INSURANCE_REQUIREMENTS, DISCIPLINE_DELIVERY_METHODS, ProjectDiscipline } from '@/types/rfp';
import { saveRFP, updateRFP, getRFP } from '@/lib/storage';
import ProjectSetupWizard from './ProjectSetupWizard';
import ScopeBuilder from './ScopeBuilder';
import ScopeFrameworkBuilder from './ScopeFrameworkBuilder';
import CommercialTermsBuilder from './CommercialTermsBuilder';
import RFPPreview from './RFPPreview';
import RFPExportTools from './RFPExportTools';
import { 
  ChevronLeft, ChevronRight, Save, 
  CheckCircle, AlertCircle
} from 'lucide-react';

interface RFPBuilderProps {
  initialRFPId?: string;
  onComplete?: (rfpId: string) => void;
  onCancel?: () => void;
}

// Helper function to get default delivery method for discipline
const getDefaultDeliveryMethod = (discipline: ProjectDiscipline): string => {
  const methods = DISCIPLINE_DELIVERY_METHODS[discipline];
  const defaultMethod = methods.find(method => method.typical);
  return defaultMethod?.value || methods[0]?.value || 'professional_services';
};

export default function RFPBuilder({ initialRFPId, onComplete, onCancel }: RFPBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [rfpId, setRFPId] = useState<string | null>(initialRFPId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Initialize empty RFP project
  const [project, setProject] = useState<RFPProject>({
    id: '',
    projectName: '',
    discipline: 'construction',
    projectType: '',
    projectSubtype: '',
    description: '',
    estimatedValue: 1000000,
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    timeline: {
      rfpIssueDate: new Date().toISOString().split('T')[0],
      questionsDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      proposalDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      awardDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      constructionStart: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    scopeDefinition: {
      specialRequirements: [],
      exclusions: [],
      deliveryMethod: getDefaultDeliveryMethod('construction'),
      contractType: 'lump_sum',
      // Legacy support
      csiDivisions: {}
    },
    siteConditions: {
      siteAccess: '',
      utilitiesAvailable: [],
      environmentalConcerns: [],
      specialConstraints: []
    },
    commercialTerms: {
      pricingStructure: 'lump_sum',
      paymentSchedule: 'monthly',
      retainage: 10,
      bondingRequired: true,
      insuranceRequirements: DEFAULT_INSURANCE_REQUIREMENTS,
      changeOrderProcedures: ''
    },
    qualificationCriteria: {
      minimumExperience: 5,
      requiredProjectTypes: [],
      minimumAnnualRevenue: 5000000,
      keyPersonnelRequirements: [],
      safetyRequirements: [],
      certificationRequirements: []
    },
    submissionRequirements: {
      technicalProposal: ['Technical approach and methodology', 'Project schedule', 'Quality control plan'],
      commercialProposal: ['Base bid amount', 'Unit prices if applicable', 'Allowances and exclusions'],
      qualifications: ['Company profile and experience', 'Project team resumes', 'Financial statements'],
      references: 3,
      presentationRequired: false,
      evaluationCriteria: DEFAULT_EVALUATION_CRITERIA
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Load existing RFP if initialRFPId provided
  useEffect(() => {
    if (initialRFPId) {
      const existingRFP = getRFP(initialRFPId);
      if (existingRFP) {
        setProject(existingRFP.project);
        setRFPId(initialRFPId);
      }
    }
  }, [initialRFPId]);

  const steps = [
    { 
      id: 1, 
      title: 'Project Setup', 
      description: 'Basic project information and timeline',
      completed: isStepComplete(1)
    },
    { 
      id: 2, 
      title: 'Scope Definition', 
      description: project.discipline === 'construction' ? 'CSI divisions and work scope' :
                   project.discipline === 'design' ? 'AIA phases and deliverables' :
                   project.discipline === 'trade' ? 'Technical systems and specifications' :
                   'Project scope definition',
      completed: isStepComplete(2)
    },
    { 
      id: 3, 
      title: 'Commercial Terms', 
      description: 'Pricing, qualifications, and requirements',
      completed: isStepComplete(3)
    },
    { 
      id: 4, 
      title: 'Review & Preview', 
      description: 'Review complete RFP document',
      completed: isStepComplete(4)
    },
    { 
      id: 5, 
      title: 'Export & Distribute', 
      description: 'Generate final documents',
      completed: false
    }
  ];

  function isStepComplete(step: number): boolean {
    switch (step) {
      case 1:
        return !!(project.projectName && project.description && project.location.city && project.discipline);
      case 2:
        // Check both new framework and legacy CSI divisions
        const hasFrameworkSections = project.scopeDefinition.framework?.sections && 
          Object.values(project.scopeDefinition.framework.sections).some(section => section.included);
        const hasCSIDivisions = project.scopeDefinition.csiDivisions && 
          Object.keys(project.scopeDefinition.csiDivisions).length > 0;
        return !!(hasFrameworkSections || hasCSIDivisions);
      case 3:
        return project.commercialTerms.insuranceRequirements.length > 0;
      case 4:
        return isStepComplete(1) && isStepComplete(2) && isStepComplete(3);
      default:
        return false;
    }
  }

  const updateProject = (updates: Partial<RFPProject>) => {
    setProject(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      
      // Update evaluation criteria and delivery method based on discipline
      if (updates.discipline && updates.discipline !== prev.discipline) {
        const disciplineEvalCriteria = DEFAULT_EVALUATION_CRITERIA;
        updated.submissionRequirements = {
          ...updated.submissionRequirements,
          evaluationCriteria: disciplineEvalCriteria
        };
        
        // Update delivery method to discipline-appropriate default
        updated.scopeDefinition = {
          ...updated.scopeDefinition,
          deliveryMethod: getDefaultDeliveryMethod(updates.discipline),
          // Clear framework sections when discipline changes - set correct framework type
          framework: {
            type: updates.discipline === 'construction' ? 'csi' as const : 
                  updates.discipline === 'design' ? 'aia' as const :
                  updates.discipline === 'trade' ? 'technical' as const : 'csi' as const,
            sections: {}
          }
        };
      }
      
      return updated;
    });
  };

  const saveProgress = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      let savedId = rfpId;
      
      if (!savedId) {
        // First save - create new RFP
        savedId = saveRFP(project);
        setRFPId(savedId);
      } else {
        // Update existing RFP
        updateRFP(savedId, project);
      }
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving RFP:', error);
      alert('Error saving RFP. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = (step: number): boolean => {
    return isStepComplete(step);
  };

  const nextStep = () => {
    if (currentStep < 5 && canProceed(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProjectSetupWizard 
            project={project}
            onUpdate={updateProject}
          />
        );
      case 2:
        // Use new ScopeFrameworkBuilder for multi-discipline support
        if (project.discipline) {
          return (
            <ScopeFrameworkBuilder
              project={project}
              onUpdate={updateProject}
            />
          );
        }
        // Legacy fallback for projects without discipline
        return (
          <ScopeBuilder
            project={project}
            onUpdate={updateProject}
          />
        );
      case 3:
        return (
          <CommercialTermsBuilder
            project={project}
            onUpdate={updateProject}
          />
        );
      case 4:
        return (
          <RFPPreview
            project={project}
            onUpdate={updateProject}
          />
        );
      case 5:
        return (
          <RFPExportTools
            project={project}
            rfpId={rfpId}
            onComplete={onComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {project.projectName || 'New RFP Project'}
              </h1>
              {lastSaved && (
                <span className="ml-4 text-sm text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={saveProgress}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Progress'}
              </button>
              
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                        currentStep === step.id
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : step.completed
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-white text-gray-500'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </button>
                    
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${
                        currentStep === step.id ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 max-w-24">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white border-t sticky bottom-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center space-x-4">
              {currentStep < 4 && !canProceed(currentStep) && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Complete this step to continue</span>
                </div>
              )}
              
              <span className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </span>
            </div>

            <button
              onClick={nextStep}
              disabled={currentStep === 5 || !canProceed(currentStep)}
              className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {currentStep === 4 ? 'Generate RFP' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}