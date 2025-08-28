// src/types/rfp.ts

// Multi-discipline project types
export type ProjectDiscipline = 'construction' | 'design' | 'trade';

export interface ProjectTypeOption {
  discipline: ProjectDiscipline;
  title: string;
  description: string;
  icon: string;
  color: string;
  subtypes: ProjectSubtype[];
}

export interface ProjectSubtype {
  value: string;
  name: string;
  description: string;
  scopeFramework: 'csi' | 'aia' | 'technical';
  typicalSections: string[];
}

// Scope framework abstractions
export interface ScopeFramework {
  type: 'csi' | 'aia' | 'technical';
  sections: Record<string, ScopeSection>;
}

export interface ScopeSection {
  code: string;
  title: string;
  description: string;
  included: boolean;
  specifications: string[];
  deliverables: string[];
  notes: string;
  estimatedPercentage?: number;
  dependencies?: string[];
  riskFactors?: string[];
}

// AIA phases for architectural/design services
export interface AIAPhase {
  phase: 'schematic_design' | 'design_development' | 'construction_documents' | 'bidding' | 'construction_administration';
  description: string;
  typicalDeliverables: string[];
  percentageOfFee: number;
}

// Technical specifications for trade services
export interface TechnicalSpec {
  category: 'electrical' | 'mechanical' | 'plumbing' | 'structural' | 'civil' | 'environmental';
  specifications: string[];
  standards: string[];
  testing: string[];
  certifications: string[];
}

export interface RFPProject {
  id: string;
  projectName: string;
  discipline: ProjectDiscipline;
  projectType: string; // Now flexible to support discipline-specific types
  projectSubtype?: string;
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
    framework?: ScopeFramework;
    specialRequirements: string[];
    exclusions: string[];
    deliveryMethod: 'design_bid_build' | 'design_build' | 'cm_at_risk' | 'direct_contract' | 'consultant_agreement';
    contractType: 'lump_sum' | 'unit_price' | 'cost_plus' | 'hourly' | 'percentage_of_cost';
    // Legacy CSI support for backward compatibility
    csiDivisions?: Record<string, CSIScopeItem>;
    // AIA phases for design services
    aiaPhases?: Record<string, AIAPhase>;
    // Technical specifications for trade services
    technicalSpecs?: TechnicalSpec[];
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

// Legacy CSI interface for backward compatibility
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
  discipline: ProjectDiscipline;
  projectType: string;
  description: string;
  scopeFramework: 'csi' | 'aia' | 'technical';
  defaultSections: {
    scope: Record<string, Partial<ScopeSection>>;
    commercialTerms: Partial<RFPProject['commercialTerms']>;
    qualifications: Partial<RFPProject['qualificationCriteria']>;
  };
}

export interface RFPGenerationRequest {
  discipline: ProjectDiscipline;
  projectType: string;
  estimatedValue: number;
  scopeSections: string[]; // Generic scope sections (CSI divisions, AIA phases, or technical categories)
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

// Multi-discipline project type configuration
export const DISCIPLINE_OPTIONS: Record<ProjectDiscipline, ProjectTypeOption> = {
  construction: {
    discipline: 'construction',
    title: 'Construction Services',
    description: 'General contracting, specialty construction, and building projects',
    icon: '🏗️',
    color: 'blue',
    subtypes: [
      {
        value: 'commercial_office',
        name: 'Commercial Office',
        description: 'Office buildings, corporate headquarters, multi-tenant facilities',
        scopeFramework: 'csi',
        typicalSections: ['01', '03', '05', '06', '07', '08', '09', '21', '22', '23', '26', '27']
      },
      {
        value: 'retail',
        name: 'Retail',
        description: 'Shopping centers, standalone stores, restaurants',
        scopeFramework: 'csi',
        typicalSections: ['01', '03', '06', '07', '08', '09', '11', '22', '23', '26']
      },
      {
        value: 'industrial',
        name: 'Industrial',
        description: 'Manufacturing facilities, warehouses, distribution centers',
        scopeFramework: 'csi',
        typicalSections: ['01', '03', '05', '07', '11', '22', '23', '26', '31', '32']
      },
      {
        value: 'residential',
        name: 'Residential',
        description: 'Single-family homes, multi-family housing, apartments',
        scopeFramework: 'csi',
        typicalSections: ['01', '03', '06', '07', '08', '09', '22', '23', '26']
      },
      {
        value: 'mixed_use',
        name: 'Mixed Use',
        description: 'Combined residential, commercial, and retail developments',
        scopeFramework: 'csi',
        typicalSections: ['01', '03', '05', '06', '07', '08', '09', '21', '22', '23', '26', '27']
      },
      {
        value: 'infrastructure',
        name: 'Infrastructure',
        description: 'Roads, bridges, utilities, public works projects',
        scopeFramework: 'csi',
        typicalSections: ['01', '02', '03', '31', '32', '33']
      }
    ]
  },
  design: {
    discipline: 'design',
    title: 'Design Services',
    description: 'Architecture, engineering, and professional design services',
    icon: '📐',
    color: 'purple',
    subtypes: [
      {
        value: 'architectural',
        name: 'Architectural Services',
        description: 'Building design, space planning, and architectural consulting',
        scopeFramework: 'aia',
        typicalSections: ['schematic_design', 'design_development', 'construction_documents', 'bidding', 'construction_administration']
      },
      {
        value: 'structural_engineering',
        name: 'Structural Engineering',
        description: 'Structural analysis, design, and engineering services',
        scopeFramework: 'technical',
        typicalSections: ['analysis', 'design', 'detailing', 'construction_support']
      },
      {
        value: 'civil_engineering',
        name: 'Civil Engineering',
        description: 'Site development, utilities, and infrastructure design',
        scopeFramework: 'technical',
        typicalSections: ['site_survey', 'design', 'permitting', 'construction_administration']
      },
      {
        value: 'landscape_architecture',
        name: 'Landscape Architecture',
        description: 'Site design, landscape planning, and environmental design',
        scopeFramework: 'aia',
        typicalSections: ['concept_design', 'design_development', 'construction_documents', 'construction_administration']
      },
      {
        value: 'interior_design',
        name: 'Interior Design',
        description: 'Space planning, interior architecture, and design services',
        scopeFramework: 'aia',
        typicalSections: ['programming', 'schematic_design', 'design_development', 'construction_documents']
      }
    ]
  },
  trade: {
    discipline: 'trade',
    title: 'Trade Services',
    description: 'Specialized mechanical, electrical, plumbing, and trade services',
    icon: '⚡',
    color: 'green',
    subtypes: [
      {
        value: 'electrical',
        name: 'Electrical Services',
        description: 'Electrical systems, power distribution, and technology infrastructure',
        scopeFramework: 'technical',
        typicalSections: ['power_distribution', 'lighting', 'fire_alarm', 'security', 'communications']
      },
      {
        value: 'mechanical',
        name: 'Mechanical Services',
        description: 'HVAC, plumbing, and mechanical systems',
        scopeFramework: 'technical',
        typicalSections: ['hvac', 'plumbing', 'fire_protection', 'controls', 'commissioning']
      },
      {
        value: 'plumbing',
        name: 'Plumbing Services',
        description: 'Plumbing systems, water distribution, and waste management',
        scopeFramework: 'technical',
        typicalSections: ['water_supply', 'drainage', 'fixtures', 'gas_systems']
      },
      {
        value: 'fire_protection',
        name: 'Fire Protection',
        description: 'Fire suppression, alarm systems, and life safety',
        scopeFramework: 'technical',
        typicalSections: ['sprinkler_systems', 'fire_alarm', 'suppression', 'testing']
      },
      {
        value: 'technology',
        name: 'Technology Systems',
        description: 'AV, security, communications, and smart building systems',
        scopeFramework: 'technical',
        typicalSections: ['structured_cabling', 'av_systems', 'security', 'building_automation']
      }
    ]
  }
};

// Legacy support for existing project types
export const PROJECT_TYPE_TEMPLATES: Record<string, {
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

// AIA phases configuration
export const AIA_PHASES: Record<string, AIAPhase> = {
  schematic_design: {
    phase: 'schematic_design',
    description: 'Conceptual design and basic project parameters',
    typicalDeliverables: ['Schematic drawings', 'Preliminary specifications', 'Cost estimates', 'Project schedule'],
    percentageOfFee: 15
  },
  design_development: {
    phase: 'design_development',
    description: 'Design refinement and coordination',
    typicalDeliverables: ['Design development drawings', 'Outline specifications', 'Updated cost estimates'],
    percentageOfFee: 20
  },
  construction_documents: {
    phase: 'construction_documents',
    description: 'Final drawings and specifications for construction',
    typicalDeliverables: ['Construction drawings', 'Technical specifications', 'Bidding documents'],
    percentageOfFee: 40
  },
  bidding: {
    phase: 'bidding',
    description: 'Bidding assistance and contractor selection',
    typicalDeliverables: ['Bidding support', 'Addenda', 'Contractor evaluation'],
    percentageOfFee: 5
  },
  construction_administration: {
    phase: 'construction_administration',
    description: 'Construction oversight and project closeout',
    typicalDeliverables: ['Shop drawing review', 'Site observation', 'Punch list', 'Project closeout'],
    percentageOfFee: 20
  }
};

// Technical specifications templates
export const TECHNICAL_SPEC_TEMPLATES: Record<string, TechnicalSpec> = {
  electrical_power: {
    category: 'electrical',
    specifications: ['Power distribution panels', 'Branch circuits', 'Grounding systems', 'Surge protection'],
    standards: ['NEC', 'IEEE', 'NEMA'],
    testing: ['Insulation testing', 'Ground fault testing', 'Load testing'],
    certifications: ['Electrical contractor license', 'NECA membership']
  },
  hvac_systems: {
    category: 'mechanical',
    specifications: ['HVAC units', 'Ductwork', 'Controls', 'Ventilation'],
    standards: ['ASHRAE', 'SMACNA', 'ACCA'],
    testing: ['Air balancing', 'Commissioning', 'Performance testing'],
    certifications: ['Mechanical contractor license', 'MCAA membership']
  },
  plumbing_systems: {
    category: 'plumbing',
    specifications: ['Water supply', 'Drainage systems', 'Fixtures', 'Water heaters'],
    standards: ['IPC', 'UPC', 'ASPE'],
    testing: ['Pressure testing', 'Flow testing', 'Leak testing'],
    certifications: ['Plumbing contractor license', 'PHCC membership']
  }
};

// Discipline-specific evaluation criteria
export const DISCIPLINE_EVALUATION_CRITERIA: Record<ProjectDiscipline, EvaluationCriterion[]> = {
  construction: [
    { category: 'Technical Approach', weight: 30, description: 'Quality and feasibility of proposed construction methods' },
    { category: 'Experience & Qualifications', weight: 25, description: 'Relevant construction experience and team qualifications' },
    { category: 'Price', weight: 25, description: 'Competitive pricing and value proposition' },
    { category: 'Schedule', weight: 10, description: 'Realistic construction timeline and milestone planning' },
    { category: 'Safety Record', weight: 10, description: 'Safety performance history and safety program' }
  ],
  design: [
    { category: 'Design Excellence', weight: 35, description: 'Quality of design approach and creative solutions' },
    { category: 'Technical Expertise', weight: 25, description: 'Professional qualifications and technical competence' },
    { category: 'Project Understanding', weight: 20, description: 'Demonstration of project requirements understanding' },
    { category: 'Fee Structure', weight: 15, description: 'Competitive fee and value for services' },
    { category: 'Project Management', weight: 5, description: 'Project delivery methodology and communication' }
  ],
  trade: [
    { category: 'Technical Specifications', weight: 35, description: 'Quality of technical approach and system design' },
    { category: 'Experience & Expertise', weight: 25, description: 'Relevant trade experience and certifications' },
    { category: 'Pricing', weight: 20, description: 'Competitive pricing and cost breakdown' },
    { category: 'Installation Methodology', weight: 15, description: 'Installation approach and quality control' },
    { category: 'Warranty & Service', weight: 5, description: 'Warranty terms and ongoing service capabilities' }
  ]
};

// Discipline-specific commercial terms templates
export const DISCIPLINE_COMMERCIAL_TEMPLATES: Record<ProjectDiscipline, {
  pricingOptions: Array<{ value: string; label: string; description: string; }>;
  contractTypes: Array<{ value: string; label: string; description: string; typical?: boolean; }>;
  paymentSchedules: Array<{ value: string; label: string; description: string; }>;
  typicalRetainage: number;
  bondingThreshold: number;
  insuranceDefaults: InsuranceRequirement[];
  qualificationDefaults: Partial<RFPProject['qualificationCriteria']>;
  submissionDefaults: {
    technicalProposal: string[];
    commercialProposal: string[];
    qualifications: string[];
    references: number;
  };
}> = {
  construction: {
    pricingOptions: [
      { value: 'lump_sum', label: 'Lump Sum', description: 'Fixed price for defined scope of work' },
      { value: 'unit_price', label: 'Unit Price', description: 'Payment based on actual quantities and unit rates' },
      { value: 'cost_plus', label: 'Cost Plus Fee', description: 'Reimbursable costs plus fixed or percentage fee' },
      { value: 'hybrid', label: 'Hybrid', description: 'Combination of lump sum and unit price elements' }
    ],
    contractTypes: [
      { value: 'design_bid_build', label: 'Design-Bid-Build', description: 'Traditional linear process', typical: true },
      { value: 'design_build', label: 'Design-Build', description: 'Single entity for design and construction' },
      { value: 'cm_at_risk', label: 'Construction Manager at Risk', description: 'CM provides preconstruction services' }
    ],
    paymentSchedules: [
      { value: 'monthly', label: 'Monthly Progress Payments', description: 'Based on work completed' },
      { value: 'milestone', label: 'Milestone-Based Payments', description: 'Tied to project milestones' },
      { value: 'custom', label: 'Custom Schedule', description: 'Project-specific payment terms' }
    ],
    typicalRetainage: 10,
    bondingThreshold: 100000,
    insuranceDefaults: [
      { type: 'general_liability', minimumAmount: 1000000, description: 'General Liability Insurance', additionalInsureds: ['Owner', 'Architect'] },
      { type: 'workers_comp', minimumAmount: 1000000, description: 'Workers Compensation Insurance', additionalInsureds: [] },
      { type: 'auto', minimumAmount: 1000000, description: 'Commercial Automobile Liability', additionalInsureds: ['Owner'] }
    ],
    qualificationDefaults: {
      minimumExperience: 5,
      minimumAnnualRevenue: 5000000,
      requiredProjectTypes: ['Similar construction projects', 'Projects of comparable size', 'Local/regional experience'],
      keyPersonnelRequirements: ['Licensed project manager', 'OSHA 30-hour certified superintendent'],
      safetyRequirements: ['EMR below 1.0', 'Written safety program', 'OSHA 10-hour minimum for workers'],
      certificationRequirements: ['State contractor license', 'Workers compensation coverage']
    },
    submissionDefaults: {
      technicalProposal: ['Construction methodology', 'Project schedule', 'Quality control plan', 'Safety plan'],
      commercialProposal: ['Base bid amount', 'Unit prices if applicable', 'Allowances and exclusions', 'Change order procedures'],
      qualifications: ['Company profile', 'Project team resumes', 'Financial statements', 'References'],
      references: 3
    }
  },
  design: {
    pricingOptions: [
      { value: 'percentage_of_cost', label: 'Percentage of Construction Cost', description: 'Fee as percentage of project cost' },
      { value: 'lump_sum', label: 'Lump Sum', description: 'Fixed fee for defined services' },
      { value: 'hourly', label: 'Hourly Rates', description: 'Time-based billing for services' },
      { value: 'cost_plus', label: 'Cost Plus Fee', description: 'Reimbursable expenses plus fee' }
    ],
    contractTypes: [
      { value: 'consultant_agreement', label: 'Professional Services Agreement', description: 'Standard design consultant contract', typical: true },
      { value: 'design_build', label: 'Design-Build', description: 'Combined design and construction services' }
    ],
    paymentSchedules: [
      { value: 'milestone', label: 'Phase-Based Payments', description: 'Payments tied to design phase completion' },
      { value: 'monthly', label: 'Monthly Progress Payments', description: 'Based on work completed' },
      { value: 'custom', label: 'Custom Schedule', description: 'Project-specific payment terms' }
    ],
    typicalRetainage: 5,
    bondingThreshold: 500000,
    insuranceDefaults: [
      { type: 'professional', minimumAmount: 1000000, description: 'Professional Liability Insurance', additionalInsureds: [] },
      { type: 'general_liability', minimumAmount: 1000000, description: 'General Liability Insurance', additionalInsureds: ['Client'] },
      { type: 'auto', minimumAmount: 1000000, description: 'Commercial Auto Liability', additionalInsureds: [] }
    ],
    qualificationDefaults: {
      minimumExperience: 10,
      minimumAnnualRevenue: 2000000,
      requiredProjectTypes: ['Similar project types', 'Comparable project scale', 'Relevant building codes experience'],
      keyPersonnelRequirements: ['Licensed architect or engineer', 'Project manager with PE/RA license'],
      safetyRequirements: ['Professional liability coverage', 'Continuing education compliance'],
      certificationRequirements: ['Professional license (Architecture/Engineering)', 'Professional liability insurance']
    },
    submissionDefaults: {
      technicalProposal: ['Design approach and methodology', 'Project understanding', 'Scope of services', 'Project schedule'],
      commercialProposal: ['Fee schedule by phase', 'Reimbursable expenses', 'Additional services rates'],
      qualifications: ['Firm profile', 'Project team credentials', 'Relevant project experience', 'References'],
      references: 5
    }
  },
  trade: {
    pricingOptions: [
      { value: 'lump_sum', label: 'Lump Sum', description: 'Fixed price for defined trade work' },
      { value: 'unit_price', label: 'Unit Price', description: 'Payment based on installed units' },
      { value: 'cost_plus', label: 'Time and Material', description: 'Labor plus materials with markup' }
    ],
    contractTypes: [
      { value: 'direct_contract', label: 'Direct Trade Contract', description: 'Direct contract with trade contractor', typical: true },
      { value: 'design_build', label: 'Design-Build Trade', description: 'Design and install services' }
    ],
    paymentSchedules: [
      { value: 'milestone', label: 'Installation Milestones', description: 'Payments based on installation progress' },
      { value: 'monthly', label: 'Monthly Progress', description: 'Based on work completed' }
    ],
    typicalRetainage: 5,
    bondingThreshold: 50000,
    insuranceDefaults: [
      { type: 'general_liability', minimumAmount: 1000000, description: 'General Liability Insurance', additionalInsureds: ['Owner', 'General Contractor'] },
      { type: 'workers_comp', minimumAmount: 1000000, description: 'Workers Compensation Insurance', additionalInsureds: [] }
    ],
    qualificationDefaults: {
      minimumExperience: 3,
      minimumAnnualRevenue: 1000000,
      requiredProjectTypes: ['Similar trade installations', 'Comparable system complexity'],
      keyPersonnelRequirements: ['Licensed trade professionals', 'Certified technicians'],
      safetyRequirements: ['Trade-specific safety training', 'OSHA compliance'],
      certificationRequirements: ['Trade license', 'Manufacturer certifications', 'Union affiliations if applicable']
    },
    submissionDefaults: {
      technicalProposal: ['Installation methodology', 'Equipment specifications', 'Testing and commissioning plan'],
      commercialProposal: ['Trade contract amount', 'Material allowances', 'Change order rates'],
      qualifications: ['Trade experience', 'Certifications', 'Equipment and tools', 'References'],
      references: 3
    }
  }
};

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  { category: 'Technical Approach', weight: 30, description: 'Quality and feasibility of proposed technical solution' },
  { category: 'Experience & Qualifications', weight: 25, description: 'Relevant project experience and team qualifications' },
  { category: 'Price', weight: 25, description: 'Competitive pricing and value proposition' },
  { category: 'Schedule', weight: 10, description: 'Realistic timeline and milestone planning' },
  { category: 'Safety Record', weight: 10, description: 'Safety performance history and program' }
];