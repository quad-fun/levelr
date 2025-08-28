// src/types/rfp.ts

export interface RFPProject {
  id: string;
  projectName: string;
  projectType: 'commercial_office' | 'retail' | 'industrial' | 'residential' | 'mixed_use' | 'infrastructure';
  description: string;
  estimatedValue: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  timeline: {
    rfpIssueDate: string;
    questionsDeadline: string;
    proposalDeadline: string;
    awardDate: string;
    constructionStart: string;
    completion: string;
  };
  scopeDefinition: {
    csiDivisions: Record<string, CSIScopeItem>;
    specialRequirements: string[];
    exclusions: string[];
    deliveryMethod: 'design_bid_build' | 'design_build' | 'cm_at_risk';
    contractType: 'lump_sum' | 'unit_price' | 'cost_plus';
  };
  siteConditions: {
    siteAccess: string;
    utilitiesAvailable: string[];
    environmentalConcerns: string[];
    specialConstraints: string[];
  };
  commercialTerms: {
    pricingStructure: 'lump_sum' | 'unit_price' | 'cost_plus' | 'hybrid';
    paymentSchedule: 'monthly' | 'milestone' | 'custom';
    retainage: number;
    bondingRequired: boolean;
    insuranceRequirements: InsuranceRequirement[];
    changeOrderProcedures: string;
  };
  qualificationCriteria: {
    minimumExperience: number;
    requiredProjectTypes: string[];
    minimumAnnualRevenue: number;
    keyPersonnelRequirements: string[];
    safetyRequirements: string[];
    certificationRequirements: string[];
  };
  submissionRequirements: {
    technicalProposal: string[];
    commercialProposal: string[];
    qualifications: string[];
    references: number;
    presentationRequired: boolean;
    evaluationCriteria: EvaluationCriterion[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CSIScopeItem {
  included: boolean;
  description: string;
  specifications: string[];
  performanceRequirements: string[];
  notes: string;
  estimatedPercentage?: number; // From market intelligence
}

export interface InsuranceRequirement {
  type: 'general_liability' | 'workers_comp' | 'auto' | 'umbrella' | 'professional';
  minimumAmount: number;
  description: string;
  additionalInsureds: string[];
}

export interface EvaluationCriterion {
  category: string;
  weight: number;
  description: string;
}

export interface SavedRFP {
  id: string;
  timestamp: string;
  project: RFPProject;
  status: 'draft' | 'issued' | 'closed';
  receivedBids?: string[]; // Links to analyzed bids
}

export interface RFPTemplate {
  id: string;
  name: string;
  projectType: RFPProject['projectType'];
  description: string;
  defaultSections: {
    scope: Record<string, Partial<CSIScopeItem>>;
    commercialTerms: Partial<RFPProject['commercialTerms']>;
    qualifications: Partial<RFPProject['qualificationCriteria']>;
  };
}

export interface RFPGenerationRequest {
  projectType: RFPProject['projectType'];
  estimatedValue: number;
  csiDivisions: string[];
  sectionType: 'scope' | 'commercial' | 'qualifications';
  context: Record<string, unknown>;
}

export interface RFPExportOptions {
  format: 'pdf' | 'word' | 'excel';
  sections: string[];
  includeEvaluationSheets: boolean;
  includeScopeMatrix: boolean;
  customStyling?: {
    companyLogo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

// CSI Division metadata for RFP scope building
export interface CSIDivisionInfo {
  code: string;
  name: string;
  description: string;
  commonItems: string[];
  typicalPercentage: {
    commercial: number;
    residential: number;
    industrial: number;
  };
  dependencies: string[]; // Other divisions typically required with this one
  riskFactors: string[];
}

// Project type templates
export const PROJECT_TYPE_TEMPLATES: Record<RFPProject['projectType'], {
  name: string;
  description: string;
  icon: string;
  typicalCSIDivisions: string[];
  commonRequirements: string[];
}> = {
  commercial_office: {
    name: 'Commercial Office',
    description: 'Office buildings, corporate headquarters, multi-tenant facilities',
    icon: '🏢',
    typicalCSIDivisions: ['01', '03', '05', '06', '07', '08', '09', '21', '22', '23', '26', '27'],
    commonRequirements: ['HVAC systems', 'Fire suppression', 'Security systems', 'Elevator systems']
  },
  retail: {
    name: 'Retail',
    description: 'Shopping centers, standalone stores, restaurants',
    icon: '🏬',
    typicalCSIDivisions: ['01', '03', '06', '07', '08', '09', '11', '22', '23', '26'],
    commonRequirements: ['Storefront systems', 'Commercial kitchen equipment', 'POS infrastructure']
  },
  industrial: {
    name: 'Industrial',
    description: 'Manufacturing facilities, warehouses, distribution centers',
    icon: '🏭',
    typicalCSIDivisions: ['01', '03', '05', '07', '11', '22', '23', '26', '31', '32'],
    commonRequirements: ['Heavy equipment foundations', 'Industrial electrical', 'Specialized ventilation']
  },
  residential: {
    name: 'Residential',
    description: 'Single-family homes, multi-family housing, apartments',
    icon: '🏘️',
    typicalCSIDivisions: ['01', '03', '06', '07', '08', '09', '22', '23', '26'],
    commonRequirements: ['Residential fixtures', 'Code compliance', 'Energy efficiency']
  },
  mixed_use: {
    name: 'Mixed Use',
    description: 'Combined residential, commercial, and retail developments',
    icon: '🏙️',
    typicalCSIDivisions: ['01', '03', '05', '06', '07', '08', '09', '21', '22', '23', '26', '27'],
    commonRequirements: ['Multiple occupancy systems', 'Shared utilities', 'Parking structures']
  },
  infrastructure: {
    name: 'Infrastructure',
    description: 'Roads, bridges, utilities, public works projects',
    icon: '🛣️',
    typicalCSIDivisions: ['01', '02', '03', '31', '32', '33'],
    commonRequirements: ['Traffic control', 'Environmental compliance', 'Public safety measures']
  }
};

export const DEFAULT_INSURANCE_REQUIREMENTS: InsuranceRequirement[] = [
  {
    type: 'general_liability',
    minimumAmount: 1000000,
    description: 'General Liability Insurance',
    additionalInsureds: ['Owner', 'Architect']
  },
  {
    type: 'workers_comp',
    minimumAmount: 1000000,
    description: 'Workers Compensation Insurance',
    additionalInsureds: []
  },
  {
    type: 'auto',
    minimumAmount: 1000000,
    description: 'Commercial Automobile Liability',
    additionalInsureds: ['Owner']
  }
];

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  { category: 'Technical Approach', weight: 30, description: 'Quality and feasibility of proposed technical solution' },
  { category: 'Experience & Qualifications', weight: 25, description: 'Relevant project experience and team qualifications' },
  { category: 'Price', weight: 25, description: 'Competitive pricing and value proposition' },
  { category: 'Schedule', weight: 10, description: 'Realistic timeline and milestone planning' },
  { category: 'Safety Record', weight: 10, description: 'Safety performance history and program' }
];