import jsPDF from 'jspdf';

// Extend jsPDF type to include autoTable properties
export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export function createLevelrPDFHeader(
  doc: jsPDF,
  title: string,
  pageWidth: number,
  margin: number
): number {
  // Header with branding
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 25);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, 35);

  doc.setTextColor(0, 0, 0);
  return 55; // Return yPosition after header
}

export function createExecutiveSummaryBox(
  doc: jsPDF,
  title: string,
  contractorLabel: string,
  contractorName: string,
  totalLabel: string,
  totalAmount: number,
  contentWidth: number,
  margin: number,
  yPosition: number
): number {
  // Executive Summary Box
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.setDrawColor(191, 219, 254); // Blue-200
  doc.rect(margin, yPosition - 5, contentWidth, 35, 'FD');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 5, yPosition + 5);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${contractorLabel}: ${contractorName}`, margin + 5, yPosition + 15);
  doc.text(`${totalLabel}: $${totalAmount.toLocaleString()}`, margin + 5, yPosition + 25);

  return yPosition + 45;
}

export function createPageBreakChecker(
  doc: jsPDF,
  pageHeight: number,
  margin: number
) {
  let yPosition = margin;

  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const updateYPosition = (newY: number) => {
    yPosition = newY;
  };

  const getCurrentY = () => yPosition;

  return { checkPageBreak, updateYPosition, getCurrentY };
}

export function addLevelrFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  reportType: string
): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Levelr ${reportType} - Confidential`, margin, pageHeight - 15);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - 15);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, pageHeight - 8);

    // Branding
    doc.text(`Powered by Levelr Platform | ${reportType}`, pageWidth - margin - 120, pageHeight - 8);
  }
}

export function addProjectDetailsSection(
  doc: jsPDF,
  analysis: { project_name?: string; proposal_date?: string; bid_date?: string; timeline?: string },
  margin: number,
  yPosition: number,
  checkPageBreak: (space?: number) => boolean
): number {
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

  const dateField = analysis.proposal_date || analysis.bid_date;
  if (dateField) {
    const label = analysis.proposal_date ? 'Proposal Date' : 'Bid Date';
    doc.text(`${label}: ${new Date(dateField).toLocaleDateString()}`, margin + 5, yPosition);
    yPosition += 8;
  }

  if (analysis.timeline) {
    doc.text(`Timeline: ${analysis.timeline}`, margin + 5, yPosition);
    yPosition += 8;
  }

  return yPosition + 10;
}

export function addExclusionsAndAssumptions(
  doc: jsPDF,
  analysis: { exclusions?: string[]; assumptions?: string[] },
  margin: number,
  contentWidth: number,
  yPosition: number,
  checkPageBreak: (space?: number) => boolean
): number {
  if (!analysis.exclusions?.length && !analysis.assumptions?.length) {
    return yPosition;
  }

  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Exclusions & Assumptions', margin, yPosition);
  yPosition += 10;

  if (analysis.exclusions?.length) {
    checkPageBreak(15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Exclusions:', margin + 5, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    analysis.exclusions.forEach((exclusion: string) => {
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
    analysis.assumptions.forEach((assumption: string) => {
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

  return yPosition;
}

export function generatePDFFilename(
  analysisType: string,
  contractorName: string
): string {
  const sanitizedContractorName = contractorName.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `Levelr_${analysisType}_${sanitizedContractorName}_${timestamp}.pdf`;
}