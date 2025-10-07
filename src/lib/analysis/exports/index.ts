// Export router for discipline-specific analysis exports
import { AnalysisResult } from '@/types/analysis';
import { SavedAnalysis } from '@/lib/storage';
import {
  exportConstructionAnalysisToPDF,
  exportConstructionAnalysisToExcel,
  exportBidLevelingToExcel as exportConstructionBidLevelingToExcel,
  exportBidLevelingToPDF as exportConstructionBidLevelingToPDF
} from './construction-exports';
import { exportDesignAnalysisToPDF, exportDesignAnalysisToExcel } from './design-exports';
import { exportTradeAnalysisToPDF, exportTradeAnalysisToExcel } from './trade-exports';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF type to include autoTable properties
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

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
 * Main bid leveling export functions with discipline detection
 */
export function exportBidLevelingToPDF(selectedAnalyses: SavedAnalysis[], activeDiscipline?: 'construction' | 'design' | 'trade'): void {
  // Determine discipline from active discipline or detect from first analysis
  const discipline = activeDiscipline || (selectedAnalyses.length > 0 ? detectAnalysisDiscipline(selectedAnalyses[0].result) : 'construction');

  switch (discipline) {
    case 'design':
      return exportDesignBidLevelingToPDF(selectedAnalyses);
    case 'trade':
      return exportTradeBidLevelingToPDF(selectedAnalyses);
    case 'construction':
    default:
      return exportConstructionBidLevelingToPDF(selectedAnalyses);
  }
}

export function exportBidLevelingToExcel(selectedAnalyses: SavedAnalysis[], activeDiscipline?: 'construction' | 'design' | 'trade'): void {
  // Determine discipline from active discipline or detect from first analysis
  const discipline = activeDiscipline || (selectedAnalyses.length > 0 ? detectAnalysisDiscipline(selectedAnalyses[0].result) : 'construction');

  switch (discipline) {
    case 'design':
      return exportDesignBidLevelingToExcel(selectedAnalyses);
    case 'trade':
      return exportTradeBidLevelingToExcel(selectedAnalyses);
    case 'construction':
    default:
      return exportConstructionBidLevelingToExcel(selectedAnalyses);
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

// Re-export construction analysis functions
export {
  exportConstructionAnalysisToPDF,
  exportConstructionAnalysisToExcel
};

export {
  exportDesignAnalysisToPDF,
  exportDesignAnalysisToExcel
} from './design-exports';

// Design bid leveling exports
export function exportDesignBidLevelingToPDF(selectedAnalyses: SavedAnalysis[]): void {
  const doc = new jsPDF();
  let currentY = 20;

  // Title Page
  doc.setFontSize(24);
  doc.text('DESIGN BID LEVELING ANALYSIS', 20, currentY);
  currentY += 15;

  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, currentY);
  currentY += 10;
  doc.text(`Number of Design Proposals Analyzed: ${selectedAnalyses.length}`, 20, currentY);
  currentY += 20;

  // Executive Summary
  doc.setFontSize(16);
  doc.text('EXECUTIVE SUMMARY', 20, currentY);
  currentY += 15;

  const sortedBids = selectedAnalyses.sort((a, b) => a.result.total_amount - b.result.total_amount);
  const lowBid = sortedBids[0].result.total_amount;
  const highBid = sortedBids[sortedBids.length - 1].result.total_amount;
  const spread = ((highBid - lowBid) / lowBid) * 100;

  doc.setFontSize(10);
  doc.text(`Lowest Fee: ${sortedBids[0].result.contractor_name} - $${lowBid.toLocaleString()}`, 20, currentY);
  currentY += 8;
  doc.text(`Highest Fee: ${sortedBids[sortedBids.length - 1].result.contractor_name} - $${highBid.toLocaleString()}`, 20, currentY);
  currentY += 8;
  doc.text(`Fee Spread: ${spread.toFixed(1)}%`, 20, currentY);
  currentY += 15;

  // Design Firm Ranking Table
  const rankingData = sortedBids.map((bid, index) => {
    const variance = ((bid.result.total_amount - lowBid) / lowBid) * 100;
    const phaseCount = bid.result.aia_phases ? Object.keys(bid.result.aia_phases).length : 0;

    return [
      (index + 1).toString(),
      bid.result.contractor_name,
      `$${bid.result.total_amount.toLocaleString()}`,
      `${phaseCount} phases`,
      `+${variance.toFixed(1)}%`
    ];
  });

  autoTable(doc, {
    head: [['Rank', 'Design Firm', 'Total Fee', 'AIA Phases', 'Variance']],
    body: rankingData,
    startY: currentY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] }
  });

  currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 20;

  // New page for AIA phase analysis if needed
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  // AIA Phase Analysis
  doc.setFontSize(16);
  doc.text('AIA PHASE ANALYSIS', 20, currentY);
  currentY += 15;

  // Get all AIA phases across bids
  const allPhases = new Set<string>();
  selectedAnalyses.forEach(bid => {
    if (bid.result.aia_phases) {
      Object.keys(bid.result.aia_phases).forEach(phase => allPhases.add(phase));
    }
  });

  // Create phase comparison table
  const phaseTableData = Array.from(allPhases).map(phase => {
    const fees = selectedAnalyses
      .map(bid => bid.result.aia_phases?.[phase]?.fee_amount || 0)
      .filter(fee => fee > 0);

    const average = fees.length > 0 ? fees.reduce((sum, fee) => sum + fee, 0) / fees.length : 0;
    const min = fees.length > 0 ? Math.min(...fees) : 0;
    const max = fees.length > 0 ? Math.max(...fees) : 0;

    return [
      phase,
      `$${average.toLocaleString()}`,
      `$${min.toLocaleString()}`,
      `$${max.toLocaleString()}`,
      fees.length.toString()
    ];
  });

  if (phaseTableData.length > 0) {
    autoTable(doc, {
      head: [['AIA Phase', 'Average Fee', 'Min Fee', 'Max Fee', 'Proposals']],
      body: phaseTableData,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] }
    });
  }

  // Save the PDF
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`Design_Bid_Leveling_Report_${timestamp}.pdf`);
}

export function exportDesignBidLevelingToExcel(selectedAnalyses: SavedAnalysis[]): void {
  const wb = XLSX.utils.book_new();

  // Sort bids by total amount for consistent ranking
  const sortedBids = selectedAnalyses.sort((a, b) => a.result.total_amount - b.result.total_amount);

  // SHEET 1 - LEVELED COMPARISON (Design-specific)
  exportDesignLeveledComparisonSheet(wb, sortedBids);
  const lowBid = sortedBids[0].result.total_amount;

  // SHEET 2 - EXECUTIVE SUMMARY
  const execData = [
    ['DESIGN BID LEVELING ANALYSIS - EXECUTIVE SUMMARY'],
    [`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
    [`Number of Design Proposals Analyzed: ${selectedAnalyses.length}`],
    [''],
    ['RANKING & RECOMMENDATIONS'],
    ['Rank', 'Design Firm', 'Total Fee', 'Dollar Difference', 'Percentage Variance', 'AIA Phases', 'Recommendation']
  ];

  sortedBids.forEach((bid, index) => {
    const dollarDiff = bid.result.total_amount - lowBid;
    const variance = lowBid > 0 ? (dollarDiff / lowBid) * 100 : 0;
    const phaseCount = bid.result.aia_phases ? Object.keys(bid.result.aia_phases).length : 0;

    // Generate intelligent recommendations for design services
    let recommendation = '';
    if (index === 0) {
      if (phaseCount >= 5) recommendation = '✅ RECOMMENDED - Lowest fee with comprehensive phases';
      else recommendation = '⚠️ CAUTION - Low fee but limited phase coverage';
    } else if (variance <= 5) {
      recommendation = '✅ COMPETITIVE - Close to low fee with good value';
    } else if (variance <= 15) {
      if (phaseCount > (sortedBids[0].result.aia_phases ? Object.keys(sortedBids[0].result.aia_phases).length : 0)) {
        recommendation = '⚠️ MODERATE - Higher fee but more comprehensive services';
      } else {
        recommendation = '⚠️ MODERATE - Higher fee for similar scope';
      }
    } else {
      recommendation = '🚨 SIGNIFICANTLY HIGHER - Review scope differences';
    }

    execData.push([
      (index + 1).toString(),
      bid.result.contractor_name,
      bid.result.total_amount.toString(),
      dollarDiff.toString(),
      variance.toFixed(1) + '%',
      phaseCount.toString(),
      recommendation
    ]);
  });

  const execWS = XLSX.utils.aoa_to_sheet(execData);

  // Format Executive Summary
  execWS['!cols'] = [
    { wch: 6 },   // Rank
    { wch: 30 },  // Design Firm
    { wch: 18 },  // Total Fee
    { wch: 18 },  // Dollar Difference
    { wch: 15 },  // Percentage
    { wch: 12 },  // AIA Phases
    { wch: 50 }   // Recommendation
  ];

  // Apply currency formatting
  const execRange = XLSX.utils.decode_range(execWS['!ref'] || 'A1');
  for (let row = 6; row <= execRange.e.r; row++) {
    const totalFeeCell = `C${row + 1}`;
    const dollarDiffCell = `D${row + 1}`;

    if (execWS[totalFeeCell] && !isNaN(Number(execWS[totalFeeCell].v))) {
      execWS[totalFeeCell].t = 'n';
      execWS[totalFeeCell].z = '$#,##0';
    }

    if (execWS[dollarDiffCell] && !isNaN(Number(execWS[dollarDiffCell].v))) {
      execWS[dollarDiffCell].t = 'n';
      execWS[dollarDiffCell].z = '$#,##0';
    }
  }

  XLSX.utils.book_append_sheet(wb, execWS, 'Executive Summary');

  // SHEET 3 - AIA PHASE ANALYSIS
  const allPhases = new Set<string>();
  selectedAnalyses.forEach(bid => {
    if (bid.result.aia_phases) {
      Object.keys(bid.result.aia_phases).forEach(phase => allPhases.add(phase));
    }
  });

  const phaseData = [
    ['AIA PHASE ANALYSIS - PERCENTAGE OF TOTAL FEE'],
    [''],
    ['Phase', 'Description', ...selectedAnalyses.map(bid => bid.result.contractor_name), 'Average', 'Variance', 'Assessment']
  ];

  Array.from(allPhases).sort().forEach(phaseKey => {
    // Get phase name from first bid that has this phase
    let phaseName = phaseKey;
    for (const bid of selectedAnalyses) {
      if (bid.result.aia_phases?.[phaseKey]) {
        phaseName = bid.result.aia_phases[phaseKey].phase_name;
        break;
      }
    }

    const phasePercentages = selectedAnalyses.map(bid => {
      const phaseData = bid.result.aia_phases?.[phaseKey];
      return phaseData ? phaseData.percentage_of_total : 0;
    });

    const validValues = phasePercentages.filter(v => v > 0);
    const average = validValues.length > 0 ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
    const variance = validValues.length > 1 ? Math.max(...validValues) - Math.min(...validValues) : 0;

    // Generate assessment
    let assessment = '';
    if (variance > 15) assessment = '🚨 HIGH VARIANCE - Review scope differences';
    else if (variance > 8) assessment = '⚠️ MODERATE VARIANCE - Some differences noted';
    else if (validValues.length === selectedAnalyses.length) assessment = '✅ CONSISTENT - All proposals include this phase';
    else assessment = '⚠️ PARTIAL COVERAGE - Not all proposals include';

    phaseData.push([
      phaseKey,
      phaseName,
      ...phasePercentages.map(v => v.toFixed(1) + '%'),
      average.toFixed(1) + '%',
      variance.toFixed(1) + '%',
      assessment
    ]);
  });

  const phaseWS = XLSX.utils.aoa_to_sheet(phaseData);

  // Format AIA Phase Analysis
  const contractorCols = selectedAnalyses.map(() => ({ wch: 14 }));
  phaseWS['!cols'] = [
    { wch: 8 },   // Phase key
    { wch: 25 },  // Phase description
    ...contractorCols,
    { wch: 12 },  // Average
    { wch: 12 },  // Variance
    { wch: 40 }   // Assessment
  ];

  XLSX.utils.book_append_sheet(wb, phaseWS, 'AIA Phase Analysis');

  // SHEET 4 - DELIVERABLES COMPARISON
  const deliverableData = [
    ['DESIGN DELIVERABLES COMPARISON'],
    [''],
    ['Firm', 'Total Deliverables', 'Key Deliverables', 'Responsible Disciplines']
  ];

  sortedBids.forEach(bid => {
    const deliverables = bid.result.design_deliverables || [];
    const totalCount = deliverables.length;
    const keyDeliverables = deliverables.slice(0, 3).map(d => d.description).join('; ');
    const disciplines = [...new Set(deliverables.map(d => d.responsible_discipline).filter(Boolean))].join(', ');

    deliverableData.push([
      bid.result.contractor_name,
      totalCount.toString(),
      keyDeliverables || 'Not specified',
      disciplines || 'Not specified'
    ]);
  });

  const deliverableWS = XLSX.utils.aoa_to_sheet(deliverableData);
  deliverableWS['!cols'] = [
    { wch: 25 },  // Firm
    { wch: 15 },  // Total Deliverables
    { wch: 50 },  // Key Deliverables
    { wch: 30 }   // Disciplines
  ];

  XLSX.utils.book_append_sheet(wb, deliverableWS, 'Deliverables');

  // Save the file with timestamp
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `Levelr_Design_Leveling_Analysis_${timestamp}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Helper function for design leveled comparison sheet
export function exportDesignLeveledComparisonSheet(wb: XLSX.WorkBook, bids: SavedAnalysis[]) {
  const sheetData: (string | number)[][] = [];

  // Calculate column positions
  const bidderBlockSize = 3; // 3 data columns per bidder (COST, %, COMMENTS)
  const spacersCount = bids.length - 1; // Spacers only between bidders
  const totalCols = 1 + (bids.length * bidderBlockSize) + spacersCount;

  // Row 1: "SCOPE" then bidder names merged across 3 columns each
  const row1: (string | number)[] = ['SCOPE'];
  bids.forEach((bid, index) => {
    row1.push(bid.result.contractor_name);
    row1.push(''); // For merge
    row1.push(''); // For merge
    if (index < bids.length - 1) row1.push(''); // Spacer column only between bidders
  });
  sheetData.push(row1);

  // Row 2: "" then "FEE", "% OF TOTAL", "COMMENTS" for each bidder
  const row2: (string | number)[] = [''];
  bids.forEach((bid, index) => {
    row2.push('FEE');
    row2.push('% OF TOTAL');
    row2.push('COMMENTS');
    if (index < bids.length - 1) row2.push(''); // Spacer column only between bidders
  });
  sheetData.push(row2);

  // Get all AIA phases across all bids
  const allPhases = new Set<string>();
  bids.forEach(bid => {
    if (bid.result.aia_phases) {
      Object.keys(bid.result.aia_phases).forEach(phase => allPhases.add(phase));
    }
  });

  // Sort phases in standard AIA order
  const phaseOrder = ['SD', 'DD', 'CD', 'BN', 'CA'];
  const sortedPhases = Array.from(allPhases).sort((a, b) => {
    const aIndex = phaseOrder.indexOf(a);
    const bIndex = phaseOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  // Body rows - All AIA phases
  sortedPhases.forEach(phaseKey => {
    // Get phase name from first bid that has this phase
    let phaseName = phaseKey;
    for (const bid of bids) {
      if (bid.result.aia_phases?.[phaseKey]) {
        phaseName = bid.result.aia_phases[phaseKey].phase_name;
        break;
      }
    }

    const row: (string | number)[] = [`${phaseKey} - ${phaseName}`];

    bids.forEach((bid, index) => {
      const phaseData = bid.result.aia_phases?.[phaseKey];
      const fee = phaseData?.fee_amount ?? 0;
      const percentage = phaseData?.percentage_of_total ?? 0;

      // FEE column
      row.push(fee);

      // % OF TOTAL column
      row.push(percentage);

      // COMMENTS column - show deliverables or scope notes
      let comment = '';
      if (phaseData) {
        if (phaseData.deliverables && phaseData.deliverables.length > 0) {
          comment = `${phaseData.deliverables.length} deliverable${phaseData.deliverables.length > 1 ? 's' : ''}`;
        } else if (phaseData.scope_notes) {
          comment = phaseData.scope_notes.substring(0, 30) + (phaseData.scope_notes.length > 30 ? '...' : '');
        } else {
          comment = 'Standard phase deliverables';
        }
      } else {
        comment = 'Phase not included';
      }
      row.push(comment);

      // Spacer column only between bidders
      if (index < bids.length - 1) row.push('');
    });

    sheetData.push(row);
  });

  // Blank separator
  const blankRow: (string | number)[] = new Array(totalCols).fill('');
  sheetData.push(blankRow);

  // "TOTAL DESIGN FEE"
  const totalFeeRow: (string | number)[] = ['TOTAL DESIGN FEE'];
  bids.forEach((bid, index) => {
    const totalAmount = bid.result.total_amount;

    totalFeeRow.push(totalAmount);
    totalFeeRow.push(100); // Always 100% for total
    totalFeeRow.push('Complete design services fee');

    if (index < bids.length - 1) totalFeeRow.push('');
  });
  sheetData.push(totalFeeRow);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column width calculations
  const colWidths: { wch: number }[] = [];
  colWidths.push({ wch: 35 }); // SCOPE column

  bids.forEach((bid, index) => {
    const contractorNameWidth = Math.max(bid.result.contractor_name.length + 2, 12);
    colWidths.push({ wch: contractorNameWidth }); // FEE
    colWidths.push({ wch: 12 }); // % OF TOTAL
    colWidths.push({ wch: 40 }); // COMMENTS
    if (index < bids.length - 1) colWidths.push({ wch: 2 }); // Spacer
  });

  ws['!cols'] = colWidths;

  // Merging for contractor headers (row 1)
  const merges: XLSX.Range[] = [];
  let colOffset = 1; // Start after SCOPE column

  bids.forEach((bid, index) => {
    const startCol = colOffset;
    const endCol = colOffset + 2; // Merge across 3 columns (FEE, % OF TOTAL, COMMENTS)

    merges.push({
      s: { r: 0, c: startCol },
      e: { r: 0, c: endCol }
    });

    colOffset += 3; // Move to next bidder block
    if (index < bids.length - 1) colOffset += 1; // Skip spacer column
  });

  ws['!merges'] = merges;

  // Format currency and percentage columns
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  let currentCol = 1; // Start after SCOPE column
  bids.forEach((_, index) => {
    // Format FEE column (whole dollars, no decimals)
    for (let row = 2; row <= range.e.r; row++) {
      const feeCellAddr = XLSX.utils.encode_cell({ r: row, c: currentCol });
      if (ws[feeCellAddr] && typeof ws[feeCellAddr].v === 'number') {
        ws[feeCellAddr].z = '$#,##0';
      }
    }

    // Format % OF TOTAL column (percentage)
    const percentCol = currentCol + 1;
    for (let row = 2; row <= range.e.r; row++) {
      const percentCellAddr = XLSX.utils.encode_cell({ r: row, c: percentCol });
      if (ws[percentCellAddr] && typeof ws[percentCellAddr].v === 'number') {
        ws[percentCellAddr].z = '0.0%';
      }
    }

    currentCol += 3; // Move to next bidder block (FEE, % OF TOTAL, COMMENTS)
    if (index < bids.length - 1) currentCol++; // Skip spacer column
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Leveled Comparison');
}

export {
  exportTradeAnalysisToPDF,
  exportTradeAnalysisToExcel
} from './trade-exports';

// Trade bid leveling exports (using construction fallback with proper messaging)
export function exportTradeBidLevelingToPDF(selectedAnalyses: SavedAnalysis[]): void {
  console.log('Trade bid leveling PDF export using construction format with trade-specific analysis');
  return exportConstructionBidLevelingToPDF(selectedAnalyses);
}

export function exportTradeBidLevelingToExcel(selectedAnalyses: SavedAnalysis[]): void {
  console.log('Trade bid leveling Excel export using construction format with trade-specific analysis');
  return exportConstructionBidLevelingToExcel(selectedAnalyses);
}

// Note: Legacy export-generator.ts is deprecated in favor of discipline-specific exports above