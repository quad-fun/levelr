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
  private sessionState: Map<string, {
    files: BidArtifact[];
    completedCount: number;
    disciplineHints: string[];
    autoLevelingEnabled: boolean;
  }> = new Map();

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

  /**
   * Initialize a multi-file upload session
   */
  initializeSession(sessionId: string, autoLevelingEnabled = true): void {
    this.sessionState.set(sessionId, {
      files: [],
      completedCount: 0,
      disciplineHints: [],
      autoLevelingEnabled
    });
  }

  /**
   * Add a completed file analysis to the session
   */
  addFileToSession(sessionId: string, artifact: BidArtifact, disciplineHint?: string): boolean {
    const session = this.sessionState.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found`);
      return false;
    }

    session.files.push(artifact);
    session.completedCount++;

    if (disciplineHint) {
      session.disciplineHints.push(disciplineHint);
    }

    console.log(`Session ${sessionId}: ${session.completedCount} files completed`);
    return true;
  }

  /**
   * Check if session is ready for auto-leveling
   */
  isSessionReadyForLeveling(sessionId: string): boolean {
    const session = this.sessionState.get(sessionId);
    if (!session || !session.autoLevelingEnabled) {
      return false;
    }

    return session.files.length >= 2;
  }

  /**
   * Get session files for leveling
   */
  getSessionFiles(sessionId: string): BidArtifact[] {
    const session = this.sessionState.get(sessionId);
    return session?.files || [];
  }

  /**
   * Get dominant discipline from session hints
   */
  getSessionDiscipline(sessionId: string): 'construction' | 'design' | 'trade' | null {
    const session = this.sessionState.get(sessionId);
    if (!session || session.disciplineHints.length === 0) {
      return null;
    }

    // Count discipline hints
    const counts = session.disciplineHints.reduce((acc, hint) => {
      acc[hint] = (acc[hint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return most common discipline
    const dominant = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0];

    return dominant[0] as 'construction' | 'design' | 'trade';
  }

  /**
   * Generate comparative insights for multi-file sessions
   */
  generateSessionInsights(sessionId: string): string[] {
    const session = this.sessionState.get(sessionId);
    if (!session || session.files.length < 2) {
      return [];
    }

    const insights: string[] = [];
    const files = session.files;

    // Cost comparison insights
    const totalAmounts = files.map(f => f.analysis.totalAmount);
    const minAmount = Math.min(...totalAmounts);
    const maxAmount = Math.max(...totalAmounts);

    if (maxAmount > minAmount * 1.5) {
      insights.push(`💰 Significant cost variance: ${((maxAmount - minAmount) / minAmount * 100).toFixed(0)}% spread between highest and lowest bids`);
    }

    // Risk comparison insights
    const riskScores = files.map(f => f.score.overall);
    const minRisk = Math.min(...riskScores);
    const maxRisk = Math.max(...riskScores);

    if (maxRisk - minRisk > 30) {
      insights.push(`⚠️ Risk levels vary significantly: ${minRisk.toFixed(0)} to ${maxRisk.toFixed(0)} points across bids`);
    }

    // Discipline consistency
    const disciplines = files.map(f => f.analysis.discipline);
    const uniqueDisciplines = [...new Set(disciplines)];

    if (uniqueDisciplines.length > 1) {
      insights.push(`🎯 Mixed disciplines detected: ${uniqueDisciplines.join(', ')} - consider separate analysis workflows`);
    } else {
      insights.push(`✅ Consistent ${uniqueDisciplines[0]} discipline across all bids`);
    }

    // Contractor diversity
    const contractors = files.map(f => f.analysis.contractorName);
    const uniqueContractors = [...new Set(contractors)];

    insights.push(`👥 ${uniqueContractors.length} unique contractor${uniqueContractors.length !== 1 ? 's' : ''} in comparison`);

    return insights;
  }

  /**
   * Cleanup session state
   */
  cleanupSession(sessionId: string): void {
    this.sessionState.delete(sessionId);
  }

  /**
   * Update session auto-leveling preference
   */
  updateSessionAutoLeveling(sessionId: string, enabled: boolean): void {
    const session = this.sessionState.get(sessionId);
    if (session) {
      session.autoLevelingEnabled = enabled;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    totalFiles: number;
    completedFiles: number;
    averageRiskScore: number;
    totalValue: number;
    dominantDiscipline: string | null;
  } | null {
    const session = this.sessionState.get(sessionId);
    if (!session) return null;

    const files = session.files;
    const avgRisk = files.length > 0
      ? files.reduce((sum, f) => sum + f.score.overall, 0) / files.length
      : 0;

    const totalValue = files.reduce((sum, f) => sum + f.analysis.totalAmount, 0);

    return {
      totalFiles: files.length,
      completedFiles: session.completedCount,
      averageRiskScore: avgRisk,
      totalValue,
      dominantDiscipline: this.getSessionDiscipline(sessionId)
    };
  }
}