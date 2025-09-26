// src/lib/analysis/multi-discipline-analyzer.ts

import { AnalysisResult, AIAPhaseAnalysis, TechnicalSystemAnalysis, DesignDeliverable, EquipmentSpec } from '@/types/analysis';
import { AIA_PHASES, TECHNICAL_SPEC_TEMPLATES } from '@/types/rfp';
import { ProcessedDocument } from '@/lib/document-processor';
import { analyzeDesignProposal } from './aia-analyzer';
import { analyzeTradeProposal } from './trade-analyzer';

// Enhanced analyzer that routes to appropriate discipline-specific analysis
export class MultiDisciplineAnalyzer {
  
  static async analyzeProposal(
    processedDoc: ProcessedDocument,
    discipline: 'construction' | 'design' | 'trade',
    _context: {
      projectType?: string;
      estimatedValue?: number;
      scopeFramework?: 'csi' | 'aia' | 'technical';
    } = {}
  ): Promise<AnalysisResult> {

    // Route to discipline-specific AI-powered analysis
    switch (discipline) {
      case 'construction':
        // Use existing proven construction analysis from the main API route
        throw new Error('Construction analysis should use the existing /api/claude route');
      case 'design':
        return await analyzeDesignProposal(processedDoc);
      case 'trade':
        return await analyzeTradeProposal(processedDoc);
      default:
        throw new Error(`Unsupported discipline: ${discipline}`);
    }
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