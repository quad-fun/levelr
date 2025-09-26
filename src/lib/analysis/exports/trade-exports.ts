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

export function exportTradeAnalysisToPDF(analysis: AnalysisResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  const { checkPageBreak, updateYPosition, getCurrentY } = createPageBreakChecker(doc, pageHeight, margin);

  // Header
  let yPosition = createLevelrPDFHeader(doc, 'Levelr Trade Analysis Report', pageWidth, margin);
  updateYPosition(yPosition);

  // Executive Summary
  yPosition = createExecutiveSummaryBox(
    doc,
    'Executive Summary',
    'Trade Contractor',
    analysis.contractor_name,
    'Total Amount',
    analysis.total_amount,
    contentWidth,
    margin,
    getCurrentY()
  );
  updateYPosition(yPosition);

  // Project Details
  yPosition = addProjectDetailsSection(doc, analysis, margin, getCurrentY(), checkPageBreak);
  updateYPosition(yPosition);

  // Technical Systems Analysis Section
  if (analysis.technical_systems && Object.keys(analysis.technical_systems).length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Technical Systems Breakdown', margin, getCurrentY());
    updateYPosition(getCurrentY() + 15);

    // Create table for technical systems
    const systemTableData = Object.entries(analysis.technical_systems).map(([, systemData]) => [
      systemData.system_name,
      systemData.category.toUpperCase(),
      `$${systemData.total_cost.toLocaleString()}`,
      `$${(systemData.equipment_cost || 0).toLocaleString()}`,
      `$${(systemData.labor_cost || 0).toLocaleString()}`,
      systemData.scope_notes || ''
    ]);

    autoTable(doc, {
      head: [['System', 'Category', 'Total Cost', 'Equipment', 'Labor', 'Scope Notes']],
      body: systemTableData,
      startY: getCurrentY(),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 35 }, // System
        1: { cellWidth: 25 }, // Category
        2: { cellWidth: 25, halign: 'right' }, // Total Cost
        3: { cellWidth: 25, halign: 'right' }, // Equipment
        4: { cellWidth: 25, halign: 'right' }, // Labor
        5: { cellWidth: 45 } // Scope Notes
      }
    });

    updateYPosition((doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15);
  }

  // Equipment Specifications Section
  if (analysis.equipment_specifications && analysis.equipment_specifications.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipment Specifications', margin, getCurrentY());
    updateYPosition(getCurrentY() + 10);

    const equipmentTableData = analysis.equipment_specifications.map(spec => [
      spec.description,
      spec.model || '',
      spec.quantity?.toString() || '1',
      `$${spec.unit_cost.toLocaleString()}`,
      `$${spec.total_cost.toLocaleString()}`
    ]);

    autoTable(doc, {
      head: [['Description', 'Model', 'Qty', 'Unit Cost', 'Total Cost']],
      body: equipmentTableData,
      startY: getCurrentY(),
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 70 }, // Description
        1: { cellWidth: 40 }, // Model
        2: { cellWidth: 15, halign: 'center' }, // Qty
        3: { cellWidth: 25, halign: 'right' }, // Unit Cost
        4: { cellWidth: 30, halign: 'right' } // Total Cost
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
    if (analysis.project_overhead.supervision) {
      overheadData.push(['Supervision', `$${analysis.project_overhead.supervision.toLocaleString()}`]);
    }
    if (analysis.project_overhead.permits) {
      overheadData.push(['Permits', `$${analysis.project_overhead.permits.toLocaleString()}`]);
    }
    if (analysis.project_overhead.insurance) {
      overheadData.push(['Insurance', `$${analysis.project_overhead.insurance.toLocaleString()}`]);
    }
    if (analysis.project_overhead.bonds) {
      overheadData.push(['Bonds', `$${analysis.project_overhead.bonds.toLocaleString()}`]);
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
  addLevelrFooter(doc, pageWidth, pageHeight, margin, 'Trade Analysis Report');

  // Save
  const fileName = generatePDFFilename('Trade_Analysis', analysis.contractor_name);
  doc.save(fileName);
}

export function exportTradeAnalysisToExcel(analysis: AnalysisResult): void {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Overview Sheet
  createOverviewSheet(wb, 'Trade Project Overview', 'Trade Contractor', analysis);

  // Technical Systems Analysis Sheet
  if (analysis.technical_systems && Object.keys(analysis.technical_systems).length > 0) {
    const systemsData = [
      ['System Name', 'Category', 'Total Cost', 'Equipment Cost', 'Labor Cost', 'Installation Cost', 'Commissioning Cost', 'Testing Requirements', 'Scope Notes']
    ];

    Object.entries(analysis.technical_systems).forEach(([, systemData]) => {
      const testingRequirements = systemData.testing_requirements ?
        systemData.testing_requirements.join('; ') : '';

      systemsData.push([
        systemData.system_name,
        systemData.category.toUpperCase(),
        systemData.total_cost.toString(),
        (systemData.equipment_cost || 0).toString(),
        (systemData.labor_cost || 0).toString(),
        (systemData.installation_cost || 0).toString(),
        (systemData.commissioning_cost || 0).toString(),
        testingRequirements,
        systemData.scope_notes || ''
      ]);
    });

    const systemsWs = XLSX.utils.aoa_to_sheet(systemsData);
    systemsWs['!cols'] = calculateOptimalColumnWidths(systemsData);

    // Format currency columns (Total Cost, Equipment Cost, Labor Cost, Installation Cost, Commissioning Cost)
    formatCurrencyColumns(systemsWs, [2, 3, 4, 5, 6], 1);

    XLSX.utils.book_append_sheet(wb, systemsWs, 'Technical Systems');
  }

  // Equipment Specifications Sheet
  if (analysis.equipment_specifications && analysis.equipment_specifications.length > 0) {
    const equipmentData = [
      ['Description', 'Model', 'Quantity', 'Unit Cost', 'Total Cost']
    ];

    analysis.equipment_specifications.forEach(spec => {
      equipmentData.push([
        spec.description,
        spec.model || '',
        spec.quantity?.toString() || '1',
        spec.unit_cost.toString(),
        spec.total_cost.toString()
      ]);
    });

    const equipmentWs = XLSX.utils.aoa_to_sheet(equipmentData);
    equipmentWs['!cols'] = calculateOptimalColumnWidths(equipmentData);

    // Format currency columns (Unit Cost, Total Cost)
    formatCurrencyColumns(equipmentWs, [3, 4], 1);

    XLSX.utils.book_append_sheet(wb, equipmentWs, 'Equipment Specs');
  }

  // Project Overhead Sheet
  addProjectOverheadSheet(wb, analysis, 'Project Overhead');

  // Save the Excel file
  const fileName = generateExcelFilename('trade', analysis.contractor_name);
  saveExcelFile(wb, fileName);
}