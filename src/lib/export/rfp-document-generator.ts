// src/lib/export/rfp-document-generator.ts

import { RFPProject } from '@/types/rfp';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export interface RFPExportOptions {
  format: 'pdf' | 'word' | 'excel';
  sections: string[];
  includeEvaluationSheets: boolean;
  includeScopeMatrix: boolean;
}

export async function generateRFPDocument(
  project: RFPProject, 
  options: RFPExportOptions
): Promise<Blob> {
  switch (options.format) {
    case 'pdf':
      return generatePDFDocument(project, options);
    case 'word':
      return generateWordDocument(project, options);
    case 'excel':
      return generateExcelDocument(project, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

async function generatePDFDocument(project: RFPProject, _options: RFPExportOptions): Promise<Blob> {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Cover Page
  doc.setFontSize(24);
  doc.text('REQUEST FOR PROPOSAL', 105, yPosition, { align: 'center' });
  yPosition += 20;
  
  doc.setFontSize(16);
  doc.text(project.projectName, 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.text(`${project.location.address}, ${project.location.city}, ${project.location.state} ${project.location.zipCode}`, 105, yPosition, { align: 'center' });
  yPosition += 30;
  
  // Project Overview
  doc.setFontSize(14);
  doc.text('PROJECT OVERVIEW', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(project.description, 170);
  doc.text(lines, 20, yPosition);
  yPosition += lines.length * 5 + 10;
  
  // Project Details
  doc.text(`Estimated Value: ${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(project.estimatedValue)}`, 20, yPosition);
  yPosition += 7;
  
  doc.text(`Proposal Deadline: ${new Date(project.timeline.proposalDeadline).toLocaleDateString()}`, 20, yPosition);
  yPosition += 7;
  
  doc.text(`Construction Start: ${new Date(project.timeline.constructionStart).toLocaleDateString()}`, 20, yPosition);
  yPosition += 7;
  
  doc.text(`Project Completion: ${new Date(project.timeline.completion).toLocaleDateString()}`, 20, yPosition);
  yPosition += 15;
  
  // Scope of Work
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text('SCOPE OF WORK', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  if (project.scopeDefinition.csiDivisions) {
    Object.entries(project.scopeDefinition.csiDivisions).forEach(([divisionCode, division]) => {
      doc.setFont('helvetica', 'bold');
      const divisionText = `${divisionCode}: CSI Division`;
      doc.text(divisionText, 20, yPosition);
      yPosition += 7;
      
      doc.setFont('helvetica', 'normal');
      division.specifications.forEach((spec) => {
        const specText = `• ${spec}`;
        doc.text(specText, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
  }
  
  // Commercial Terms
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text('COMMERCIAL TERMS', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.text(`Pricing Structure: ${project.commercialTerms.pricingStructure}`, 20, yPosition);
  yPosition += 7;
  
  doc.text(`Payment Schedule: ${project.commercialTerms.paymentSchedule}`, 20, yPosition);
  yPosition += 7;
  
  doc.text(`Retainage: ${project.commercialTerms.retainage}%`, 20, yPosition);
  yPosition += 10;
  
  // Insurance Requirements
  doc.setFont('helvetica', 'bold');
  const insuranceTitle = 'Insurance Requirements:';
  doc.text(insuranceTitle, 20, yPosition);
  yPosition += 7;
  
  doc.setFont('helvetica', 'normal');
  project.commercialTerms.insuranceRequirements.forEach((req) => {
    const insuranceText = `• ${req.type}: $${req.minimumAmount.toLocaleString()}`;
    doc.text(insuranceText, 25, yPosition);
    yPosition += 5;
  });
  
  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

async function generateWordDocument(project: RFPProject, _options: RFPExportOptions): Promise<Blob> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: 'REQUEST FOR PROPOSAL',
              bold: true,
              size: 48,
            }),
          ],
          heading: HeadingLevel.TITLE,
        }),
        
        // Project Name
        new Paragraph({
          children: [
            new TextRun({
              text: project.projectName,
              bold: true,
              size: 32,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
        }),
        
        // Location
        new Paragraph({
          children: [
            new TextRun({
              text: `${project.location.address}, ${project.location.city}, ${project.location.state} ${project.location.zipCode}`,
              size: 24,
            }),
          ],
        }),
        
        new Paragraph({
          children: [new TextRun({ text: '' })],
        }),
        
        // Project Overview
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROJECT OVERVIEW',
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: project.description,
              size: 22,
            }),
          ],
        }),
        
        new Paragraph({
          children: [new TextRun({ text: '' })],
        }),
        
        // Project Details
        new Paragraph({
          children: [
            new TextRun({
              text: `Estimated Value: ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(project.estimatedValue)}`,
              size: 22,
            }),
          ],
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Proposal Deadline: ${new Date(project.timeline.proposalDeadline).toLocaleDateString()}`,
              size: 22,
            }),
          ],
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Construction Start: ${new Date(project.timeline.constructionStart).toLocaleDateString()}`,
              size: 22,
            }),
          ],
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Project Completion: ${new Date(project.timeline.completion).toLocaleDateString()}`,
              size: 22,
            }),
          ],
        }),
        
        new Paragraph({
          children: [new TextRun({ text: '' })],
        }),
        
        // Scope of Work
        new Paragraph({
          children: [
            new TextRun({
              text: 'SCOPE OF WORK',
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
        }),
      ],
    }],
  });
  
  // Note: Additional scope details would be added here in a more complex implementation
  
  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
}

async function generateExcelDocument(project: RFPProject, options: RFPExportOptions): Promise<Blob> {
  const wb = XLSX.utils.book_new();
  
  // Summary Sheet
  const summaryData = [
    ['PROJECT SUMMARY'],
    [''],
    ['Project Name', project.projectName],
    ['Location', `${project.location.address}, ${project.location.city}, ${project.location.state} ${project.location.zipCode}`],
    ['Estimated Value', project.estimatedValue],
    ['Proposal Deadline', new Date(project.timeline.proposalDeadline).toLocaleDateString()],
    ['Construction Start', new Date(project.timeline.constructionStart).toLocaleDateString()],
    ['Project Completion', new Date(project.timeline.completion).toLocaleDateString()],
    [''],
    ['Description'],
    [project.description],
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Project Summary');
  
  // Scope Matrix Sheet
  if (project.scopeDefinition.csiDivisions) {
    const scopeData = [
      ['CSI DIVISION', 'NAME', 'SPECIFICATIONS'],
      [''],
    ];
    
    Object.entries(project.scopeDefinition.csiDivisions).forEach(([divisionCode, division]) => {
      const specsText = division.specifications.join(', ');
      scopeData.push([divisionCode, `CSI Division ${divisionCode}`, specsText]);
    });
    
    const scopeWs = XLSX.utils.aoa_to_sheet(scopeData);
    XLSX.utils.book_append_sheet(wb, scopeWs, 'Scope Matrix');
  }
  
  // Evaluation Criteria Sheet
  if (options.includeEvaluationSheets && project.submissionRequirements.evaluationCriteria.length > 0) {
    const evalData = [
      ['EVALUATION CRITERIA'],
      [''],
      ['Criteria', 'Weight (%)', 'Description'],
    ];
    
    project.submissionRequirements.evaluationCriteria.forEach((criteria) => {
      evalData.push([criteria.category, criteria.weight.toString(), criteria.description || '']);
    });
    
    const evalWs = XLSX.utils.aoa_to_sheet(evalData);
    XLSX.utils.book_append_sheet(wb, evalWs, 'Evaluation Criteria');
  }
  
  // Bid Comparison Template
  const bidData = [
    ['BID COMPARISON TEMPLATE'],
    [''],
    ['Contractor Name', 'Total Bid', 'Technical Score', 'Commercial Score', 'Overall Score', 'Ranking'],
    ['Contractor A', '', '', '', '', ''],
    ['Contractor B', '', '', '', '', ''],
    ['Contractor C', '', '', '', '', ''],
    ['Contractor D', '', '', '', '', ''],
    ['Contractor E', '', '', '', '', ''],
  ];
  
  const bidWs = XLSX.utils.aoa_to_sheet(bidData);
  XLSX.utils.book_append_sheet(wb, bidWs, 'Bid Comparison');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}