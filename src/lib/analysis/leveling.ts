// src/lib/analysis/leveling.ts

import type { BidArtifact } from './sessionStore';

export interface LevelingComparison {
  id: string;
  fileName: string;
  delta: number;
  deltaPercent: number;
  topDivisions: Array<{
    code: string;
    diff: number;
    diffPercent: number;
    baseCost: number;
    otherCost: number;
  }>;
}

export interface LevelingResult {
  baselineId: string;
  baselineFileName: string;
  baselineTotal: number;
  comparisons: LevelingComparison[];
  discipline: string;
}

/**
 * Build discipline-agnostic leveling comparison
 * Works for construction (CSI), design (AIA), or trade (systems)
 */
export function buildLeveling(arts: BidArtifact[], baselineId: string): LevelingResult | null {
  if (arts.length < 2) {
    console.log('📊 Not enough artifacts for leveling');
    return null;
  }

  const byId = Object.fromEntries(arts.map(a => [a.id, a]));
  const base = byId[baselineId];

  if (!base) {
    console.warn(`⚠️ Baseline artifact not found: ${baselineId}`);
    return null;
  }

  console.log(`📊 Building leveling with baseline: ${base.fileName} ($${base.totals.grandTotal.toLocaleString()})`);

  const comparisons = arts
    .filter(a => a.id !== baselineId)
    .map(a => {
      const delta = a.totals.grandTotal - base.totals.grandTotal;
      const deltaPercent = base.totals.grandTotal > 0 ? (delta / base.totals.grandTotal) * 100 : 0;

      const comparison: LevelingComparison = {
        id: a.id,
        fileName: a.fileName,
        delta,
        deltaPercent,
        topDivisions: topKDelta(base.totals.byDivision, a.totals.byDivision, 5)
      };

      console.log(`📊 Comparison: ${a.fileName} - Delta: $${delta.toLocaleString()} (${deltaPercent.toFixed(1)}%)`);
      return comparison;
    })
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)); // Sort by largest delta

  const result: LevelingResult = {
    baselineId,
    baselineFileName: base.fileName,
    baselineTotal: base.totals.grandTotal,
    comparisons,
    discipline: base.discipline
  };

  console.log(`✅ Leveling built: ${comparisons.length} comparisons against ${base.fileName}`);
  return result;
}

/**
 * Find top K differences between baseline and comparison divisions
 */
function topKDelta(
  base: Record<string, number>,
  other: Record<string, number>,
  k: number
) {
  const keys = new Set([...Object.keys(base), ...Object.keys(other)]);

  const rows = [...keys].map(code => {
    const baseCost = base[code] || 0;
    const otherCost = other[code] || 0;
    const diff = otherCost - baseCost;
    const diffPercent = baseCost > 0 ? (diff / baseCost) * 100 : 0;

    return {
      code,
      diff,
      diffPercent,
      baseCost,
      otherCost
    };
  });

  return rows
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, k);
}

/**
 * Auto-level trigger - checks if we have enough artifacts
 */
export function maybeAutoLevel(artifacts: BidArtifact[], baselineId?: string): LevelingResult | null {
  if (artifacts.length < 2) {
    return null;
  }

  // Use provided baseline or first artifact
  const baseline = baselineId || artifacts[0]?.id;
  if (!baseline) {
    return null;
  }

  return buildLeveling(artifacts, baseline);
}

/**
 * Debounce utility for auto-leveling
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Debug auto-leveling conditions
 */
export function debugAutoLeveling(artifacts: BidArtifact[], baselineId?: string) {
  console.log('🔍 AUTO-LEVELING DEBUG:');
  console.log('📊 Artifacts provided:', artifacts.length);
  console.log('🎯 Baseline ID provided:', baselineId);

  if (artifacts.length < 2) {
    console.log('❌ Not enough artifacts for leveling (need ≥2)');
    return null;
  }

  const baseline = baselineId || artifacts[0]?.id;
  console.log('🎯 Using baseline:', baseline);

  if (!baseline) {
    console.log('❌ No baseline found');
    return null;
  }

  const result = buildLeveling(artifacts, baseline);
  console.log('✅ Leveling result:', result ? 'Success' : 'Failed');

  if (result) {
    console.log('📊 Comparisons:', result.comparisons.length);
    result.comparisons.forEach((comp, index) => {
      console.log(`  ${index + 1}. ${comp.fileName}: $${comp.delta.toLocaleString()} (${comp.deltaPercent.toFixed(1)}%)`);
    });
  }

  return result;
}