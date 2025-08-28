import CryptoJS from 'crypto-js';
import { UsageData, AnalysisResult, MarketVariance, RiskAssessment } from '@/types/analysis';
import { RFPProject, SavedRFP } from '@/types/rfp';

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