// src/lib/analysis/enhanced-risk-analyzer.ts

import { AnalysisResult, RiskSummary, DisciplineRiskAssessment, NormalizedRiskItem } from '@/types/analysis';
import type { Flags } from '@/lib/flags';

const isDev = process.env.NODE_ENV !== 'production';

function safeLog(message: string, data?: unknown) {
  if (isDev) {
    console.log(`[EnhancedRiskAnalyzer] ${message}`, data);
  }
}

// Detect analysis discipline (reuse existing logic)
function detectAnalysisDiscipline(analysis: AnalysisResult): 'construction' | 'design' | 'trade' {
  // Check explicit discipline field first
  if (analysis.discipline) return analysis.discipline;

  // Analyze content structure to determine discipline
  const hasAIAPhases = analysis.aia_phases && Object.keys(analysis.aia_phases).length > 0;
  const hasTechnicalSystems = analysis.technical_systems && Object.keys(analysis.technical_systems).length > 0;
  const hasDesignDeliverables = analysis.design_deliverables && analysis.design_deliverables.length > 0;
  const hasEquipmentSpecs = analysis.equipment_specifications && analysis.equipment_specifications.length > 0;

  // Design discipline indicators
  if (hasAIAPhases || hasDesignDeliverables) return 'design';

  // Trade discipline indicators
  if (hasTechnicalSystems || hasEquipmentSpecs) return 'trade';

  // Construction discipline indicators (or fallback)
  return 'construction';
}

// Risk Score Prioritizer - converts risk items to normalized format with discipline weighting
function prioritizeRisks(
  assessments: DisciplineRiskAssessment[],
  maxRisks: number = 5
): NormalizedRiskItem[] {
  const allRisks: NormalizedRiskItem[] = [];

  // Collect all risks from all disciplines
  assessments.forEach(assessment => {
    assessment.risks.forEach(risk => {
      // Apply discipline-specific weighting
      const disciplineWeight = getDisciplineWeight(risk.discipline);
      const severityScore = getSeverityScore(risk.severity);
      const weightedScore = severityScore * disciplineWeight;

      allRisks.push({
        ...risk,
        // Store weighted score for internal sorting (not exposed in interface)
        _weightedScore: weightedScore
      } as NormalizedRiskItem & { _weightedScore: number });
    });
  });

  // Sort by weighted score and take top N
  return allRisks
    .sort((a, b) => (b as any)._weightedScore - (a as any)._weightedScore)
    .slice(0, maxRisks)
    .map(({ _weightedScore, ...risk }: any) => risk); // Remove internal scoring
}

function getDisciplineWeight(discipline: 'construction' | 'design' | 'trade'): number {
  switch (discipline) {
    case 'construction': return 1.2; // Physical execution risks tend to be higher impact
    case 'design': return 1.0; // Professional liability risks
    case 'trade': return 1.1; // Technical performance risks
    default: return 1.0;
  }
}

function getSeverityScore(severity: 'LOW' | 'MEDIUM' | 'HIGH'): number {
  switch (severity) {
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 1;
  }
}

// Main orchestrator function
export async function generateEnhancedRiskSummary(
  analysis: AnalysisResult,
  flags: Flags
): Promise<AnalysisResult> {
  console.log('[DEBUG] generateEnhancedRiskSummary called with flags:', flags);

  // Fail closed: if risk analysis is disabled, return original analysis unchanged
  if (!flags.riskDisciplineAware) {
    console.log('[DEBUG] Risk discipline awareness disabled, skipping enhanced analysis');
    safeLog('Risk discipline awareness disabled, skipping enhanced analysis');
    return analysis;
  }

  try {
    safeLog('Starting enhanced risk analysis', {
      contractor: analysis.contractor_name,
      totalAmount: analysis.total_amount
    });

    const startTime = Date.now();
    const discipline = detectAnalysisDiscipline(analysis);
    const assessments: DisciplineRiskAssessment[] = [];

    safeLog(`Detected discipline: ${discipline}`);

    // Phase 1: Run discipline-specific analyzers
    // For now, we'll create placeholder analyzers that return minimal risk assessments
    // These will be replaced with full analyzers in Phase 2

    if (discipline === 'construction') {
      const constructionAssessment = await analyzeConstructionRisks(analysis, flags);
      if (constructionAssessment) assessments.push(constructionAssessment);
    } else if (discipline === 'design') {
      const designAssessment = await analyzeDesignRisks(analysis, flags);
      if (designAssessment) assessments.push(designAssessment);
    } else if (discipline === 'trade') {
      const tradeAssessment = await analyzeTradeRisks(analysis, flags);
      if (tradeAssessment) assessments.push(tradeAssessment);
    }

    // Skip if no assessments generated
    if (assessments.length === 0) {
      safeLog('No risk assessments generated, returning original analysis');
      return analysis;
    }

    // Generate top 5 prioritized risks
    const topRisks = prioritizeRisks(assessments, 5);

    // Create risk summary
    const riskSummary: RiskSummary = {
      topRisks,
      assessments,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const duration = Date.now() - startTime;
    safeLog(`Enhanced risk analysis completed in ${duration}ms`, {
      topRisksCount: topRisks.length,
      assessmentsCount: assessments.length
    });

    // Return enhanced analysis result
    return {
      ...analysis,
      riskSummary
    };

  } catch (error) {
    // Fail closed: log error in dev but return original analysis
    if (isDev) {
      console.error('[EnhancedRiskAnalyzer] Error during risk analysis:', error);
    }
    safeLog('Risk analysis failed, returning original analysis');
    return analysis;
  }
}

// Phase 2: Full Construction Risk Analyzer
async function analyzeConstructionRisks(
  analysis: AnalysisResult,
  flags: Flags
): Promise<DisciplineRiskAssessment | null> {
  try {
    const risks: NormalizedRiskItem[] = [];
    const followUpActions: any[] = [];
    const categoryBreakdown = {
      schedule: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      market: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      scope: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      contract: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      value_engineering: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] }
    };

    // SCHEDULE & DELIVERY RISK ANALYSIS
    await analyzeScheduleRisks(analysis, risks, categoryBreakdown.schedule, followUpActions, flags);

    // MARKET VOLATILITY & ESCALATION RISK ANALYSIS
    await analyzeMarketRisks(analysis, risks, categoryBreakdown.market, followUpActions, flags);

    // SCOPE DEFINITION & CHANGE ORDER RISK ANALYSIS
    await analyzeScopeRisks(analysis, risks, categoryBreakdown.scope, followUpActions, flags);

    // CONTRACT TERMS & CONDITIONS RISK ANALYSIS
    await analyzeContractRisks(analysis, risks, categoryBreakdown.contract, followUpActions, flags);

    // VALUE ENGINEERING OPPORTUNITIES
    await analyzeValueEngineeringOpportunities(analysis, risks, categoryBreakdown.value_engineering, followUpActions, flags);

    // Calculate overall risk score (weighted average)
    const overallScore = Math.round(
      (categoryBreakdown.schedule.score * 0.25) +
      (categoryBreakdown.market.score * 0.20) +
      (categoryBreakdown.scope.score * 0.30) +
      (categoryBreakdown.contract.score * 0.15) +
      (categoryBreakdown.value_engineering.score * 0.10)
    );

    const overallLevel = overallScore >= 70 ? 'HIGH' : overallScore >= 40 ? 'MEDIUM' : 'LOW';

    return {
      discipline: 'construction',
      overallScore,
      overallLevel,
      categoryBreakdown,
      risks,
      followUpActions
    };
  } catch (error) {
    safeLog('Construction risk analysis failed', error);
    return null;
  }
}

// Construction Risk Category Analyzers
async function analyzeScheduleRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for missing timeline information
  if (!analysis.timeline || analysis.timeline.length < 20) {
    const risk = {
      title: 'Incomplete Project Timeline',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'schedule' as const,
      description: 'Limited or missing project schedule information',
      impact: 'Schedule conflicts and delivery delays may occur without clear timeline'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 30;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Request Detailed Project Schedule',
        description: 'Ask contractor for detailed timeline with key milestones and dependencies',
        priority: 'MEDIUM',
        category: 'schedule',
        discipline: 'construction'
      });
    }
  }

  // Check for potential coordination issues
  const hasMultipleSubcontractors = analysis.subcontractors && analysis.subcontractors.length > 5;
  if (hasMultipleSubcontractors) {
    const risk = {
      title: 'Complex Subcontractor Coordination',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'schedule' as const,
      description: `${analysis.subcontractors?.length || 0} subcontractors require coordination`,
      impact: 'Multiple trades may create scheduling conflicts and delay risk'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 25;
  }

  // Check for seasonal/weather sensitive work
  const outdoorDivisions = ['02', '03', '05', '06', '07', '32', '33'];
  const hasOutdoorWork = Object.keys(analysis.csi_divisions).some(div =>
    outdoorDivisions.some(outdoor => div.startsWith(outdoor))
  );
  if (hasOutdoorWork && (!analysis.assumptions?.some(a => a.toLowerCase().includes('weather')) || !analysis.assumptions?.some(a => a.toLowerCase().includes('season')))) {
    const risk = {
      title: 'Weather-Dependent Work Not Addressed',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'schedule' as const,
      description: 'Outdoor work identified but no weather considerations mentioned',
      impact: 'Seasonal delays could extend project timeline significantly'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 20;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeMarketRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for bid validity period
  if (!analysis.assumptions?.some(a => a.toLowerCase().includes('valid') || a.toLowerCase().includes('hold'))) {
    const risk = {
      title: 'No Bid Validity Period Specified',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'market' as const,
      description: 'Bid does not specify how long pricing is valid',
      impact: 'Material costs may increase between bid and contract signing'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 35;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Clarify Bid Validity Period',
        description: 'Request specific timeframe for pricing validity and escalation clauses',
        priority: 'MEDIUM',
        category: 'market',
        discipline: 'construction'
      });
    }
  }

  // Check for material escalation considerations
  const materialIntensiveDivisions = ['03', '05', '06', '07', '08', '09'];
  const hasMaterialIntensiveWork = Object.keys(analysis.csi_divisions).some(div =>
    materialIntensiveDivisions.some(material => div.startsWith(material))
  );

  if (hasMaterialIntensiveWork && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('escalation') ||
    a.toLowerCase().includes('material') ||
    a.toLowerCase().includes('inflation')
  )) {
    const risk = {
      title: 'Material Escalation Risk Not Addressed',
      severity: 'HIGH' as const,
      discipline: 'construction' as const,
      category: 'market' as const,
      description: 'Significant material costs without escalation protection',
      impact: 'Volatile material markets could increase costs 10-30%'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 50;
  }

  // Check for labor availability considerations
  const laborIntensiveDivisions = ['03', '04', '05', '06', '09'];
  const hasLaborIntensiveWork = Object.keys(analysis.csi_divisions).some(div =>
    laborIntensiveDivisions.some(labor => div.startsWith(labor))
  );

  if (hasLaborIntensiveWork && analysis.total_amount > 1000000) {
    const risk = {
      title: 'Large Project Labor Availability Risk',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'market' as const,
      description: 'High-value project requires significant skilled labor',
      impact: 'Tight labor markets may increase costs or delay project'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 25;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeScopeRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for missing general conditions
  if (!analysis.project_overhead?.general_conditions && !analysis.project_overhead?.general_requirements) {
    const risk = {
      title: 'Missing General Conditions',
      severity: 'HIGH' as const,
      discipline: 'construction' as const,
      category: 'scope' as const,
      description: 'No general conditions or requirements identified',
      impact: 'Major project overhead costs not accounted for in bid'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 60;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Request General Conditions Breakdown',
        description: 'Ask for detailed breakdown of general conditions, site overhead, and temporary facilities',
        priority: 'HIGH',
        category: 'scope',
        discipline: 'construction'
      });
    }
  }

  // Check for high uncategorized costs
  if (analysis.uncategorizedTotal && analysis.uncategorizedTotal > analysis.total_amount * 0.15) {
    const risk = {
      title: 'High Uncategorized Costs',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'scope' as const,
      description: `${(analysis.uncategorizedTotal / analysis.total_amount * 100).toFixed(1)}% of costs are uncategorized`,
      impact: 'Unclear scope definition increases change order risk'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 35;
  }

  // Check for missing permits/approvals
  if (!analysis.project_overhead?.permits && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('permit') || a.toLowerCase().includes('approval')
  )) {
    const risk = {
      title: 'Permit Responsibilities Unclear',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'scope' as const,
      description: 'No mention of permit responsibilities or costs',
      impact: 'Permit delays or cost overruns if responsibilities are unclear'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 30;
  }

  // Check for exclusions that might indicate scope gaps
  if (analysis.exclusions && analysis.exclusions.length > 3) {
    const risk = {
      title: 'Extensive Exclusions Listed',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'scope' as const,
      description: `${analysis.exclusions.length} exclusions may indicate scope uncertainties`,
      impact: 'Multiple exclusions increase risk of scope gaps and change orders'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 25;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeContractRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for insurance and bonding
  if (!analysis.project_overhead?.insurance && !analysis.project_overhead?.bonds) {
    const risk = {
      title: 'No Insurance/Bonding Mentioned',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'contract' as const,
      description: 'No insurance or bonding costs included in bid',
      impact: 'Additional costs may be required for project insurance and bonds'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 30;
  }

  // Check for warranty provisions
  if (!analysis.assumptions?.some(a =>
    a.toLowerCase().includes('warrant') ||
    a.toLowerCase().includes('guarantee') ||
    a.toLowerCase().includes('defect')
  )) {
    const risk = {
      title: 'Warranty Terms Not Specified',
      severity: 'LOW' as const,
      discipline: 'construction' as const,
      category: 'contract' as const,
      description: 'No warranty or guarantee terms mentioned',
      impact: 'Post-completion defect responsibilities unclear'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 15;
  }

  // Check for payment terms
  if (!analysis.assumptions?.some(a =>
    a.toLowerCase().includes('payment') ||
    a.toLowerCase().includes('billing') ||
    a.toLowerCase().includes('progress')
  )) {
    const risk = {
      title: 'Payment Terms Not Defined',
      severity: 'MEDIUM' as const,
      discipline: 'construction' as const,
      category: 'contract' as const,
      description: 'No payment schedule or billing terms specified',
      impact: 'Cash flow issues if payment terms are unfavorable'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 25;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Clarify Payment Terms',
        description: 'Request detailed payment schedule and billing procedures',
        priority: 'MEDIUM',
        category: 'contract',
        discipline: 'construction'
      });
    }
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeValueEngineeringOpportunities(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for potential high-cost items that could have alternatives
  const expensiveDivisions = Object.entries(analysis.csi_divisions)
    .filter(([, div]) => div.cost > analysis.total_amount * 0.15)
    .map(([code]) => code);

  if (expensiveDivisions.length > 0 && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('alternate') ||
    a.toLowerCase().includes('substitution') ||
    a.toLowerCase().includes('equivalent')
  )) {
    const risk = {
      title: 'Value Engineering Opportunities Identified',
      severity: 'LOW' as const,
      discipline: 'construction' as const,
      category: 'value_engineering' as const,
      description: `High-cost divisions (${expensiveDivisions.join(', ')}) may have cost-saving alternatives`,
      impact: 'Potential 5-15% cost savings through material/method alternatives'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 20;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Explore Value Engineering Options',
        description: `Review alternatives for high-cost divisions: ${expensiveDivisions.join(', ')}`,
        priority: 'LOW',
        category: 'value_engineering',
        discipline: 'construction'
      });
    }
  }

  // Check for oversized allowances
  if (analysis.allowances_total && analysis.allowances_total > analysis.total_amount * 0.20) {
    const risk = {
      title: 'High Contingency/Allowances',
      severity: 'LOW' as const,
      discipline: 'construction' as const,
      category: 'value_engineering' as const,
      description: `${(analysis.allowances_total / analysis.total_amount * 100).toFixed(1)}% in allowances/contingencies`,
      impact: 'High contingencies may indicate inflated pricing or scope uncertainties'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 15;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

// Phase 2: Full Design Risk Analyzer
async function analyzeDesignRisks(
  analysis: AnalysisResult,
  flags: Flags
): Promise<DisciplineRiskAssessment | null> {
  try {
    const risks: NormalizedRiskItem[] = [];
    const followUpActions: any[] = [];
    const categoryBreakdown = {
      schedule: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      market: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      scope: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      contract: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      value_engineering: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] }
    };

    // DESIGN SCHEDULE RISK ANALYSIS
    await analyzeDesignScheduleRisks(analysis, risks, categoryBreakdown.schedule, followUpActions, flags);

    // DESIGN MARKET RISK ANALYSIS
    await analyzeDesignMarketRisks(analysis, risks, categoryBreakdown.market, followUpActions, flags);

    // DESIGN SCOPE RISK ANALYSIS
    await analyzeDesignScopeRisks(analysis, risks, categoryBreakdown.scope, followUpActions, flags);

    // DESIGN CONTRACT RISK ANALYSIS
    await analyzeDesignContractRisks(analysis, risks, categoryBreakdown.contract, followUpActions, flags);

    // DESIGN VALUE ENGINEERING OPPORTUNITIES
    await analyzeDesignValueEngineeringOpportunities(analysis, risks, categoryBreakdown.value_engineering, followUpActions, flags);

    // Calculate overall risk score (weighted average)
    const overallScore = Math.round(
      (categoryBreakdown.schedule.score * 0.30) +  // Higher weight for design schedule risk
      (categoryBreakdown.market.score * 0.15) +
      (categoryBreakdown.scope.score * 0.35) +     // Scope definition critical in design
      (categoryBreakdown.contract.score * 0.10) +
      (categoryBreakdown.value_engineering.score * 0.10)
    );

    const overallLevel = overallScore >= 70 ? 'HIGH' : overallScore >= 40 ? 'MEDIUM' : 'LOW';

    return {
      discipline: 'design',
      overallScore,
      overallLevel,
      categoryBreakdown,
      risks,
      followUpActions
    };
  } catch (error) {
    safeLog('Design risk analysis failed', error);
    return null;
  }
}

// Design Risk Category Analyzers
async function analyzeDesignScheduleRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for incomplete phase coverage
  const standardPhases = ['SD', 'DD', 'CD', 'BN', 'CA'];
  const providedPhases = analysis.aia_phases ? Object.keys(analysis.aia_phases) : [];
  const missingPhases = standardPhases.filter(phase => !providedPhases.some(p => p.includes(phase)));

  if (missingPhases.length > 2) {
    const risk = {
      title: 'Incomplete Design Phase Coverage',
      severity: 'HIGH' as const,
      discipline: 'design' as const,
      category: 'schedule' as const,
      description: `Missing ${missingPhases.length} standard AIA phases: ${missingPhases.join(', ')}`,
      impact: 'Design schedule may require additional phases, extending timeline'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 50;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Clarify Design Phase Scope',
        description: `Confirm scope for missing phases: ${missingPhases.join(', ')}`,
        priority: 'HIGH',
        category: 'schedule',
        discipline: 'design'
      });
    }
  }

  // Check for frontend/backend loading in early phases
  if (analysis.aia_phases) {
    const totalFee = analysis.total_amount;
    const sdFee = Object.values(analysis.aia_phases).find(p => p.phase_name.includes('SD') || p.phase_name.includes('Schematic'))?.fee_amount || 0;
    const ddFee = Object.values(analysis.aia_phases).find(p => p.phase_name.includes('DD') || p.phase_name.includes('Design Development'))?.fee_amount || 0;

    const earlyPhasePercentage = ((sdFee + ddFee) / totalFee) * 100;

    if (earlyPhasePercentage > 35) {
      const risk = {
        title: 'Frontend-Heavy Fee Structure',
        severity: 'MEDIUM' as const,
        discipline: 'design' as const,
        category: 'schedule' as const,
        description: `${earlyPhasePercentage.toFixed(1)}% of fees in early phases (SD/DD)`,
        impact: 'Higher early phase costs may indicate scope creep or rushed schedule'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 30;
    }
  }

  // Check for timeline information
  if (!analysis.timeline || analysis.timeline.length < 30) {
    const risk = {
      title: 'Insufficient Design Timeline Detail',
      severity: 'MEDIUM' as const,
      discipline: 'design' as const,
      category: 'schedule' as const,
      description: 'Limited design schedule and milestone information provided',
      impact: 'Coordination and approval milestones may be unclear'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 25;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeDesignMarketRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for professional liability considerations
  if (!analysis.project_overhead?.professional_liability && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('liability') || a.toLowerCase().includes('insurance')
  )) {
    const risk = {
      title: 'Professional Liability Not Addressed',
      severity: 'MEDIUM' as const,
      discipline: 'design' as const,
      category: 'market' as const,
      description: 'No professional liability insurance or coverage mentioned',
      impact: 'Design firm liability exposure unclear for project risks'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 35;
  }

  // Check for consultant coordination
  const hasMultipleDisciplines = analysis.design_deliverables &&
    analysis.design_deliverables.some(d => d.responsible_discipline &&
      !d.responsible_discipline.toLowerCase().includes('architect'));

  if (hasMultipleDisciplines && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('consultant') || a.toLowerCase().includes('engineer')
  )) {
    const risk = {
      title: 'Multi-Discipline Coordination Risk',
      severity: 'MEDIUM' as const,
      discipline: 'design' as const,
      category: 'market' as const,
      description: 'Multiple design disciplines without clear coordination plan',
      impact: 'Design coordination issues may cause delays and additional costs'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 30;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Clarify Consultant Coordination',
        description: 'Request detailed consultant coordination and management plan',
        priority: 'MEDIUM',
        category: 'market',
        discipline: 'design'
      });
    }
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeDesignScopeRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for scope exclusions
  if (analysis.exclusions && analysis.exclusions.length > 2) {
    const risk = {
      title: 'Multiple Design Exclusions',
      severity: 'MEDIUM' as const,
      discipline: 'design' as const,
      category: 'scope' as const,
      description: `${analysis.exclusions.length} exclusions may indicate scope uncertainties`,
      impact: 'Excluded services may be required later, increasing project cost'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 35;
  }

  // Check for deliverables without clear definitions
  if (analysis.design_deliverables && analysis.design_deliverables.length > 0) {
    const vagueDeliverables = analysis.design_deliverables.filter(d =>
      !d.quantity && !d.completion_date && (!d.notes || d.notes.length < 20)
    );

    if (vagueDeliverables.length > analysis.design_deliverables.length * 0.4) {
      const risk = {
        title: 'Vague Deliverable Definitions',
        severity: 'MEDIUM' as const,
        discipline: 'design' as const,
        category: 'scope' as const,
        description: `${vagueDeliverables.length} deliverables lack specific requirements`,
        impact: 'Unclear deliverables may lead to scope disputes and additional work'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 30;

      if (flags.riskFollowUps) {
        followUpActions.push({
          title: 'Define Deliverable Requirements',
          description: 'Request specific requirements for vague deliverables',
          priority: 'MEDIUM',
          category: 'scope',
          discipline: 'design'
        });
      }
    }
  }

  // Check for missing administrative overhead
  if (!analysis.project_overhead?.administration && analysis.total_amount > 100000) {
    const risk = {
      title: 'Administrative Overhead Not Included',
      severity: 'MEDIUM' as const,
      discipline: 'design' as const,
      category: 'scope' as const,
      description: 'No administrative or project management fees identified',
      impact: 'Project management and coordination costs may not be covered'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 25;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeDesignContractRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for ownership of work product
  if (!analysis.assumptions?.some(a =>
    a.toLowerCase().includes('ownership') ||
    a.toLowerCase().includes('copyright') ||
    a.toLowerCase().includes('intellectual')
  )) {
    const risk = {
      title: 'Work Product Ownership Unclear',
      severity: 'LOW' as const,
      discipline: 'design' as const,
      category: 'contract' as const,
      description: 'No mention of design ownership or intellectual property rights',
      impact: 'Ownership disputes may arise for design documents and modifications'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 20;
  }

  // Check for approval process
  if (!analysis.assumptions?.some(a =>
    a.toLowerCase().includes('approval') ||
    a.toLowerCase().includes('review') ||
    a.toLowerCase().includes('submittal')
  )) {
    const risk = {
      title: 'Approval Process Not Defined',
      severity: 'MEDIUM' as const,
      discipline: 'design' as const,
      category: 'contract' as const,
      description: 'Design review and approval process not specified',
      impact: 'Approval delays may extend schedule and increase costs'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 30;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Define Approval Process',
        description: 'Request detailed design review and approval workflow',
        priority: 'MEDIUM',
        category: 'contract',
        discipline: 'design'
      });
    }
  }

  // Check for travel and reimbursable expenses
  if (!analysis.project_overhead?.travel_expenses && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('travel') ||
    a.toLowerCase().includes('reimburse') ||
    a.toLowerCase().includes('expense')
  )) {
    const risk = {
      title: 'Reimbursable Expenses Not Addressed',
      severity: 'LOW' as const,
      discipline: 'design' as const,
      category: 'contract' as const,
      description: 'Travel and reimbursable expense policy not specified',
      impact: 'Additional costs may be incurred for site visits and project expenses'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 15;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeDesignValueEngineeringOpportunities(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for high-fee phases that might be optimized
  if (analysis.aia_phases) {
    const highFeePhases = Object.entries(analysis.aia_phases)
      .filter(([, phase]) => phase.percentage_of_total > 25)
      .map(([name]) => name);

    if (highFeePhases.length > 0) {
      const risk = {
        title: 'High-Fee Phases Identified',
        severity: 'LOW' as const,
        discipline: 'design' as const,
        category: 'value_engineering' as const,
        description: `Phases with >25% of fees: ${highFeePhases.join(', ')}`,
        impact: 'Phase scope optimization could potentially reduce design costs'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 15;

      if (flags.riskFollowUps) {
        followUpActions.push({
          title: 'Review High-Fee Phase Scope',
          description: `Analyze scope efficiency for phases: ${highFeePhases.join(', ')}`,
          priority: 'LOW',
          category: 'value_engineering',
          discipline: 'design'
        });
      }
    }
  }

  // Check for potential deliverable optimization
  if (analysis.design_deliverables && analysis.design_deliverables.length > 10) {
    const risk = {
      title: 'Extensive Deliverable List',
      severity: 'LOW' as const,
      discipline: 'design' as const,
      category: 'value_engineering' as const,
      description: `${analysis.design_deliverables.length} deliverables - may include redundancies`,
      impact: 'Consolidating similar deliverables could reduce design effort'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 10;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

// Phase 2: Full Trade Risk Analyzer
async function analyzeTradeRisks(
  analysis: AnalysisResult,
  flags: Flags
): Promise<DisciplineRiskAssessment | null> {
  try {
    const risks: NormalizedRiskItem[] = [];
    const followUpActions: any[] = [];
    const categoryBreakdown = {
      schedule: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      market: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      scope: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      contract: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] },
      value_engineering: { score: 0, level: 'LOW' as const, risks: [] as NormalizedRiskItem[] }
    };

    // TRADE SCHEDULE RISK ANALYSIS
    await analyzeTradeScheduleRisks(analysis, risks, categoryBreakdown.schedule, followUpActions, flags);

    // TRADE MARKET RISK ANALYSIS
    await analyzeTradeMarketRisks(analysis, risks, categoryBreakdown.market, followUpActions, flags);

    // TRADE SCOPE RISK ANALYSIS
    await analyzeTradeScopeRisks(analysis, risks, categoryBreakdown.scope, followUpActions, flags);

    // TRADE CONTRACT RISK ANALYSIS
    await analyzeTradeContractRisks(analysis, risks, categoryBreakdown.contract, followUpActions, flags);

    // TRADE VALUE ENGINEERING OPPORTUNITIES
    await analyzeTradeValueEngineeringOpportunities(analysis, risks, categoryBreakdown.value_engineering, followUpActions, flags);

    // Calculate overall risk score (weighted average)
    const overallScore = Math.round(
      (categoryBreakdown.schedule.score * 0.20) +
      (categoryBreakdown.market.score * 0.25) +   // Higher weight for trade market risks (equipment availability)
      (categoryBreakdown.scope.score * 0.30) +    // Scope definition critical for technical systems
      (categoryBreakdown.contract.score * 0.15) +
      (categoryBreakdown.value_engineering.score * 0.10)
    );

    const overallLevel = overallScore >= 70 ? 'HIGH' : overallScore >= 40 ? 'MEDIUM' : 'LOW';

    return {
      discipline: 'trade',
      overallScore,
      overallLevel,
      categoryBreakdown,
      risks,
      followUpActions
    };
  } catch (error) {
    safeLog('Trade risk analysis failed', error);
    return null;
  }
}

// Trade Risk Category Analyzers
async function analyzeTradeScheduleRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for commissioning and testing schedules
  if (analysis.technical_systems) {
    const systemsWithoutTesting = Object.values(analysis.technical_systems)
      .filter(system => !system.testing_requirements || system.testing_requirements.length === 0);

    if (systemsWithoutTesting.length > 0) {
      const risk = {
        title: 'Missing Testing Requirements',
        severity: 'MEDIUM' as const,
        discipline: 'trade' as const,
        category: 'schedule' as const,
        description: `${systemsWithoutTesting.length} systems lack testing requirements`,
        impact: 'Commissioning delays may extend project completion schedule'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 35;

      if (flags.riskFollowUps) {
        followUpActions.push({
          title: 'Define Testing and Commissioning Schedule',
          description: 'Request detailed testing procedures and commissioning timeline',
          priority: 'MEDIUM',
          category: 'schedule',
          discipline: 'trade'
        });
      }
    }
  }

  // Check for complex system integration requirements
  if (analysis.technical_systems && Object.keys(analysis.technical_systems).length > 3) {
    const risk = {
      title: 'Complex System Integration Required',
      severity: 'MEDIUM' as const,
      discipline: 'trade' as const,
      category: 'schedule' as const,
      description: `${Object.keys(analysis.technical_systems).length} technical systems require integration`,
      impact: 'System integration and coordination may cause schedule delays'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 30;
  }

  // Check for equipment lead times
  if (analysis.equipment_specifications) {
    const customEquipment = analysis.equipment_specifications.filter(eq =>
      eq.specifications && eq.specifications.length > 0 && !eq.manufacturer?.toLowerCase().includes('standard')
    );

    if (customEquipment.length > 0) {
      const risk = {
        title: 'Custom Equipment Lead Time Risk',
        severity: 'MEDIUM' as const,
        discipline: 'trade' as const,
        category: 'schedule' as const,
        description: `${customEquipment.length} custom equipment items may have extended lead times`,
        impact: 'Custom equipment procurement may delay installation schedule'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 25;
    }
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeTradeMarketRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for equipment availability and supply chain risks
  if (analysis.equipment_specifications && analysis.equipment_specifications.length > 0) {
    const highValueEquipment = analysis.equipment_specifications.filter(eq => eq.total_cost > 50000);

    if (highValueEquipment.length > 0 && !analysis.assumptions?.some(a =>
      a.toLowerCase().includes('availability') ||
      a.toLowerCase().includes('lead time') ||
      a.toLowerCase().includes('supply')
    )) {
      const risk = {
        title: 'Equipment Supply Chain Risk',
        severity: 'HIGH' as const,
        discipline: 'trade' as const,
        category: 'market' as const,
        description: `${highValueEquipment.length} high-value equipment items without supply chain consideration`,
        impact: 'Equipment shortages or price increases could impact project budget'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 50;

      if (flags.riskFollowUps) {
        followUpActions.push({
          title: 'Verify Equipment Availability',
          description: 'Confirm equipment availability and lead times with manufacturers',
          priority: 'HIGH',
          category: 'market',
          discipline: 'trade'
        });
      }
    }
  }

  // Check for specialized labor requirements
  if (analysis.technical_systems) {
    const specializedSystems = Object.values(analysis.technical_systems)
      .filter(system => system.category === 'environmental' ||
        (system.specifications && system.specifications.length > 5));

    if (specializedSystems.length > 0) {
      const risk = {
        title: 'Specialized Labor Requirements',
        severity: 'MEDIUM' as const,
        discipline: 'trade' as const,
        category: 'market' as const,
        description: `${specializedSystems.length} systems require specialized installation expertise`,
        impact: 'Limited qualified contractors may increase costs or delay project'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 30;
    }
  }

  // Check for warranty and support considerations
  if (analysis.equipment_specifications) {
    const equipmentWithoutWarranty = analysis.equipment_specifications.filter(eq =>
      !eq.warranty_period || eq.warranty_period.length < 5
    );

    if (equipmentWithoutWarranty.length > analysis.equipment_specifications.length * 0.5) {
      const risk = {
        title: 'Limited Equipment Warranty Information',
        severity: 'LOW' as const,
        discipline: 'trade' as const,
        category: 'market' as const,
        description: `${equipmentWithoutWarranty.length} equipment items lack warranty details`,
        impact: 'Post-installation support and maintenance costs unclear'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 20;
    }
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeTradeScopeRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for missing equipment specifications
  if (!analysis.equipment_specifications || analysis.equipment_specifications.length === 0) {
    const risk = {
      title: 'Missing Equipment Specifications',
      severity: 'HIGH' as const,
      discipline: 'trade' as const,
      category: 'scope' as const,
      description: 'No equipment specifications provided',
      impact: 'Equipment performance and compatibility requirements unclear'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 60;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Request Equipment Specifications',
        description: 'Obtain detailed equipment specs, models, and performance criteria',
        priority: 'HIGH',
        category: 'scope',
        discipline: 'trade'
      });
    }
  }

  // Check for incomplete technical system definitions
  if (analysis.technical_systems) {
    const incompleteSystems = Object.values(analysis.technical_systems)
      .filter(system => !system.scope_notes || system.scope_notes.length < 50);

    if (incompleteSystems.length > 0) {
      const risk = {
        title: 'Incomplete System Scope Definitions',
        severity: 'MEDIUM' as const,
        discipline: 'trade' as const,
        category: 'scope' as const,
        description: `${incompleteSystems.length} systems lack detailed scope descriptions`,
        impact: 'Scope gaps may lead to change orders during installation'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 35;
    }
  }

  // Check for maintenance and service access considerations
  if (analysis.technical_systems && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('access') ||
    a.toLowerCase().includes('maintenance') ||
    a.toLowerCase().includes('service')
  )) {
    const risk = {
      title: 'Service Access Not Addressed',
      severity: 'MEDIUM' as const,
      discipline: 'trade' as const,
      category: 'scope' as const,
      description: 'Equipment maintenance and service access requirements not specified',
      impact: 'Future maintenance costs and access modifications not planned'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 25;
  }

  // Check for integration with existing systems
  if (analysis.total_amount > 200000 && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('existing') ||
    a.toLowerCase().includes('integration') ||
    a.toLowerCase().includes('interface')
  )) {
    const risk = {
      title: 'Existing System Integration Unclear',
      severity: 'MEDIUM' as const,
      discipline: 'trade' as const,
      category: 'scope' as const,
      description: 'Integration with existing building systems not addressed',
      impact: 'Additional work may be required for system compatibility'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 30;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeTradeContractRisks(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for performance guarantees
  if (analysis.technical_systems && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('performance') ||
    a.toLowerCase().includes('guarantee') ||
    a.toLowerCase().includes('efficiency')
  )) {
    const risk = {
      title: 'Performance Guarantees Not Specified',
      severity: 'MEDIUM' as const,
      discipline: 'trade' as const,
      category: 'contract' as const,
      description: 'No performance guarantees or efficiency commitments specified',
      impact: 'System performance expectations and remedies unclear'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 35;

    if (flags.riskFollowUps) {
      followUpActions.push({
        title: 'Define Performance Requirements',
        description: 'Request specific performance guarantees and measurement criteria',
        priority: 'MEDIUM',
        category: 'contract',
        discipline: 'trade'
      });
    }
  }

  // Check for training and documentation requirements
  if (analysis.equipment_specifications && analysis.equipment_specifications.length > 0 &&
    !analysis.assumptions?.some(a =>
      a.toLowerCase().includes('training') ||
      a.toLowerCase().includes('documentation') ||
      a.toLowerCase().includes('manual')
    )) {
    const risk = {
      title: 'Training and Documentation Not Included',
      severity: 'LOW' as const,
      discipline: 'trade' as const,
      category: 'contract' as const,
      description: 'No training or documentation deliverables specified',
      impact: 'Additional costs may be required for operation training and manuals'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 20;
  }

  // Check for startup and commissioning responsibilities
  if (analysis.technical_systems && !analysis.assumptions?.some(a =>
    a.toLowerCase().includes('commissioning') ||
    a.toLowerCase().includes('startup') ||
    a.toLowerCase().includes('testing')
  )) {
    const risk = {
      title: 'Commissioning Responsibilities Unclear',
      severity: 'MEDIUM' as const,
      discipline: 'trade' as const,
      category: 'contract' as const,
      description: 'System commissioning and startup responsibilities not defined',
      impact: 'Commissioning delays or disputes over responsibility scope'
    };
    risks.push(risk);
    category.risks.push(risk);
    riskScore += 30;
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}

async function analyzeTradeValueEngineeringOpportunities(
  analysis: AnalysisResult,
  risks: NormalizedRiskItem[],
  category: any,
  followUpActions: any[],
  flags: Flags
): Promise<void> {
  let riskScore = 0;

  // Check for equipment alternatives
  if (analysis.equipment_specifications) {
    const expensiveEquipment = analysis.equipment_specifications.filter(eq =>
      eq.total_cost > analysis.total_amount * 0.15
    );

    if (expensiveEquipment.length > 0 && !analysis.assumptions?.some(a =>
      a.toLowerCase().includes('alternate') ||
      a.toLowerCase().includes('equivalent') ||
      a.toLowerCase().includes('substitute')
    )) {
      const risk = {
        title: 'Equipment Value Engineering Opportunities',
        severity: 'LOW' as const,
        discipline: 'trade' as const,
        category: 'value_engineering' as const,
        description: `${expensiveEquipment.length} high-cost equipment items may have alternatives`,
        impact: 'Alternative equipment specifications could reduce project costs'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 20;

      if (flags.riskFollowUps) {
        followUpActions.push({
          title: 'Evaluate Equipment Alternatives',
          description: 'Review alternative equipment options for high-cost items',
          priority: 'LOW',
          category: 'value_engineering',
          discipline: 'trade'
        });
      }
    }
  }

  // Check for system redundancy optimization
  if (analysis.technical_systems && Object.keys(analysis.technical_systems).length > 2) {
    const systemsWithHighCosts = Object.values(analysis.technical_systems)
      .filter(system => system.total_cost > analysis.total_amount * 0.20);

    if (systemsWithHighCosts.length > 0) {
      const risk = {
        title: 'System Optimization Potential',
        severity: 'LOW' as const,
        discipline: 'trade' as const,
        category: 'value_engineering' as const,
        description: `${systemsWithHighCosts.length} high-cost systems may benefit from optimization`,
        impact: 'System design optimization could reduce equipment and installation costs'
      };
      risks.push(risk);
      category.risks.push(risk);
      riskScore += 15;
    }
  }

  category.score = Math.min(riskScore, 100);
  category.level = category.score >= 60 ? 'HIGH' : category.score >= 30 ? 'MEDIUM' : 'LOW';
}