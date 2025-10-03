import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AnalysisResult } from '@/types/analysis';
import { SavedAnalysis } from '@/lib/storage';
import {
  createLevelrPDFHeader,
  createExecutiveSummaryBox,
  createPageBreakChecker,
  addLevelrFooter,
  addProjectDetailsSection,
  addExclusionsAndAssumptions,
  generatePDFFilename,
  JsPDFWithAutoTable
} from './shared/pdf-helpers';
import {
  createOverviewSheet,
  calculateOptimalColumnWidths,
  formatCurrencyColumns,
  addProjectOverheadSheet,
  generateExcelFilename,
  saveExcelFile
} from './shared/excel-helpers';

export function exportDesignAnalysisToPDF(analysis: AnalysisResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  const { checkPageBreak, updateYPosition, getCurrentY } = createPageBreakChecker(doc, pageHeight, margin);

  // Header
  let yPosition = createLevelrPDFHeader(doc, 'Levelr Design Analysis Report', pageWidth, margin);
  updateYPosition(yPosition);

  // Executive Summary
  yPosition = createExecutiveSummaryBox(
    doc,
    'Executive Summary',
    'Design Firm',
    analysis.contractor_name,
    'Total Fee',
    analysis.total_amount,
    contentWidth,
    margin,
    getCurrentY()
  );
  updateYPosition(yPosition);

  // Project Details
  yPosition = addProjectDetailsSection(doc, analysis, margin, getCurrentY(), checkPageBreak);
  updateYPosition(yPosition);

  // AIA Phases Analysis Section
  if (analysis.aia_phases && Object.keys(analysis.aia_phases).length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AIA Phases Breakdown', margin, getCurrentY());
    updateYPosition(getCurrentY() + 15);

    // Create table for AIA phases
    const phaseTableData = Object.entries(analysis.aia_phases).map(([, phaseData]) => [
      phaseData.phase_name,
      `$${phaseData.fee_amount.toLocaleString()}`,
      `${phaseData.percentage_of_total}%`,
      phaseData.scope_notes || ''
    ]);

    autoTable(doc, {
      head: [['Phase', 'Fee Amount', '% of Total', 'Scope Notes']],
      body: phaseTableData,
      startY: getCurrentY(),
      styles: {
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Phase
        1: { cellWidth: 30, halign: 'right' }, // Fee Amount
        2: { cellWidth: 20, halign: 'center' }, // Percentage
        3: { cellWidth: 70 } // Scope Notes
      }
    });

    updateYPosition((doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15);
  }

  // Design Deliverables Section
  if (analysis.design_deliverables && analysis.design_deliverables.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Design Deliverables', margin, getCurrentY());
    updateYPosition(getCurrentY() + 10);

    const deliverableTableData = analysis.design_deliverables.map(deliverable => [
      deliverable.description,
      deliverable.responsible_discipline || ''
    ]);

    autoTable(doc, {
      head: [['Deliverable', 'Responsible Discipline']],
      body: deliverableTableData,
      startY: getCurrentY(),
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 40 }
      }
    });

    updateYPosition((doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15);
  }

  // Project Overhead Section
  if (analysis.project_overhead) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Overhead', margin, getCurrentY());
    updateYPosition(getCurrentY() + 10);

    const overheadData = [];
    if (analysis.project_overhead.project_management) {
      overheadData.push(['Project Management', `$${analysis.project_overhead.project_management.toLocaleString()}`]);
    }
    if (analysis.project_overhead.insurance) {
      overheadData.push(['Insurance', `$${analysis.project_overhead.insurance.toLocaleString()}`]);
    }
    overheadData.push(['TOTAL OVERHEAD', `$${analysis.project_overhead.total_overhead.toLocaleString()}`]);

    if (overheadData.length > 0) {
      autoTable(doc, {
        body: overheadData,
        startY: getCurrentY(),
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'right' }
        }
      });

      updateYPosition((doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15);
    }
  }

  // Exclusions and Assumptions
  yPosition = addExclusionsAndAssumptions(doc, analysis, margin, contentWidth, getCurrentY(), checkPageBreak);
  updateYPosition(yPosition);

  // Footer
  addLevelrFooter(doc, pageWidth, pageHeight, margin, 'Design Analysis Report');

  // Save
  const fileName = generatePDFFilename('Design_Analysis', analysis.contractor_name);
  doc.save(fileName);
}

export function exportDesignAnalysisToExcel(analysis: AnalysisResult): void {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Overview Sheet
  createOverviewSheet(wb, 'Design Project Overview', 'Design Firm', analysis);

  // AIA Phases Analysis Sheet
  if (analysis.aia_phases && Object.keys(analysis.aia_phases).length > 0) {
    const aiaData = [
      ['AIA Phase', 'Fee Amount', 'Percentage of Total', 'Deliverables', 'Scope Notes']
    ];

    Object.entries(analysis.aia_phases).forEach(([, phaseData]) => {
      const deliverables = phaseData.deliverables ?
        phaseData.deliverables.map(d => d.description).join('; ') : '';

      aiaData.push([
        phaseData.phase_name,
        phaseData.fee_amount?.toString() || '0',
        `${phaseData.percentage_of_total || 0}%`,
        deliverables,
        phaseData.scope_notes || ''
      ]);
    });

    const aiaWs = XLSX.utils.aoa_to_sheet(aiaData);
    aiaWs['!cols'] = calculateOptimalColumnWidths(aiaData);
    formatCurrencyColumns(aiaWs, [1], 1); // Column B (Fee Amount), starting from row 2
    XLSX.utils.book_append_sheet(wb, aiaWs, 'AIA Phases');
  }

  // Design Deliverables Sheet
  if (analysis.design_deliverables && analysis.design_deliverables.length > 0) {
    const deliverableData = [
      ['Deliverable', 'Responsible Discipline']
    ];

    analysis.design_deliverables.forEach(deliverable => {
      deliverableData.push([
        deliverable.description,
        deliverable.responsible_discipline || ''
      ]);
    });

    const deliverableWs = XLSX.utils.aoa_to_sheet(deliverableData);
    deliverableWs['!cols'] = [{ wch: 50 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, deliverableWs, 'Deliverables');
  }

  // Project Overhead Sheet
  addProjectOverheadSheet(wb, analysis, 'Project Overhead');

  // Save the Excel file
  const fileName = generateExcelFilename('design', analysis.contractor_name);
  saveExcelFile(wb, fileName);
}

// ============== DESIGN BID LEVELING FUNCTIONS ==============

/**
 * Design-specific bid leveling Excel export comparing AIA phases instead of CSI divisions
 */
export function exportDesignBidLevelingToExcel(selectedAnalyses: SavedAnalysis[]) {
  const wb = XLSX.utils.book_new();

  // Sort bids by total amount for consistent ranking
  const sortedBids = selectedAnalyses.sort((a, b) => a.result.total_amount - b.result.total_amount);

  // SHEET 1 - AIA PHASE COMPARISON (PRIMARY SHEET)
  exportDesignLeveledComparisonSheet(wb, sortedBids);
  const lowBid = sortedBids[0].result.total_amount;

  // SHEET 2 - EXECUTIVE SUMMARY
  const execData = [
    ['DESIGN BID LEVELING ANALYSIS - EXECUTIVE SUMMARY'],
    [`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
    [`Number of Design Proposals Analyzed: ${selectedAnalyses.length}`],
    [''],
    ['RANKING & RECOMMENDATIONS'],
    ['Rank', 'Design Firm', 'Total Fee', 'Dollar Difference', 'Percentage Variance', 'Phase Coverage', 'Recommendation']
  ];

  sortedBids.forEach((bid, index) => {
    const dollarDiff = bid.result.total_amount - lowBid;
    const variance = lowBid > 0 ? (dollarDiff / lowBid) * 100 : 0;

    // Calculate phase coverage
    const phaseCount = bid.result.aia_phases ? Object.keys(bid.result.aia_phases).length : 0;
    const expectedPhases = 5; // SD, DD, CD, BN, CA
    const phaseCoverage = `${phaseCount}/${expectedPhases} phases`;

    // Generate intelligent recommendations for design services
    let recommendation = '';
    if (index === 0) {
      if (phaseCount >= 4) recommendation = '✅ RECOMMENDED - Lowest fee with comprehensive scope';
      else recommendation = '⚠️ CAUTION - Low fee but incomplete phase coverage';
    } else if (variance <= 10) {
      if (phaseCount >= 4) recommendation = '✅ COMPETITIVE - Reasonable fee with good scope coverage';
      else recommendation = '⚠️ REVIEW - Competitive fee but verify scope completeness';
    } else if (variance <= 25) {
      if (phaseCount >= 4) recommendation = '⚠️ HIGHER FEE - Premium pricing but comprehensive services';
      else recommendation = '🚨 EXPENSIVE - Higher fee AND limited scope';
    } else {
      recommendation = '🚨 SIGNIFICANTLY HIGHER - Review scope differences and value proposition';
    }

    execData.push([
      (index + 1).toString(),
      bid.result.contractor_name,
      bid.result.total_amount.toString(),
      dollarDiff.toString(),
      variance.toFixed(1) + '%',
      phaseCoverage,
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
    { wch: 15 },  // Phase Coverage
    { wch: 50 }   // Recommendation
  ];

  // Apply formatting and color coding
  const execRange = XLSX.utils.decode_range(execWS['!ref'] || 'A1');
  for (let row = 0; row <= execRange.e.r; row++) {
    for (let col = 0; col <= execRange.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = execWS[cellAddr];
      if (!cell) continue;

      // Header formatting
      if (row === 0) {
        cell.s = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '9333EA' } } };
      } else if (row === 4) {
        cell.s = { font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '7C3AED' } } };
      } else if (row === 5) {
        cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
      }

      // Data row formatting
      if (row > 5) {
        const rank = row - 6;
        let fillColor = 'FFFFFF'; // White default

        if (rank === 0) fillColor = 'DCFCE7'; // Green for lowest
        else if (rank === 1) fillColor = 'FEF3C7'; // Yellow for second
        else if (rank >= 2) fillColor = 'FEE2E2'; // Red for higher

        cell.s = { fill: { fgColor: { rgb: fillColor } } };

        // Format currency columns
        if (col === 2 || col === 3) { // Total Fee and Dollar Difference
          cell.t = 'n';
          cell.z = '$#,##0';
        } else if (col === 4) { // Percentage Variance
          cell.t = 'n';
          cell.z = '0.0%';
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, execWS, 'Executive Summary');

  // Save the file with timestamp
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `Levelr_Design_Leveling_Analysis_${timestamp}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Design-specific bid leveling PDF export
 */
export function exportDesignBidLevelingToPDF(selectedAnalyses: SavedAnalysis[]) {
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
      `${phaseCount}/5 phases`,
      `+${variance.toFixed(1)}%`
    ];
  });

  autoTable(doc, {
    head: [['Rank', 'Design Firm', 'Total Fee', 'Phase Coverage', 'Variance']],
    body: rankingData,
    startY: currentY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [147, 51, 234] } // Purple for design
  });

  // Save the PDF
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`Design_Bid_Leveling_Report_${timestamp}.pdf`);
}

/**
 * Creates the main AIA phase comparison sheet for design bid leveling
 */
function exportDesignLeveledComparisonSheet(wb: XLSX.WorkBook, bids: SavedAnalysis[]) {
  const sheetData: (string | number)[][] = [];

  // Calculate column positions
  const bidderBlockSize = 3; // 3 data columns per bidder: FEE, FEE%, DELIVERABLES
  const spacersCount = bids.length - 1;
  const totalCols = 1 + (bids.length * bidderBlockSize) + spacersCount;

  // Row 1: "AIA PHASE" then design firm names merged across 3 columns each
  const row1: (string | number)[] = ['AIA PHASE'];
  bids.forEach((bid, index) => {
    row1.push(bid.result.contractor_name);
    row1.push(''); // For merge
    row1.push(''); // For merge
    if (index < bids.length - 1) row1.push(''); // Spacer column only between bidders
  });
  sheetData.push(row1);

  // Row 2: "" then "FEE", "FEE%", "DELIVERABLES" for each bidder
  const row2: (string | number)[] = [''];
  bids.forEach((bid, index) => {
    row2.push('FEE');
    row2.push('FEE%');
    row2.push('DELIVERABLES');
    if (index < bids.length - 1) row2.push(''); // Spacer column only between bidders
  });
  sheetData.push(row2);

  // Standard AIA phases
  const aiaPhases = [
    { code: 'SD', name: 'Schematic Design' },
    { code: 'DD', name: 'Design Development' },
    { code: 'CD', name: 'Construction Documents' },
    { code: 'BN', name: 'Bidding/Negotiation' },
    { code: 'CA', name: 'Construction Administration' }
  ];

  // Body rows - AIA phases
  aiaPhases.forEach(phase => {
    const row: (string | number)[] = [`${phase.code} - ${phase.name}`];

    bids.forEach((bid, index) => {
      // Find matching AIA phase in the bid
      let phaseData = null;
      if (bid.result.aia_phases) {
        phaseData = Object.values(bid.result.aia_phases).find(p =>
          p.phase_name.toUpperCase().includes(phase.code) ||
          p.phase_name.toLowerCase().includes(phase.name.toLowerCase())
        );
      }

      const fee = phaseData?.fee_amount ?? 0;
      const percentage = phaseData?.percentage_of_total ?? 0;
      const deliverables = phaseData?.deliverables ?
        phaseData.deliverables.map(d => d.description).join(', ') :
        (fee > 0 ? 'Standard deliverables' : 'Not included');

      // FEE column
      row.push(fee);

      // FEE% column
      row.push(percentage);

      // DELIVERABLES column
      row.push(deliverables);

      // Spacer column only between bidders
      if (index < bids.length - 1) row.push('');
    });

    sheetData.push(row);
  });

  // Project Management row (if any bid has it)
  const hasProjectManagement = bids.some(bid =>
    bid.result.project_overhead?.project_management && bid.result.project_overhead.project_management > 0
  );

  if (hasProjectManagement) {
    const pmRow: (string | number)[] = ['Project Management'];
    bids.forEach((bid, index) => {
      const pmFee = bid.result.project_overhead?.project_management ?? 0;
      const pmPercentage = bid.result.total_amount > 0 ? (pmFee / bid.result.total_amount) * 100 : 0;

      pmRow.push(pmFee);
      pmRow.push(Math.round(pmPercentage * 100) / 100);
      pmRow.push(pmFee > 0 ? 'Project oversight and coordination' : 'Not included');

      if (index < bids.length - 1) pmRow.push('');
    });
    sheetData.push(pmRow);
  }

  // Blank separator
  const blankRow: (string | number)[] = new Array(totalCols).fill('');
  sheetData.push(blankRow);

  // "TOTAL DESIGN FEE"
  const totalFeeRow: (string | number)[] = ['TOTAL DESIGN FEE'];
  bids.forEach((bid, index) => {
    const totalAmount = bid.result.total_amount;

    totalFeeRow.push(totalAmount);
    totalFeeRow.push(100); // Always 100% for total
    totalFeeRow.push('Complete design services package');

    if (index < bids.length - 1) totalFeeRow.push('');
  });
  sheetData.push(totalFeeRow);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column width calculations
  const colWidths: { wch: number }[] = [];
  colWidths.push({ wch: 35 }); // AIA PHASE column

  bids.forEach((bid, index) => {
    const contractorNameWidth = Math.max(bid.result.contractor_name.length + 2, 12);
    colWidths.push({ wch: contractorNameWidth }); // FEE
    colWidths.push({ wch: 10 }); // FEE%
    colWidths.push({ wch: 45 }); // DELIVERABLES
    if (index < bids.length - 1) colWidths.push({ wch: 2 }); // Spacer
  });

  ws['!cols'] = colWidths;

  // Merging for contractor headers (row 1)
  const merges: XLSX.Range[] = [];
  let colOffset = 1; // Start after AIA PHASE column

  bids.forEach((bid, index) => {
    const startCol = colOffset;
    const endCol = colOffset + 2; // Merge across 3 columns (FEE, FEE%, DELIVERABLES)

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
  let currentCol = 1; // Start after AIA PHASE column
  bids.forEach((_, index) => {
    // Format FEE column (whole dollars, no decimals)
    for (let row = 2; row <= range.e.r; row++) {
      const feeCellAddr = XLSX.utils.encode_cell({ r: row, c: currentCol });
      if (ws[feeCellAddr] && typeof ws[feeCellAddr].v === 'number') {
        ws[feeCellAddr].z = '$#,##0';
      }
    }

    // Format FEE% column (percentage with 1 decimal place)
    const feePercentCol = currentCol + 1;
    for (let row = 2; row <= range.e.r; row++) {
      const feePercentCellAddr = XLSX.utils.encode_cell({ r: row, c: feePercentCol });
      if (ws[feePercentCellAddr] && typeof ws[feePercentCellAddr].v === 'number') {
        ws[feePercentCellAddr].z = '0.0%';
      }
    }

    currentCol += 3; // Move to next bidder block (FEE, FEE%, DELIVERABLES)
    if (index < bids.length - 1) currentCol++; // Skip spacer column
  });

  XLSX.utils.book_append_sheet(wb, ws, 'AIA Phase Comparison');
}