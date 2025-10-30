// src/lib/ai/tools/market.ts

import type { CsiLine, Risk } from '@/types/analysis';

export interface MarketToolResult {
  risks: Risk[];
  insights: string[];
}

/**
 * Market volatility and escalation risk detector
 * Browser-first deterministic analysis
 */
export function analyzeMarketRisks(lines: CsiLine[], metadata: {
  fileName: string;
  totalAmount: number;
  contractorName: string;
}): MarketToolResult {
  const risks: Risk[] = [];
  const insights: string[] = [];

  // Check for escalation protection
  const hasEscalationClause = lines.some(line =>
    line.description.toLowerCase().includes('escalation') ||
    line.description.toLowerCase().includes('price adjustment') ||
    line.description.toLowerCase().includes('material cost')
  );

  if (!hasEscalationClause) {
    risks.push({
      id: `market-escalation-${Date.now()}`,
      category: 'Market',
      severity: 4, // High severity for missing escalation
      title: 'Material Escalation Risk Not Addressed',
      description: 'Significant material costs without escalation protection',
      evidence: ['No escalation clauses found in bid document'],
      pageRefs: [],
      explanation: 'Volatile material markets could increase costs 10-30%',
      impact: {
        financial: metadata.totalAmount * 0.15, // Estimate 15% risk exposure
        probability: 0.7
      }
    });
    insights.push('Consider adding escalation clauses for materials >$50K');
  }

  // Check for bid validity period
  const hasBidValidity = lines.some(line =>
    line.description.toLowerCase().includes('validity') ||
    line.description.toLowerCase().includes('valid for') ||
    line.description.toLowerCase().includes('expires')
  );

  if (!hasBidValidity) {
    risks.push({
      id: `market-validity-${Date.now()}`,
      category: 'Market',
      severity: 3,
      title: 'No Bid Validity Period Specified',
      description: 'Bid does not specify how long pricing is valid',
      evidence: ['No validity period mentioned in bid'],
      pageRefs: [],
      explanation: 'Material costs may increase between bid and contract signing',
      impact: {
        timeline: 30, // 30 days typical exposure
        probability: 0.5
      }
    });
  }

  // Check for large project labor risks
  if (metadata.totalAmount > 5000000) { // $5M+ projects
    const laborIntensiveDivisions = lines.filter(line =>
      ['03', '04', '05', '09'].includes(line.division) // Concrete, masonry, metals, finishes
    );

    if (laborIntensiveDivisions.length > 0) {
      const laborCost = laborIntensiveDivisions.reduce((sum, line) => sum + line.cost, 0);

      if (laborCost > metadata.totalAmount * 0.3) { // >30% labor-intensive work
        risks.push({
          id: `market-labor-${Date.now()}`,
          category: 'Market',
          severity: 3,
          title: 'Large Project Labor Availability Risk',
          description: 'High-value project requires significant skilled labor',
          evidence: [`Labor-intensive work: $${laborCost.toLocaleString()}`],
          pageRefs: [],
          explanation: 'Tight labor markets may increase costs or delay project',
          impact: {
            financial: laborCost * 0.1, // 10% labor cost risk
            timeline: 60, // Potential 2-month delay
            probability: 0.4
          }
        });
        insights.push('Monitor local labor market conditions and consider retention strategies');
      }
    }
  }

  return { risks, insights };
}