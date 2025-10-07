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