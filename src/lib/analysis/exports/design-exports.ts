import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AnalysisResult } from '@/types/analysis';
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
import { getCachedVarianceExplanation } from '../../varianceExplain';
import { SavedAnalysis } from '@/lib/storage';

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
    if (analysis.project_overhead.administration) {
      overheadData.push(['Administration', `$${analysis.project_overhead.administration.toLocaleString()}`]);
    }
    if (analysis.project_overhead.professional_liability) {
      overheadData.push(['Professional Liability', `$${analysis.project_overhead.professional_liability.toLocaleString()}`]);
    }
    if (analysis.project_overhead.travel_expenses) {
      overheadData.push(['Travel & Expenses', `$${analysis.project_overhead.travel_expenses.toLocaleString()}`]);
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

// Enhanced function to add variance explanations sheet for design bid leveling
async function addDesignVarianceExplanationSheet(wb: XLSX.WorkBook, bids: SavedAnalysis[]) {
  console.log(`🔍 addDesignVarianceExplanationSheet called with ${bids.length} bids`);

  if (bids.length < 2) {
    console.log('⚠️ Not enough bids for variance analysis (need at least 2)');
    return; // Need at least 2 bids for variance analysis
  }

  const explanations: Array<{
    scope: string;
    bidsCompared: string;
    shortExplanation: string;
    detailedAnalysis: string;
    generatedAt: string;
    confidence: string;
  }> = [];

  // Get all AIA phases across all bids
  const allPhases = new Set<string>();
  bids.forEach(bid => {
    if (bid.result.aia_phases) {
      Object.keys(bid.result.aia_phases).forEach(phase => allPhases.add(phase));
    }
  });

  console.log(`📋 Found ${allPhases.size} unique AIA phases across bids:`, Array.from(allPhases));

  // Show what's in the cache
  const { getCacheStats } = await import('../../varianceExplain');
  const cacheStats = getCacheStats();
  console.log(`💾 Current cache has ${cacheStats.size} entries:`, cacheStats.entries);

  // Check for cached explanations for each AIA phase across all bid combinations
  for (const phaseKey of allPhases) {
    // Get phase name from first bid that has this phase
    let phaseName = phaseKey;
    for (const bid of bids) {
      if (bid.result.aia_phases?.[phaseKey]) {
        phaseName = bid.result.aia_phases[phaseKey].phase_name;
        break;
      }
    }

    // Generate all possible bid pair combinations
    for (let i = 0; i < bids.length - 1; i++) {
      for (let j = i + 1; j < bids.length; j++) {
        const bid1 = bids[i];
        const bid2 = bids[j];

        // Check if both bids have this phase
        const phase1 = bid1.result.aia_phases?.[phaseKey];
        const phase2 = bid2.result.aia_phases?.[phaseKey];

        if (!phase1 || !phase2 || (phase1.fee_amount === 0 && phase2.fee_amount === 0)) {
          continue; // Skip if either bid doesn't have this phase or both are zero
        }

        // Create row data for this phase comparison
        const rows = [{
          division: phaseKey,
          scopePath: phaseName,
          item: phaseName,
          bids: {
            [bid1.result.contractor_name]: phase1.fee_amount,
            [bid2.result.contractor_name]: phase2.fee_amount
          },
          varianceAbs: Math.abs(phase1.fee_amount - phase2.fee_amount),
          variancePct: phase1.fee_amount > 0 ? Math.abs((phase1.fee_amount - phase2.fee_amount) / phase1.fee_amount) * 100 : 0
        }];

        const selectedBids = [bid1.result.contractor_name, bid2.result.contractor_name];

        try {
          // Check for cached explanation
          console.log(`🔍 Checking cache for ${phaseKey} between ${selectedBids.join(' vs ')}`);
          const cached = await getCachedVarianceExplanation(rows, selectedBids);

          if (cached) {
            console.log(`✅ Found cached explanation for ${phaseKey}:`, cached.short.substring(0, 50) + '...');
            // Calculate confidence based on variance magnitude and explanation length
            let confidence = 'High';
            const variancePct = rows[0].variancePct;
            if (variancePct < 8) confidence = 'Medium'; // Design services typically have wider acceptable variance
            if (variancePct < 3) confidence = 'Low';
            if (cached.short.includes('Unable to') || cached.model === 'fallback') confidence = 'Low';

            explanations.push({
              scope: `${phaseKey} - ${phaseName}`,
              bidsCompared: selectedBids.join(' vs '),
              shortExplanation: cached.short,
              detailedAnalysis: cached.long || cached.short,
              generatedAt: cached.at,
              confidence: confidence
            });
          } else {
            console.log(`❌ No cached explanation found for ${phaseKey} between ${selectedBids.join(' vs ')}`);
          }
        } catch (error) {
          console.warn(`Failed to get cached explanation for phase ${phaseKey}:`, error);
          // Continue processing other phases
        }
      }
    }
  }

  // Only create the sheet if we have explanations
  if (explanations.length === 0) {
    console.log('No variance explanations found in cache for design phases - skipping Variance Explanations sheet');
    return;
  }

  // Create the variance explanations sheet
  const sheetData = [
    ['DESIGN VARIANCE EXPLANATIONS'],
    ['Generated explanations for fee differences across AIA phases'],
    [''],
    ['AIA Phase', 'Bids Compared', 'Short Explanation', 'Detailed Analysis', 'Generated At', 'Confidence Level']
  ];

  // Sort explanations by scope for better organization
  explanations.sort((a, b) => a.scope.localeCompare(b.scope));

  explanations.forEach(exp => {
    sheetData.push([
      exp.scope,
      exp.bidsCompared,
      exp.shortExplanation,
      exp.detailedAnalysis,
      new Date(exp.generatedAt).toLocaleString(),
      exp.confidence
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 25 }, // AIA Phase
    { wch: 20 }, // Bids Compared
    { wch: 40 }, // Short Explanation
    { wch: 60 }, // Detailed Analysis
    { wch: 18 }, // Generated At
    { wch: 15 }  // Confidence Level
  ];

  // Apply formatting
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[cellAddr];
      if (!cell) continue;

      // Header formatting
      if (row === 0) {
        cell.s = { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } } };
      } else if (row === 1) {
        cell.s = { font: { italic: true, sz: 11, color: { rgb: '6B7280' } } };
      } else if (row === 3) {
        cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
      }

      // Data row formatting
      if (row > 3) {
        // Color code confidence levels
        if (col === 5) { // Confidence Level column
          const confidence = cell.v;
          let fillColor = 'FFFFFF';
          if (confidence === 'High') fillColor = 'DCFCE7'; // Green
          else if (confidence === 'Medium') fillColor = 'FEF3C7'; // Yellow
          else if (confidence === 'Low') fillColor = 'FEE2E2'; // Red

          cell.s = { fill: { fgColor: { rgb: fillColor } } };
        }

        // Wrap text for explanation columns
        if (col === 2 || col === 3) {
          cell.s = { ...(cell.s || {}), alignment: { wrapText: true, vertical: 'top' } };
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Variance Explanations');
  console.log(`Added Design Variance Explanations sheet with ${explanations.length} explanations`);
}

// Export the function for use in index.ts
export { addDesignVarianceExplanationSheet };