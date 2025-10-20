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

  // Enhanced Risk Analysis Section
  if (analysis.riskSummary) {
    checkPageBreak(40);

    // Risk Summary Header
    doc.setFillColor(254, 226, 226); // Red-100
    doc.setDrawColor(239, 68, 68); // Red-500
    doc.rect(margin, getCurrentY() - 5, contentWidth, 20, 'FD');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27); // Red-800
    doc.text('Enhanced Risk Analysis & Recommendations', margin + 5, getCurrentY() + 8);

    doc.setTextColor(0, 0, 0);
    updateYPosition(getCurrentY() + 25);

    // Overall Risk Level
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Risk Assessment:', margin, getCurrentY());
    updateYPosition(getCurrentY() + 8);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Get trade-specific assessment
    const tradeAssessment = analysis.riskSummary.assessments?.find(a => a.discipline === 'trade');
    const overallLevel = tradeAssessment?.overallLevel || 'MEDIUM';
    const overallScore = tradeAssessment?.overallScore || 50;

    // Color code the risk level
    if (overallLevel === 'HIGH') {
      doc.setTextColor(153, 27, 27); // Red-800
    } else if (overallLevel === 'MEDIUM') {
      doc.setTextColor(146, 64, 14); // Yellow-800
    } else {
      doc.setTextColor(20, 83, 45); // Green-800
    }

    doc.text(`Risk Level: ${overallLevel} (Score: ${overallScore}/100)`, margin + 5, getCurrentY());
    doc.setTextColor(0, 0, 0);
    updateYPosition(getCurrentY() + 12);

    // Top Priority Risks
    if (analysis.riskSummary.topRisks && analysis.riskSummary.topRisks.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Priority Risk Items:', margin, getCurrentY());
      updateYPosition(getCurrentY() + 10);

      const topRisks = analysis.riskSummary.topRisks.slice(0, 5); // Show top 5

      topRisks.forEach((risk) => {
        checkPageBreak(15);

        // Risk severity indicator
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        if (risk.severity === 'HIGH') {
          doc.setTextColor(153, 27, 27);
          doc.text('[HIGH]', margin + 5, getCurrentY());
        } else if (risk.severity === 'MEDIUM') {
          doc.setTextColor(146, 64, 14);
          doc.text('⚠️ MEDIUM', margin + 5, getCurrentY());
        } else {
          doc.setTextColor(20, 83, 45);
          doc.text('✓ LOW', margin + 5, getCurrentY());
        }

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(risk.title, margin + 35, getCurrentY());
        updateYPosition(getCurrentY() + 6);

        // Risk description
        doc.setFont('helvetica', 'normal');
        const description = doc.splitTextToSize(risk.description, contentWidth - 40);
        if (Array.isArray(description)) {
          description.forEach((line: string) => {
            checkPageBreak(5);
            doc.text(line, margin + 35, getCurrentY());
            updateYPosition(getCurrentY() + 5);
          });
        } else {
          doc.text(description, margin + 35, getCurrentY());
          updateYPosition(getCurrentY() + 5);
        }

        if (risk.impact) {
          doc.setFont('helvetica', 'italic');
          doc.text(`Impact: ${risk.impact}`, margin + 35, getCurrentY());
          updateYPosition(getCurrentY() + 8);
        } else {
          updateYPosition(getCurrentY() + 3);
        }
      });
    }

    // Follow-up Actions
    const allFollowUps = analysis.riskSummary.assessments?.flatMap(assessment =>
      assessment.followUpActions || []
    ) || [];

    if (allFollowUps.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommended Follow-up Actions:', margin, getCurrentY());
      updateYPosition(getCurrentY() + 10);

      const priorityActions = allFollowUps
        .sort((a, b) => {
          const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        })
        .slice(0, 8); // Show top 8 actions

      priorityActions.forEach((action) => {
        checkPageBreak(12);

        // Priority indicator
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        if (action.priority === 'HIGH') {
          doc.setTextColor(153, 27, 27);
          doc.text('[HIGH]', margin + 5, getCurrentY());
        } else if (action.priority === 'MEDIUM') {
          doc.setTextColor(146, 64, 14);
          doc.text('[MEDIUM]', margin + 5, getCurrentY());
        } else {
          doc.setTextColor(20, 83, 45);
          doc.text('[LOW]', margin + 5, getCurrentY());
        }

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(action.title, margin + 40, getCurrentY());
        updateYPosition(getCurrentY() + 6);

        // Action description
        if (action.description) {
          doc.setFont('helvetica', 'normal');
          const description = doc.splitTextToSize(action.description, contentWidth - 45);
          if (Array.isArray(description)) {
            description.forEach((line: string) => {
              checkPageBreak(5);
              doc.text(line, margin + 40, getCurrentY());
              updateYPosition(getCurrentY() + 5);
            });
          } else {
            doc.text(description, margin + 40, getCurrentY());
            updateYPosition(getCurrentY() + 5);
          }
        }
        updateYPosition(getCurrentY() + 3);
      });

      if (allFollowUps.length > 8) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text(`+ ${allFollowUps.length - 8} additional recommendations available in detailed analysis`, margin + 5, getCurrentY());
        updateYPosition(getCurrentY() + 10);
      }
    }

    // Risk Analysis Footer
    checkPageBreak(15);
    doc.setFillColor(239, 246, 255); // Blue-50
    doc.setDrawColor(191, 219, 254); // Blue-200
    doc.rect(margin, getCurrentY() - 5, contentWidth, 12, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Risk analysis generated using Levelr's proprietary multi-discipline assessment framework v${analysis.riskSummary.version}`, margin + 5, getCurrentY() + 3);
    updateYPosition(getCurrentY() + 20);
  }

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
        (systemData.total_cost || 0).toString(),
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
        (spec.unit_cost || 0).toString(),
        (spec.total_cost || 0).toString()
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

  // Enhanced Risk Analysis Sheet
  if (analysis.riskSummary) {
    const riskData = [
      ['ENHANCED TRADE RISK ANALYSIS & RECOMMENDATIONS'],
      [`Generated using Levelr Risk Assessment Framework v${analysis.riskSummary.version}`],
      [`Analysis Date: ${new Date(analysis.riskSummary.generatedAt).toLocaleDateString()}`],
      [''],
      ['OVERALL RISK ASSESSMENT']
    ];

    // Get trade-specific assessment
    const tradeAssessment = analysis.riskSummary.assessments?.find(a => a.discipline === 'trade');
    if (tradeAssessment) {
      riskData.push(['Risk Level', tradeAssessment.overallLevel]);
      riskData.push(['Risk Score', `${tradeAssessment.overallScore}/100`]);
    }

    riskData.push(['']);
    riskData.push(['PRIORITY RISK ITEMS']);
    riskData.push(['Severity', 'Title', 'Category', 'Description', 'Impact', 'Discipline']);

    // Add priority risks (focus on trade-related risks)
    if (analysis.riskSummary.topRisks) {
      analysis.riskSummary.topRisks
        .filter(risk => risk.discipline === 'trade')
        .slice(0, 10)
        .forEach(risk => {
          riskData.push([
            risk.severity,
            risk.title,
            risk.category,
            risk.description,
            risk.impact || 'See description',
            risk.discipline
          ]);
        });
    }

    // Add follow-up actions (trade-specific)
    const tradeFollowUps = analysis.riskSummary.assessments
      ?.find(a => a.discipline === 'trade')
      ?.followUpActions || [];

    if (tradeFollowUps.length > 0) {
      riskData.push(['']);
      riskData.push(['RECOMMENDED FOLLOW-UP ACTIONS']);
      riskData.push(['Priority', 'Action', 'Category', 'Description']);

      tradeFollowUps
        .sort((a, b) => {
          const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        })
        .slice(0, 15)
        .forEach(action => {
          riskData.push([
            action.priority,
            action.title,
            action.category,
            action.description
          ]);
        });
    }

    // Add technical system risk breakdown if available
    if (tradeAssessment?.categoryBreakdown) {
      riskData.push(['']);
      riskData.push(['TECHNICAL SYSTEM RISK BREAKDOWN']);
      riskData.push(['System Category', 'Risk Level', 'Score (/100)', 'Risk Count']);

      Object.entries(tradeAssessment.categoryBreakdown).forEach(([category, breakdown]) => {
        // Map internal categories to technical system categories
        let systemCategory = category;
        if (category === 'schedule') systemCategory = 'Installation Schedule';
        else if (category === 'scope') systemCategory = 'Technical Scope';
        else if (category === 'contract') systemCategory = 'Contract Terms';
        else if (category === 'market') systemCategory = 'Equipment Market';

        riskData.push([
          systemCategory,
          breakdown.level,
          breakdown.score.toString(),
          (breakdown.risks?.length || 0).toString()
        ]);
      });
    }

    const riskWs = XLSX.utils.aoa_to_sheet(riskData);

    // Style the risk analysis sheet
    riskWs['!cols'] = [
      { wch: 15 }, // Priority/Severity
      { wch: 40 }, // Title/Action
      { wch: 25 }, // Category
      { wch: 55 }, // Description
      { wch: 30 }, // Impact
      { wch: 15 }  // Discipline
    ];

    // Color code severity/priority columns for trade-specific risks
    const riskRange = XLSX.utils.decode_range(riskWs['!ref'] || 'A1');

    for (let row = 6; row <= riskRange.e.r; row++) {
      const severityCell = `A${row + 1}`;
      if (riskWs[severityCell]) {
        const value = riskWs[severityCell].v;
        if (value === 'HIGH') {
          riskWs[severityCell].s = {
            fill: { fgColor: { rgb: 'FFEBEE' } },
            font: { color: { rgb: '991B1B' }, bold: true }
          };
        } else if (value === 'MEDIUM') {
          riskWs[severityCell].s = {
            fill: { fgColor: { rgb: 'FFF8E1' } },
            font: { color: { rgb: '92400E' }, bold: true }
          };
        } else if (value === 'LOW') {
          riskWs[severityCell].s = {
            fill: { fgColor: { rgb: 'F0FDF4' } },
            font: { color: { rgb: '14532D' }, bold: true }
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, riskWs, 'Trade Risk Analysis');
  }

  // Save the Excel file
  const fileName = generateExcelFilename('trade', analysis.contractor_name);
  saveExcelFile(wb, fileName);
}

// Enhanced function to add variance explanations sheet for trade bid leveling
async function addTradeVarianceExplanationSheet(wb: XLSX.WorkBook, bids: SavedAnalysis[]) {
  if (bids.length < 2) return; // Need at least 2 bids for variance analysis

  const explanations: Array<{
    scope: string;
    bidsCompared: string;
    shortExplanation: string;
    detailedAnalysis: string;
    generatedAt: string;
    confidence: string;
  }> = [];

  // Get all technical systems across all bids
  const allSystems = new Set<string>();
  bids.forEach(bid => {
    if (bid.result.technical_systems) {
      Object.keys(bid.result.technical_systems).forEach(system => allSystems.add(system));
    }
  });

  // Check for cached explanations for each technical system across all bid combinations
  for (const systemKey of allSystems) {
    // Get system name from first bid that has this system
    let systemName = systemKey;
    for (const bid of bids) {
      if (bid.result.technical_systems?.[systemKey]) {
        systemName = bid.result.technical_systems[systemKey].system_name;
        break;
      }
    }

    // Generate all possible bid pair combinations
    for (let i = 0; i < bids.length - 1; i++) {
      for (let j = i + 1; j < bids.length; j++) {
        const bid1 = bids[i];
        const bid2 = bids[j];

        // Check if both bids have this system
        const system1 = bid1.result.technical_systems?.[systemKey];
        const system2 = bid2.result.technical_systems?.[systemKey];

        if (!system1 || !system2 || (system1.total_cost === 0 && system2.total_cost === 0)) {
          continue; // Skip if either bid doesn't have this system or both are zero
        }

        // Create row data for this system comparison
        const rows = [{
          division: systemKey,
          scopePath: systemName,
          item: systemName,
          bids: {
            [bid1.result.contractor_name]: system1.total_cost,
            [bid2.result.contractor_name]: system2.total_cost
          },
          varianceAbs: Math.abs(system1.total_cost - system2.total_cost),
          variancePct: system1.total_cost > 0 ? Math.abs((system1.total_cost - system2.total_cost) / system1.total_cost) * 100 : 0
        }];

        const selectedBids = [bid1.result.contractor_name, bid2.result.contractor_name];

        try {
          // Check for cached explanation
          const cached = await getCachedVarianceExplanation(rows, selectedBids);

          if (cached) {
            // Calculate confidence based on variance magnitude and explanation length
            let confidence = 'High';
            const variancePct = rows[0].variancePct;
            if (variancePct < 10) confidence = 'Medium'; // Trade systems typically have wider acceptable variance
            if (variancePct < 5) confidence = 'Low';
            if (cached.short.includes('Unable to') || cached.model === 'fallback') confidence = 'Low';

            explanations.push({
              scope: systemName, // Use clean system name only
              bidsCompared: selectedBids.join(' vs '),
              shortExplanation: cached.short,
              detailedAnalysis: cached.long || cached.short,
              generatedAt: cached.at,
              confidence: confidence
            });
          }
        } catch (error) {
          console.warn(`Failed to get cached explanation for system ${systemKey}:`, error);
          // Continue processing other systems
        }
      }
    }
  }

  // Only create the sheet if we have explanations
  if (explanations.length === 0) {
    console.log('No variance explanations found in cache for technical systems - skipping Variance Explanations sheet');
    return;
  }

  // Create the variance explanations sheet
  const sheetData = [
    ['TRADE VARIANCE EXPLANATIONS'],
    ['Generated explanations for cost differences across technical systems'],
    [''],
    ['Technical System', 'Bids Compared', 'Short Explanation', 'Detailed Analysis', 'Generated At', 'Confidence Level']
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
    { wch: 25 }, // Technical System
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

        // Wrap text for explanation columns and other text-heavy columns
        if (col === 0 || col === 1 || col === 2 || col === 3) {
          cell.s = { ...(cell.s || {}), alignment: { wrapText: true, vertical: 'top' } };
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Variance Explanations');
  console.log(`Added Trade Variance Explanations sheet with ${explanations.length} explanations`);
}

// Export the function for use in index.ts
export { addTradeVarianceExplanationSheet };