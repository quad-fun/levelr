import CryptoJS from 'crypto-js';
import { UsageData, AnalysisResult } from '@/types/analysis';
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

// Analysis History Management
export interface SavedAnalysis {
  id: string;
  timestamp: string;
  result: AnalysisResult;
  comparisonData?: {
    averageTotal: number;
    divisionAverages: Record<string, number>;
    riskLevel: string;
  };
}

export function saveAnalysis(result: AnalysisResult): string {
  const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const savedAnalysis: SavedAnalysis = {
    id,
    timestamp: new Date().toISOString(),
    result,
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

// Leveling Database Functions
function calculateComparisonData(_result: AnalysisResult): SavedAnalysis['comparisonData'] {
  const allAnalyses = getAllAnalyses();
  
  if (allAnalyses.length === 0) {
    return undefined;
  }
  
  // Calculate averages from existing analyses
  const totals = allAnalyses.map(a => a.result.total_amount);
  const averageTotal = totals.reduce((sum, total) => sum + total, 0) / totals.length;
  
  // Calculate division averages
  const divisionAverages: Record<string, number> = {};
  const divisionCounts: Record<string, number> = {};
  
  allAnalyses.forEach(analysis => {
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
  
  // Determine risk level distribution
  const riskLevels = allAnalyses.map(a => a.comparisonData?.riskLevel || 'UNKNOWN');
  const riskCounts = riskLevels.reduce((acc, level) => {
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonRisk = Object.entries(riskCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'MEDIUM';
  
  return {
    averageTotal,
    divisionAverages,
    riskLevel: mostCommonRisk
  };
}

// Market Intelligence Functions  
export function getMarketIntelligence(): {
  totalProjects: number;
  averageProjectValue: number;
  divisionBenchmarks: Record<string, { average: number; min: number; max: number }>;
  riskDistribution: Record<string, number>;
} {
  const allAnalyses = getAllAnalyses();
  
  if (allAnalyses.length === 0) {
    return {
      totalProjects: 0,
      averageProjectValue: 0,
      divisionBenchmarks: {},
      riskDistribution: {}
    };
  }
  
  const totalProjects = allAnalyses.length;
  const averageProjectValue = allAnalyses.reduce((sum, a) => sum + a.result.total_amount, 0) / totalProjects;
  
  // Calculate division benchmarks from actual data
  const divisionStats: Record<string, number[]> = {};
  
  allAnalyses.forEach(analysis => {
    Object.entries(analysis.result.csi_divisions).forEach(([code, data]) => {
      const percentage = (data.cost / analysis.result.total_amount) * 100;
      if (!divisionStats[code]) divisionStats[code] = [];
      divisionStats[code].push(percentage);
    });
  });
  
  const divisionBenchmarks: Record<string, { average: number; min: number; max: number }> = {};
  Object.entries(divisionStats).forEach(([code, percentages]) => {
    percentages.sort((a, b) => a - b);
    divisionBenchmarks[code] = {
      average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
      min: percentages[0],
      max: percentages[percentages.length - 1]
    };
  });
  
  // Risk distribution
  const riskDistribution = allAnalyses.reduce((acc, analysis) => {
    const risk = analysis.comparisonData?.riskLevel || 'UNKNOWN';
    acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalProjects,
    averageProjectValue,
    divisionBenchmarks,
    riskDistribution
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