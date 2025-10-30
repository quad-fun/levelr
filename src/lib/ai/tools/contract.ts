// src/lib/ai/tools/contract.ts

import type { CsiLine, Risk } from '@/types/analysis';

export interface ContractToolResult {
  risks: Risk[];
  insights: string[];
}

/**
 * Contract terms and conditions risk detector
 * Browser-first deterministic analysis
 */
export function analyzeContractRisks(lines: CsiLine[], metadata: {
  fileName: string;
  totalAmount: number;
  contractorName: string;
}): ContractToolResult {
  const risks: Risk[] = [];
  const insights: string[] = [];

  // Check for payment terms
  const hasPaymentTerms = lines.some(line =>
    line.description.toLowerCase().includes('payment') ||
    line.description.toLowerCase().includes('billing') ||
    line.description.toLowerCase().includes('invoice') ||
    line.description.toLowerCase().includes('progress payment')
  );

  if (!hasPaymentTerms) {
    risks.push({
      id: `contract-payment-${Date.now()}`,
      category: 'Contract',
      severity: 2,
      title: 'Payment Terms Not Defined',
      description: 'No payment schedule or billing terms specified',
      evidence: ['No payment terms found in bid'],
      pageRefs: [],
      explanation: 'Cash flow issues if payment terms are unfavorable',
      impact: {
        financial: metadata.totalAmount * 0.05, // 5% cash flow impact
        probability: 0.3
      }
    });
    insights.push('Clarify payment schedule and retention terms');
  }

  // Check for warranty terms
  const hasWarranty = lines.some(line =>
    line.description.toLowerCase().includes('warranty') ||
    line.description.toLowerCase().includes('guarantee') ||
    line.description.toLowerCase().includes('defect') ||
    line.description.toLowerCase().includes('repair')
  );

  if (!hasWarranty) {
    risks.push({
      id: `contract-warranty-${Date.now()}`,
      category: 'Contract',
      severity: 2,
      title: 'Warranty Terms Not Specified',
      description: 'No warranty or guarantee terms mentioned',
      evidence: ['No warranty provisions found'],
      pageRefs: [],
      explanation: 'Post-completion defect responsibilities unclear',
      impact: {
        financial: metadata.totalAmount * 0.02, // 2% warranty exposure
        probability: 0.2
      }
    });
    insights.push('Define warranty periods and coverage scope');
  }

  // Check for change order provisions
  const hasChangeOrders = lines.some(line =>
    line.description.toLowerCase().includes('change order') ||
    line.description.toLowerCase().includes('additional work') ||
    line.description.toLowerCase().includes('extra') ||
    line.description.toLowerCase().includes('modification')
  );

  if (!hasChangeOrders && metadata.totalAmount > 1000000) { // $1M+ projects
    risks.push({
      id: `contract-changeorders-${Date.now()}`,
      category: 'Contract',
      severity: 3,
      title: 'Change Order Process Undefined',
      description: 'Large project without defined change order procedures',
      evidence: ['No change order process mentioned'],
      pageRefs: [],
      explanation: 'Scope changes may lead to disputes and cost overruns',
      impact: {
        financial: metadata.totalAmount * 0.1, // 10% change order risk
        probability: 0.5
      }
    });
    insights.push('Establish clear change order procedures and pricing');
  }

  // Check for insurance and bonding
  const hasInsuranceBonding = lines.some(line => {
    const desc = line.description.toLowerCase();
    return desc.includes('insurance') ||
           desc.includes('bond') ||
           desc.includes('liability') ||
           desc.includes('performance bond') ||
           desc.includes('payment bond');
  });

  if (!hasInsuranceBonding && metadata.totalAmount > 500000) { // $500K+ projects
    risks.push({
      id: `contract-insurance-${Date.now()}`,
      category: 'Contract',
      severity: 3,
      title: 'Insurance and Bonding Requirements Unclear',
      description: 'No mention of insurance or bonding requirements',
      evidence: ['No insurance/bonding provisions found'],
      pageRefs: [],
      explanation: 'Inadequate protection against contractor default or claims',
      impact: {
        financial: metadata.totalAmount * 0.15, // 15% exposure without proper coverage
        probability: 0.1
      }
    });
    insights.push('Verify insurance coverage and consider performance bonds');
  }

  // Check for dispute resolution
  const hasDisputeResolution = lines.some(line => {
    const desc = line.description.toLowerCase();
    return desc.includes('dispute') ||
           desc.includes('arbitration') ||
           desc.includes('mediation') ||
           desc.includes('claim') ||
           desc.includes('litigation');
  });

  if (!hasDisputeResolution && metadata.totalAmount > 2000000) { // $2M+ projects
    risks.push({
      id: `contract-disputes-${Date.now()}`,
      category: 'Contract',
      severity: 2,
      title: 'Dispute Resolution Process Missing',
      description: 'Large project without defined dispute resolution procedures',
      evidence: ['No dispute resolution clause found'],
      pageRefs: [],
      explanation: 'Conflicts may escalate to costly litigation',
      impact: {
        financial: metadata.totalAmount * 0.05, // 5% litigation cost risk
        timeline: 120, // 4-month delay risk
        probability: 0.15
      }
    });
    insights.push('Include arbitration or mediation clauses');
  }

  return { risks, insights };
}