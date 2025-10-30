// src/lib/analysis/score.ts

import type { Risk } from '@/types/analysis';

/**
 * AI-Native deterministic scoring system
 * Fixes the 0/100 bug with transparent, weighted calculations
 */

export interface CategoryWeights {
  Schedule: number;
  Market: number;
  Scope: number;
  Contract: number;
  Quality: number;
}

export interface ScoreResult {
  overall: number; // 0-100
  byCategory: Record<Risk['category'], number>;
  confidence: number; // 0-1 based on evidence quality
  breakdown: {
    weights: CategoryWeights;
    riskCounts: Record<Risk['category'], number>;
    avgSeverities: Record<Risk['category'], number>;
  };
}

// Default category weights (must sum to 1.0)
export const DEFAULT_WEIGHTS: CategoryWeights = {
  Schedule: 0.30, // Timeline is critical in construction
  Market: 0.30,   // Cost volatility impacts bottom line
  Scope: 0.20,    // Change orders are expensive
  Contract: 0.15, // Terms affect cash flow
  Quality: 0.05   // Quality issues are usually caught early
};

/**
 * Convert severity (0-5) to score contribution (0-100)
 * Higher severity = lower score (more risky)
 */
function severityToScore(severity: number): number {
  // Invert: 0 severity = 100 score, 5 severity = 0 score
  return Math.max(0, Math.min(100, 100 - (severity * 20)));
}

/**
 * Calculate category score from risks
 */
function calculateCategoryScore(risks: Risk[]): number {
  if (risks.length === 0) return 100; // No risks = perfect score

  // Average severity across all risks in category
  const avgSeverity = risks.reduce((sum, risk) => sum + risk.severity, 0) / risks.length;
  return severityToScore(avgSeverity);
}

/**
 * Calculate confidence based on evidence quality
 */
function calculateConfidence(risks: Risk[]): number {
  if (risks.length === 0) return 0.5; // Low confidence when no risks found

  const totalEvidence = risks.reduce((sum, risk) => sum + risk.evidence.length, 0);
  const totalPageRefs = risks.reduce((sum, risk) => sum + risk.pageRefs.length, 0);

  // Confidence increases with evidence and page references
  const evidenceScore = Math.min(1, totalEvidence / (risks.length * 2)); // 2 pieces of evidence per risk = full confidence
  const pageRefScore = Math.min(1, totalPageRefs / risks.length); // 1 page ref per risk = full confidence

  return (evidenceScore + pageRefScore) / 2;
}

/**
 * Main scoring function - deterministic and transparent
 */
export function calculateScore(
  risks: Risk[],
  weights: CategoryWeights = DEFAULT_WEIGHTS
): ScoreResult {
  // Group risks by category
  const risksByCategory: Partial<Record<Risk['category'], Risk[]>> = {};
  for (const risk of risks) {
    if (!risksByCategory[risk.category]) {
      risksByCategory[risk.category] = [];
    }
    risksByCategory[risk.category]!.push(risk);
  }

  // Calculate score for each category
  const byCategory: Record<Risk['category'], number> = {
    Schedule: calculateCategoryScore(risksByCategory.Schedule || []),
    Market: calculateCategoryScore(risksByCategory.Market || []),
    Scope: calculateCategoryScore(risksByCategory.Scope || []),
    Contract: calculateCategoryScore(risksByCategory.Contract || []),
    Quality: calculateCategoryScore(risksByCategory.Quality || [])
  };

  // Calculate weighted overall score
  const overall = Math.round(
    (byCategory.Schedule * weights.Schedule) +
    (byCategory.Market * weights.Market) +
    (byCategory.Scope * weights.Scope) +
    (byCategory.Contract * weights.Contract) +
    (byCategory.Quality * weights.Quality)
  );

  // Calculate confidence
  const confidence = calculateConfidence(risks);

  // Generate breakdown for transparency
  const breakdown = {
    weights,
    riskCounts: {
      Schedule: risksByCategory.Schedule?.length || 0,
      Market: risksByCategory.Market?.length || 0,
      Scope: risksByCategory.Scope?.length || 0,
      Contract: risksByCategory.Contract?.length || 0,
      Quality: risksByCategory.Quality?.length || 0
    },
    avgSeverities: {
      Schedule: (risksByCategory.Schedule?.reduce((sum, r) => sum + r.severity, 0) || 0) / (risksByCategory.Schedule?.length || 1),
      Market: (risksByCategory.Market?.reduce((sum, r) => sum + r.severity, 0) || 0) / (risksByCategory.Market?.length || 1),
      Scope: (risksByCategory.Scope?.reduce((sum, r) => sum + r.severity, 0) || 0) / (risksByCategory.Scope?.length || 1),
      Contract: (risksByCategory.Contract?.reduce((sum, r) => sum + r.severity, 0) || 0) / (risksByCategory.Contract?.length || 1),
      Quality: (risksByCategory.Quality?.reduce((sum, r) => sum + r.severity, 0) || 0) / (risksByCategory.Quality?.length || 1)
    }
  };

  return {
    overall,
    byCategory,
    confidence,
    breakdown
  };
}

/**
 * Convert numeric score to risk level
 */
export function scoreToLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 70) return 'LOW';    // 70-100 = Low Risk
  if (score >= 40) return 'MEDIUM'; // 40-69 = Medium Risk
  return 'HIGH';                    // 0-39 = High Risk
}

/**
 * Debug helper - explain how score was calculated
 */
export function explainScore(result: ScoreResult): string[] {
  const explanations = [
    `Overall Score: ${result.overall}/100 (${scoreToLevel(result.overall)} Risk)`,
    `Confidence: ${Math.round(result.confidence * 100)}%`,
    '',
    'Category Breakdown:',
    ...Object.entries(result.byCategory).map(([category, score]) => {
      const weight = result.breakdown.weights[category as Risk['category']];
      const count = result.breakdown.riskCounts[category as Risk['category']];
      const avgSev = result.breakdown.avgSeverities[category as Risk['category']];
      const contribution = Math.round(score * weight);

      return `  ${category}: ${score}/100 (${count} risks, avg severity ${avgSev.toFixed(1)}) × ${(weight * 100)}% = ${contribution} points`;
    }),
    '',
    `Total: ${result.overall}/100`
  ];

  return explanations;
}