import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AnalysisResult } from '@/types/analysis';
import { SavedAnalysis } from '@/lib/storage';
import { analyzeMarketVariance } from '../market-analyzer';
import { calculateProjectRisk } from '../risk-analyzer';
import { CSI_DIVISIONS, LEVELING_DIVISIONS, LEVELING_LABELS, PSEUDO_SCOPES } from '../csi-analyzer';

// Extend jsPDF type to include autoTable properties
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export function exportConstructionAnalysisToPDF(analysis: AnalysisResult): void {
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
  doc.text('Levelr Analysis Report', margin, 25);

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
    const qualityLabels: { [key: string]: string } = {
      'professional_typed': 'Professional Typed Document',
      'handwritten_notes': 'Handwritten with Typed Sections',
      'poor_scan': 'Poor Quality Scan',
      'mixed_format': 'Mixed Format Document'
    };

    doc.text(`Document Quality: ${qualityLabels[analysis.document_quality] || analysis.document_quality}`, margin + 5, yPosition);
    yPosition += 8;
  }

  // Square footage information
  if (analysis.gross_sqft && analysis.gross_sqft > 0) {
    doc.text(`Gross Square Footage: ${analysis.gross_sqft.toLocaleString()} SF`, margin + 5, yPosition);
    doc.text(`Cost per SF: $${(analysis.total_amount / analysis.gross_sqft).toFixed(2)}`, margin + 5, yPosition + 8);
    yPosition += 16;
  }

  yPosition += 10;

  // Market Analysis Section with dynamic risk detection
  const risk = calculateProjectRisk(
    Object.fromEntries(Object.entries(analysis.csi_divisions).map(([code, data]) => [code, data.cost])),
    analysis.total_amount,
    analysis.uncategorizedTotal || 0,
    analysis
  );

  checkPageBreak(45);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Analysis & Risk Assessment', margin, yPosition);
  yPosition += 15;

  // Risk level box with color coding
  const riskColors = {
    'LOW': [34, 197, 94],      // Green-500
    'MEDIUM': [234, 179, 8],   // Yellow-500
    'HIGH': [239, 68, 68],     // Red-500
    'CRITICAL': [127, 29, 29]  // Red-900
  };

  const riskColor = riskColors[risk.level as keyof typeof riskColors] || [107, 114, 128];
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPosition - 5, contentWidth, 20, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Overall Risk Level: ${risk.level} (Score: ${risk.score}/100)`, margin + 5, yPosition + 7);

  doc.setTextColor(0, 0, 0);
  yPosition += 25;

  // Risk factors list
  if (risk.factors.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Risk Factors:', margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    risk.factors.forEach((factor) => {
      checkPageBreak(8);
      doc.circle(margin + 12, yPosition - 2, 1, 'F');
      const lines = doc.splitTextToSize(factor, contentWidth - 25);
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
    yPosition += 10;
  }

  // CSI Divisions Analysis
  if (analysis.csi_divisions && Object.keys(analysis.csi_divisions).length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CSI Divisions Analysis', margin, yPosition);
    yPosition += 15;

    // Create table data with market variance analysis
    const tableData = Object.entries(analysis.csi_divisions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, data]) => {
        const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
        const variance = analyzeMarketVariance(data.cost, analysis.total_amount, code);
        const percentage = ((data.cost / analysis.total_amount) * 100).toFixed(1);
        const costPerSF = analysis.gross_sqft && analysis.gross_sqft > 0 ?
          `$${(data.cost / analysis.gross_sqft).toFixed(2)}` : '—';

        return [
          `${code} - ${division?.name || 'Unknown'}`,
          `$${data.cost.toLocaleString()}`,
          costPerSF,
          `${percentage}%`,
          variance.status.replace('_', ' '),
          data.items.join(', ').substring(0, 50) + (data.items.join(', ').length > 50 ? '...' : '')
        ];
      });

    // Track total mapped costs for coverage calculation
    const totalMappedCost = Object.values(analysis.csi_divisions)
      .reduce((sum, division) => sum + division.cost, 0);

    autoTable(doc, {
      head: [['Division', 'Cost', 'Cost/SF', '% of Total', 'Market Status', 'Items']],
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
        0: { cellWidth: 50 }, // Division
        1: { cellWidth: 25, halign: 'right' }, // Cost
        2: { cellWidth: 20, halign: 'right' }, // Cost/SF
        3: { cellWidth: 15, halign: 'center' }, // % of Total
        4: { cellWidth: 25, halign: 'center' }, // Market Status
        5: { cellWidth: 45 } // Items
      },
      didDrawCell: function(data: { column: { index: number }, section: string, cell: { text: string[], x: number, y: number, width: number, height: number } }) {
        // Color code market status cells
        if (data.column.index === 4 && data.section === 'body') {
          const status = data.cell.text[0];
          if (status === 'ABOVE MARKET') {
            doc.setFillColor(254, 226, 226); // Red-100 background
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(153, 27, 27); // Red-800 text for contrast
          } else if (status === 'BELOW MARKET') {
            doc.setFillColor(254, 249, 195); // Yellow-100 background
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(146, 64, 14); // Yellow-800 text for contrast
          } else if (status === 'MARKET RATE') {
            doc.setFillColor(220, 252, 231); // Green-100 background
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(20, 83, 45); // Green-800 text for contrast
          }

          // Redraw the text with proper color
          if (status) {
            doc.setFontSize(9);
            const textX = data.cell.x + data.cell.width / 2;
            const textY = data.cell.y + data.cell.height / 2 + 2;
            doc.text(status, textX, textY, { align: 'center' });
          }

          // Reset text color for other cells
          doc.setTextColor(0, 0, 0);
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
          fillColor: [245, 158, 11], // Yellow-500
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 20, halign: 'center' }
        }
      });

      yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
    }
  }

  // Soft Costs Section (if available)
  if (analysis.softCosts && analysis.softCosts.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Soft Costs', margin, yPosition);
    yPosition += 10;

    const softCostTableData = analysis.softCosts.map(cost => [
      cost.description,
      `$${cost.cost.toLocaleString()}`,
      `${((cost.cost / analysis.total_amount) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [['Description', 'Cost', '% of Total']],
      body: softCostTableData,
      startY: yPosition,
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
        0: { cellWidth: 120 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 20, halign: 'center' }
      }
    });

    yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
  }

  // Project Information Section
  if (analysis.exclusions?.length || analysis.assumptions?.length) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Information', margin, yPosition);
    yPosition += 10;

    if (analysis.exclusions?.length) {
      checkPageBreak(15);
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
    doc.text('Levelr Analysis Report - Confidential', margin, pageHeight - 15);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - 15);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, pageHeight - 8);

    // Branding
    doc.text('Powered by Levelr Platform | MasterFormat 2018 Compliant', pageWidth - margin - 120, pageHeight - 8);
  }

  // Generate filename and save
  const sanitizedContractorName = analysis.contractor_name.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `Levelr_Analysis_${sanitizedContractorName}_${timestamp}.pdf`;

  doc.save(fileName);
}

export function exportConstructionAnalysisToExcel(analysis: AnalysisResult): void {
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
    ['CSI Code', 'Division Name', 'Cost', 'Cost/SF', 'Percentage', 'Items', 'Unit Cost', 'Quantity', 'Unit', 'Market Status', 'Variance', 'Recommendation']
  ];

  Object.entries(analysis.csi_divisions)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([code, data]) => {
    const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
    const variance = analyzeMarketVariance(data.cost, analysis.total_amount, code);
    const percentage = ((data.cost / analysis.total_amount) * 100).toFixed(1);
    const costPerSF = analysis.gross_sqft && analysis.gross_sqft > 0 ? (data.cost / analysis.gross_sqft).toFixed(2) : '—';

    csiData.push([
      code,
      division?.name || 'Unknown',
      data.cost.toString(),
      costPerSF,
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
    csiData.push(['UNCATEGORIZED COSTS', '', '', '', '', '', '', '', '', '', '', '']);
    csiData.push(['Description', 'Cost', 'Cost/SF', '% of Total', 'Reason', '', '', '', '', '', '', '']);

    analysis.uncategorizedCosts.forEach(item => {
      const percentage = ((item.cost / analysis.total_amount) * 100).toFixed(1);
      const costPerSF = analysis.gross_sqft && analysis.gross_sqft > 0 ? (item.cost / analysis.gross_sqft).toFixed(2) : '—';
      csiData.push([
        item.description,
        item.cost.toString(),
        costPerSF,
        `${percentage}%`,
        'Not matched to CSI divisions',
        '', '', '', '', '', '', ''
      ]);
    });

    // Add total uncategorized row
    const totalPercentage = (((analysis.uncategorizedTotal || 0) / analysis.total_amount) * 100).toFixed(1);
    const totalCostPerSF = analysis.gross_sqft && analysis.gross_sqft > 0 ? ((analysis.uncategorizedTotal || 0) / analysis.gross_sqft).toFixed(2) : '—';
    csiData.push([
      'TOTAL UNCATEGORIZED',
      (analysis.uncategorizedTotal || 0).toString(),
      totalCostPerSF,
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

  // Soft Costs Sheet
  if (analysis.softCosts && analysis.softCosts.length > 0) {
    const softCostsData = [
      ['Description', 'Cost', 'Cost/SF', '% of Total']
    ];

    analysis.softCosts.forEach(cost => {
      const percentage = ((cost.cost / analysis.total_amount) * 100).toFixed(1);
      const costPerSF = analysis.gross_sqft && analysis.gross_sqft > 0 ? (cost.cost / analysis.gross_sqft).toFixed(2) : '—';
      softCostsData.push([
        cost.description,
        cost.cost.toString(),
        costPerSF,
        `${percentage}%`
      ]);
    });

    // Add total soft costs row
    const totalSoftPercentage = (((analysis.softCostsTotal || 0) / analysis.total_amount) * 100).toFixed(1);
    const totalSoftCostPerSF = analysis.gross_sqft && analysis.gross_sqft > 0 ? ((analysis.softCostsTotal || 0) / analysis.gross_sqft).toFixed(2) : '—';
    softCostsData.push([
      'TOTAL SOFT COSTS',
      (analysis.softCostsTotal || 0).toString(),
      totalSoftCostPerSF,
      `${totalSoftPercentage}%`
    ]);

    const softCostsWs = XLSX.utils.aoa_to_sheet(softCostsData);

    // Calculate optimal column widths based on content
    const softCostsMaxLengths: number[] = [];
    softCostsData.forEach(row => {
      row.forEach((cell, colIndex) => {
        const cellLength = String(cell).length;
        softCostsMaxLengths[colIndex] = Math.max(softCostsMaxLengths[colIndex] || 0, cellLength);
      });
    });

    // Set auto-fit column widths with minimum and maximum constraints
    softCostsWs['!cols'] = softCostsMaxLengths.map((length) => ({
      wch: Math.min(Math.max(length + 2, 10), 50) // Min 10, Max 50 characters
    }));

    // Format currency columns
    const softCostsRange = XLSX.utils.decode_range(softCostsWs['!ref'] || 'A1');
    for (let row = 1; row <= softCostsRange.e.r; row++) {
      const costCell = `B${row + 1}`;

      if (softCostsWs[costCell] && !isNaN(Number(softCostsWs[costCell].v))) {
        softCostsWs[costCell].t = 'n';
        softCostsWs[costCell].z = '$#,##0';
      }
    }

    XLSX.utils.book_append_sheet(wb, softCostsWs, 'Soft Costs');
  }

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
    if (analysis.project_overhead.total_overhead != null) {
      overheadData.push(['TOTAL OVERHEAD', analysis.project_overhead.total_overhead.toString(),
        `${((analysis.project_overhead.total_overhead / analysis.total_amount) * 100).toFixed(2)}%`]);
    }

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
  const divisionsWithSubItems = Object.entries(analysis.csi_divisions)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([_, data]) =>
      data.sub_items && data.sub_items.length > 0
    );

  if (divisionsWithSubItems.length > 0) {
    const lineItemData = [
      ['CSI Code', 'Division', 'Line Item', 'Description', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost', 'Subcontractor', 'Notes']
    ];

    divisionsWithSubItems.forEach(([code, data]) => {
      const division = CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS];
      data.sub_items!.forEach(item => {
        lineItemData.push([
          code,
          division?.name || 'Unknown',
          '', // Line item number - could be added to LineItem interface
          item.description,
          item.quantity?.toString() || '',
          item.unit || '',
          item.unit_cost?.toString() || '',
          item.cost.toString(),
          item.subcontractor || '',
          item.notes || ''
        ]);
      });
    });

    const lineItemWs = XLSX.utils.aoa_to_sheet(lineItemData);

    // Auto-fit columns
    lineItemWs['!cols'] = [
      { wch: 10 }, // CSI Code
      { wch: 30 }, // Division
      { wch: 10 }, // Line Item
      { wch: 40 }, // Description
      { wch: 10 }, // Quantity
      { wch: 10 }, // Unit
      { wch: 15 }, // Unit Cost
      { wch: 15 }, // Total Cost
      { wch: 25 }, // Subcontractor
      { wch: 30 }  // Notes
    ];

    // Format currency columns (Unit Cost and Total Cost)
    for (let row = 2; row < lineItemData.length; row++) {
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

    XLSX.utils.book_append_sheet(wb, lineItemWs, 'Line Items');
  }

  // Additional Info Sheet (if needed for debugging or additional data)
  if (analysis.categorizationPercentage !== undefined) {
    const additionalData = [
      ['Additional Analysis Information'],
      [''],
      ['Metric', 'Value'],
      ['Categorization Coverage', `${analysis.categorizationPercentage.toFixed(1)}%`],
      ['Total CSI Division Cost', Object.values(analysis.csi_divisions).reduce((sum, div) => sum + div.cost, 0)],
      ['Document Type', analysis.document_quality || 'Not specified'],
      ['Analysis Date', new Date().toISOString()]
    ];

    const additionalWs = XLSX.utils.aoa_to_sheet(additionalData);
    additionalWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, additionalWs, 'Additional Info');
  }

  // Save the Excel file
  const fileName = `bid-analysis-${analysis.contractor_name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ============== BID LEVELING FUNCTIONS ==============

// Helper function to synthesize division comments
function synthesizeDivisionComment(analysis: SavedAnalysis, code: string): string {
  const exclusions = (analysis.result.exclusions || []).join(' ').toLowerCase();
  const cost = analysis.result.csi_divisions?.[code]?.cost ?? 0;

  if (cost === 0) {
    if (code === '28' && exclusions.includes('security')) return 'Excluded per bid (Security)';
    if (code === '27' && (exclusions.includes('tele') || exclusions.includes('communications'))) return 'Excluded per bid (Comms)';
    return 'No cost; likely excluded';
  }
  return '';
}

// Helper function to calculate trades subtotal
function calculateTradesSubtotal(analysis: SavedAnalysis): number {
  return LEVELING_DIVISIONS.reduce((sum, code) => {
    return sum + (analysis.result.csi_divisions?.[code]?.cost ?? 0);
  }, 0);
}

// Main leveling worksheet function
export function exportLeveledComparisonSheet(wb: XLSX.WorkBook, bids: SavedAnalysis[]) {
  const sheetData: (string | number)[][] = [];

  // Calculate column positions
  // SCOPE (1) + bidder blocks (3 cols each: COST, COST/SF, COMMENTS) + spacers between (not after last)
  const bidderBlockSize = 3; // 3 data columns per bidder
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

  // Row 2: "" then "COST", "COST/SF", "COMMENTS" for each bidder
  const row2: (string | number)[] = [''];
  bids.forEach((bid, index) => {
    row2.push('COST');
    row2.push('COST/SF');
    row2.push('COMMENTS');
    if (index < bids.length - 1) row2.push(''); // Spacer column only between bidders
  });
  sheetData.push(row2);

  // Body rows - All LEVELING_DIVISIONS using LEVELING_LABELS
  LEVELING_DIVISIONS.forEach(code => {
    const row: (string | number)[] = [`${code} - ${LEVELING_LABELS[code] || `Division ${code}`}`];

    bids.forEach((bid, index) => {
      const divisionData = bid.result.csi_divisions?.[code];
      const cost = divisionData?.cost ?? 0;
      const grossSqft = bid.result.gross_sqft;

      // COST column
      row.push(cost);

      // COST/SF column
      const costPerSF = grossSqft && grossSqft > 0 ? cost / grossSqft : null;
      row.push(costPerSF ?? '—');

      // COMMENTS column
      row.push(synthesizeDivisionComment(bid, code));

      // Spacer column only between bidders
      if (index < bids.length - 1) row.push('');
    });

    sheetData.push(row);
  });

  // "Soft Costs" row
  const softCostsRow: (string | number)[] = [PSEUDO_SCOPES.SOFT];
  bids.forEach((bid, index) => {
    const softCostAmount = bid.result.softCostsTotal ?? 0;
    const grossSqft = bid.result.gross_sqft;

    softCostsRow.push(softCostAmount);
    softCostsRow.push(grossSqft && grossSqft > 0 ? softCostAmount / grossSqft : '—');

    // Generate intelligent comment based on soft costs data
    let comment = 'No soft costs identified';
    if (softCostAmount > 0) {
      const softCostCount = bid.result.softCosts?.length ?? 0;
      if (softCostCount > 0) {
        comment = `${softCostCount} soft cost item${softCostCount > 1 ? 's' : ''} (permits, fees, etc.)`;
      } else {
        comment = 'Soft costs identified but not itemized';
      }
    }
    softCostsRow.push(comment);

    if (index < bids.length - 1) softCostsRow.push('');
  });
  sheetData.push(softCostsRow);

  // "Uncategorized" row
  const uncategorizedRow: (string | number)[] = [PSEUDO_SCOPES.UNC];
  bids.forEach((bid, index) => {
    const uncategorizedAmount = bid.result.uncategorizedTotal ?? 0;
    const grossSqft = bid.result.gross_sqft;

    uncategorizedRow.push(uncategorizedAmount);
    uncategorizedRow.push(grossSqft && grossSqft > 0 ? uncategorizedAmount / grossSqft : '—');
    uncategorizedRow.push(uncategorizedAmount > 0 ? 'Items not categorized to CSI divisions' : 'All costs categorized');

    if (index < bids.length - 1) uncategorizedRow.push('');
  });
  sheetData.push(uncategorizedRow);

  // Blank separator
  const blankRow: (string | number)[] = new Array(totalCols).fill('');
  sheetData.push(blankRow);

  // "TRADES SUBTOTAL" (sum divisions only)
  const tradesSubtotalRow: (string | number)[] = ['TRADES SUBTOTAL'];
  bids.forEach((bid, index) => {
    const tradesSubtotal = calculateTradesSubtotal(bid);
    const grossSqft = bid.result.gross_sqft;

    tradesSubtotalRow.push(tradesSubtotal);
    tradesSubtotalRow.push(grossSqft && grossSqft > 0 ? tradesSubtotal / grossSqft : '—');
    tradesSubtotalRow.push('Sum of all CSI divisions');

    if (index < bids.length - 1) tradesSubtotalRow.push('');
  });
  sheetData.push(tradesSubtotalRow);

  // Add markup rows (CM Fee, Insurance, Bond, OH&P) based on project_overhead
  bids.forEach((bid, bidIndex) => {
    const overhead = bid.result.project_overhead;

    // Only create markup rows for the first bid, then populate all bids
    if (bidIndex === 0) {
      // CM Fee row
      if (overhead?.cm_fee && overhead.cm_fee > 0) {
        const cmFeeRow: (string | number)[] = ['CM Fee'];
        bids.forEach((b, i) => {
          const cmFee = b.result.project_overhead?.cm_fee ?? 0;
          const bTradesSubtotal = calculateTradesSubtotal(b);
          const percentage = bTradesSubtotal > 0 ? (cmFee / bTradesSubtotal) * 100 : 0;
          const grossSqft = b.result.gross_sqft;

          cmFeeRow.push(cmFee);
          cmFeeRow.push(grossSqft && grossSqft > 0 ? cmFee / grossSqft : '—');
          cmFeeRow.push(percentage > 0 ? `${percentage.toFixed(2)}% of Trades Subtotal` : 'No CM fee');

          if (i < bids.length - 1) cmFeeRow.push('');
        });
        sheetData.push(cmFeeRow);
      }

      // Insurance row
      if (overhead?.insurance && overhead.insurance > 0) {
        const insuranceRow: (string | number)[] = ['Insurance'];
        bids.forEach((b, i) => {
          const insurance = b.result.project_overhead?.insurance ?? 0;
          const bTradesSubtotal = calculateTradesSubtotal(b);
          const percentage = bTradesSubtotal > 0 ? (insurance / bTradesSubtotal) * 100 : 0;
          const grossSqft = b.result.gross_sqft;

          insuranceRow.push(insurance);
          insuranceRow.push(grossSqft && grossSqft > 0 ? insurance / grossSqft : '—');
          insuranceRow.push(percentage > 0 ? `${percentage.toFixed(2)}% of Trades Subtotal` : 'No insurance cost');

          if (i < bids.length - 1) insuranceRow.push('');
        });
        sheetData.push(insuranceRow);
      }

      // Bond row
      if (overhead?.bonds && overhead.bonds > 0) {
        const bondsRow: (string | number)[] = ['Bond'];
        bids.forEach((b, i) => {
          const bonds = b.result.project_overhead?.bonds ?? 0;
          const bTradesSubtotal = calculateTradesSubtotal(b);
          const percentage = bTradesSubtotal > 0 ? (bonds / bTradesSubtotal) * 100 : 0;
          const grossSqft = b.result.gross_sqft;

          bondsRow.push(bonds);
          bondsRow.push(grossSqft && grossSqft > 0 ? bonds / grossSqft : '—');
          bondsRow.push(percentage > 0 ? `${percentage.toFixed(2)}% of Trades Subtotal` : 'No bond cost');

          if (i < bids.length - 1) bondsRow.push('');
        });
        sheetData.push(bondsRow);
      }

      // General Conditions / OH&P row
      if (overhead?.general_conditions && overhead.general_conditions > 0) {
        const gcRow: (string | number)[] = ['General Conditions'];
        bids.forEach((b, i) => {
          const gc = b.result.project_overhead?.general_conditions ?? 0;
          const bTradesSubtotal = calculateTradesSubtotal(b);
          const percentage = bTradesSubtotal > 0 ? (gc / bTradesSubtotal) * 100 : 0;
          const grossSqft = b.result.gross_sqft;

          gcRow.push(gc);
          gcRow.push(grossSqft && grossSqft > 0 ? gc / grossSqft : '—');
          gcRow.push(percentage > 0 ? `${percentage.toFixed(2)}% of Trades Subtotal` : 'No general conditions');

          if (i < bids.length - 1) gcRow.push('');
        });
        sheetData.push(gcRow);
      }
    }
  });

  // "GRAND TOTAL" (trades + overhead + soft costs + uncategorized)
  const grandTotalRow: (string | number)[] = ['GRAND TOTAL'];
  bids.forEach((bid, index) => {
    const tradesSubtotal = calculateTradesSubtotal(bid);
    const overhead = bid.result.project_overhead;
    const overheadTotal = (overhead?.cm_fee ?? 0) + (overhead?.insurance ?? 0) + (overhead?.bonds ?? 0) + (overhead?.general_conditions ?? 0);
    const softCostsAmount = bid.result.softCostsTotal ?? 0;
    const uncategorizedAmount = bid.result.uncategorizedTotal ?? 0;
    const grandTotal = tradesSubtotal + overheadTotal + softCostsAmount + uncategorizedAmount;
    const grossSqft = bid.result.gross_sqft;

    grandTotalRow.push(grandTotal);
    grandTotalRow.push(grossSqft && grossSqft > 0 ? grandTotal / grossSqft : '—');
    grandTotalRow.push('Complete project total');

    if (index < bids.length - 1) grandTotalRow.push('');
  });
  sheetData.push(grandTotalRow);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  const colWidths = [{ wch: 35 }]; // SCOPE column
  bids.forEach(() => {
    colWidths.push({ wch: 15 }); // COST
    colWidths.push({ wch: 12 }); // COST/SF
    colWidths.push({ wch: 40 }); // COMMENTS
    if (colWidths.length < totalCols) {
      colWidths.push({ wch: 2 }); // Spacer
    }
  });
  ws['!cols'] = colWidths;

  // Format currency and merge cells for headers
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  // Merge bidder name headers (row 1)
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  let currentCol = 1; // Start after SCOPE column
  bids.forEach((_, index) => {
    const startCol = currentCol;
    const endCol = currentCol + 2; // Merge across 3 columns
    merges.push({
      s: { r: 0, c: startCol },
      e: { r: 0, c: endCol }
    });
    currentCol = endCol + 1;
    if (index < bids.length - 1) currentCol++; // Skip spacer
  });
  ws['!merges'] = merges;

  // Format currency columns (COST columns)
  currentCol = 1;
  bids.forEach((_, index) => {
    for (let row = 2; row <= range.e.r; row++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: currentCol });
      if (ws[cellAddr] && typeof ws[cellAddr].v === 'number') {
        ws[cellAddr].z = '$#,##0';
      }
    }
    currentCol += 3; // Move to next bidder's COST column
    if (index < bids.length - 1) currentCol++; // Skip spacer
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Leveled Comparison');
}

// Construction bid leveling Excel export
export function exportBidLevelingToExcel(selectedAnalyses: SavedAnalysis[]) {
  const wb = XLSX.utils.book_new();

  // Sort bids by total amount for consistent ranking
  const sortedBids = selectedAnalyses.sort((a, b) => a.result.total_amount - b.result.total_amount);

  // SHEET 1 - LEVELED COMPARISON (NEW PRIMARY SHEET)
  exportLeveledComparisonSheet(wb, sortedBids);
  const lowBid = sortedBids[0].result.total_amount;

  // SHEET 2 - EXECUTIVE SUMMARY
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
      variance.toFixed(1) + '%', // Display as percentage
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

      // Format currency columns (Total Amount, Dollar Difference)
      if ((col === 2 || col === 3) && row > 5) {
        if (typeof cell.v === 'string' && !isNaN(Number(cell.v))) {
          cell.v = Number(cell.v);
          cell.t = 'n';
        }
        if (typeof cell.v === 'number') {
          cell.z = '$#,##0';
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, execWS, 'Executive Summary');

  // Save
  const fileName = `bid-leveling-comparison-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Construction bid leveling PDF export
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
    const risk = calculateProjectRisk(
      Object.fromEntries(Object.entries(bid.result.csi_divisions).map(([code, data]) => [code, data.cost])),
      bid.result.total_amount,
      bid.result.uncategorizedTotal || 0,
      bid.result
    );

    return [
      (index + 1).toString(),
      bid.result.contractor_name,
      `$${bid.result.total_amount.toLocaleString()}`,
      risk.level,
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

  // Save
  const fileName = `bid-leveling-analysis-${Date.now()}.pdf`;
  doc.save(fileName);
}