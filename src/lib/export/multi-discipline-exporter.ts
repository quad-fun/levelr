// src/lib/export/multi-discipline-exporter.ts

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { AnalysisResult, MarketVariance, RiskAssessment } from '@/types/analysis';

export interface ExportOptions {
  format: 'pdf' | 'excel';
  sections: string[];
  includeCharts: boolean;
  includeComparison: boolean;
  customBranding?: {
    companyName?: string;
    companyLogo?: string;
    primaryColor?: string;
  };
}

export class MultiDisciplineExporter {
  
  static async generateReport(
    analysis: AnalysisResult,
    marketVariance?: MarketVariance,
    riskAssessment?: RiskAssessment,
    options: ExportOptions = {
      format: 'pdf',
      sections: ['overview', 'scope', 'commercial', 'risk'],
      includeCharts: true,
      includeComparison: true
    }
  ): Promise<Blob> {
    
    if (options.format === 'pdf') {
      return this.generatePDFReport(analysis, marketVariance, riskAssessment, options);
    } else {
      return this.generateExcelReport(analysis, marketVariance, riskAssessment, options);
    }
  }

  // PDF Export Functions
  private static async generatePDFReport(
    analysis: AnalysisResult,
    marketVariance?: MarketVariance,
    riskAssessment?: RiskAssessment,
    options?: ExportOptions
  ): Promise<Blob> {
    const defaultOptions: ExportOptions = {
      format: 'pdf',
      sections: ['overview', 'scope', 'commercial', 'risk'],
      includeCharts: true,
      includeComparison: true,
      ...options
    };
    const doc = new jsPDF();
    let yPosition = 20;

    // Document setup
    // const { primaryColor = '#2563eb' } = defaultOptions.customBranding || {};
    
    // Header
    yPosition = this.addPDFHeader(doc, analysis, yPosition, defaultOptions.customBranding);
    
    // Overview Section
    if (defaultOptions.sections.includes('overview')) {
      yPosition = this.addOverviewSection(doc, analysis, yPosition, marketVariance, riskAssessment);
    }
    
    // Scope Section (discipline-specific)
    if (defaultOptions.sections.includes('scope')) {
      yPosition = this.addScopeSection(doc, analysis, yPosition);
    }
    
    // Commercial Section
    if (defaultOptions.sections.includes('commercial')) {
      yPosition = this.addCommercialSection(doc, analysis, yPosition);
    }
    
    // Risk Analysis Section
    if (defaultOptions.sections.includes('risk') && riskAssessment) {
      this.addRiskSection(doc, riskAssessment, yPosition);
    }
    
    // Footer
    this.addPDFFooter(doc, analysis);
    
    return new Promise((resolve) => {
      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    });
  }

  private static addPDFHeader(
    doc: jsPDF, 
    analysis: AnalysisResult,
    yPos: number,
    branding?: ExportOptions['customBranding']
  ): number {
    const disciplineConfig = {
      construction: { title: 'Construction Analysis Report', icon: '🏗️', color: '#2563eb' },
      design: { title: 'Design Services Analysis Report', icon: '📐', color: '#7c3aed' },
      trade: { title: 'Trade Services Analysis Report', icon: '⚡', color: '#059669' }
    };
    
    const config = disciplineConfig[analysis.discipline];
    
    // Company logo/name
    if (branding?.companyLogo) {
      // Add logo logic here
      doc.setFontSize(20);
    } else if (branding?.companyName) {
      doc.setFontSize(16);
      doc.setTextColor(100);
      doc.text(branding.companyName, 20, yPos);
      yPos += 15;
    }
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.text(config.title, 20, yPos);
    yPos += 15;
    
    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`${analysis.contractor_name} | ${analysis.project_name || 'Untitled Project'}`, 20, yPos);
    yPos += 10;
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 20;
    
    return yPos;
  }

  private static addOverviewSection(
    doc: jsPDF, 
    analysis: AnalysisResult,
    yPos: number,
    marketVariance?: MarketVariance,
    _riskAssessment?: RiskAssessment
  ): number {
    // Section header
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Executive Summary', 20, yPos);
    yPos += 10;
    
    // Key metrics
    doc.setFontSize(12);
    doc.setTextColor(50);
    
    const metrics = [
      `Total Amount: ${this.formatCurrency(analysis.total_amount)}`,
      `Discipline: ${analysis.discipline.charAt(0).toUpperCase() + analysis.discipline.slice(1)}`,
      `Coverage: ${(analysis.categorizationPercentage || 0).toFixed(1)}%`,
      `Document Quality: ${analysis.document_quality?.replace('_', ' ') || 'Unknown'}`
    ];
    
    if (analysis.gross_sqft) {
      metrics.push(`Cost per SF: ${this.formatCurrency(analysis.total_amount / analysis.gross_sqft)}`);
    }
    
    metrics.forEach(metric => {
      doc.text(metric, 20, yPos);
      yPos += 8;
    });
    yPos += 10;
    
    // Market analysis
    if (marketVariance) {
      doc.setFontSize(14);
      doc.text('Market Position', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      const statusColor = marketVariance.status === 'ABOVE_MARKET' ? [220, 53, 69] :
                         marketVariance.status === 'BELOW_MARKET' ? [13, 110, 253] : [25, 135, 84];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`Status: ${marketVariance.status.replace('_', ' ')}`, 20, yPos);
      yPos += 6;
      
      doc.setTextColor(50);
      const messageLines = doc.splitTextToSize(marketVariance.message, 170);
      messageLines.forEach((line: string) => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
      yPos += 8;
      
      doc.setFontSize(10);
      doc.text(`Recommendation: ${marketVariance.recommendation}`, 20, yPos);
      yPos += 15;
    }
    
    return yPos;
  }

  private static addScopeSection(doc: jsPDF, analysis: AnalysisResult, yPos: number): number {
    doc.setFontSize(16);
    doc.setTextColor(0);
    
    if (analysis.discipline === 'construction') {
      doc.text('CSI Division Breakdown', 20, yPos);
      yPos += 10;
      
      // CSI divisions table
      const divisions = Object.entries(analysis.csi_divisions)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 15); // Limit for space
      
      divisions.forEach(([code, division]) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`Division ${code}`, 20, yPos);
        doc.text(this.formatCurrency(division.cost), 120, yPos);
        
        if (division.estimatedPercentage) {
          doc.text(`${division.estimatedPercentage.toFixed(1)}%`, 160, yPos);
        }
        
        yPos += 6;
        
        if (division.items.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(100);
          const items = division.items.slice(0, 3).join(', ');
          const itemLines = doc.splitTextToSize(items, 160);
          itemLines.slice(0, 2).forEach((line: string) => {
            doc.text(line, 25, yPos);
            yPos += 4;
          });
        }
        yPos += 3;
      });
      
    } else if (analysis.discipline === 'design' && analysis.aia_phases) {
      doc.text('AIA Phase Breakdown', 20, yPos);
      yPos += 10;
      
      Object.entries(analysis.aia_phases).forEach(([_phaseKey, phase]) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(0);
        const phaseName = phase.phase_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.text(phaseName, 20, yPos);
        doc.text(this.formatCurrency(phase.fee_amount), 120, yPos);
        doc.text(`${phase.percentage_of_total}%`, 160, yPos);
        yPos += 8;
      });
      
    } else if (analysis.discipline === 'trade' && analysis.technical_systems) {
      doc.text('Technical Systems Breakdown', 20, yPos);
      yPos += 10;
      
      Object.entries(analysis.technical_systems).forEach(([_systemKey, system]) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(system.system_name, 20, yPos);
        doc.text(this.formatCurrency(system.total_cost), 120, yPos);
        doc.text(system.category, 160, yPos);
        yPos += 8;
      });
    }
    
    return yPos + 15;
  }

  private static addCommercialSection(doc: jsPDF, analysis: AnalysisResult, yPos: number): number {
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Commercial Terms', 20, yPos);
    yPos += 10;
    
    // Cost structure
    doc.setFontSize(12);
    doc.text('Cost Structure', 20, yPos);
    yPos += 8;
    
    const costItems = [
      { label: 'Base Amount', value: analysis.base_bid_amount || analysis.total_amount },
      { label: 'Direct Costs', value: analysis.direct_costs },
      { label: 'Total Amount', value: analysis.total_amount, isBold: true }
    ];
    
    if (analysis.project_overhead) {
      costItems.splice(-1, 0, { label: 'Overhead', value: analysis.project_overhead.total_overhead });
    }
    
    costItems.forEach(item => {
      if (item.value !== undefined) {
        doc.setFontSize(item.isBold ? 12 : 11);
        doc.setFont('helvetica', item.isBold ? 'bold' : 'normal');
        doc.text(`${item.label}:`, 25, yPos);
        doc.text(this.formatCurrency(item.value), 120, yPos);
        yPos += 7;
      }
    });
    
    yPos += 10;
    
    // Assumptions and exclusions
    if (analysis.assumptions && analysis.assumptions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Key Assumptions', 20, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      analysis.assumptions.slice(0, 5).forEach(assumption => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        const lines = doc.splitTextToSize(`• ${assumption}`, 170);
        lines.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 4;
        });
        yPos += 2;
      });
      yPos += 8;
    }
    
    if (analysis.exclusions && analysis.exclusions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Exclusions', 20, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      analysis.exclusions.slice(0, 5).forEach(exclusion => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        const lines = doc.splitTextToSize(`• ${exclusion}`, 170);
        lines.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 4;
        });
        yPos += 2;
      });
    }
    
    return yPos + 15;
  }

  private static addRiskSection(doc: jsPDF, riskAssessment: RiskAssessment, yPos: number): number {
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Risk Analysis', 20, yPos);
    yPos += 10;
    
    // Risk level
    doc.setFontSize(12);
    doc.text(`Risk Level: ${riskAssessment.level}`, 20, yPos);
    doc.text(`Risk Score: ${riskAssessment.score}/100`, 120, yPos);
    yPos += 10;
    
    // Risk factors
    if (riskAssessment.factors.length > 0) {
      doc.setFontSize(12);
      doc.text('Risk Factors', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      riskAssessment.factors.slice(0, 10).forEach(factor => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        const lines = doc.splitTextToSize(`• ${factor}`, 170);
        lines.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 4;
        });
        yPos += 2;
      });
    }
    
    return yPos + 15;
  }

  private static addPDFFooter(doc: jsPDF, analysis: AnalysisResult): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      
      // Footer text
      doc.text(`${analysis.discipline.charAt(0).toUpperCase() + analysis.discipline.slice(1)} Analysis Report`, 20, 285);
      doc.text(`Page ${i} of ${pageCount}`, 160, 285);
      doc.text('Generated by Levelr', 20, 290);
    }
  }

  // Excel Export Functions
  private static async generateExcelReport(
    analysis: AnalysisResult,
    marketVariance?: MarketVariance,
    riskAssessment?: RiskAssessment,
    options?: ExportOptions
  ): Promise<Blob> {
    const defaultOptions: ExportOptions = {
      format: 'excel',
      sections: ['overview', 'scope', 'commercial', 'risk'],
      includeCharts: true,
      includeComparison: true,
      ...options
    };
    const workbook = XLSX.utils.book_new();
    
    // Overview sheet
    if (defaultOptions.sections.includes('overview')) {
      const overviewSheet = this.createOverviewSheet(analysis, marketVariance, riskAssessment);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
    }
    
    // Scope sheet (discipline-specific)
    if (defaultOptions.sections.includes('scope')) {
      const scopeSheet = this.createScopeSheet(analysis);
      XLSX.utils.book_append_sheet(workbook, scopeSheet, 'Scope Analysis');
    }
    
    // Commercial sheet
    if (defaultOptions.sections.includes('commercial')) {
      const commercialSheet = this.createCommercialSheet(analysis);
      XLSX.utils.book_append_sheet(workbook, commercialSheet, 'Commercial Terms');
    }
    
    // Risk sheet
    if (defaultOptions.sections.includes('risk') && riskAssessment) {
      const riskSheet = this.createRiskSheet(riskAssessment);
      XLSX.utils.book_append_sheet(workbook, riskSheet, 'Risk Analysis');
    }
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  private static createOverviewSheet(
    analysis: AnalysisResult,
    marketVariance?: MarketVariance,
    riskAssessment?: RiskAssessment
  ) {
    const data = [
      ['ANALYSIS OVERVIEW'],
      [],
      ['Contractor', analysis.contractor_name],
      ['Project', analysis.project_name || 'Untitled'],
      ['Discipline', analysis.discipline.charAt(0).toUpperCase() + analysis.discipline.slice(1)],
      ['Total Amount', analysis.total_amount],
      ['Document Quality', analysis.document_quality?.replace('_', ' ') || 'Unknown'],
      ['Coverage Percentage', `${(analysis.categorizationPercentage || 0).toFixed(1)}%`],
      ['Analysis Date', new Date().toLocaleDateString()],
      []
    ];
    
    if (analysis.gross_sqft) {
      data.push(['Gross Square Feet', analysis.gross_sqft]);
      data.push(['Cost per SF', analysis.total_amount / analysis.gross_sqft]);
      data.push([]);
    }
    
    if (marketVariance) {
      data.push(['MARKET ANALYSIS']);
      data.push([]);
      data.push(['Market Status', marketVariance.status.replace('_', ' ')]);
      data.push(['Market Message', marketVariance.message]);
      data.push(['Recommendation', marketVariance.recommendation]);
      data.push([]);
    }
    
    if (riskAssessment) {
      data.push(['RISK ASSESSMENT']);
      data.push([]);
      data.push(['Risk Level', riskAssessment.level]);
      data.push(['Risk Score', `${riskAssessment.score}/100`]);
    }
    
    return XLSX.utils.aoa_to_sheet(data);
  }

  private static createScopeSheet(analysis: AnalysisResult) {
    let data: unknown[][] = [];
    
    if (analysis.discipline === 'construction') {
      data = [
        ['CSI DIVISION BREAKDOWN'],
        [],
        ['Division', 'Code', 'Description', 'Cost', 'Percentage', 'Items']
      ];
      
      Object.entries(analysis.csi_divisions)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([code, division]) => {
          data.push([
            `Division ${code}`,
            code,
            division.items.slice(0, 3).join(', '),
            division.cost,
            division.estimatedPercentage ? `${division.estimatedPercentage.toFixed(1)}%` : '',
            division.items.join(', ')
          ]);
        });
        
    } else if (analysis.discipline === 'design' && analysis.aia_phases) {
      data = [
        ['AIA PHASE BREAKDOWN'],
        [],
        ['Phase', 'Fee Amount', 'Percentage of Total', 'Deliverables', 'Notes']
      ];
      
      Object.entries(analysis.aia_phases).forEach(([_phaseKey, phase]) => {
        data.push([
          phase.phase_name.replace(/_/g, ' '),
          phase.fee_amount,
          `${phase.percentage_of_total}%`,
          phase.deliverables.map(d => d.description).join(', '),
          phase.scope_notes || ''
        ]);
      });
      
    } else if (analysis.discipline === 'trade' && analysis.technical_systems) {
      data = [
        ['TECHNICAL SYSTEMS BREAKDOWN'],
        [],
        ['System', 'Category', 'Total Cost', 'Equipment Cost', 'Labor Cost', 'Notes']
      ];
      
      Object.entries(analysis.technical_systems).forEach(([_systemKey, system]) => {
        data.push([
          system.system_name,
          system.category,
          system.total_cost,
          system.equipment_cost || '',
          system.labor_cost || '',
          system.scope_notes || ''
        ]);
      });
    }
    
    return XLSX.utils.aoa_to_sheet(data);
  }

  private static createCommercialSheet(analysis: AnalysisResult) {
    const data = [
      ['COMMERCIAL TERMS'],
      [],
      ['COST STRUCTURE'],
      ['Item', 'Amount'],
      ['Total Amount', analysis.total_amount],
      ['Base Bid Amount', analysis.base_bid_amount || analysis.total_amount],
    ];
    
    if (analysis.direct_costs) {
      data.push(['Direct Costs', analysis.direct_costs]);
    }
    
    if (analysis.project_overhead) {
      data.push(['Total Overhead', analysis.project_overhead.total_overhead]);
    }
    
    data.push([]);
    
    if (analysis.assumptions && analysis.assumptions.length > 0) {
      data.push(['KEY ASSUMPTIONS']);
      data.push([]);
      analysis.assumptions.forEach(assumption => {
        data.push([assumption]);
      });
      data.push([]);
    }
    
    if (analysis.exclusions && analysis.exclusions.length > 0) {
      data.push(['EXCLUSIONS']);
      data.push([]);
      analysis.exclusions.forEach(exclusion => {
        data.push([exclusion]);
      });
    }
    
    return XLSX.utils.aoa_to_sheet(data);
  }

  private static createRiskSheet(riskAssessment: RiskAssessment) {
    const data = [
      ['RISK ANALYSIS'],
      [],
      ['Risk Level', riskAssessment.level],
      ['Risk Score', `${riskAssessment.score}/100`],
      [],
      ['RISK FACTORS'],
      []
    ];
    
    riskAssessment.factors.forEach(factor => {
      data.push([factor]);
    });
    
    return XLSX.utils.aoa_to_sheet(data);
  }

  // Utility functions
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

// Export utility function
export async function exportAnalysis(
  analysis: AnalysisResult,
  marketVariance?: MarketVariance,
  riskAssessment?: RiskAssessment,
  options?: Partial<ExportOptions>
): Promise<void> {
  const defaultOptions: ExportOptions = {
    format: 'pdf',
    sections: ['overview', 'scope', 'commercial', 'risk'],
    includeCharts: true,
    includeComparison: true,
    ...options
  };
  
  try {
    const reportBlob = await MultiDisciplineExporter.generateReport(
      analysis, 
      marketVariance, 
      riskAssessment, 
      defaultOptions
    );
    
    // Create download
    const url = URL.createObjectURL(reportBlob);
    const link = document.createElement('a');
    link.href = url;
    
    const disciplineTitle = analysis.discipline.charAt(0).toUpperCase() + analysis.discipline.slice(1);
    const fileName = `${disciplineTitle}_Analysis_${analysis.contractor_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${defaultOptions.format === 'pdf' ? 'pdf' : 'xlsx'}`;
    
    link.download = fileName;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to generate report');
  }
}