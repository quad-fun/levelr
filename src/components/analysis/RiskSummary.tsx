// src/components/analysis/RiskSummary.tsx

'use client';

import { RiskSummary, NormalizedRiskItem, DisciplineRiskAssessment, FollowUpAction } from '@/types/analysis';
import { AlertTriangle, TrendingDown, CheckCircle, Clock, Building, Palette, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface RiskSummaryProps {
  riskSummary: RiskSummary;
}

export default function RiskSummaryComponent({ riskSummary }: RiskSummaryProps) {
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showFollowUps, setShowFollowUps] = useState(false);

  const toggleAssessment = (discipline: string) => {
    const newExpanded = new Set(expandedAssessments);
    if (newExpanded.has(discipline)) {
      newExpanded.delete(discipline);
    } else {
      newExpanded.add(discipline);
    }
    setExpandedAssessments(newExpanded);
  };

  const toggleCategory = (key: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCategories(newExpanded);
  };

  const getSeverityColor = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (severity) {
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM': return <TrendingDown className="h-4 w-4" />;
      case 'LOW': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getDisciplineIcon = (discipline: 'construction' | 'design' | 'trade') => {
    switch (discipline) {
      case 'construction': return <Building className="h-4 w-4" />;
      case 'design': return <Palette className="h-4 w-4" />;
      case 'trade': return <Settings className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  const getDisciplineLabel = (discipline: 'construction' | 'design' | 'trade') => {
    switch (discipline) {
      case 'construction': return 'Construction';
      case 'design': return 'Design';
      case 'trade': return 'Trade';
      default: return 'Construction';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'schedule': return 'Schedule & Delivery';
      case 'market': return 'Market & Volatility';
      case 'scope': return 'Scope & Change Orders';
      case 'contract': return 'Contract Terms';
      case 'value_engineering': return 'Value Engineering';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Collect all follow-up actions
  const allFollowUps: FollowUpAction[] = riskSummary.assessments.flatMap(assessment =>
    assessment.followUpActions || []
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Risk Analysis</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            v{riskSummary.version}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          Generated {new Date(riskSummary.generatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Top 5 Risks Summary */}
      {riskSummary.topRisks && riskSummary.topRisks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Priority Risks</h4>
          <div className="space-y-3">
            {riskSummary.topRisks.map((risk, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getSeverityIcon(risk.severity)}
                      <span className="font-medium">{risk.title}</span>
                      <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                        {getDisciplineLabel(risk.discipline)}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                        {getCategoryLabel(risk.category)}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{risk.description}</p>
                    {risk.impact && (
                      <p className="text-sm font-medium">Impact: {risk.impact}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discipline-Specific Risk Assessments */}
      {riskSummary.assessments && riskSummary.assessments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Discipline Analysis</h4>
          <div className="space-y-3">
            {riskSummary.assessments.map((assessment) => (
              <div key={assessment.discipline} className="border border-gray-200 rounded-lg">
                {/* Assessment Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleAssessment(assessment.discipline)}
                >
                  <div className="flex items-center space-x-3">
                    {getDisciplineIcon(assessment.discipline)}
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {getDisciplineLabel(assessment.discipline)} Risk Assessment
                      </h5>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(assessment.overallLevel)}`}>
                          {assessment.overallLevel} RISK
                        </span>
                        <span className="text-sm text-gray-500">
                          Score: {assessment.overallScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedAssessments.has(assessment.discipline) ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {/* Assessment Details */}
                {expandedAssessments.has(assessment.discipline) && (
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    {/* Category Breakdown */}
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Risk Categories</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(assessment.categoryBreakdown).map(([categoryKey, category]) => (
                          <div key={categoryKey} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{getCategoryLabel(categoryKey)}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(category.level)}`}>
                                {category.level}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Score: {category.score}/100
                            </div>
                            {category.risks && category.risks.length > 0 && (
                              <div className="mt-2">
                                <button
                                  onClick={() => toggleCategory(`${assessment.discipline}-${categoryKey}`)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  {category.risks.length} risk{category.risks.length !== 1 ? 's' : ''}
                                  {expandedCategories.has(`${assessment.discipline}-${categoryKey}`) ? ' ▼' : ' ▶'}
                                </button>
                                {expandedCategories.has(`${assessment.discipline}-${categoryKey}`) && (
                                  <div className="mt-2 space-y-1">
                                    {category.risks.map((risk, idx) => (
                                      <div key={idx} className="text-xs p-2 bg-white rounded border">
                                        <div className="font-medium">{risk.title}</div>
                                        <div className="text-gray-600 mt-1">{risk.description}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All Risks for this Discipline */}
                    {assessment.risks && assessment.risks.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">
                          All {getDisciplineLabel(assessment.discipline)} Risks ({assessment.risks.length})
                        </h6>
                        <div className="space-y-2">
                          {assessment.risks.map((risk, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded border">
                              <div className="flex items-center space-x-2 mb-1">
                                {getSeverityIcon(risk.severity)}
                                <span className="text-sm font-medium">{risk.title}</span>
                                <span className="text-xs px-2 py-1 rounded bg-white">
                                  {getCategoryLabel(risk.category)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{risk.description}</p>
                              {risk.impact && (
                                <p className="text-xs text-gray-500">Impact: {risk.impact}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Actions */}
      {allFollowUps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-900">Recommended Follow-ups</h4>
            <button
              onClick={() => setShowFollowUps(!showFollowUps)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showFollowUps ? 'Hide' : 'Show'} {allFollowUps.length} action{allFollowUps.length !== 1 ? 's' : ''}
            </button>
          </div>
          {showFollowUps && (
            <div className="space-y-3">
              {allFollowUps.map((action, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{action.title}</span>
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(action.priority)}`}>
                          {action.priority}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white">
                          {getDisciplineLabel(action.discipline)}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">{action.description}</p>
                      <p className="text-xs text-blue-600 mt-1">Category: {getCategoryLabel(action.category)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}