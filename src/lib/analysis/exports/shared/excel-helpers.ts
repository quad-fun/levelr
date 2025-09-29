import * as XLSX from 'xlsx';
import { ProjectOverhead } from '@/types/analysis';

export function createOverviewSheet(
  wb: XLSX.WorkBook,
  title: string,
  contractorLabel: string,
  analysis: { contractor_name: string; total_amount: number; project_name?: string; proposal_date?: string; bid_date?: string; timeline?: string }
): void {
  const overviewData = [
    [title],
    [contractorLabel, analysis.contractor_name],
    ['Total Amount', analysis.total_amount],
    ['Project Name', analysis.project_name || ''],
    ['Date', analysis.proposal_date || analysis.bid_date || ''],
    ['Timeline', analysis.timeline || ''],
    ['Generated', new Date().toISOString()]
  ];

  const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);

  // Auto-fit columns for overview sheet
  overviewWs['!cols'] = [
    { wch: 15 },  // Labels
    { wch: Math.max(25, analysis.contractor_name.length + 5) }  // Values - auto-size based on content
  ];

  XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');
}

export function calculateOptimalColumnWidths(data: string[][]): { wch: number }[] {
  const maxLengths: number[] = [];
  data.forEach(row => {
    row.forEach((cell, colIndex) => {
      const cellLength = String(cell).length;
      maxLengths[colIndex] = Math.max(maxLengths[colIndex] || 0, cellLength);
    });
  });

  // Set auto-fit column widths with minimum and maximum constraints
  return maxLengths.map((length) => ({
    wch: Math.min(Math.max(length + 2, 10), 50) // Min 10, Max 50 characters
  }));
}

export function formatCurrencyColumns(
  ws: XLSX.WorkSheet,
  columnIndexes: number[],
  startRow: number = 1
): void {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let row = startRow; row <= range.e.r; row++) {
    columnIndexes.forEach(colIndex => {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: colIndex });
      if (ws[cellAddr] && !isNaN(Number(ws[cellAddr].v))) {
        ws[cellAddr].t = 'n';
        ws[cellAddr].z = '$#,##0';
      }
    });
  }
}

export function formatPercentageColumns(
  ws: XLSX.WorkSheet,
  columnIndexes: number[],
  startRow: number = 1
): void {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let row = startRow; row <= range.e.r; row++) {
    columnIndexes.forEach(colIndex => {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: colIndex });
      if (ws[cellAddr] && !isNaN(Number(ws[cellAddr].v))) {
        ws[cellAddr].t = 'n';
        ws[cellAddr].z = '0.0%';
      }
    });
  }
}

export function addProjectOverheadSheet(
  wb: XLSX.WorkBook,
  analysis: { project_overhead?: ProjectOverhead; total_amount: number },
  sheetName: string = 'Project Overhead'
): void {
  if (!analysis.project_overhead) return;

  const overheadData = [
    ['Project Overhead Breakdown'],
    [''],
    ['Overhead Item', 'Cost', '% of Total']
  ];

  // Add all available overhead items
  const overheadFields = [
    { key: 'general_conditions', label: 'General Conditions' },
    { key: 'general_requirements', label: 'General Requirements' },
    { key: 'cm_fee', label: 'CM Fee' },
    { key: 'contractor_fee', label: 'Contractor Fee' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'bonds', label: 'Bonds' },
    { key: 'permits', label: 'Permits' },
    { key: 'project_management', label: 'Project Management' },
    { key: 'supervision', label: 'Supervision' },
    { key: 'temporary_facilities', label: 'Temporary Facilities' },
    // Design-specific fields
    { key: 'administration', label: 'Administration' },
    { key: 'travel_expenses', label: 'Travel & Expenses' },
    { key: 'subconsultants', label: 'Subconsultants' }
  ];

  overheadFields.forEach(field => {
    if (analysis.project_overhead) {
      const value = analysis.project_overhead[field.key as keyof ProjectOverhead];
      if (typeof value === 'number' && value != null) {
        overheadData.push([
          field.label,
          value.toString(),
          `${((value / analysis.total_amount) * 100).toFixed(2)}%`
        ]);
      }
    }
  });

  overheadData.push(['']);
  if (analysis.project_overhead && analysis.project_overhead.total_overhead != null) {
    overheadData.push([
      'TOTAL OVERHEAD',
      analysis.project_overhead.total_overhead.toString(),
      `${((analysis.project_overhead.total_overhead / analysis.total_amount) * 100).toFixed(2)}%`
    ]);
  }

  const overheadWs = XLSX.utils.aoa_to_sheet(overheadData);

  // Format currency columns
  formatCurrencyColumns(overheadWs, [1], 2); // Column B (Cost), starting from row 3

  overheadWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, overheadWs, sheetName);
}

export function generateExcelFilename(
  analysisType: string,
  contractorName: string
): string {
  const sanitizedName = contractorName.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  return `${analysisType}-analysis-${sanitizedName}-${timestamp}.xlsx`;
}

export function saveExcelFile(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename);
}