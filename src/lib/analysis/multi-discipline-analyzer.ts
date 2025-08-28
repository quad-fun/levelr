// src/lib/analysis/multi-discipline-analyzer.ts

import { AnalysisResult, AIAPhaseAnalysis, TechnicalSystemAnalysis, DesignDeliverable, EquipmentSpec } from '@/types/analysis';
import { AIA_PHASES, TECHNICAL_SPEC_TEMPLATES } from '@/types/rfp';

// Enhanced analyzer that routes to appropriate discipline-specific analysis
export class MultiDisciplineAnalyzer {
  
  static async analyzeProposal(
    documentText: string,
    discipline: 'construction' | 'design' | 'trade',
    context: {
      projectType?: string;
      estimatedValue?: number;
      scopeFramework?: 'csi' | 'aia' | 'technical';
    } = {}
  ): Promise<AnalysisResult> {
    
    // Base analysis structure
    const baseAnalysis = await this.extractBaseInformation(documentText);
    
    // Route to discipline-specific analysis
    switch (discipline) {
      case 'construction':
        return this.analyzeConstructionProposal(documentText, baseAnalysis, context);
      case 'design':
        return this.analyzeDesignProposal(documentText, baseAnalysis, context);
      case 'trade':
        return this.analyzeTradeProposal(documentText, baseAnalysis, context);
      default:
        throw new Error(`Unsupported discipline: ${discipline}`);
    }
  }

  private static async extractBaseInformation(documentText: string): Promise<Partial<AnalysisResult>> {
    // Extract common fields present in all proposal types
    const contractorNameMatch = documentText.match(/(?:company|contractor|firm)[:\s]+([^\n]+)/i);
    const totalAmountMatch = documentText.match(/(?:total|amount|cost|fee)[:\s]*\$?[\s]*([\d,]+(?:\.\d{2})?)/i);
    const projectNameMatch = documentText.match(/(?:project|job)[:\s]+([^\n]+)/i);
    const dateMatch = documentText.match(/(?:date|submitted)[:\s]+([^\n]+)/i);

    return {
      contractor_name: contractorNameMatch?.[1]?.trim() || 'Unknown Contractor',
      total_amount: totalAmountMatch ? parseFloat(totalAmountMatch[1].replace(/,/g, '')) : 0,
      project_name: projectNameMatch?.[1]?.trim(),
      proposal_date: dateMatch?.[1]?.trim(),
      document_quality: this.assessDocumentQuality(documentText)
    };
  }

  private static assessDocumentQuality(text: string): 'professional_typed' | 'scanned' | 'handwritten' {
    // Simple heuristics for document quality assessment
    const hasFormattedTables = /\|\s*[^\|]+\s*\|/.test(text);
    const hasConsistentSpacing = /\n\s*\n/.test(text);
    const hasSpecialChars = /[^\w\s\.\,\-\$\%\(\)\[\]]+/.test(text);
    
    if (hasFormattedTables && hasConsistentSpacing) {
      return 'professional_typed';
    } else if (hasSpecialChars || text.includes('OCR') || text.includes('scan')) {
      return 'scanned';
    } else {
      return 'handwritten';
    }
  }

  private static async analyzeConstructionProposal(
    documentText: string,
    baseAnalysis: Partial<AnalysisResult>,
    _context: { projectType?: string; estimatedValue?: number }
  ): Promise<AnalysisResult> {
    // For now, create a basic construction analysis structure
    // In a real implementation, this would use the existing CSI analyzer
    return {
      ...baseAnalysis,
      discipline: 'construction',
      csi_divisions: {},
      categorizationPercentage: 75,
      timeline: this.extractConstructionTimeline(documentText),
      assumptions: this.extractAssumptions(documentText),
      exclusions: this.extractExclusions(documentText)
    } as AnalysisResult;
  }

  private static async analyzeDesignProposal(
    documentText: string,
    baseAnalysis: Partial<AnalysisResult>,
    _context: { projectType?: string; estimatedValue?: number }
  ): Promise<AnalysisResult> {
    
    const aiaPhases = this.extractAIAPhases(documentText);
    const designDeliverables = this.extractDesignDeliverables(documentText);
    const timeline = this.extractDesignTimeline(documentText);
    const assumptions = this.extractAssumptions(documentText);
    const exclusions = this.extractExclusions(documentText);

    return {
      ...baseAnalysis,
      discipline: 'design',
      csi_divisions: {}, // Empty for design proposals
      aia_phases: aiaPhases,
      design_deliverables: designDeliverables,
      timeline,
      assumptions,
      exclusions,
      categorizationPercentage: this.calculateDesignCategorizationPercentage(aiaPhases),
      project_overhead: this.extractDesignOverhead(documentText)
    } as AnalysisResult;
  }

  private static async analyzeTradeProposal(
    documentText: string,
    baseAnalysis: Partial<AnalysisResult>,
    _context: { projectType?: string; estimatedValue?: number }
  ): Promise<AnalysisResult> {
    
    const technicalSystems = this.extractTechnicalSystems(documentText);
    const equipmentSpecs = this.extractEquipmentSpecifications(documentText);
    const timeline = this.extractInstallationTimeline(documentText);
    const assumptions = this.extractAssumptions(documentText);
    const exclusions = this.extractExclusions(documentText);

    return {
      ...baseAnalysis,
      discipline: 'trade',
      csi_divisions: {}, // Empty for trade proposals
      technical_systems: technicalSystems,
      equipment_specifications: equipmentSpecs,
      timeline,
      assumptions,
      exclusions,
      categorizationPercentage: this.calculateTradeCategorizationPercentage(technicalSystems),
      project_overhead: this.extractTradeOverhead(documentText)
    } as AnalysisResult;
  }

  // Design-specific extraction methods
  private static extractAIAPhases(documentText: string): Record<string, AIAPhaseAnalysis> {
    const phases: Record<string, AIAPhaseAnalysis> = {};
    
    // Look for AIA phase indicators in the text
    Object.entries(AIA_PHASES).forEach(([phaseKey, phaseData]) => {
      const phasePattern = new RegExp(
        `(${phaseData.phase.replace(/_/g, '[\\s_-]*')})[:\\s]*\\$?([\\d,]+(?:\\.\\d{2})?)`,
        'gi'
      );
      
      const match = documentText.match(phasePattern);
      if (match) {
        const amount = parseFloat(match[2].replace(/,/g, ''));
        phases[phaseKey] = {
          phase_name: phaseData.phase,
          fee_amount: amount,
          percentage_of_total: phaseData.percentageOfFee,
          deliverables: phaseData.typicalDeliverables.map(d => ({
            description: d,
            cost_allocation: amount * (phaseData.percentageOfFee / 100)
          })),
          scope_notes: this.extractPhaseNotes(documentText, phaseData.phase)
        };
      }
    });

    return phases;
  }

  private static extractDesignDeliverables(documentText: string): DesignDeliverable[] {
    const deliverables: DesignDeliverable[] = [];
    
    // Common design deliverable patterns
    const deliverablePatterns = [
      /drawings?\s*[:-]\s*([^\n]+)/gi,
      /specifications?\s*[:-]\s*([^\n]+)/gi,
      /reports?\s*[:-]\s*([^\n]+)/gi,
      /models?\s*[:-]\s*([^\n]+)/gi,
      /studies?\s*[:-]\s*([^\n]+)/gi
    ];

    deliverablePatterns.forEach(pattern => {
      const matches = documentText.matchAll(pattern);
      for (const match of matches) {
        deliverables.push({
          description: match[1].trim(),
          responsible_discipline: 'Architecture/Engineering'
        });
      }
    });

    return deliverables;
  }

  private static extractDesignTimeline(documentText: string): string {
    const timelinePattern = /(?:schedule|timeline|duration)[:\s]+([^\n]+)/gi;
    const match = documentText.match(timelinePattern);
    return match?.[0] || '';
  }

  // Trade-specific extraction methods
  private static extractTechnicalSystems(documentText: string): Record<string, TechnicalSystemAnalysis> {
    const systems: Record<string, TechnicalSystemAnalysis> = {};
    
    // Look for technical system indicators
    Object.entries(TECHNICAL_SPEC_TEMPLATES).forEach(([systemKey, systemData]) => {
      const systemPattern = new RegExp(
        `(${systemKey.replace(/_/g, '[\\s_-]*')})[:\\s]*\\$?([\\d,]+(?:\\.\\d{2})?)`,
        'gi'
      );
      
      const match = documentText.match(systemPattern);
      if (match) {
        const cost = parseFloat(match[2].replace(/,/g, ''));
        systems[systemKey] = {
          system_name: systemKey.replace(/_/g, ' '),
          category: systemData.category,
          total_cost: cost,
          specifications: systemData.specifications.map(spec => ({
            description: spec,
            quantity: 1,
            unit_cost: cost / systemData.specifications.length,
            total_cost: cost / systemData.specifications.length,
            specifications: [spec]
          })),
          testing_requirements: systemData.testing,
          scope_notes: this.extractSystemNotes(documentText, systemKey)
        };
      }
    });

    return systems;
  }

  private static extractEquipmentSpecifications(documentText: string): EquipmentSpec[] {
    const equipment: EquipmentSpec[] = [];
    
    // Equipment specification patterns
    const equipmentPatterns = [
      /([A-Z][a-z]+\s+[A-Z][a-z]+)[:\s]*Model\s*([A-Z0-9-]+)[:\s]*\$?([\d,]+(?:\.\\d{2})?)/gi,
      /(\w+\s+\w+)[:\s]*Qty[:\s]*(\d+)[:\s]*\$?([\d,]+(?:\.\\d{2})?)/gi
    ];

    equipmentPatterns.forEach(pattern => {
      const matches = documentText.matchAll(pattern);
      for (const match of matches) {
        equipment.push({
          description: match[1],
          model: match[2] || undefined,
          quantity: parseInt(match[3] || '1'),
          unit_cost: parseFloat((match[4] || match[3]).replace(/,/g, '')),
          total_cost: parseFloat((match[4] || match[3]).replace(/,/g, ''))
        });
      }
    });

    return equipment;
  }

  private static extractInstallationTimeline(documentText: string): string {
    const timelinePattern = /(?:installation|commissioning|startup)[:\s]+([^\n]+)/gi;
    const match = documentText.match(timelinePattern);
    return match?.[0] || '';
  }

  private static extractConstructionTimeline(documentText: string): string {
    const timelinePattern = /(?:schedule|timeline|duration|completion)[:\s]+([^\n]+)/gi;
    const match = documentText.match(timelinePattern);
    return match?.[0] || '';
  }

  // Helper methods
  private static extractAssumptions(documentText: string): string[] {
    const assumptionPattern = /assumptions?[:\s]*([^]+?)(?:\n\s*\n|exclusions?|$)/gi;
    const match = documentText.match(assumptionPattern);
    
    if (match) {
      return match[0].split(/\n|;|,/).map(a => a.trim()).filter(a => a.length > 0);
    }
    return [];
  }

  private static extractExclusions(documentText: string): string[] {
    const exclusionPattern = /exclusions?[:\s]*([^]+?)(?:\n\s*\n|assumptions?|$)/gi;
    const match = documentText.match(exclusionPattern);
    
    if (match) {
      return match[0].split(/\n|;|,/).map(e => e.trim()).filter(e => e.length > 0);
    }
    return [];
  }

  private static extractPhaseNotes(documentText: string, phase: string): string {
    const notePattern = new RegExp(`${phase}[:\\s]*([^\\n]+)`, 'gi');
    const match = documentText.match(notePattern);
    return match?.[0] || '';
  }

  private static extractSystemNotes(documentText: string, system: string): string {
    const notePattern = new RegExp(`${system}[:\\s]*([^\\n]+)`, 'gi');
    const match = documentText.match(notePattern);
    return match?.[0] || '';
  }

  private static calculateDesignCategorizationPercentage(phases: Record<string, AIAPhaseAnalysis>): number {
    const totalPhases = Object.keys(AIA_PHASES).length;
    const identifiedPhases = Object.keys(phases).length;
    return (identifiedPhases / totalPhases) * 100;
  }

  private static calculateTradeCategorizationPercentage(systems: Record<string, TechnicalSystemAnalysis>): number {
    const totalSystems = Object.keys(TECHNICAL_SPEC_TEMPLATES).length;
    const identifiedSystems = Object.keys(systems).length;
    return (identifiedSystems / totalSystems) * 100;
  }

  private static extractDesignOverhead(documentText: string) {
    const overheadPattern = /(?:overhead|indirect|admin)[:\s]*\$?([\\d,]+(?:\\.\\d{2})?)/gi;
    const match = documentText.match(overheadPattern);
    
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      return {
        project_management: amount * 0.4,
        administration: amount * 0.3,
        insurance: amount * 0.2,
        other: amount * 0.1,
        total_overhead: amount
      };
    }
    
    return undefined;
  }

  private static extractTradeOverhead(documentText: string) {
    const overheadPattern = /(?:overhead|markup|profit)[:\s]*\$?([\\d,]+(?:\\.\\d{2})?)/gi;
    const match = documentText.match(overheadPattern);
    
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      return {
        supervision: amount * 0.3,
        insurance: amount * 0.2,
        bonds: amount * 0.2,
        permits: amount * 0.1,
        other: amount * 0.2,
        total_overhead: amount
      };
    }
    
    return undefined;
  }
}

// Market analysis extensions for different disciplines
export class MultiDisciplineMarketAnalyzer {
  
  static analyzeDesignMarketRates(
    phases: Record<string, AIAPhaseAnalysis>,
    projectValue: number,
    projectType: string
  ) {
    // Design fee typically ranges from 6-12% of construction cost
    const totalFee = Object.values(phases).reduce((sum, phase) => sum + phase.fee_amount, 0);
    const feePercentage = (totalFee / projectValue) * 100;
    
    const benchmarks = this.getDesignFeeBenchmarks(projectType);
    
    if (feePercentage < benchmarks.low) {
      return {
        status: 'BELOW_MARKET' as const,
        message: `Design fee of ${feePercentage.toFixed(1)}% is below typical range of ${benchmarks.low}-${benchmarks.high}%`,
        severity: 'medium' as const,
        recommendation: 'Verify scope completeness and fee adequacy'
      };
    } else if (feePercentage > benchmarks.high) {
      return {
        status: 'ABOVE_MARKET' as const,
        message: `Design fee of ${feePercentage.toFixed(1)}% exceeds typical range of ${benchmarks.low}-${benchmarks.high}%`,
        severity: 'high' as const,
        recommendation: 'Evaluate premium services and scope complexity'
      };
    } else {
      return {
        status: 'MARKET_RATE' as const,
        message: `Design fee of ${feePercentage.toFixed(1)}% is within market range`,
        severity: 'low' as const,
        recommendation: 'Fee appears competitive for scope'
      };
    }
  }

  static analyzeTradeMarketRates(
    systems: Record<string, TechnicalSystemAnalysis>,
    projectValue: number,
    tradeType: string
  ) {
    const totalTradeCost = Object.values(systems).reduce((sum, system) => sum + system.total_cost, 0);
    const tradePercentage = (totalTradeCost / projectValue) * 100;
    
    const benchmarks = this.getTradePercentageBenchmarks(tradeType);
    
    if (tradePercentage < benchmarks.low) {
      return {
        status: 'BELOW_MARKET' as const,
        message: `${tradeType} cost of ${tradePercentage.toFixed(1)}% is below typical range of ${benchmarks.low}-${benchmarks.high}%`,
        severity: 'medium' as const,
        recommendation: 'Verify completeness of trade scope and pricing'
      };
    } else if (tradePercentage > benchmarks.high) {
      return {
        status: 'ABOVE_MARKET' as const,
        message: `${tradeType} cost of ${tradePercentage.toFixed(1)}% exceeds typical range of ${benchmarks.low}-${benchmarks.high}%`,
        severity: 'high' as const,
        recommendation: 'Evaluate premium equipment and installation complexity'
      };
    } else {
      return {
        status: 'MARKET_RATE' as const,
        message: `${tradeType} cost of ${tradePercentage.toFixed(1)}% is within market range`,
        severity: 'low' as const,
        recommendation: 'Trade pricing appears competitive'
      };
    }
  }

  private static getDesignFeeBenchmarks(projectType: string) {
    const benchmarks = {
      'commercial_office': { low: 6, high: 10 },
      'retail': { low: 7, high: 12 },
      'industrial': { low: 4, high: 8 },
      'residential': { low: 8, high: 15 },
      'mixed_use': { low: 7, high: 12 },
      'infrastructure': { low: 10, high: 20 }
    };
    
    return benchmarks[projectType as keyof typeof benchmarks] || { low: 6, high: 12 };
  }

  private static getTradePercentageBenchmarks(tradeType: string) {
    const benchmarks = {
      'electrical': { low: 8, high: 15 },
      'mechanical': { low: 12, high: 20 },
      'plumbing': { low: 6, high: 12 },
      'fire_protection': { low: 2, high: 5 },
      'technology': { low: 3, high: 8 }
    };
    
    return benchmarks[tradeType as keyof typeof benchmarks] || { low: 5, high: 15 };
  }
}