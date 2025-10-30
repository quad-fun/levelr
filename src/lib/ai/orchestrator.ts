// src/lib/ai/orchestrator.ts

import type { CsiLine, Risk, BidArtifact } from '@/types/analysis';
import { calculateScore } from '@/lib/analysis/score';
import { AVAILABLE_TOOLS } from './tools';

export interface OrchestrationResult {
  artifact: BidArtifact;
  insights: string[];
  timings: Record<string, number>;
}

/**
 * Browser-first analysis orchestrator
 * No LLM calls - pure deterministic analysis
 */
export class AnalysisOrchestrator {
  private timings: Record<string, number> = {};

  private time<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    this.timings[label] = performance.now() - start;
    return result;
  }

  /**
   * Automatically detect discipline from document content
   */
  private detectDiscipline(lines: CsiLine[], fileName: string): 'construction' | 'design' | 'trade' {
    // Keywords that indicate design documents
    const designKeywords = [
      'schematic design', 'design development', 'construction documents',
      'architectural', 'engineering', 'aia', 'phase', 'deliverable',
      'design fees', 'consultant', 'drawing', 'specification',
      'sd', 'dd', 'cd', 'bn', 'ca'
    ];

    // Keywords that indicate trade/technical documents
    const tradeKeywords = [
      'electrical system', 'hvac system', 'plumbing system', 'fire protection',
      'security system', 'elevator', 'commissioning', 'testing',
      'automation', 'controls', 'equipment', 'installation',
      'technical', 'specialty', 'mechanical', 'systems integration'
    ];

    // Keywords that indicate construction documents
    const constructionKeywords = [
      'concrete', 'masonry', 'steel', 'framing', 'roofing',
      'excavation', 'foundation', 'drywall', 'flooring',
      'general contractor', 'construction', 'building'
    ];

    const content = [fileName, ...lines.map(l => l.description || '')].join(' ').toLowerCase();

    // Check for design indicators
    const designScore = designKeywords.reduce((score, keyword) =>
      score + (content.includes(keyword) ? 1 : 0), 0);

    // Check for trade indicators
    const tradeScore = tradeKeywords.reduce((score, keyword) =>
      score + (content.includes(keyword) ? 1 : 0), 0);

    // Check for construction indicators
    const constructionScore = constructionKeywords.reduce((score, keyword) =>
      score + (content.includes(keyword) ? 1 : 0), 0);

    // Also check line item divisions for clues
    const divisionTypes = lines.map(l => l.division).filter(Boolean);
    const hasCSIDivisions = divisionTypes.some(d => /^\d{2}$/.test(d));
    const hasAIAPhases = divisionTypes.some(d => /^(SD|DD|CD|BN|CA)/.test(d));
    const hasTechnicalSystems = divisionTypes.some(d => /^(ELEC|HVAC|PLUMB|FIRE|SECU|COMM|ELEV|SPEC|AUTO|LIFE|TEST|MAINT)$/.test(d));

    // Boost scores based on division patterns
    if (hasAIAPhases) return 'design';
    if (hasTechnicalSystems) return 'trade';
    if (hasCSIDivisions) return 'construction';

    // Use keyword scores
    if (designScore > tradeScore && designScore > constructionScore) return 'design';
    if (tradeScore > constructionScore) return 'trade';

    // Default to construction
    return 'construction';
  }

  /**
   * Main orchestration method
   * Input: parsed lines (any discipline)
   * Output: complete analysis artifact with auto-detected discipline
   */
  async orchestrate(
    lines: CsiLine[],
    metadata: {
      runId: string;
      fileName: string;
      fileSize: number;
      docIds: string[];
    }
  ): Promise<OrchestrationResult> {
    this.timings = {}; // Reset timings

    // Step 0: Auto-detect discipline
    const detectedDiscipline = this.detectDiscipline(lines, metadata.fileName);
    console.log(`🎯 Auto-detected discipline: ${detectedDiscipline}`);

    // Step 1: Extract basic analysis data
    const analysis = this.time('extract_analysis', () => {
      return this.extractAnalysis(lines);
    });

    // Step 2: Run deterministic risk detectors
    const risks = this.time('detect_risks', () => {
      return this.detectRisks(lines, {
        fileName: metadata.fileName,
        totalAmount: analysis.totalAmount,
        contractorName: analysis.contractorName
      });
    });

    // Step 3: Calculate deterministic score
    const score = this.time('calculate_score', () => {
      return calculateScore(risks);
    });

    // Step 4: Build artifact
    const artifact: BidArtifact = {
      meta: {
        runId: metadata.runId,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        docIds: metadata.docIds,
        fileName: metadata.fileName,
        fileSize: metadata.fileSize
      },
      parsing: {
        lines,
        totalPages: Math.max(...lines.map(l => l.pageRef || 1)),
        parseConfidence: this.calculateParseConfidence(lines),
        errors: this.validateLines(lines)
      },
      analysis: {
        ...analysis,
        discipline: detectedDiscipline
      },
      risks,
      score: {
        overall: score.overall,
        byCategory: score.byCategory,
        confidence: score.confidence
      }
    };

    // Step 5: Generate insights
    const insights = this.time('generate_insights', () => {
      return this.generateInsights(artifact);
    });

    return {
      artifact,
      insights,
      timings: this.timings
    };
  }

  /**
   * Extract analysis data from parsed lines
   */
  private extractAnalysis(lines: CsiLine[]) {
    // Find contractor name (look for company names in descriptions)
    const contractorName = this.extractContractorName(lines);

    // Calculate total amount
    const totalAmount = lines.reduce((sum, line) => sum + line.cost, 0);

    // Group by CSI division
    const csiBreakdown: Record<string, { cost: number; items: string[]; subcontractor?: string }> = {};

    for (const line of lines) {
      if (!csiBreakdown[line.division]) {
        csiBreakdown[line.division] = {
          cost: 0,
          items: [],
          subcontractor: line.subcontractor
        };
      }

      csiBreakdown[line.division].cost += line.cost;
      csiBreakdown[line.division].items.push(line.description);

      // Update subcontractor if not set
      if (!csiBreakdown[line.division].subcontractor && line.subcontractor) {
        csiBreakdown[line.division].subcontractor = line.subcontractor;
      }
    }

    // Extract project name (look for project references)
    const projectName = this.extractProjectName(lines);

    return {
      contractorName,
      totalAmount,
      projectName,
      bidDate: new Date().toISOString().split('T')[0],
      csiBreakdown
    };
  }

  /**
   * Run all deterministic risk detection tools
   */
  private detectRisks(lines: CsiLine[], metadata: {
    fileName: string;
    totalAmount: number;
    contractorName: string;
  }): Risk[] {
    const allRisks: Risk[] = [];

    // Run each tool
    for (const [toolName, toolFn] of Object.entries(AVAILABLE_TOOLS)) {
      try {
        const result = toolFn(lines, metadata);
        allRisks.push(...result.risks);
      } catch (error) {
        console.warn(`Tool ${toolName} failed:`, error);
      }
    }

    return allRisks;
  }

  /**
   * Extract contractor name from lines
   */
  private extractContractorName(lines: CsiLine[]): string {
    // Look for company indicators
    const companyPatterns = [
      /([A-Z][a-z]+\s+(?:Construction|Builders?|Contractors?|Inc\.?|LLC|Corp\.?))/i,
      /([A-Z][a-z]+\s+[A-Z][a-z]+\s+(?:Construction|Builders?|Contractors?))/i
    ];

    for (const line of lines) {
      if (!line.description) continue;
      for (const pattern of companyPatterns) {
        const match = line.description.match(pattern);
        if (match) {
          return match[1];
        }
      }
    }

    // Fallback: use subcontractor name if available
    const subcontractor = lines.find(l => l.subcontractor && l.subcontractor !== 'Self-performed')?.subcontractor;
    if (subcontractor) {
      return subcontractor;
    }

    // Final fallback
    return 'Unknown Contractor';
  }

  /**
   * Extract project name from lines
   */
  private extractProjectName(lines: CsiLine[]): string | undefined {
    const projectPatterns = [
      /Project:\s*([^,\n]+)/i,
      /([A-Z][a-z]+\s+(?:Building|Center|Plaza|Tower|Development))/i,
      /(\d+\s+[A-Z][a-z]+\s+(?:Street|Avenue|Boulevard|Drive))/i
    ];

    for (const line of lines) {
      if (!line.description) continue;
      for (const pattern of projectPatterns) {
        const match = line.description.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Calculate parsing confidence based on line quality
   */
  private calculateParseConfidence(lines: CsiLine[]): number {
    if (lines.length === 0) return 0;

    const avgConfidence = lines.reduce((sum, line) => sum + line.confidence, 0) / lines.length;
    return avgConfidence;
  }

  /**
   * Validate parsed lines and return errors
   */
  private validateLines(lines: CsiLine[]): string[] {
    const errors: string[] = [];

    // Check for missing costs
    const missingCosts = lines.filter(line => line.cost <= 0).length;
    if (missingCosts > 0) {
      errors.push(`${missingCosts} lines with missing or zero costs`);
    }

    // Check for invalid divisions
    const invalidDivisions = lines.filter(line =>
      !line.division?.match(/^\d{2}$/) ||
      !line.division ||
      parseInt(line.division) < 1 ||
      parseInt(line.division) > 49
    ).length;
    if (invalidDivisions > 0) {
      errors.push(`${invalidDivisions} lines with invalid CSI divisions`);
    }

    // Check for low confidence lines
    const lowConfidence = lines.filter(line => line.confidence < 0.5).length;
    if (lowConfidence > lines.length * 0.1) { // >10% low confidence
      errors.push(`${lowConfidence} lines with low parsing confidence`);
    }

    return errors;
  }

  /**
   * Generate actionable insights from analysis
   */
  private generateInsights(artifact: BidArtifact): string[] {
    const insights: string[] = [];

    // Score-based insights
    if (artifact.score.overall < 40) {
      insights.push('🚨 High-risk bid requires immediate attention and mitigation strategies');
    } else if (artifact.score.overall < 70) {
      insights.push('⚠️ Medium-risk bid should be reviewed carefully before award');
    } else {
      insights.push('✅ Low-risk bid appears well-structured with minimal red flags');
    }

    // Category-specific insights
    const categoryScores = artifact.score.byCategory;
    const lowScoreCategories = Object.entries(categoryScores)
      .filter(([, score]) => score < 50)
      .map(([category]) => category);

    if (lowScoreCategories.length > 0) {
      insights.push(`Focus attention on: ${lowScoreCategories.join(', ')} risks`);
    }

    // Cost distribution insights
    const divisions = Object.entries(artifact.analysis.csiBreakdown);
    const topDivisions = divisions
      .sort(([, a], [, b]) => b.cost - a.cost)
      .slice(0, 3);

    insights.push(`Top cost drivers: ${topDivisions.map(([div, data]) =>
      `Div ${div} ($${(data.cost / 1000).toFixed(0)}K)`
    ).join(', ')}`);

    // Risk concentration insights
    const risksByCategory = artifact.risks.reduce((acc, risk) => {
      acc[risk.category] = (acc[risk.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highRiskCategories = Object.entries(risksByCategory)
      .filter(([, count]) => count >= 3)
      .map(([category]) => category);

    if (highRiskCategories.length > 0) {
      insights.push(`Multiple risks detected in: ${highRiskCategories.join(', ')}`);
    }

    return insights;
  }
}