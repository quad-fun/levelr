import CryptoJS from 'crypto-js';
import { UsageData, AnalysisResult, MarketVariance, RiskAssessment } from '@/types/analysis';
import { RFPProject, SavedRFP } from '@/types/rfp';
import {
  ProjectEcosystem,
  SavedProject,
  ProjectDashboardMetrics,
  AwardedBid,
  ProjectChangeOrder
} from '@/types/project';

// MVP: Simple localStorage utilities with optional encryption
export function secureStore(key: string, data: unknown, userSecret?: string): void {
  try {
    const jsonData = JSON.stringify(data);
    
    if (userSecret) {
      const encrypted = CryptoJS.AES.encrypt(jsonData, userSecret).toString();
      localStorage.setItem(key, encrypted);
    } else {
      localStorage.setItem(key, jsonData);
    }
  } catch (error) {
    console.error('Error storing data:', error);
  }
}

export function secureRetrieve(key: string, userSecret?: string): unknown {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    if (userSecret) {
      const decrypted = CryptoJS.AES.decrypt(stored, userSecret).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } else {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
}

export function clearSecureStorage(keys: string[]): void {
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing ${key}:`, error);
    }
  });
}

// Usage tracking functions
export function getLocalUsage(): UsageData {
  const usage = secureRetrieve('analysis_usage');
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  
  if (!usage) {
    return {
      totalAnalyses: 0,
      analysesThisMonth: 0,
      resetDate: now.toISOString()
    };
  }
  
  const resetDate = new Date((usage as UsageData).resetDate);
  const resetMonth = resetDate.getFullYear() * 12 + resetDate.getMonth();
  
  // Reset monthly counter if it's a new month
  if (currentMonth > resetMonth) {
    return {
      ...(usage as UsageData),
      analysesThisMonth: 0,
      resetDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    };
  }
  
  return usage as UsageData;
}

export function trackAnalysis(): void {
  const usage = getLocalUsage();
  usage.totalAnalyses += 1;
  usage.analysesThisMonth += 1;
  usage.lastAnalysis = new Date().toISOString();
  
  secureStore('analysis_usage', usage);
}

// MVP: Always allow analysis (no limits for initial validation)
export function canAnalyze(): { canAnalyze: boolean; message?: string } {
  return { canAnalyze: true };
}

// Growth Rails: Ready for user-based tracking
export function getUserUsage(userId: string): UsageData & { userId: string } {
  const stored = secureRetrieve(`usage_${userId}`);
  const usage = stored || {
    totalAnalyses: 0,
    analysesThisMonth: 0,
    resetDate: new Date().toISOString()
  };
  
  return { ...(usage as UsageData), userId };
}

export function trackAnalysisWithUser(userId: string): void {
  const usage = getUserUsage(userId);
  usage.totalAnalyses += 1;
  usage.analysesThisMonth += 1;
  usage.lastAnalysis = new Date().toISOString();
  
  secureStore(`usage_${userId}`, usage);
}

// Feature flag for enabling usage limits
export function getUsageStatus(userId?: string): { canAnalyze: boolean; message?: string } {
  const ENABLE_LIMITS = process.env.NEXT_PUBLIC_ENABLE_USAGE_LIMITS === 'true';
  
  if (!ENABLE_LIMITS) {
    return { canAnalyze: true };
  }
  
  if (userId) {
    const usage = getUserUsage(userId);
    if (usage.analysesThisMonth >= 10) {
      return { 
        canAnalyze: false, 
        message: "Monthly limit reached. Upgrade for unlimited access." 
      };
    }
  } else {
    const usage = getLocalUsage();
    if (usage.analysesThisMonth >= 1) {
      return { 
        canAnalyze: false, 
        message: "Free analysis limit reached. Sign up for more analyses." 
      };
    }
  }
  
  return { canAnalyze: true };
}

// Analysis History Management - Enhanced for Multi-Discipline
export interface SavedAnalysis {
  id: string;
  timestamp: string;
  result: AnalysisResult;
  marketVariance?: MarketVariance;
  riskAssessment?: RiskAssessment;
  comparisonData?: {
    averageTotal: number;
    divisionAverages?: Record<string, number>; // For construction
    phaseAverages?: Record<string, number>; // For design
    systemAverages?: Record<string, number>; // For trade
    riskLevel: string;
    discipline: 'construction' | 'design' | 'trade';
  };
}

export function saveAnalysis(
  result: AnalysisResult, 
  marketVariance?: MarketVariance, 
  riskAssessment?: RiskAssessment
): string {
  const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const savedAnalysis: SavedAnalysis = {
    id,
    timestamp: new Date().toISOString(),
    result,
    marketVariance,
    riskAssessment,
    comparisonData: calculateComparisonData(result)
  };
  
  // Save individual analysis
  secureStore(`analysis_${id}`, savedAnalysis);
  
  // Update analysis index
  const analyses = getSavedAnalyses();
  const updatedIndex = [...analyses, id];
  
  // Keep only last 50 analyses for performance
  if (updatedIndex.length > 50) {
    const oldAnalysisId = updatedIndex.shift();
    if (oldAnalysisId) {
      localStorage.removeItem(`analysis_${oldAnalysisId}`);
    }
  }
  
  secureStore('analysis_index', updatedIndex);
  
  // Track usage
  trackAnalysis();
  
  return id;
}

export function getSavedAnalyses(): string[] {
  const index = secureRetrieve('analysis_index');
  return Array.isArray(index) ? index : [];
}

export function getAnalysis(id: string): SavedAnalysis | null {
  const analysis = secureRetrieve(`analysis_${id}`);
  return analysis as SavedAnalysis | null;
}

export function getAllAnalyses(): SavedAnalysis[] {
  const ids = getSavedAnalyses();
  return ids
    .map(id => getAnalysis(id))
    .filter((analysis): analysis is SavedAnalysis => analysis !== null)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function deleteAnalysis(id: string): void {
  localStorage.removeItem(`analysis_${id}`);
  const analyses = getSavedAnalyses().filter(analysisId => analysisId !== id);
  secureStore('analysis_index', analyses);
}

export function clearAllAnalyses(): void {
  const analyses = getSavedAnalyses();
  analyses.forEach(id => localStorage.removeItem(`analysis_${id}`));
  localStorage.removeItem('analysis_index');
}

// Leveling Database Functions - Enhanced for Multi-Discipline
function calculateComparisonData(result: AnalysisResult): SavedAnalysis['comparisonData'] {
  const allAnalyses = getAllAnalyses();
  
  if (allAnalyses.length === 0) {
    return {
      averageTotal: result.total_amount,
      riskLevel: 'MEDIUM',
      discipline: result.discipline
    };
  }
  
  // Filter analyses by discipline for more accurate comparisons
  const disciplineAnalyses = allAnalyses.filter(a => a.result.discipline === result.discipline);
  
  if (disciplineAnalyses.length === 0) {
    return {
      averageTotal: result.total_amount,
      riskLevel: 'MEDIUM',
      discipline: result.discipline
    };
  }
  
  // Calculate averages from existing analyses of the same discipline
  const totals = disciplineAnalyses.map(a => a.result.total_amount);
  const averageTotal = totals.reduce((sum, total) => sum + total, 0) / totals.length;
  
  let divisionAverages: Record<string, number> | undefined;
  let phaseAverages: Record<string, number> | undefined;
  let systemAverages: Record<string, number> | undefined;
  
  // Calculate discipline-specific averages
  if (result.discipline === 'construction') {
    divisionAverages = calculateDivisionAverages(disciplineAnalyses);
  } else if (result.discipline === 'design') {
    phaseAverages = calculatePhaseAverages(disciplineAnalyses);
  } else if (result.discipline === 'trade') {
    systemAverages = calculateSystemAverages(disciplineAnalyses);
  }
  
  // Determine risk level distribution
  const riskLevels = disciplineAnalyses.map(a => 
    a.riskAssessment?.level || a.comparisonData?.riskLevel || 'MEDIUM'
  );
  const riskCounts = riskLevels.reduce((acc, level) => {
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonRisk = Object.entries(riskCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'MEDIUM';
  
  return {
    averageTotal,
    divisionAverages,
    phaseAverages,
    systemAverages,
    riskLevel: mostCommonRisk,
    discipline: result.discipline
  };
}

// Helper functions for discipline-specific calculations
function calculateDivisionAverages(analyses: SavedAnalysis[]): Record<string, number> {
  const divisionAverages: Record<string, number> = {};
  const divisionCounts: Record<string, number> = {};
  
  analyses.forEach(analysis => {
    Object.entries(analysis.result.csi_divisions).forEach(([code, data]) => {
      const percentage = (data.cost / analysis.result.total_amount) * 100;
      divisionAverages[code] = (divisionAverages[code] || 0) + percentage;
      divisionCounts[code] = (divisionCounts[code] || 0) + 1;
    });
  });
  
  // Convert sums to averages
  Object.keys(divisionAverages).forEach(code => {
    divisionAverages[code] = divisionAverages[code] / divisionCounts[code];
  });
  
  return divisionAverages;
}

function calculatePhaseAverages(analyses: SavedAnalysis[]): Record<string, number> {
  const phaseAverages: Record<string, number> = {};
  const phaseCounts: Record<string, number> = {};
  
  analyses.forEach(analysis => {
    if (analysis.result.aia_phases) {
      Object.entries(analysis.result.aia_phases).forEach(([phaseKey, phase]) => {
        const percentage = (phase.fee_amount / analysis.result.total_amount) * 100;
        phaseAverages[phaseKey] = (phaseAverages[phaseKey] || 0) + percentage;
        phaseCounts[phaseKey] = (phaseCounts[phaseKey] || 0) + 1;
      });
    }
  });
  
  // Convert sums to averages
  Object.keys(phaseAverages).forEach(phaseKey => {
    phaseAverages[phaseKey] = phaseAverages[phaseKey] / phaseCounts[phaseKey];
  });
  
  return phaseAverages;
}

function calculateSystemAverages(analyses: SavedAnalysis[]): Record<string, number> {
  const systemAverages: Record<string, number> = {};
  const systemCounts: Record<string, number> = {};
  
  analyses.forEach(analysis => {
    if (analysis.result.technical_systems) {
      Object.entries(analysis.result.technical_systems).forEach(([systemKey, system]) => {
        const percentage = (system.total_cost / analysis.result.total_amount) * 100;
        systemAverages[systemKey] = (systemAverages[systemKey] || 0) + percentage;
        systemCounts[systemKey] = (systemCounts[systemKey] || 0) + 1;
      });
    }
  });
  
  // Convert sums to averages
  Object.keys(systemAverages).forEach(systemKey => {
    systemAverages[systemKey] = systemAverages[systemKey] / systemCounts[systemKey];
  });
  
  return systemAverages;
}

// Market Intelligence Functions - Enhanced for Multi-Discipline
export function getMarketIntelligence(discipline?: 'construction' | 'design' | 'trade'): {
  totalProjects: number;
  averageProjectValue: number;
  disciplineBreakdown: Record<string, number>;
  divisionBenchmarks?: Record<string, { average: number; min: number; max: number }>;
  phaseBenchmarks?: Record<string, { average: number; min: number; max: number }>;
  systemBenchmarks?: Record<string, { average: number; min: number; max: number }>;
  riskDistribution: Record<string, number>;
} {
  const allAnalyses = getAllAnalyses();
  
  // Filter by discipline if specified
  const targetAnalyses = discipline 
    ? allAnalyses.filter(a => a.result.discipline === discipline)
    : allAnalyses;
  
  if (targetAnalyses.length === 0) {
    return {
      totalProjects: 0,
      averageProjectValue: 0,
      disciplineBreakdown: {},
      riskDistribution: {}
    };
  }
  
  const totalProjects = targetAnalyses.length;
  const averageProjectValue = targetAnalyses.reduce((sum, a) => sum + a.result.total_amount, 0) / totalProjects;
  
  // Calculate discipline breakdown
  const disciplineBreakdown = allAnalyses.reduce((acc, analysis) => {
    const disc = analysis.result.discipline;
    acc[disc] = (acc[disc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate discipline-specific benchmarks
  let divisionBenchmarks: Record<string, { average: number; min: number; max: number }> | undefined;
  let phaseBenchmarks: Record<string, { average: number; min: number; max: number }> | undefined;
  let systemBenchmarks: Record<string, { average: number; min: number; max: number }> | undefined;
  
  if (!discipline || discipline === 'construction') {
    divisionBenchmarks = calculateDivisionBenchmarks(
      discipline ? targetAnalyses : allAnalyses.filter(a => a.result.discipline === 'construction')
    );
  }
  
  if (!discipline || discipline === 'design') {
    phaseBenchmarks = calculatePhaseBenchmarks(
      discipline ? targetAnalyses : allAnalyses.filter(a => a.result.discipline === 'design')
    );
  }
  
  if (!discipline || discipline === 'trade') {
    systemBenchmarks = calculateSystemBenchmarks(
      discipline ? targetAnalyses : allAnalyses.filter(a => a.result.discipline === 'trade')
    );
  }
  
  // Risk distribution
  const riskDistribution = targetAnalyses.reduce((acc, analysis) => {
    const risk = analysis.riskAssessment?.level || analysis.comparisonData?.riskLevel || 'UNKNOWN';
    acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalProjects,
    averageProjectValue,
    disciplineBreakdown,
    divisionBenchmarks,
    phaseBenchmarks,
    systemBenchmarks,
    riskDistribution
  };
}

// Benchmark calculation helpers
function calculateDivisionBenchmarks(analyses: SavedAnalysis[]): Record<string, { average: number; min: number; max: number }> {
  const divisionStats: Record<string, number[]> = {};
  
  analyses.forEach(analysis => {
    Object.entries(analysis.result.csi_divisions).forEach(([code, data]) => {
      const percentage = (data.cost / analysis.result.total_amount) * 100;
      if (!divisionStats[code]) divisionStats[code] = [];
      divisionStats[code].push(percentage);
    });
  });
  
  const benchmarks: Record<string, { average: number; min: number; max: number }> = {};
  Object.entries(divisionStats).forEach(([code, percentages]) => {
    percentages.sort((a, b) => a - b);
    benchmarks[code] = {
      average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
      min: percentages[0],
      max: percentages[percentages.length - 1]
    };
  });
  
  return benchmarks;
}

function calculatePhaseBenchmarks(analyses: SavedAnalysis[]): Record<string, { average: number; min: number; max: number }> {
  const phaseStats: Record<string, number[]> = {};
  
  analyses.forEach(analysis => {
    if (analysis.result.aia_phases) {
      Object.entries(analysis.result.aia_phases).forEach(([phaseKey, phase]) => {
        const percentage = (phase.fee_amount / analysis.result.total_amount) * 100;
        if (!phaseStats[phaseKey]) phaseStats[phaseKey] = [];
        phaseStats[phaseKey].push(percentage);
      });
    }
  });
  
  const benchmarks: Record<string, { average: number; min: number; max: number }> = {};
  Object.entries(phaseStats).forEach(([phaseKey, percentages]) => {
    percentages.sort((a, b) => a - b);
    benchmarks[phaseKey] = {
      average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
      min: percentages[0],
      max: percentages[percentages.length - 1]
    };
  });
  
  return benchmarks;
}

function calculateSystemBenchmarks(analyses: SavedAnalysis[]): Record<string, { average: number; min: number; max: number }> {
  const systemStats: Record<string, number[]> = {};
  
  analyses.forEach(analysis => {
    if (analysis.result.technical_systems) {
      Object.entries(analysis.result.technical_systems).forEach(([systemKey, system]) => {
        const percentage = (system.total_cost / analysis.result.total_amount) * 100;
        if (!systemStats[systemKey]) systemStats[systemKey] = [];
        systemStats[systemKey].push(percentage);
      });
    }
  });
  
  const benchmarks: Record<string, { average: number; min: number; max: number }> = {};
  Object.entries(systemStats).forEach(([systemKey, percentages]) => {
    percentages.sort((a, b) => a - b);
    benchmarks[systemKey] = {
      average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
      min: percentages[0],
      max: percentages[percentages.length - 1]
    };
  });
  
  return benchmarks;
}

// Cross-discipline comparison functions
export function compareAnalysisAcrossDisciplines(analysisId: string): {
  analysis: SavedAnalysis;
  constructionComparison?: { averageValue: number; riskDistribution: Record<string, number> };
  designComparison?: { averageValue: number; riskDistribution: Record<string, number> };
  tradeComparison?: { averageValue: number; riskDistribution: Record<string, number> };
} {
  const analysis = getAnalysis(analysisId);
  if (!analysis) {
    throw new Error('Analysis not found');
  }
  
  const allAnalyses = getAllAnalyses();
  
  const constructionAnalyses = allAnalyses.filter(a => a.result.discipline === 'construction');
  const designAnalyses = allAnalyses.filter(a => a.result.discipline === 'design');
  const tradeAnalyses = allAnalyses.filter(a => a.result.discipline === 'trade');
  
  const constructionComparison = constructionAnalyses.length > 0 ? {
    averageValue: constructionAnalyses.reduce((sum, a) => sum + a.result.total_amount, 0) / constructionAnalyses.length,
    riskDistribution: constructionAnalyses.reduce((acc, a) => {
      const risk = a.riskAssessment?.level || 'MEDIUM';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  } : undefined;
  
  const designComparison = designAnalyses.length > 0 ? {
    averageValue: designAnalyses.reduce((sum, a) => sum + a.result.total_amount, 0) / designAnalyses.length,
    riskDistribution: designAnalyses.reduce((acc, a) => {
      const risk = a.riskAssessment?.level || 'MEDIUM';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  } : undefined;
  
  const tradeComparison = tradeAnalyses.length > 0 ? {
    averageValue: tradeAnalyses.reduce((sum, a) => sum + a.result.total_amount, 0) / tradeAnalyses.length,
    riskDistribution: tradeAnalyses.reduce((acc, a) => {
      const risk = a.riskAssessment?.level || 'MEDIUM';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  } : undefined;
  
  return {
    analysis,
    constructionComparison,
    designComparison,
    tradeComparison
  };
}

// RFP Storage Functions
export function saveRFP(project: RFPProject): string {
  const id = `rfp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const savedRFP: SavedRFP = {
    id,
    timestamp: new Date().toISOString(),
    project: {
      ...project,
      id,
      updatedAt: new Date().toISOString()
    },
    status: 'draft',
    receivedBids: []
  };
  
  // Save individual RFP
  secureStore(`rfp_${id}`, savedRFP);
  
  // Update RFP index
  const rfps = getSavedRFPs();
  const updatedIndex = [...rfps, id];
  
  // Keep only last 100 RFPs for performance
  if (updatedIndex.length > 100) {
    const oldRFPId = updatedIndex.shift();
    if (oldRFPId) {
      localStorage.removeItem(`rfp_${oldRFPId}`);
    }
  }
  
  secureStore('rfp_index', updatedIndex);
  
  return id;
}

export function getSavedRFPs(): string[] {
  const index = secureRetrieve('rfp_index');
  return Array.isArray(index) ? index : [];
}

export function getRFP(id: string): SavedRFP | null {
  const rfp = secureRetrieve(`rfp_${id}`);
  return rfp as SavedRFP | null;
}

export function getAllRFPs(): SavedRFP[] {
  const ids = getSavedRFPs();
  return ids
    .map(id => getRFP(id))
    .filter((rfp): rfp is SavedRFP => rfp !== null)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function updateRFP(id: string, updates: Partial<RFPProject>): void {
  const existingRFP = getRFP(id);
  if (!existingRFP) {
    throw new Error('RFP not found');
  }
  
  const updatedRFP: SavedRFP = {
    ...existingRFP,
    project: {
      ...existingRFP.project,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  };
  
  secureStore(`rfp_${id}`, updatedRFP);
}

export function updateRFPStatus(id: string, status: SavedRFP['status']): void {
  const existingRFP = getRFP(id);
  if (!existingRFP) {
    throw new Error('RFP not found');
  }
  
  const updatedRFP: SavedRFP = {
    ...existingRFP,
    status
  };
  
  secureStore(`rfp_${id}`, updatedRFP);
}

export function deleteRFP(id: string): void {
  localStorage.removeItem(`rfp_${id}`);
  const rfps = getSavedRFPs().filter(rfpId => rfpId !== id);
  secureStore('rfp_index', rfps);
}

export function linkBidToRFP(rfpId: string, bidAnalysisId: string): void {
  const existingRFP = getRFP(rfpId);
  if (!existingRFP) {
    throw new Error('RFP not found');
  }
  
  const receivedBids = existingRFP.receivedBids || [];
  if (!receivedBids.includes(bidAnalysisId)) {
    receivedBids.push(bidAnalysisId);
    
    const updatedRFP: SavedRFP = {
      ...existingRFP,
      receivedBids
    };
    
    secureStore(`rfp_${rfpId}`, updatedRFP);
  }
}

export function clearAllRFPs(): void {
  const rfps = getSavedRFPs();
  rfps.forEach(id => localStorage.removeItem(`rfp_${id}`));
  localStorage.removeItem('rfp_index');
}

// Project Ecosystem Storage Functions - Added for project management functionality
export function saveProject(project: ProjectEcosystem): string {
  const id = `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const metrics = calculateProjectMetrics(project);
  const savedProject: SavedProject = {
    id,
    timestamp: new Date().toISOString(),
    project: {
      ...project,
      id,
      updatedAt: new Date().toISOString()
    },
    metrics,
    lastActivity: new Date().toISOString()
  };

  // Save individual project
  secureStore(`project_${id}`, savedProject);

  // Update project index
  const projects = getSavedProjects();
  const updatedIndex = [...projects, id];

  // Keep only last 100 projects for performance
  if (updatedIndex.length > 100) {
    const oldProjectId = updatedIndex.shift();
    if (oldProjectId) {
      localStorage.removeItem(`project_${oldProjectId}`);
    }
  }

  secureStore('project_index', updatedIndex);

  return id;
}

export function getSavedProjects(): string[] {
  const index = secureRetrieve('project_index');
  return Array.isArray(index) ? index : [];
}

export function getProject(id: string): SavedProject | null {
  const project = secureRetrieve(`project_${id}`);
  return project as SavedProject | null;
}

export function getAllProjects(): SavedProject[] {
  const ids = getSavedProjects();
  return ids
    .map(id => getProject(id))
    .filter((project): project is SavedProject => project !== null)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function updateProject(id: string, updates: Partial<ProjectEcosystem>): void {
  const existingProject = getProject(id);
  if (!existingProject) {
    throw new Error('Project not found');
  }

  const updatedProjectData = {
    ...existingProject.project,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const metrics = calculateProjectMetrics(updatedProjectData);

  const updatedProject: SavedProject = {
    ...existingProject,
    project: updatedProjectData,
    metrics,
    lastActivity: new Date().toISOString()
  };

  secureStore(`project_${id}`, updatedProject);
}

export function deleteProject(id: string): void {
  localStorage.removeItem(`project_${id}`);
  const projects = getSavedProjects().filter(projectId => projectId !== id);
  secureStore('project_index', projects);
}

export function linkRFPToProject(projectId: string, rfpId: string): void {
  const existingProject = getProject(projectId);
  if (!existingProject) {
    throw new Error('Project not found');
  }

  const rfpIds = existingProject.project.rfpIds || [];
  if (!rfpIds.includes(rfpId)) {
    const updatedProject = {
      ...existingProject.project,
      rfpIds: [...rfpIds, rfpId],
      updatedAt: new Date().toISOString()
    };

    updateProject(projectId, updatedProject);
  }
}

export function awardBidToProject(projectId: string, bidData: Omit<AwardedBid, 'id'>): string {
  const existingProject = getProject(projectId);
  if (!existingProject) {
    throw new Error('Project not found');
  }

  const bidId = `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const awardedBid: AwardedBid = {
    ...bidData,
    id: bidId
  };

  const awardedBids = existingProject.project.awardedBids || [];
  const updatedProject = {
    ...existingProject.project,
    awardedBids: [...awardedBids, awardedBid],
    updatedAt: new Date().toISOString()
  };

  updateProject(projectId, updatedProject);

  return bidId;
}

export function updateBidStatus(projectId: string, bidId: string, status: AwardedBid['status']): void {
  const existingProject = getProject(projectId);
  if (!existingProject) {
    throw new Error('Project not found');
  }

  const awardedBids = existingProject.project.awardedBids.map(bid =>
    bid.id === bidId ? { ...bid, status } : bid
  );

  const updatedProject = {
    ...existingProject.project,
    awardedBids,
    updatedAt: new Date().toISOString()
  };

  updateProject(projectId, updatedProject);
}

export function addChangeOrder(changeOrder: Omit<ProjectChangeOrder, 'id'>): string {
  const id = `co_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const fullChangeOrder: ProjectChangeOrder = {
    ...changeOrder,
    id
  };

  // Save individual change order
  secureStore(`changeorder_${id}`, fullChangeOrder);

  // Update change order index for project
  const projectChangeOrders = getProjectChangeOrders(changeOrder.projectId);
  const updatedIndex = [...projectChangeOrders.map(co => co.id), id];
  secureStore(`project_changeorders_${changeOrder.projectId}`, updatedIndex);

  return id;
}

export function getProjectChangeOrders(projectId: string): ProjectChangeOrder[] {
  const index = secureRetrieve(`project_changeorders_${projectId}`);
  const ids = Array.isArray(index) ? index : [];

  return ids
    .map(id => secureRetrieve(`changeorder_${id}`))
    .filter((co): co is ProjectChangeOrder => co !== null)
    .sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
}

export function updateChangeOrderStatus(id: string, status: ProjectChangeOrder['status'], approvedDate?: string): void {
  const changeOrder = secureRetrieve(`changeorder_${id}`) as ProjectChangeOrder;
  if (!changeOrder) {
    throw new Error('Change order not found');
  }

  const updatedChangeOrder = {
    ...changeOrder,
    status,
    ...(approvedDate && { approvedDate })
  };

  secureStore(`changeorder_${id}`, updatedChangeOrder);
}

// Helper function to calculate project metrics
function calculateProjectMetrics(project: ProjectEcosystem): ProjectDashboardMetrics {
  const totalBudget = project.totalBudget;
  const awardedBids = project.awardedBids || [];
  const rfpIds = project.rfpIds || [];

  const committedBudget = awardedBids.reduce((sum, bid) => sum + bid.awardedAmount, 0);
  const remainingBudget = totalBudget - committedBudget;
  const budgetVariance = ((committedBudget - totalBudget) / totalBudget) * 100;

  // Calculate schedule variance (simplified - days from planned end date)
  const plannedEnd = new Date(project.baselineSchedule.endDate);
  const currentEnd = new Date(project.currentSchedule.endDate);
  const scheduleVariance = Math.ceil((currentEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24));

  const totalRfps = rfpIds.length;
  // const linkedRfps = new Set(awardedBids.map(bid => bid.rfpId)).size;
  const completedRfps = awardedBids.filter(bid => bid.status === 'completed').length;
  const activeRfps = totalRfps - completedRfps;

  const totalBids = awardedBids.length;
  const awardedBidsCount = awardedBids.filter(bid => bid.status !== 'awarded').length;

  // Simple risk scoring based on budget and schedule variance
  let riskScore = 0;
  if (Math.abs(budgetVariance) > 10) riskScore += 30;
  if (Math.abs(scheduleVariance) > 30) riskScore += 30;
  if (awardedBidsCount / Math.max(totalBids, 1) < 0.5) riskScore += 20;
  if (activeRfps > totalRfps * 0.8) riskScore += 20;

  // Calculate completion percentage based on completed milestones
  const totalMilestones = project.currentSchedule.milestones.length;
  const completedMilestones = project.currentSchedule.milestones.filter(m => m.status === 'completed').length;
  const completionPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return {
    totalBudget,
    committedBudget,
    remainingBudget,
    budgetVariance,
    scheduleVariance,
    totalRfps,
    completedRfps,
    activeRfps,
    totalBids,
    awardedBids: awardedBidsCount,
    riskScore: Math.min(riskScore, 100),
    completionPercentage
  };
}

// Project intelligence functions
export function getProjectIntelligence(discipline?: 'construction' | 'design' | 'trade'): {
  totalProjects: number;
  averageProjectValue: number;
  averageDuration: number;
  disciplineBreakdown: Record<string, number>;
  budgetVarianceStats: { average: number; min: number; max: number };
  scheduleVarianceStats: { average: number; min: number; max: number };
  riskDistribution: Record<string, number>;
} {
  const allProjects = getAllProjects();

  // Filter by discipline if specified
  const targetProjects = discipline
    ? allProjects.filter(p => p.project.disciplines.includes(discipline))
    : allProjects;

  if (targetProjects.length === 0) {
    return {
      totalProjects: 0,
      averageProjectValue: 0,
      averageDuration: 0,
      disciplineBreakdown: {},
      budgetVarianceStats: { average: 0, min: 0, max: 0 },
      scheduleVarianceStats: { average: 0, min: 0, max: 0 },
      riskDistribution: {}
    };
  }

  const totalProjects = targetProjects.length;
  const averageProjectValue = targetProjects.reduce((sum, p) => sum + p.project.totalBudget, 0) / totalProjects;

  // Calculate average duration
  const durations = targetProjects.map(p => {
    const start = new Date(p.project.baselineSchedule.startDate);
    const end = new Date(p.project.baselineSchedule.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  });
  const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

  // Discipline breakdown
  const disciplineBreakdown = allProjects.reduce((acc, project) => {
    project.project.disciplines.forEach(disc => {
      acc[disc] = (acc[disc] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Budget variance statistics
  const budgetVariances = targetProjects.map(p => p.metrics.budgetVariance);
  const budgetVarianceStats = {
    average: budgetVariances.reduce((sum, v) => sum + v, 0) / budgetVariances.length,
    min: Math.min(...budgetVariances),
    max: Math.max(...budgetVariances)
  };

  // Schedule variance statistics
  const scheduleVariances = targetProjects.map(p => p.metrics.scheduleVariance);
  const scheduleVarianceStats = {
    average: scheduleVariances.reduce((sum, v) => sum + v, 0) / scheduleVariances.length,
    min: Math.min(...scheduleVariances),
    max: Math.max(...scheduleVariances)
  };

  // Risk distribution
  const riskDistribution = targetProjects.reduce((acc, project) => {
    const risk = project.metrics.riskScore < 30 ? 'LOW' :
                 project.metrics.riskScore < 70 ? 'MEDIUM' : 'HIGH';
    acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalProjects,
    averageProjectValue,
    averageDuration,
    disciplineBreakdown,
    budgetVarianceStats,
    scheduleVarianceStats,
    riskDistribution
  };
}

export function clearAllProjects(): void {
  const projects = getSavedProjects();
  projects.forEach(id => {
    localStorage.removeItem(`project_${id}`);
    // Also clean up change orders for this project
    const changeOrders = getProjectChangeOrders(id);
    changeOrders.forEach(co => localStorage.removeItem(`changeorder_${co.id}`));
    localStorage.removeItem(`project_changeorders_${id}`);
  });
  localStorage.removeItem('project_index');
}