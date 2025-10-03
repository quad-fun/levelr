// Export router for discipline-specific analysis exports
import { AnalysisResult } from '@/types/analysis';
import { SavedAnalysis } from '@/lib/storage';
import { exportConstructionAnalysisToPDF, exportConstructionAnalysisToExcel } from './construction-exports';
import { exportDesignAnalysisToPDF, exportDesignAnalysisToExcel } from './design-exports';
import { exportTradeAnalysisToPDF, exportTradeAnalysisToExcel } from './trade-exports';

/**
 * Main export function that routes to appropriate discipline-specific export
 * Detects discipline automatically based on analysis content
 */
export function exportAnalysisToPDF(analysis: AnalysisResult): void {
  const discipline = detectAnalysisDiscipline(analysis);

  switch (discipline) {
    case 'construction':
      return exportConstructionAnalysisToPDF(analysis);
    case 'design':
      return exportDesignAnalysisToPDF(analysis);
    case 'trade':
      return exportTradeAnalysisToPDF(analysis);
    default:
      // Fallback to construction for backward compatibility
      return exportConstructionAnalysisToPDF(analysis);
  }
}

/**
 * Main Excel export function that routes to appropriate discipline-specific export
 * Detects discipline automatically based on analysis content
 */
export function exportAnalysisToExcel(analysis: AnalysisResult): void {
  const discipline = detectAnalysisDiscipline(analysis);

  switch (discipline) {
    case 'construction':
      return exportConstructionAnalysisToExcel(analysis);
    case 'design':
      return exportDesignAnalysisToExcel(analysis);
    case 'trade':
      return exportTradeAnalysisToExcel(analysis);
    default:
      // Fallback to construction for backward compatibility
      return exportConstructionAnalysisToExcel(analysis);
  }
}

/**
 * Detects the discipline type for bid leveling based on multiple analyses
 * Uses majority rule or first analysis if mixed disciplines
 */
function detectBidLevelingDiscipline(selectedAnalyses: SavedAnalysis[]): 'construction' | 'design' | 'trade' {
  if (selectedAnalyses.length === 0) return 'construction';

  // Count disciplines from selected analyses
  const disciplineCounts = { construction: 0, design: 0, trade: 0 };

  selectedAnalyses.forEach(savedAnalysis => {
    const discipline = detectAnalysisDiscipline(savedAnalysis.result);
    disciplineCounts[discipline]++;
  });

  // Return majority discipline
  if (disciplineCounts.design > disciplineCounts.construction && disciplineCounts.design > disciplineCounts.trade) {
    return 'design';
  }
  if (disciplineCounts.trade > disciplineCounts.construction && disciplineCounts.trade > disciplineCounts.design) {
    return 'trade';
  }
  return 'construction'; // Default/majority
}

/**
 * Detects the discipline type based on analysis content
 * Priority: explicit discipline field > content analysis > fallback to construction
 */
function detectAnalysisDiscipline(analysis: AnalysisResult): 'construction' | 'design' | 'trade' {
  // Check explicit discipline field first
  if (analysis.discipline) {
    switch (analysis.discipline) {
      case 'construction':
        return 'construction';
      case 'design':
        return 'design';
      case 'trade':
        return 'trade';
    }
  }

  // Analyze content structure to determine discipline
  const hasCSIDivisions = analysis.csi_divisions && Object.keys(analysis.csi_divisions).length > 0;
  const hasAIAPhases = analysis.aia_phases && Object.keys(analysis.aia_phases).length > 0;
  const hasTechnicalSystems = analysis.technical_systems && Object.keys(analysis.technical_systems).length > 0;
  const hasDesignDeliverables = analysis.design_deliverables && analysis.design_deliverables.length > 0;
  const hasEquipmentSpecs = analysis.equipment_specifications && analysis.equipment_specifications.length > 0;

  // Design discipline indicators
  if (hasAIAPhases || hasDesignDeliverables) {
    return 'design';
  }

  // Trade discipline indicators
  if (hasTechnicalSystems || hasEquipmentSpecs) {
    return 'trade';
  }

  // Construction discipline indicators (or fallback)
  if (hasCSIDivisions) {
    return 'construction';
  }

  // Default fallback for backward compatibility
  return 'construction';
}

/**
 * Smart bid leveling export functions that route to appropriate discipline
 */
export async function exportBidLevelingToExcel(selectedAnalyses: SavedAnalysis[]): Promise<void> {
  const discipline = detectBidLevelingDiscipline(selectedAnalyses);

  switch (discipline) {
    case 'design':
      const { exportDesignBidLevelingToExcel } = await import('./design-exports');
      return exportDesignBidLevelingToExcel(selectedAnalyses);
    case 'trade':
      // Future: implement trade-specific bid leveling
      const { exportBidLevelingToExcel: tradeExcel } = await import('./construction-exports');
      return tradeExcel(selectedAnalyses);
    case 'construction':
    default:
      const { exportBidLevelingToExcel: constructionExcel } = await import('./construction-exports');
      return constructionExcel(selectedAnalyses);
  }
}

export async function exportBidLevelingToPDF(selectedAnalyses: SavedAnalysis[]): Promise<void> {
  const discipline = detectBidLevelingDiscipline(selectedAnalyses);

  switch (discipline) {
    case 'design':
      const { exportDesignBidLevelingToPDF } = await import('./design-exports');
      return exportDesignBidLevelingToPDF(selectedAnalyses);
    case 'trade':
      // Future: implement trade-specific bid leveling
      const { exportBidLevelingToPDF: tradePDF } = await import('./construction-exports');
      return tradePDF(selectedAnalyses);
    case 'construction':
    default:
      const { exportBidLevelingToPDF: constructionPDF } = await import('./construction-exports');
      return constructionPDF(selectedAnalyses);
  }
}

// Re-export discipline-specific functions for direct use
export {
  exportConstructionAnalysisToPDF,
  exportConstructionAnalysisToExcel
} from './construction-exports';

export {
  exportDesignAnalysisToPDF,
  exportDesignAnalysisToExcel
} from './design-exports';

export {
  exportTradeAnalysisToPDF,
  exportTradeAnalysisToExcel
} from './trade-exports';

// Note: Legacy export-generator.ts is deprecated in favor of discipline-specific exports above