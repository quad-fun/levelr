'use client';

import { useState } from 'react';
import { RFPProject } from '@/types/rfp';
import { CSI_DIVISIONS } from '@/lib/rfp/csi-data';
import { 
  Eye, Calendar, MapPin, DollarSign, FileText, 
  CheckCircle, AlertCircle, Users, Shield, Award, Settings
} from 'lucide-react';

interface RFPPreviewProps {
  project: RFPProject;
  onUpdate: (updates: Partial<RFPProject>) => void;
}

export default function RFPPreview({ project }: RFPPreviewProps) {
  const [viewMode, setViewMode] = useState<'full' | 'summary'>('full');

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const selectedDivisions = project.scopeDefinition.csiDivisions ? Object.keys(project.scopeDefinition.csiDivisions) : [];
  const totalEvaluationWeight = project.submissionRequirements.evaluationCriteria
    .reduce((sum, criterion) => sum + criterion.weight, 0);

  if (viewMode === 'summary') {
    return (
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">RFP Summary</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('full')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                View Full RFP
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-900">Project Details</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{project.projectType.replace('_', ' ')}</p>
            <p className="text-sm text-blue-700">{formatCurrency(project.estimatedValue)}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Settings className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-green-900">Scope</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{selectedDivisions.length}</p>
            <p className="text-sm text-green-700">CSI Divisions</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium text-purple-900">Requirements</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">{project.commercialTerms.insuranceRequirements.length}</p>
            <p className="text-sm text-purple-700">Insurance Types</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Award className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="font-medium text-orange-900">Evaluation</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">{project.submissionRequirements.evaluationCriteria.length}</p>
            <p className="text-sm text-orange-700">Criteria ({totalEvaluationWeight}%)</p>
          </div>
        </div>

        {/* Key Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">RFP Issue:</span>
                  <span>{formatDate(project.timeline.rfpIssueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Due:</span>
                  <span>{formatDate(project.timeline.questionsDeadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proposals Due:</span>
                  <span className="font-medium">{formatDate(project.timeline.proposalDeadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Award Date:</span>
                  <span>{formatDate(project.timeline.awardDate)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Scope Highlights</h3>
              <div className="space-y-2">
                {selectedDivisions.slice(0, 5).map(code => (
                  <div key={code} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Division {code} - {CSI_DIVISIONS[code]?.name}</span>
                  </div>
                ))}
                {selectedDivisions.length > 5 && (
                  <p className="text-sm text-gray-500">...and {selectedDivisions.length - 5} more divisions</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Commercial Terms</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pricing:</span>
                  <span className="capitalize">{project.commercialTerms.pricingStructure.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className="capitalize">{project.commercialTerms.paymentSchedule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Retainage:</span>
                  <span>{project.commercialTerms.retainage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bonding:</span>
                  <span>{project.commercialTerms.bondingRequired ? 'Required' : 'Not Required'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Key Qualifications</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Min. Experience:</span>
                  <span>{project.qualificationCriteria.minimumExperience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min. Revenue:</span>
                  <span>{formatCurrency(project.qualificationCriteria.minimumAnnualRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">References:</span>
                  <span>{project.submissionRequirements.references}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Presentation:</span>
                  <span>{project.submissionRequirements.presentationRequired ? 'Required' : 'Not Required'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Eye className="h-6 w-6 mr-2" />
            RFP Document Preview
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('summary')}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-lg font-medium transition-colors"
            >
              Summary View
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Preview your complete RFP document before generating final exports.
        </p>
      </div>

      {/* RFP Document Preview */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Cover Page */}
        <div className="p-8 border-b border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">REQUEST FOR PROPOSAL</h1>
            <h2 className="text-xl font-semibold text-gray-700">{project.projectName}</h2>
            <div className="flex items-center justify-center mt-4 text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{project.location.city}, {project.location.state}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Project Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="text-gray-600 w-32">Project Type:</span>
                  <span className="capitalize">{project.projectType.replace('_', ' ')}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Estimated Value:</span>
                  <span>{formatCurrency(project.estimatedValue)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Delivery Method:</span>
                  <span className="capitalize">{project.scopeDefinition.deliveryMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Contract Type:</span>
                  <span className="capitalize">{project.scopeDefinition.contractType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Key Dates
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="text-gray-600 w-32">RFP Issue:</span>
                  <span>{formatDate(project.timeline.rfpIssueDate)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Questions Due:</span>
                  <span>{formatDate(project.timeline.questionsDeadline)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Proposals Due:</span>
                  <span className="font-semibold text-red-600">{formatDate(project.timeline.proposalDeadline)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Award Date:</span>
                  <span>{formatDate(project.timeline.awardDate)}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-32">Construction Start:</span>
                  <span>{formatDate(project.timeline.constructionStart)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">1. PROJECT DESCRIPTION</h3>
          <p className="text-gray-700 leading-relaxed mb-4">{project.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Project Location</h4>
              <div className="text-sm text-gray-700">
                <p>{project.location.address}</p>
                <p>{project.location.city}, {project.location.state} {project.location.zipCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">2. SCOPE OF WORK</h3>
          
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">CSI Divisions Included</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDivisions.sort().map(code => {
                const division = project.scopeDefinition.csiDivisions![code];
                return (
                  <div key={code} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Division {code} - {CSI_DIVISIONS[code]?.name}
                    </h5>
                    <p className="text-sm text-gray-600 mb-2">{division.description}</p>
                    
                    {division.specifications.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Key Items:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {division.specifications.slice(0, 3).map((spec, index) => (
                            <li key={index}>• {spec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {division.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        <strong>Note:</strong> {division.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special Requirements */}
          {project.scopeDefinition.specialRequirements.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Special Requirements</h4>
              <ul className="space-y-2">
                {project.scopeDefinition.specialRequirements.map((req, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exclusions */}
          {project.scopeDefinition.exclusions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Exclusions</h4>
              <ul className="space-y-2">
                {project.scopeDefinition.exclusions.map((exclusion, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    {exclusion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Commercial Terms */}
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            3. COMMERCIAL TERMS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pricing & Payment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pricing Structure:</span>
                  <span className="capitalize">{project.commercialTerms.pricingStructure.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Schedule:</span>
                  <span className="capitalize">{project.commercialTerms.paymentSchedule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Retainage:</span>
                  <span>{project.commercialTerms.retainage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Performance Bond:</span>
                  <span>{project.commercialTerms.bondingRequired ? 'Required' : 'Not Required'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Insurance Requirements
              </h4>
              <div className="space-y-2">
                {project.commercialTerms.insuranceRequirements.map((req, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 capitalize">{req.type.replace('_', ' ')}:</span>
                      <span>{formatCurrency(req.minimumAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {project.commercialTerms.changeOrderProcedures && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Change Order Procedures</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {project.commercialTerms.changeOrderProcedures}
              </p>
            </div>
          )}
        </div>

        {/* Qualification Requirements */}
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            4. QUALIFICATION REQUIREMENTS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Experience Requirements</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>• Minimum {project.qualificationCriteria.minimumExperience} years of experience</p>
                  <p>• Minimum annual revenue: {formatCurrency(project.qualificationCriteria.minimumAnnualRevenue)}</p>
                </div>
              </div>

              {project.qualificationCriteria.requiredProjectTypes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Project Experience</h4>
                  <ul className="space-y-1">
                    {project.qualificationCriteria.requiredProjectTypes.map((type, index) => (
                      <li key={index} className="text-sm text-gray-700">• {type}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {project.qualificationCriteria.keyPersonnelRequirements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Personnel</h4>
                  <ul className="space-y-1">
                    {project.qualificationCriteria.keyPersonnelRequirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-700">• {req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {project.qualificationCriteria.safetyRequirements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Safety Requirements</h4>
                  <ul className="space-y-1">
                    {project.qualificationCriteria.safetyRequirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-700">• {req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submission Requirements */}
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            5. SUBMISSION REQUIREMENTS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Technical Proposal</h4>
              <ul className="space-y-1">
                {project.submissionRequirements.technicalProposal.map((req, index) => (
                  <li key={index} className="text-sm text-gray-700">• {req}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Commercial Proposal</h4>
              <ul className="space-y-1">
                {project.submissionRequirements.commercialProposal.map((req, index) => (
                  <li key={index} className="text-sm text-gray-700">• {req}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Qualifications</h4>
              <ul className="space-y-1">
                {project.submissionRequirements.qualifications.map((req, index) => (
                  <li key={index} className="text-sm text-gray-700">• {req}</li>
                ))}
              </ul>
              <div className="mt-4 text-sm">
                <p className="text-gray-600">References required: <span className="font-medium">{project.submissionRequirements.references}</span></p>
                <p className="text-gray-600">Presentation: <span className="font-medium">{project.submissionRequirements.presentationRequired ? 'Required' : 'Not Required'}</span></p>
              </div>
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Evaluation Criteria
            </h4>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Criterion</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Weight</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {project.submissionRequirements.evaluationCriteria.map((criterion, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{criterion.category}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{criterion.weight}%</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{criterion.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalEvaluationWeight !== 100 && (
              <div className="mt-2 flex items-center text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Total evaluation weights: {totalEvaluationWeight}% (should equal 100%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-gray-50">
          <div className="text-center text-sm text-gray-600">
            <p>Request for Proposal - {project.projectName}</p>
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}