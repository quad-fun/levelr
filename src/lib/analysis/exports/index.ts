// Export router for discipline-specific analysis exports
import { AnalysisResult } from '@/types/analysis';
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

// Re-export discipline-specific functions for direct use
export {
  exportConstructionAnalysisToPDF,
  exportConstructionAnalysisToExcel,
  exportDesignAnalysisToPDF,
  exportDesignAnalysisToExcel,
  exportTradeAnalysisToPDF,
  exportTradeAnalysisToExcel
};

// Re-export from original export-generator for any remaining imports
export * from '../export-generator';