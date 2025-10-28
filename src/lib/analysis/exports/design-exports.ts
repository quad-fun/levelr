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

// Helper function to transform action descriptions into actionable checklists
function transformToChecklist(title: string, description: string, category: string): string[] {
  const steps: string[] = [];

  // Category-specific checklist transformations
  switch (category) {
    case 'schedule':
      if (title.includes('Design Phase Scope')) {
        steps.push('Review current phase definitions in contract');
        steps.push('Identify missing AIA phase requirements');
        steps.push('Request written clarification for each missing phase');
        steps.push('Confirm scope deliverables for each phase');
        steps.push('Establish timeline for missing phase work');
      } else if (title.includes('Testing') || title.includes('Schedule')) {
        steps.push('Request detailed project timeline with key milestones');
        steps.push('Confirm dependencies between design phases');
        steps.push('Identify critical path activities');
        steps.push('Establish review and approval timeframes');
      } else {
        steps.push(description);
      }
      break;

    case 'market':
      if (title.includes('Consultant Coordination')) {
        steps.push('Request list of all subconsultants and disciplines');
        steps.push('Confirm lead consultant roles and responsibilities');
        steps.push('Review coordination protocols and communication plan');
        steps.push('Verify professional liability coverage for all consultants');
        steps.push('Establish change order procedures for coordination issues');
      } else {
        steps.push('Research current market conditions and pricing trends');
        steps.push('Verify pricing validity period and escalation clauses');
        steps.push('Confirm availability of key personnel and resources');
        steps.push(description);
      }
      break;

    case 'scope':
      if (title.includes('Deliverable Requirements')) {
        steps.push('List all undefined or vague deliverables');
        steps.push('Request specific format and content requirements');
        steps.push('Confirm quantity and quality expectations');
        steps.push('Establish delivery schedule for each deliverable');
        steps.push('Define acceptance criteria and review process');
      } else if (title.includes('Equipment Specifications')) {
        steps.push('Request detailed equipment specifications and models');
        steps.push('Confirm performance requirements and standards');
        steps.push('Verify warranty terms and maintenance requirements');
        steps.push('Obtain installation and commissioning procedures');
      } else {
        steps.push('Review scope definition for completeness');
        steps.push('Identify potential scope gaps or overlaps');
        steps.push('Request clarification on undefined items');
        steps.push(description);
      }
      break;

    case 'contract':
      if (title.includes('Approval Process')) {
        steps.push('Define design review and approval workflow');
        steps.push('Establish reviewer roles and responsibilities');
        steps.push('Set approval timeframes for each phase');
        steps.push('Create revision and resubmittal procedures');
        steps.push('Confirm final approval authority');
      } else if (title.includes('Payment') || title.includes('Terms')) {
        steps.push('Review payment schedule and billing procedures');
        steps.push('Confirm invoice requirements and approval process');
        steps.push('Establish terms for change orders and extras');
        steps.push('Verify insurance and bonding requirements');
      } else {
        steps.push('Review contract terms and conditions');
        steps.push('Identify potential legal or financial risks');
        steps.push('Request clarification on ambiguous clauses');
        steps.push(description);
      }
      break;

    case 'value_engineering':
      if (title.includes('High-Fee Phase')) {
        steps.push('Analyze scope requirements for high-fee phases');
        steps.push('Compare fee allocation to industry standards');
        steps.push('Identify opportunities for scope optimization');
        steps.push('Request alternative delivery methods or approaches');
        steps.push('Evaluate cost-benefit of proposed alternatives');
      } else {
        steps.push('Identify high-cost items for potential optimization');
        steps.push('Research alternative approaches or technologies');
        steps.push('Evaluate cost-benefit of proposed changes');
        steps.push('Request value engineering proposals from design team');
        steps.push(description);
      }
      break;

    default:
      // Generic checklist for other categories
      steps.push('Review and understand the issue');
      steps.push('Gather relevant documentation');
      steps.push('Contact responsible party for clarification');
      steps.push('Document findings and recommendations');
      steps.push(description);
  }

  return steps.filter(step => step && step.length > 0);
}

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

  // AIA Phases Analysis Section (Fee Chart)
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

  // Enhanced Risk Analysis Section (moved up for better flow)
  if (analysis.riskSummary) {
    checkPageBreak(60);

    // Risk Summary Header with Visual Grade
    const designAssessment = analysis.riskSummary.assessments?.find(a => a.discipline === 'design');
    const overallLevel = designAssessment?.overallLevel || 'MEDIUM';
    const overallScore = designAssessment?.overallScore || 50;

    // Color-coded header based on risk level
    let headerBg, headerBorder, headerText;
    if (overallLevel === 'HIGH') {
      headerBg = [254, 226, 226]; // Red-100
      headerBorder = [239, 68, 68]; // Red-500
      headerText = [153, 27, 27]; // Red-800
    } else if (overallLevel === 'MEDIUM') {
      headerBg = [254, 243, 199]; // Yellow-100
      headerBorder = [245, 158, 11]; // Yellow-500
      headerText = [146, 64, 14]; // Yellow-800
    } else {
      headerBg = [220, 252, 231]; // Green-100
      headerBorder = [34, 197, 94]; // Green-500
      headerText = [20, 83, 45]; // Green-800
    }

    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.setDrawColor(headerBorder[0], headerBorder[1], headerBorder[2]);
    doc.rect(margin, getCurrentY() - 5, contentWidth, 25, 'FD');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(headerText[0], headerText[1], headerText[2]);
    doc.text('Design Risk Analysis & Recommendations', margin + 5, getCurrentY() + 6);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Overall Risk: ${overallLevel} (${overallScore}/100)`, margin + 5, getCurrentY() + 16);

    doc.setTextColor(0, 0, 0);
    updateYPosition(getCurrentY() + 35);

    // Risk Heat Map Summary Table
    if (designAssessment?.categoryBreakdown) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Heat Map by Category:', margin, getCurrentY());
      updateYPosition(getCurrentY() + 10);

      const heatMapData = Object.entries(designAssessment.categoryBreakdown).map(([category, breakdown]) => {
        let categoryLabel;
        switch (category) {
          case 'schedule': categoryLabel = 'Schedule & Delivery'; break;
          case 'scope': categoryLabel = 'Scope Definition'; break;
          case 'contract': categoryLabel = 'Contract Terms'; break;
          case 'market': categoryLabel = 'Market Conditions'; break;
          case 'value_engineering': categoryLabel = 'Value Engineering'; break;
          default: categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
        }

        const riskGrade = breakdown.level === 'HIGH' ? '[HIGH]' : breakdown.level === 'MEDIUM' ? '[MED]' : '[LOW]';
        return [
          categoryLabel,
          `${riskGrade} ${breakdown.level}`,
          `${breakdown.score}/100`,
          `${breakdown.risks?.length || 0} risks`
        ];
      });

      autoTable(doc, {
        head: [['Risk Category', 'Grade', 'Score', 'Risk Count']],
        body: heatMapData,
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
          0: { cellWidth: 50 },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.column.index === 1 && data.row.index > 0) {
            const grade = data.cell.text[0];
            if (grade.includes('HIGH')) {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [153, 27, 27];
            } else if (grade.includes('MEDIUM')) {
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.textColor = [146, 64, 14];
            } else if (grade.includes('LOW')) {
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.textColor = [20, 83, 45];
            }
          }
        }
      });

      updateYPosition((doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15);
    }

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

        // Risk severity indicator with improved icons
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        if (risk.severity === 'HIGH') {
          doc.setTextColor(153, 27, 27);
          doc.text('[HIGH]', margin + 5, getCurrentY());
        } else if (risk.severity === 'MEDIUM') {
          doc.setTextColor(146, 64, 14);
          doc.text('[MEDIUM]', margin + 5, getCurrentY());
        } else {
          doc.setTextColor(20, 83, 45);
          doc.text('[LOW]', margin + 5, getCurrentY());
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

        // Priority indicator with consistent visual grading
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        if (action.priority === 'HIGH') {
          doc.setTextColor(153, 27, 27);
          doc.text('HIGH PRIORITY', margin + 5, getCurrentY());
        } else if (action.priority === 'MEDIUM') {
          doc.setTextColor(146, 64, 14);
          doc.text('MEDIUM PRIORITY', margin + 5, getCurrentY());
        } else {
          doc.setTextColor(20, 83, 45);
          doc.text('LOW PRIORITY', margin + 5, getCurrentY());
        }

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(action.title, margin + 40, getCurrentY());
        updateYPosition(getCurrentY() + 6);

        // Action description with checklist format
        if (action.description) {
          doc.setFont('helvetica', 'normal');

          // Transform action description into actionable checklist
          const checklistSteps = transformToChecklist(action.title, action.description, action.category);

          checklistSteps.forEach((step, _index) => {
            checkPageBreak(5);
            doc.text(`[ ] ${step}`, margin + 40, getCurrentY());
            updateYPosition(getCurrentY() + 5);
          });
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

  // Project Details Section (moved down)
  yPosition = addProjectDetailsSection(doc, analysis, margin, getCurrentY(), checkPageBreak);
  updateYPosition(yPosition);

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

  // Exclusions and Assumptions (moved to end)
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

    // Add text wrapping for deliverables and scope notes columns
    const range = XLSX.utils.decode_range(aiaWs['!ref'] || 'A1');
    for (let row = 1; row <= range.e.r; row++) { // Start from row 1 (skip header)
      for (let col = 3; col <= 4; col++) { // Columns D (Deliverables) and E (Scope Notes)
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = aiaWs[cellAddr];
        if (cell) {
          cell.s = { ...(cell.s || {}), alignment: { wrapText: true, vertical: 'top' } };
        }
      }
    }

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

    // Add text wrapping for deliverable descriptions
    const deliverableRange = XLSX.utils.decode_range(deliverableWs['!ref'] || 'A1');
    for (let row = 1; row <= deliverableRange.e.r; row++) { // Start from row 1 (skip header)
      for (let col = 0; col <= 1; col++) { // Both columns could have long text
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = deliverableWs[cellAddr];
        if (cell) {
          cell.s = { ...(cell.s || {}), alignment: { wrapText: true, vertical: 'top' } };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, deliverableWs, 'Deliverables');
  }

  // Project Overhead Sheet
  addProjectOverheadSheet(wb, analysis, 'Project Overhead');

  // Enhanced Risk Analysis Sheet
  if (analysis.riskSummary) {
    const riskData = [
      ['ENHANCED DESIGN RISK ANALYSIS & RECOMMENDATIONS'],
      [`Generated using Levelr Risk Assessment Framework v${analysis.riskSummary.version}`],
      [`Analysis Date: ${new Date(analysis.riskSummary.generatedAt).toLocaleDateString()}`],
      [''],
      ['OVERALL RISK ASSESSMENT']
    ];

    // Get design-specific assessment
    const designAssessment = analysis.riskSummary.assessments?.find(a => a.discipline === 'design');
    if (designAssessment) {
      riskData.push(['Risk Level', designAssessment.overallLevel]);
      riskData.push(['Risk Score', `${designAssessment.overallScore}/100`]);
    }

    riskData.push(['']);
    riskData.push(['PRIORITY RISK ITEMS']);
    riskData.push(['Severity', 'Title', 'Category', 'Description', 'Impact', 'Discipline']);

    // Add priority risks (focus on design-related risks)
    if (analysis.riskSummary.topRisks) {
      analysis.riskSummary.topRisks
        .filter(risk => risk.discipline === 'design')
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

    // Add follow-up actions (design-specific)
    const designFollowUps = analysis.riskSummary.assessments
      ?.find(a => a.discipline === 'design')
      ?.followUpActions || [];

    if (designFollowUps.length > 0) {
      riskData.push(['']);
      riskData.push(['RECOMMENDED FOLLOW-UP ACTIONS']);
      riskData.push(['Priority', 'Action', 'Category', 'Description']);

      designFollowUps
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

    // Add AIA phase risk breakdown if available
    if (designAssessment?.categoryBreakdown) {
      riskData.push(['']);
      riskData.push(['AIA PHASE RISK BREAKDOWN']);
      riskData.push(['Phase Category', 'Risk Level', 'Score (/100)', 'Risk Count']);

      Object.entries(designAssessment.categoryBreakdown).forEach(([category, breakdown]) => {
        // Map internal categories to AIA phase categories
        let phaseCategory = category;
        if (category === 'schedule') phaseCategory = 'Schedule & Delivery';
        else if (category === 'scope') phaseCategory = 'Scope Definition';
        else if (category === 'contract') phaseCategory = 'Contract Terms';
        else if (category === 'market') phaseCategory = 'Market Conditions';

        riskData.push([
          phaseCategory,
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

    // Color code severity/priority columns for design-specific risks
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

    XLSX.utils.book_append_sheet(wb, riskWs, 'Design Risk Analysis');
  }

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
              scope: phaseName, // Use clean phase name only
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

        // Wrap text for explanation columns and other text-heavy columns
        if (col === 0 || col === 1 || col === 2 || col === 3) {
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