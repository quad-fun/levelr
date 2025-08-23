import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable properties
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}
import * as XLSX from 'xlsx';
import { AnalysisResult } from '@/types/analysis';
import { SavedAnalysis } from '@/lib/storage';
import { analyzeMarketVariance } from './market-analyzer';
import { calculateProjectRisk } from './risk-analyzer';
import { CSI_DIVISIONS } from './csi-analyzer';

export function exportAnalysisToPDF(analysis: AnalysisResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header with branding
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ProLeveler Analysis Report', margin, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, 35);

  yPosition = 55;
  doc.setTextColor(0, 0, 0);

  // Executive Summary Box
  checkPageBreak(40);
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.setDrawColor(191, 219, 254); // Blue-200
  doc.rect(margin, yPosition - 5, contentWidth, 35, 'FD');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin + 5, yPosition + 5);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contractor: ${analysis.contractor_name}`, margin + 5, yPosition + 15);
  doc.text(`Total Amount: $${analysis.total_amount.toLocaleString()}`, margin + 5, yPosition + 25);
  
  yPosition += 45;

  // Project Details Section
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Details', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  if (analysis.project_name) {
    doc.text(`Project Name: ${analysis.project_name}`, margin + 5, yPosition);
    yPosition += 8;
  }
  
  if (analysis.bid_date) {
    doc.text(`Bid Date: ${new Date(analysis.bid_date).toLocaleDateString()}`, margin + 5, yPosition);
    yPosition += 8;
  }
  
  if (analysis.timeline) {
    doc.text(`Timeline: ${analysis.timeline}`, margin + 5, yPosition);
    yPosition += 8;
  }

  // Document Quality Assessment
  if (analysis.document_quality) {
    const qualityMap: Record<string, string> = {
      'professional_typed': 'Professional Typed Document',
      'scanned': 'Scanned Document',
      'handwritten': 'Handwritten Document'
    };
    doc.text(`Document Quality: ${qualityMap[analysis.document_quality] || analysis.document_quality}`, margin + 5, yPosition);
    yPosition += 8;
  }

  yPosition += 10;

  // Risk Assessment Section
  const risk = calculateProjectRisk(
    Object.fromEntries(Object.entries(analysis.csi_divisions).map(([code, data]) => [code, data.cost])),
    analysis.total_amount,
    analysis.uncategorizedTotal || 0,
    analysis
  );

  checkPageBreak(50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment', margin, yPosition);
  yPosition += 10;

  // Risk level with color coding
  const riskColors = {
    'LOW': [34, 197, 94],     // Green-500
    'MEDIUM': [234, 179, 8],  // Yellow-500  
    'HIGH': [239, 68, 68]     // Red-500
  };
  
  const [r, g, b] = riskColors[risk.level as keyof typeof riskColors] || [107, 114, 128];
  doc.setFillColor(r, g, b);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin + 5, yPosition - 5, 60, 12, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${risk.level} RISK`, margin + 8, yPosition + 3);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Score: ${risk.score}/100`, margin + 75, yPosition + 3);
  
  yPosition += 20;

  // Risk factors
  if (risk.factors.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Factors:', margin + 5, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    risk.factors.forEach((factor) => {
      checkPageBreak(15);
      // Bullet point
      doc.circle(margin + 10, yPosition - 2, 1, 'F');
      // Wrapped text for long risk factors
      const lines = doc.splitTextToSize(factor, contentWidth - 25);
      if (Array.isArray(lines)) {
        lines.forEach((line: string, index: number) => {
          if (index > 0) checkPageBreak();
          doc.text(line, margin + 15, yPosition);
          yPosition += 6;
        });
      } else {
        doc.text(lines, margin + 15, yPosition);
        yPosition += 6;
      }
    });
  }

  yPosition += 10;

  // CSI Division Analysis Section
  checkPageBreak(30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CSI Division Analysis', margin, yPosition);
  yPosition += 15;

  // Create table data for CSI divisions
  const tableData: (string | number)[][] = [];
  const totalMappedCost = Object.values(analysis.csi_divisions).reduce((sum, div) => sum + div.cost, 0);
  
  Object.entries(analysis.csi_divisions).forEach(([code, data]) => {
    const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
    const variance = analyzeMarketVariance(data.cost, analysis.total_amount, code);
    const percentage = ((data.cost / analysis.total_amount) * 100).toFixed(1);
    
    tableData.push([
      `${code} - ${division?.name || 'Unknown'}`,
      `$${data.cost.toLocaleString()}`,
      `${percentage}%`,
      variance.status.replace('_', ' '),
      data.items.join(', ').substring(0, 50) + (data.items.join(', ').length > 50 ? '...' : '')
    ]);
  });

  autoTable(doc, {
    head: [['Division', 'Cost', '% of Total', 'Market Status', 'Items']],
    body: tableData,
    startY: yPosition,
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
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 50 }
    },
    didDrawCell: function(data: { column: { index: number }, section: string, cell: { text: string[], x: number, y: number, width: number, height: number } }) {
      // Color code market status cells
      if (data.column.index === 3 && data.section === 'body') {
        const status = data.cell.text[0];
        if (status === 'ABOVE MARKET') {
          doc.setFillColor(254, 226, 226); // Red-100
        } else if (status === 'BELOW MARKET') {
          doc.setFillColor(254, 249, 195); // Yellow-100
        } else if (status === 'MARKET RATE') {
          doc.setFillColor(220, 252, 231); // Green-100
        }
        if (status !== 'MARKET RATE') {
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        }
      }
    }
  });

  yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;

  // Coverage Summary
  checkPageBreak(25);
  const coveragePercentage = ((totalMappedCost / analysis.total_amount) * 100).toFixed(1);
  const uncategorizedPercentage = (((analysis.uncategorizedTotal || 0) / analysis.total_amount) * 100).toFixed(1);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Coverage Summary:', margin, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`CSI Division Coverage: ${coveragePercentage}% ($${totalMappedCost.toLocaleString()})`, margin + 5, yPosition);
  yPosition += 6;
  doc.text(`Uncategorized Costs: ${uncategorizedPercentage}% ($${(analysis.uncategorizedTotal || 0).toLocaleString()})`, margin + 5, yPosition);
  yPosition += 15;

  // Uncategorized Costs Section
  if (analysis.uncategorizedCosts && analysis.uncategorizedCosts.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Uncategorized Costs', margin, yPosition);
    yPosition += 10;

    // Warning box for high uncategorized percentage
    if (parseFloat(uncategorizedPercentage) > 15) {
      doc.setFillColor(254, 243, 199); // Yellow-100
      doc.setDrawColor(245, 158, 11); // Yellow-500
      doc.rect(margin, yPosition - 5, contentWidth, 15, 'FD');
      doc.setFontSize(10);
      doc.text('⚠️ High uncategorized costs may indicate missing CSI classifications or scope gaps', margin + 5, yPosition + 5);
      yPosition += 20;
    }

    // Create table for uncategorized costs
    const uncategorizedTableData = analysis.uncategorizedCosts.map(item => [
      item.description,
      `$${item.cost.toLocaleString()}`,
      `${((item.cost / analysis.total_amount) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [['Description', 'Cost', '% of Total']],
      body: uncategorizedTableData,
      startY: yPosition,
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [251, 146, 60],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 30, halign: 'center' }
      }
    });

    yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
  }

  // Project Overhead Section
  if (analysis.project_overhead) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Overhead Breakdown', margin, yPosition);
    yPosition += 10;

    const overheadData: (string | number)[][] = [];
    if (analysis.project_overhead.general_conditions) {
      overheadData.push(['General Conditions', `$${analysis.project_overhead.general_conditions.toLocaleString()}`]);
    }
    if (analysis.project_overhead.cm_fee) {
      overheadData.push(['CM Fee', `$${analysis.project_overhead.cm_fee.toLocaleString()}`]);
    }
    if (analysis.project_overhead.insurance) {
      overheadData.push(['Insurance', `$${analysis.project_overhead.insurance.toLocaleString()}`]);
    }
    if (analysis.project_overhead.bonds) {
      overheadData.push(['Bonds', `$${analysis.project_overhead.bonds.toLocaleString()}`]);
    }
    if (analysis.project_overhead.permits) {
      overheadData.push(['Permits', `$${analysis.project_overhead.permits.toLocaleString()}`]);
    }
    if (analysis.project_overhead.supervision) {
      overheadData.push(['Supervision', `$${analysis.project_overhead.supervision.toLocaleString()}`]);
    }
    overheadData.push(['TOTAL OVERHEAD', `$${analysis.project_overhead.total_overhead.toLocaleString()}`]);

    autoTable(doc, {
      head: [['Overhead Item', 'Cost']],
      body: overheadData,
      startY: yPosition,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'right' }
      },
      didDrawCell: function(data: { row: { index: number }, section: string }) {
        if (data.section === 'body' && data.row.index === overheadData.length - 1) {
          doc.setFillColor(59, 130, 246);
          doc.setTextColor(255, 255, 255);
        }
      }
    });

    yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
  }

  // Allowances & Contingencies Section
  if (analysis.allowances && analysis.allowances.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Allowances & Contingencies', margin, yPosition);
    yPosition += 10;

    const allowanceData = analysis.allowances.map(allowance => [
      allowance.description,
      allowance.type.replace('_', ' ').toUpperCase(),
      `$${allowance.amount.toLocaleString()}`,
      allowance.percentage_of_total ? `${allowance.percentage_of_total.toFixed(1)}%` : '',
      allowance.scope_description || ''
    ]);

    autoTable(doc, {
      head: [['Description', 'Type', 'Amount', '% of Total', 'Scope']],
      body: allowanceData,
      startY: yPosition,
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 45 }
      }
    });

    yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;

    // Add allowance risk warning
    const totalAllowancePercentage = ((analysis.allowances_total || 0) / analysis.total_amount) * 100;
    if (totalAllowancePercentage > 20) {
      doc.setFillColor(254, 226, 226); // Red-100
      doc.setDrawColor(220, 38, 38); // Red-600
      doc.rect(margin, yPosition - 5, contentWidth, 15, 'FD');
      doc.setFontSize(10);
      doc.text(`⚠️ High allowances (${totalAllowancePercentage.toFixed(1)}%) may indicate scope uncertainty`, margin + 5, yPosition + 5);
      yPosition += 20;
    }
  }

  // Subcontractors Section
  if (analysis.subcontractors && analysis.subcontractors.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Subcontractor Assignments', margin, yPosition);
    yPosition += 10;

    const subcontractorData = analysis.subcontractors.map(sub => [
      sub.name,
      sub.trade,
      sub.divisions.map(d => `Div ${d}`).join(', '),
      `$${sub.total_amount.toLocaleString()}`,
      `${((sub.total_amount / analysis.total_amount) * 100).toFixed(1)}%`,
      sub.scope_description || ''
    ]);

    autoTable(doc, {
      head: [['Subcontractor', 'Trade', 'Divisions', 'Amount', '% of Total', 'Scope']],
      body: subcontractorData,
      startY: yPosition,
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 45 }
      }
    });

    yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
  }

  // Detailed Line Items Section (for divisions with sub_items)
  const divisionsWithSubItems = Object.entries(analysis.csi_divisions).filter(([_, data]) => 
    data.sub_items && data.sub_items.length > 0
  );

  if (divisionsWithSubItems.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Line Item Breakdown', margin, yPosition);
    yPosition += 15;

    divisionsWithSubItems.forEach(([code, data]) => {
      const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
      
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Division ${code} - ${division?.name} (${data.subcontractor || 'TBD'})`, margin, yPosition);
      yPosition += 8;

      const lineItemData = data.sub_items!.map(item => [
        item.description,
        item.quantity ? item.quantity.toLocaleString() : '',
        item.unit || '',
        item.unit_cost ? `$${item.unit_cost.toFixed(2)}` : '',
        `$${item.cost.toLocaleString()}`,
        item.subcontractor || '',
        item.notes || ''
      ]);

      autoTable(doc, {
        head: [['Description', 'Qty', 'Unit', 'Unit Cost', 'Total Cost', 'Sub', 'Notes']],
        body: lineItemData,
        startY: yPosition,
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 15, halign: 'right' },
          2: { cellWidth: 10, halign: 'center' },
          3: { cellWidth: 20, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25 },
          6: { cellWidth: 35 }
        }
      });

      yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
    });
  }

  // Market Variance Details Section
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Variance Analysis', margin, yPosition);
  yPosition += 15;

  Object.entries(analysis.csi_divisions).forEach(([code, data]) => {
    checkPageBreak(25);
    const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
    const variance = analyzeMarketVariance(data.cost, analysis.total_amount, code);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Division ${code} - ${division?.name}`, margin + 5, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Status: ${variance.message}`, margin + 10, yPosition);
    yPosition += 5;
    
    if (variance.recommendation) {
      const recommendationLines = doc.splitTextToSize(`Recommendation: ${variance.recommendation}`, contentWidth - 15);
      if (Array.isArray(recommendationLines)) {
        recommendationLines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin + 10, yPosition);
          yPosition += 5;
        });
      }
    }
    yPosition += 5;
  });

  // Additional Information Section
  if (analysis.exclusions?.length || analysis.assumptions?.length) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Information', margin, yPosition);
    yPosition += 15;

    if (analysis.exclusions?.length) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Exclusions:', margin + 5, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      analysis.exclusions.forEach((exclusion) => {
        checkPageBreak(8);
        doc.circle(margin + 12, yPosition - 2, 1, 'F');
        const lines = doc.splitTextToSize(exclusion, contentWidth - 25);
        if (Array.isArray(lines)) {
          lines.forEach((line: string, index: number) => {
            if (index > 0) checkPageBreak();
            doc.text(line, margin + 17, yPosition);
            yPosition += 5;
          });
        } else {
          doc.text(lines, margin + 17, yPosition);
          yPosition += 5;
        }
      });
      yPosition += 5;
    }

    if (analysis.assumptions?.length) {
      checkPageBreak(15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Assumptions:', margin + 5, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      analysis.assumptions.forEach((assumption) => {
        checkPageBreak(8);
        doc.circle(margin + 12, yPosition - 2, 1, 'F');
        const lines = doc.splitTextToSize(assumption, contentWidth - 25);
        if (Array.isArray(lines)) {
          lines.forEach((line: string, index: number) => {
            if (index > 0) checkPageBreak();
            doc.text(line, margin + 17, yPosition);
            yPosition += 5;
          });
        } else {
          doc.text(lines, margin + 17, yPosition);
          yPosition += 5;
        }
      });
    }
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('ProLeveler Analysis Report - Confidential', margin, pageHeight - 15);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - 15);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, pageHeight - 8);
    
    // Branding
    doc.text('Powered by ProLeveler Platform | MasterFormat 2018 Compliant', pageWidth - margin - 120, pageHeight - 8);
  }

  // Generate filename and save
  const sanitizedContractorName = analysis.contractor_name.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `ProLeveler_Analysis_${sanitizedContractorName}_${timestamp}.pdf`;
  
  doc.save(fileName);
}

export function exportAnalysisToExcel(analysis: AnalysisResult): void {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Project Overview Sheet
  const overviewData = [
    ['Project Overview'],
    ['Contractor', analysis.contractor_name],
    ['Total Amount', analysis.total_amount],
    ['Project Name', analysis.project_name || ''],
    ['Bid Date', analysis.bid_date || ''],
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
  
  // CSI Analysis Sheet
  const csiData = [
    ['CSI Code', 'Division Name', 'Cost', 'Percentage', 'Items', 'Unit Cost', 'Quantity', 'Unit', 'Market Status', 'Variance', 'Recommendation']
  ];
  
  Object.entries(analysis.csi_divisions).forEach(([code, data]) => {
    const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
    const variance = analyzeMarketVariance(data.cost, analysis.total_amount, code);
    const percentage = ((data.cost / analysis.total_amount) * 100).toFixed(1);
    
    csiData.push([
      code,
      division?.name || 'Unknown',
      data.cost.toString(),
      `${percentage}%`,
      data.items.join(', '),
      data.unit_cost?.toString() || '',
      data.quantity?.toString() || '',
      data.unit || '',
      variance.status,
      variance.message,
      variance.recommendation
    ]);
  });
  
  // Add uncategorized costs section to CSI data
  if (analysis.uncategorizedCosts && analysis.uncategorizedCosts.length > 0) {
    csiData.push(['']); // Empty row separator
    csiData.push(['UNCATEGORIZED COSTS', '', '', '', '', '', '', '', '', '', '']);
    csiData.push(['Description', 'Cost', '% of Total', 'Reason', '', '', '', '', '', '', '']);
    
    analysis.uncategorizedCosts.forEach(item => {
      const percentage = ((item.cost / analysis.total_amount) * 100).toFixed(1);
      csiData.push([
        item.description,
        item.cost.toString(),
        `${percentage}%`,
        'Not matched to CSI divisions',
        '', '', '', '', '', '', ''
      ]);
    });
    
    // Add total uncategorized row
    const totalPercentage = (((analysis.uncategorizedTotal || 0) / analysis.total_amount) * 100).toFixed(1);
    csiData.push([
      'TOTAL UNCATEGORIZED',
      (analysis.uncategorizedTotal || 0).toString(),
      `${totalPercentage}%`,
      `${analysis.uncategorizedCosts.length} items not classified`,
      '', '', '', '', '', '', ''
    ]);
  }
  
  const csiWs = XLSX.utils.aoa_to_sheet(csiData);
  
  // Calculate optimal column widths based on content
  const maxLengths: number[] = [];
  csiData.forEach(row => {
    row.forEach((cell, colIndex) => {
      const cellLength = String(cell).length;
      maxLengths[colIndex] = Math.max(maxLengths[colIndex] || 0, cellLength);
    });
  });
  
  // Set auto-fit column widths with minimum and maximum constraints
  csiWs['!cols'] = maxLengths.map((length) => ({
    wch: Math.min(Math.max(length + 2, 10), 50) // Min 10, Max 50 characters
  }));
  
  // Format currency columns
  const csiRange = XLSX.utils.decode_range(csiWs['!ref'] || 'A1');
  for (let row = 1; row <= csiRange.e.r; row++) {
    const costCell = `C${row + 1}`;
    
    if (csiWs[costCell] && !isNaN(Number(csiWs[costCell].v))) {
      csiWs[costCell].t = 'n';
      csiWs[costCell].z = '$#,##0';
    }
  }
  
  XLSX.utils.book_append_sheet(wb, csiWs, 'CSI Analysis');
  
  // Risk Assessment Sheet
  const risk = calculateProjectRisk(
    Object.fromEntries(Object.entries(analysis.csi_divisions).map(([code, data]) => [code, data.cost])),
    analysis.total_amount,
    analysis.uncategorizedTotal || 0,
    analysis
  );
  
  const riskData = [
    ['Risk Assessment'],
    ['Overall Risk Level', risk.level],
    ['Risk Score', `${risk.score}/100`],
    [''],
    ['Risk Factors'],
    ...risk.factors.map(factor => [factor])
  ];
  
  const riskWs = XLSX.utils.aoa_to_sheet(riskData);
  XLSX.utils.book_append_sheet(wb, riskWs, 'Risk Assessment');

  // Project Overhead Sheet
  if (analysis.project_overhead) {
    const overheadData = [
      ['Project Overhead Breakdown'],
      [''],
      ['Overhead Item', 'Cost', '% of Total']
    ];

    if (analysis.project_overhead.general_conditions) {
      overheadData.push(['General Conditions', analysis.project_overhead.general_conditions.toString(), 
        `${((analysis.project_overhead.general_conditions / analysis.total_amount) * 100).toFixed(2)}%`]);
    }
    if (analysis.project_overhead.cm_fee) {
      overheadData.push(['CM Fee', analysis.project_overhead.cm_fee.toString(),
        `${((analysis.project_overhead.cm_fee / analysis.total_amount) * 100).toFixed(2)}%`]);
    }
    if (analysis.project_overhead.insurance) {
      overheadData.push(['Insurance', analysis.project_overhead.insurance.toString(),
        `${((analysis.project_overhead.insurance / analysis.total_amount) * 100).toFixed(2)}%`]);
    }
    if (analysis.project_overhead.bonds) {
      overheadData.push(['Bonds', analysis.project_overhead.bonds.toString(),
        `${((analysis.project_overhead.bonds / analysis.total_amount) * 100).toFixed(2)}%`]);
    }
    if (analysis.project_overhead.permits) {
      overheadData.push(['Permits', analysis.project_overhead.permits.toString(),
        `${((analysis.project_overhead.permits / analysis.total_amount) * 100).toFixed(2)}%`]);
    }
    if (analysis.project_overhead.supervision) {
      overheadData.push(['Supervision', analysis.project_overhead.supervision.toString(),
        `${((analysis.project_overhead.supervision / analysis.total_amount) * 100).toFixed(2)}%`]);
    }

    overheadData.push(['']);
    overheadData.push(['TOTAL OVERHEAD', analysis.project_overhead.total_overhead.toString(),
      `${((analysis.project_overhead.total_overhead / analysis.total_amount) * 100).toFixed(2)}%`]);

    const overheadWs = XLSX.utils.aoa_to_sheet(overheadData);
    
    // Format currency columns
    for (let row = 3; row < overheadData.length; row++) {
      const costCell = `B${row + 1}`;
      if (overheadWs[costCell] && !isNaN(Number(overheadWs[costCell].v))) {
        overheadWs[costCell].t = 'n';
        overheadWs[costCell].z = '$#,##0';
      }
    }

    overheadWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, overheadWs, 'Project Overhead');
  }

  // Allowances & Contingencies Sheet
  if (analysis.allowances && analysis.allowances.length > 0) {
    const allowanceData = [
      ['Allowances & Contingencies'],
      [''],
      ['Description', 'Type', 'Amount', '% of Total', 'Scope Description']
    ];

    analysis.allowances.forEach(allowance => {
      allowanceData.push([
        allowance.description,
        allowance.type.replace('_', ' ').toUpperCase(),
        allowance.amount.toString(),
        allowance.percentage_of_total ? `${allowance.percentage_of_total.toFixed(2)}%` : '',
        allowance.scope_description || ''
      ]);
    });

    allowanceData.push(['']);
    allowanceData.push(['TOTAL ALLOWANCES', '', (analysis.allowances_total || 0).toString(),
      `${(((analysis.allowances_total || 0) / analysis.total_amount) * 100).toFixed(2)}%`, '']);

    const allowanceWs = XLSX.utils.aoa_to_sheet(allowanceData);
    
    // Format currency column
    for (let row = 3; row < allowanceData.length; row++) {
      const costCell = `C${row + 1}`;
      if (allowanceWs[costCell] && !isNaN(Number(allowanceWs[costCell].v))) {
        allowanceWs[costCell].t = 'n';
        allowanceWs[costCell].z = '$#,##0';
      }
    }

    allowanceWs['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, allowanceWs, 'Allowances');
  }

  // Subcontractors Sheet
  if (analysis.subcontractors && analysis.subcontractors.length > 0) {
    const subData = [
      ['Subcontractor Breakdown'],
      [''],
      ['Subcontractor Name', 'Trade', 'CSI Divisions', 'Total Amount', '% of Total', 'Scope Description', 'Contact Info']
    ];

    analysis.subcontractors.forEach(sub => {
      subData.push([
        sub.name,
        sub.trade,
        sub.divisions.map(d => `Div ${d}`).join(', '),
        sub.total_amount.toString(),
        `${((sub.total_amount / analysis.total_amount) * 100).toFixed(2)}%`,
        sub.scope_description || '',
        sub.contact_info || ''
      ]);
    });

    const subWs = XLSX.utils.aoa_to_sheet(subData);
    
    // Format currency column
    for (let row = 3; row < subData.length; row++) {
      const costCell = `D${row + 1}`;
      if (subWs[costCell] && !isNaN(Number(subWs[costCell].v))) {
        subWs[costCell].t = 'n';
        subWs[costCell].z = '$#,##0';
      }
    }

    subWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, subWs, 'Subcontractors');
  }

  // Detailed Line Items Sheet
  const divisionsWithSubItems = Object.entries(analysis.csi_divisions).filter(([_, data]) => 
    data.sub_items && data.sub_items.length > 0
  );

  if (divisionsWithSubItems.length > 0) {
    const lineItemData = [
      ['Detailed Line Item Breakdown'],
      [''],
      ['Division', 'Division Name', 'Subcontractor', 'Line Item Description', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost', 'Sub Notes']
    ];

    divisionsWithSubItems.forEach(([code, data]) => {
      const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
      
      // Add division header
      lineItemData.push([
        `DIV ${code}`,
        division?.name || 'Unknown',
        data.subcontractor || 'TBD',
        '--- DIVISION TOTAL ---',
        '',
        '',
        '',
        data.cost.toString(),
        data.scope_notes || ''
      ]);

      // Add line items
      data.sub_items!.forEach(item => {
        lineItemData.push([
          '',
          '',
          item.subcontractor || '',
          item.description,
          item.quantity?.toString() || '',
          item.unit || '',
          item.unit_cost?.toString() || '',
          item.cost.toString(),
          item.notes || ''
        ]);
      });

      lineItemData.push(['']); // Separator
    });

    const lineItemWs = XLSX.utils.aoa_to_sheet(lineItemData);
    
    // Format currency columns
    for (let row = 3; row < lineItemData.length; row++) {
      const unitCostCell = `G${row + 1}`;
      const totalCostCell = `H${row + 1}`;
      
      if (lineItemWs[unitCostCell] && !isNaN(Number(lineItemWs[unitCostCell].v))) {
        lineItemWs[unitCostCell].t = 'n';
        lineItemWs[unitCostCell].z = '$#,##0.00';
      }
      
      if (lineItemWs[totalCostCell] && !isNaN(Number(lineItemWs[totalCostCell].v))) {
        lineItemWs[totalCostCell].t = 'n';
        lineItemWs[totalCostCell].z = '$#,##0';
      }
    }

    lineItemWs['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, lineItemWs, 'Line Items');
  }
  
  // Additional Information Sheet
  if (analysis.exclusions?.length || analysis.assumptions?.length) {
    const additionalData = [['Additional Information'], ['']];
    
    if (analysis.exclusions?.length) {
      additionalData.push(['Exclusions']);
      analysis.exclusions.forEach(exclusion => additionalData.push([exclusion]));
      additionalData.push(['']);
    }
    
    if (analysis.assumptions?.length) {
      additionalData.push(['Assumptions']);
      analysis.assumptions.forEach(assumption => additionalData.push([assumption]));
    }
    
    const additionalWs = XLSX.utils.aoa_to_sheet(additionalData);
    XLSX.utils.book_append_sheet(wb, additionalWs, 'Additional Info');
  }
  
  // Save the Excel file
  const fileName = `bid-analysis-${analysis.contractor_name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Note: BidComparison interface kept for backwards compatibility but not used in enhanced exports

// Enhanced Excel export for bid leveling with professional analysis
export function exportBidLevelingToExcel(selectedAnalyses: SavedAnalysis[]) {
  const wb = XLSX.utils.book_new();
  
  // Sort bids by total amount for consistent ranking
  const sortedBids = selectedAnalyses.sort((a, b) => a.result.total_amount - b.result.total_amount);
  const lowBid = sortedBids[0].result.total_amount;
  
  // SHEET 1 - EXECUTIVE SUMMARY
  const execData = [
    ['BID LEVELING ANALYSIS - EXECUTIVE SUMMARY'],
    [`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
    [`Number of Bids Analyzed: ${selectedAnalyses.length}`],
    [''],
    ['RANKING & RECOMMENDATIONS'],
    ['Rank', 'Contractor', 'Total Bid Amount', 'Dollar Difference', 'Percentage Variance', 'Uncategorized %', 'Risk Level', 'Recommendation']
  ];
  
  sortedBids.forEach((bid, index) => {
    const dollarDiff = bid.result.total_amount - lowBid;
    const variance = lowBid > 0 ? (dollarDiff / lowBid) * 100 : 0;
    
    // Calculate comprehensive risk assessment
    const risk = calculateProjectRisk(
      Object.fromEntries(Object.entries(bid.result.csi_divisions).map(([code, data]) => [code, data.cost])),
      bid.result.total_amount,
      bid.result.uncategorizedTotal || 0,
      bid.result
    );
    
    // Generate intelligent recommendations with emojis
    let recommendation = '';
    if (index === 0) {
      if (risk.level === 'LOW') recommendation = '✅ RECOMMENDED - Lowest bid with low risk';
      else if (risk.level === 'MEDIUM') recommendation = '⚠️ CAUTION - Low bid but moderate risk factors';
      else recommendation = '🚨 HIGH RISK - Low bid with significant risk concerns';
    } else if (variance <= 5) {
      if (risk.level === 'LOW') recommendation = '✅ COMPETITIVE - Close to low bid with low risk';
      else if (risk.level === 'MEDIUM') recommendation = '⚠️ CONSIDER - Competitive pricing but some risks';
      else recommendation = '🚨 REVIEW - Higher risk despite competitive pricing';
    } else if (variance <= 15) {
      if (risk.level === 'LOW') recommendation = '⚠️ MODERATE - Higher cost but lower risk profile';
      else recommendation = '🚨 EXPENSIVE - Higher cost AND higher risk';
    } else {
      recommendation = '🚨 SIGNIFICANTLY HIGHER - Review scope differences';
    }
    
    // Calculate uncategorized percentage for this bid
    const uncategorizedPct = bid.result.uncategorizedTotal ? 
      ((bid.result.uncategorizedTotal / bid.result.total_amount) * 100).toFixed(1) : '0.0';
    
    execData.push([
      (index + 1).toString(),
      bid.result.contractor_name,
      bid.result.total_amount.toString(),
      dollarDiff.toString(),
      (variance / 100).toString(), // Convert to decimal for Excel percentage formatting
      `${uncategorizedPct}%`,
      risk.level,
      recommendation
    ]);
  });
  
  const execWS = XLSX.utils.aoa_to_sheet(execData);
  
  // Format Executive Summary
  execWS['!cols'] = [
    { wch: 6 },   // Rank
    { wch: 30 },  // Contractor
    { wch: 18 },  // Total Amount
    { wch: 18 },  // Dollar Difference
    { wch: 15 },  // Percentage
    { wch: 15 },  // Uncategorized %
    { wch: 12 },  // Risk Level
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
        cell.s = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } } };
      } else if (row === 4) {
        cell.s = { font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E40AF' } } };
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
        
        // Format currency and percentage columns
        if (col === 2 || col === 3) { // Total Amount and Dollar Difference
          cell.t = 'n';
          cell.z = '$#,##0';
        } else if (col === 4 || col === 5) { // Percentage Variance and Uncategorized %
          cell.t = 'n';
          cell.z = '0.0%';
        }
      }
    }
  }
  
  XLSX.utils.book_append_sheet(wb, execWS, 'Executive Summary');
  
  // SHEET 2 - CSI DIVISION ANALYSIS
  const allDivisions = new Set<string>();
  selectedAnalyses.forEach(bid => {
    Object.keys(bid.result.csi_divisions).forEach(div => allDivisions.add(div));
  });
  
  const divisionData = [
    ['CSI DIVISION ANALYSIS - PERCENTAGE OF TOTAL PROJECT COST'],
    [''],
    ['Division', 'Name', 'Market Range', ...selectedAnalyses.map(bid => bid.result.contractor_name), 'Average', 'Variance', 'Assessment']
  ];
  
  Array.from(allDivisions).sort().forEach(divCode => {
    const division = CSI_DIVISIONS[divCode as keyof typeof CSI_DIVISIONS];
    const marketRange = division ? `${division.typicalPercentage[0]}-${division.typicalPercentage[1]}%` : 'N/A';
    
    const bidPercentages = selectedAnalyses.map(bid => {
      const divData = bid.result.csi_divisions[divCode];
      return divData ? (divData.cost / bid.result.total_amount) * 100 : 0;
    });
    
    const validValues = bidPercentages.filter(v => v > 0);
    const average = validValues.length > 0 ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length : 0;
    const variance = validValues.length > 1 ? Math.max(...validValues) - Math.min(...validValues) : 0;
    
    // Generate assessment with flags
    let assessment = '';
    if (variance > 10) assessment = '🚨 HIGH VARIANCE - Review scope differences';
    else if (variance > 5) assessment = '⚠️ MODERATE VARIANCE - Some differences noted';
    else if (validValues.length === selectedAnalyses.length) assessment = '✅ CONSISTENT - All bids include this work';
    else assessment = '⚠️ PARTIAL COVERAGE - Not all bids include';
    
    divisionData.push([
      divCode,
      division?.name || `Division ${divCode}`,
      marketRange,
      ...bidPercentages.map(v => (v / 100).toString()), // Convert to decimal for Excel formatting
      (average / 100).toString(),
      (variance / 100).toString(),
      assessment
    ]);
  });
  
  const divisionWS = XLSX.utils.aoa_to_sheet(divisionData);
  
  // Format CSI Division Analysis
  const contractorCols = selectedAnalyses.map(() => ({ wch: 14 }));
  divisionWS['!cols'] = [
    { wch: 8 },   // Division code
    { wch: 25 },  // Division name
    { wch: 15 },  // Market range
    ...contractorCols,
    { wch: 12 },  // Average
    { wch: 12 },  // Variance
    { wch: 40 }   // Assessment
  ];
  
  const divRange = XLSX.utils.decode_range(divisionWS['!ref'] || 'A1');
  for (let row = 0; row <= divRange.e.r; row++) {
    for (let col = 0; col <= divRange.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = divisionWS[cellAddr];
      if (!cell) continue;
      
      // Header formatting
      if (row === 0) {
        cell.s = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } } };
      } else if (row === 2) {
        cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
      }
      
      // Data formatting and color coding
      if (row > 2 && col >= 3 && col <= 3 + selectedAnalyses.length + 1) {
        cell.t = 'n';
        cell.z = '0.0%';
        
        // Color code based on variance level
        if (col === 3 + selectedAnalyses.length + 1) { // Variance column
          const variance = typeof cell.v === 'number' ? cell.v * 100 : 0;
          let fillColor = 'FFFFFF';
          if (variance > 10) fillColor = 'FEE2E2'; // Red for high variance
          else if (variance > 5) fillColor = 'FEF3C7'; // Yellow for moderate
          else fillColor = 'DCFCE7'; // Green for consistent
          
          cell.s = { fill: { fgColor: { rgb: fillColor } }, numFmt: '0.0%' };
        }
      }
    }
  }
  
  // Add uncategorized costs comparison section
  divisionData.push(['']); // Empty row separator  
  divisionData.push(['UNCATEGORIZED COSTS COMPARISON']);
  divisionData.push(['Metric', '', '', ...selectedAnalyses.map(bid => bid.result.contractor_name), 'Average', 'Highest', 'Analysis']);
  
  // Uncategorized amounts
  const uncategorizedAmounts = selectedAnalyses.map(bid => bid.result.uncategorizedTotal || 0);
  const avgUncategorized = uncategorizedAmounts.reduce((sum, amt) => sum + amt, 0) / selectedAnalyses.length;
  const maxUncategorized = Math.max(...uncategorizedAmounts);
  
  divisionData.push([
    'Uncategorized Amount', '', '',
    ...uncategorizedAmounts.map(amt => (amt / 100).toString()), // Format as currency
    (avgUncategorized / 100).toString(),
    (maxUncategorized / 100).toString(),
    maxUncategorized > avgUncategorized * 2 ? '🚨 High variance in uncategorized costs' : '✅ Consistent uncategorized amounts'
  ]);
  
  // Uncategorized percentages
  const uncategorizedPercentages = selectedAnalyses.map(bid => {
    const total = bid.result.total_amount;
    const uncategorized = bid.result.uncategorizedTotal || 0;
    return total > 0 ? (uncategorized / total) * 100 : 0;
  });
  const avgPercentage = uncategorizedPercentages.reduce((sum, pct) => sum + pct, 0) / selectedAnalyses.length;
  const maxPercentage = Math.max(...uncategorizedPercentages);
  
  divisionData.push([
    'Uncategorized %', '', '',
    ...uncategorizedPercentages.map(pct => (pct / 100).toString()),
    (avgPercentage / 100).toString(),
    (maxPercentage / 100).toString(),
    maxPercentage > 25 ? '🚨 High uncategorized percentage detected' : avgPercentage > 15 ? '⚠️ Moderate uncategorized levels' : '✅ Low uncategorized costs'
  ]);
  
  // Recreate the worksheet with updated data
  const updatedDivisionWS = XLSX.utils.aoa_to_sheet(divisionData);
  updatedDivisionWS['!cols'] = divisionWS['!cols']; // Keep the same column formatting
  
  XLSX.utils.book_append_sheet(wb, updatedDivisionWS, 'CSI Division Analysis');
  
  // SHEET 3 - RISK ANALYSIS MATRIX
  const riskData = [
    ['RISK ANALYSIS MATRIX'],
    [''],
    ['Contractor', 'Total Bid', 'Risk Score', 'Risk Level', 'Missing Critical Divisions', 'Cost Concentration Issues', 'Key Risk Factors']
  ];
  
  sortedBids.forEach(bid => {
    const risk = calculateProjectRisk(
      Object.fromEntries(Object.entries(bid.result.csi_divisions).map(([code, data]) => [code, data.cost])),
      bid.result.total_amount,
      bid.result.uncategorizedTotal || 0,
      bid.result
    );
    
    // Identify missing critical divisions (MasterFormat 2018)
    const criticalDivisions = ['01', '03', '22', '23', '26']; // General, Concrete, Plumbing, HVAC, Electrical
    const presentDivisions = Object.keys(bid.result.csi_divisions);
    const missingCritical = criticalDivisions.filter(d => !presentDivisions.includes(d));
    const missingText = missingCritical.length > 0 ? 
      missingCritical.map(d => CSI_DIVISIONS[d as keyof typeof CSI_DIVISIONS]?.name || d).join(', ') : 
      '✅ All critical divisions present';
    
    // Check cost concentration
    const concentrationIssues: string[] = [];
    Object.entries(bid.result.csi_divisions).forEach(([code, data]) => {
      const percentage = (data.cost / bid.result.total_amount) * 100;
      if (percentage > 40) {
        const divName = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS]?.name || code;
        concentrationIssues.push(`${divName}: ${percentage.toFixed(1)}%`);
      }
    });
    const concentrationText = concentrationIssues.length > 0 ? 
      `🚨 ${concentrationIssues.join('; ')}` : 
      '✅ Well-distributed costs';
    
    // Top 3 risk factors
    const topRisks = risk.factors.slice(0, 3).join('; ');
    
    riskData.push([
      bid.result.contractor_name,
      bid.result.total_amount.toString(),
      risk.score.toString(),
      risk.level,
      missingText,
      concentrationText,
      topRisks || 'No significant risks identified'
    ]);
  });
  
  const riskWS = XLSX.utils.aoa_to_sheet(riskData);
  
  // Format Risk Analysis
  riskWS['!cols'] = [
    { wch: 25 },  // Contractor
    { wch: 15 },  // Total Bid
    { wch: 12 },  // Risk Score
    { wch: 12 },  // Risk Level
    { wch: 30 },  // Missing Divisions
    { wch: 35 },  // Cost Concentration
    { wch: 50 }   // Risk Factors
  ];
  
  const riskRange = XLSX.utils.decode_range(riskWS['!ref'] || 'A1');
  for (let row = 0; row <= riskRange.e.r; row++) {
    for (let col = 0; col <= riskRange.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = riskWS[cellAddr];
      if (!cell) continue;
      
      // Header formatting
      if (row === 0) {
        cell.s = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } } };
      } else if (row === 2) {
        cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
      }
      
      // Data formatting
      if (row > 2) {
        if (col === 1) { // Total Bid
          cell.t = 'n';
          cell.z = '$#,##0';
        } else if (col === 3) { // Risk Level
          const riskLevel = cell.v;
          let fillColor = 'FFFFFF';
          if (riskLevel === 'HIGH') fillColor = 'FEE2E2'; // Red
          else if (riskLevel === 'MEDIUM') fillColor = 'FEF3C7'; // Yellow
          else if (riskLevel === 'LOW') fillColor = 'DCFCE7'; // Green
          
          cell.s = { fill: { fgColor: { rgb: fillColor } } };
        }
      }
    }
  }
  
  XLSX.utils.book_append_sheet(wb, riskWS, 'Risk Analysis Matrix');
  
  // SHEET 4 - MARKET BENCHMARKING
  const benchmarkData = [
    ['MARKET BENCHMARKING ANALYSIS'],
    [''],
    ['Division', 'Market Standard', 'Your Bids Average', 'Deviation', 'Market Assessment', 'Guidance']
  ];
  
  Array.from(allDivisions).sort().forEach(divCode => {
    const division = CSI_DIVISIONS[divCode as keyof typeof CSI_DIVISIONS];
    if (!division) return;
    
    const bidPercentages = selectedAnalyses
      .map(bid => {
        const divData = bid.result.csi_divisions[divCode];
        return divData ? (divData.cost / bid.result.total_amount) * 100 : null;
      })
      .filter(p => p !== null) as number[];
    
    if (bidPercentages.length === 0) return;
    
    const average = bidPercentages.reduce((sum, v) => sum + v, 0) / bidPercentages.length;
    const [marketMin, marketMax] = division.typicalPercentage;
    const marketMid = (marketMin + marketMax) / 2;
    const deviation = average - marketMid;
    
    // Generate assessment and guidance
    let assessment = '';
    let guidance = '';
    
    if (average < marketMin) {
      assessment = '🚨 BELOW MARKET';
      guidance = 'Review for missing scope items or unrealistic pricing';
    } else if (average > marketMax) {
      assessment = '🚨 ABOVE MARKET';
      guidance = 'Investigate reasons for premium pricing or scope additions';
    } else if (Math.abs(deviation) <= 1) {
      assessment = '✅ ON TARGET';
      guidance = 'Pricing aligns well with market standards';
    } else {
      assessment = '⚠️ ACCEPTABLE';
      guidance = 'Within market range but monitor for consistency';
    }
    
    benchmarkData.push([
      `${divCode} - ${division.name}`,
      `${marketMin.toFixed(1)}% - ${marketMax.toFixed(1)}%`,
      (average / 100).toString(), // Convert to decimal for Excel formatting
      (deviation / 100).toString(),
      assessment,
      guidance
    ]);
  });
  
  const benchmarkWS = XLSX.utils.aoa_to_sheet(benchmarkData);
  
  // Format Market Benchmarking
  benchmarkWS['!cols'] = [
    { wch: 30 },  // Division
    { wch: 15 },  // Market Standard
    { wch: 15 },  // Your Average
    { wch: 12 },  // Deviation
    { wch: 18 },  // Assessment
    { wch: 45 }   // Guidance
  ];
  
  const benchRange = XLSX.utils.decode_range(benchmarkWS['!ref'] || 'A1');
  for (let row = 0; row <= benchRange.e.r; row++) {
    for (let col = 0; col <= benchRange.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = benchmarkWS[cellAddr];
      if (!cell) continue;
      
      // Header formatting
      if (row === 0) {
        cell.s = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } } };
      } else if (row === 2) {
        cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'E5E7EB' } } };
      }
      
      // Data formatting
      if (row > 2) {
        if (col === 2 || col === 3) { // Percentage columns
          cell.t = 'n';
          cell.z = '0.0%';
        }
        
        if (col === 4) { // Assessment column
          const assessment = cell.v;
          let fillColor = 'FFFFFF';
          if (typeof assessment === 'string') {
            if (assessment.includes('BELOW MARKET') || assessment.includes('ABOVE MARKET')) {
              fillColor = 'FEE2E2'; // Red for out of range
            } else if (assessment.includes('ON TARGET')) {
              fillColor = 'DCFCE7'; // Green for on target
            } else if (assessment.includes('ACCEPTABLE')) {
              fillColor = 'FEF3C7'; // Yellow for acceptable
            }
          }
          cell.s = { fill: { fgColor: { rgb: fillColor } } };
        }
      }
    }
  }
  
  XLSX.utils.book_append_sheet(wb, benchmarkWS, 'Market Benchmarking');
  
  // Save the file with timestamp
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `ProLeveler_Leveling_Analysis_${timestamp}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Enhanced PDF export for bid leveling
export function exportBidLevelingToPDF(selectedAnalyses: SavedAnalysis[]) {
  const doc = new jsPDF();
  let currentY = 20;
  
  // Title Page
  doc.setFontSize(24);
  doc.text('BID LEVELING ANALYSIS', 20, currentY);
  currentY += 15;
  
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, currentY);
  currentY += 10;
  doc.text(`Number of Bids Analyzed: ${selectedAnalyses.length}`, 20, currentY);
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
  doc.text(`Lowest Bid: ${sortedBids[0].result.contractor_name} - $${lowBid.toLocaleString()}`, 20, currentY);
  currentY += 8;
  doc.text(`Highest Bid: ${sortedBids[sortedBids.length - 1].result.contractor_name} - $${highBid.toLocaleString()}`, 20, currentY);
  currentY += 8;
  doc.text(`Bid Spread: ${spread.toFixed(1)}%`, 20, currentY);
  currentY += 15;
  
  // Bid Ranking Table
  const rankingData = sortedBids.map((bid, index) => {
    const variance = ((bid.result.total_amount - lowBid) / lowBid) * 100;
    return [
      (index + 1).toString(),
      bid.result.contractor_name,
      `$${bid.result.total_amount.toLocaleString()}`,
      'MEDIUM', // Default risk level
      `+${variance.toFixed(1)}%`
    ];
  });
  
  autoTable(doc, {
    head: [['Rank', 'Contractor', 'Total Amount', 'Risk', 'Variance']],
    body: rankingData,
    startY: currentY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 20;
  
  // New page for CSI analysis if needed
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  // CSI Division Analysis
  doc.setFontSize(16);
  doc.text('CSI DIVISION ANALYSIS', 20, currentY);
  currentY += 15;
  
  // Get top divisions by average cost
  const allDivisions = new Set<string>();
  selectedAnalyses.forEach(bid => {
    Object.keys(bid.result.csi_divisions).forEach(div => allDivisions.add(div));
  });
  
  const divisionSummary = Array.from(allDivisions).map(divCode => {
    const costs = selectedAnalyses
      .map(bid => bid.result.csi_divisions[divCode])
      .filter(d => d)
      .map(d => d.cost);
    
    const average = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const division = CSI_DIVISIONS[divCode as keyof typeof CSI_DIVISIONS];
    
    return {
      code: divCode,
      name: division?.name || 'Unknown',
      average,
      min: Math.min(...costs),
      max: Math.max(...costs),
      count: costs.length
    };
  }).sort((a, b) => b.average - a.average).slice(0, 8); // Top 8 divisions
  
  const divisionTableData = divisionSummary.map(div => [
    `${div.code} - ${div.name}`,
    `$${div.average.toLocaleString()}`,
    `$${div.min.toLocaleString()}`,
    `$${div.max.toLocaleString()}`,
    div.count.toString()
  ]);
  
  autoTable(doc, {
    head: [['Division', 'Average', 'Min', 'Max', 'Bids']],
    body: divisionTableData,
    startY: currentY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [52, 152, 219] }
  });
  
  // Save the PDF
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`Bid_Leveling_Report_${timestamp}.pdf`);
}