// src/lib/analysis/sessionStore.ts

import type { AnalysisResult } from '@/types/analysis';

/**
 * Single source of truth for bid artifacts and leveling session state
 * Bulletproof store contract for multi-file upload and bid leveling
 */

export type BidArtifact = {
  id: string;               // stable ID
  fileName: string;
  discipline: 'construction' | 'design' | 'trade';
  totals: {
    grandTotal: number;
    byDivision: Record<string, number>;
    _source?: {
      grandTotal?: { page?: number; cell?: string };
      byDivision?: Record<string, { page?: number; cell?: string }>;
    };
  };
  terms?: {
    payment?: string[];
    insurance?: string[];
    schedule?: string[];
    warranty?: string[];
  };
  risks?: Array<{
    category: string;
    severity: number;
    msg: string;
    source?: { page?: number; cell?: string };
  }>;
  rawAnalysis?: unknown; // Store original analysis for reference
};

type SessionState = {
  artifacts: Record<string, BidArtifact>;
  baselineId?: string;
};

const state: SessionState = { artifacts: {} };
const listeners = new Set<() => void>();

export function onSessionChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach(fn => fn());
}

export function upsertArtifact(a: BidArtifact) {
  console.log(`📦 Storing artifact: ${a.id} (${a.fileName}) - ${a.discipline}`);
  state.artifacts[a.id] = a;

  // First file becomes default baseline
  if (!state.baselineId) {
    state.baselineId = a.id;
    console.log(`🎯 Set baseline: ${a.id}`);
  }

  console.log(`📊 Total artifacts: ${Object.keys(state.artifacts).length}`);
  emit();
}

export function getArtifacts() {
  return Object.values(state.artifacts);
}

export function setBaseline(id: string) {
  if (state.artifacts[id]) {
    state.baselineId = id;
    console.log(`🎯 Baseline changed to: ${id}`);
    emit();
  } else {
    console.warn(`⚠️ Cannot set baseline to non-existent artifact: ${id}`);
  }
}

export function getBaseline() {
  return state.baselineId;
}

export function clearSession() {
  console.log('🧹 Clearing session store');
  state.artifacts = {};
  state.baselineId = undefined;
  emit();
}

// Debug helpers
export function getSessionState() {
  return {
    artifactCount: Object.keys(state.artifacts).length,
    artifactIds: Object.keys(state.artifacts),
    baselineId: state.baselineId
  };
}

// Convert analysis result to BidArtifact
export function toBidArtifact(
  fileId: string,
  fileName: string,
  analysis: AnalysisResult,
  discipline: 'construction' | 'design' | 'trade'
): BidArtifact {
  let totals = { grandTotal: 0, byDivision: {} as Record<string, number> };

  try {
    if (discipline === 'construction' && analysis.csi_divisions) {
      // Construction CSI divisions
      let total = 0;
      const byDivision: Record<string, number> = {};

      Object.entries(analysis.csi_divisions).forEach(([code, data]) => {
        const cost = data.cost || 0;
        byDivision[code] = cost;
        total += cost;
      });

      totals = { grandTotal: total, byDivision };
    } else if (discipline === 'design' && analysis.aia_phases) {
      // Design AIA phases
      let total = 0;
      const byDivision: Record<string, number> = {};

      Object.entries(analysis.aia_phases).forEach(([phase, data]) => {
        const cost = data.fee_amount || 0;
        byDivision[phase] = cost;
        total += cost;
      });

      totals = { grandTotal: total, byDivision };
    } else if (discipline === 'trade' && analysis.technical_systems) {
      // Trade technical systems
      let total = 0;
      const byDivision: Record<string, number> = {};

      Object.entries(analysis.technical_systems).forEach(([system, data]) => {
        const cost = data.total_cost || 0;
        byDivision[system] = cost;
        total += cost;
      });

      totals = { grandTotal: total, byDivision };
    } else {
      // Fallback: try to extract total from common fields
      totals.grandTotal = analysis.total_amount || analysis.base_bid_amount || 0;
      console.warn(`⚠️ Could not extract detailed breakdown for ${discipline} analysis`);
    }
  } catch (error) {
    console.error('Error converting analysis to artifact:', error);
    totals.grandTotal = analysis.total_amount || analysis.base_bid_amount || 0;
  }

  return {
    id: fileId,
    fileName,
    discipline,
    totals,
    rawAnalysis: analysis
  };
}