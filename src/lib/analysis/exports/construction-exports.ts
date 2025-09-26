import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AnalysisResult } from '@/types/analysis';
import { analyzeMarketVariance } from '../market-analyzer';
import { calculateProjectRisk } from '../risk-analyzer';
import { CSI_DIVISIONS } from '../csi-analyzer';

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