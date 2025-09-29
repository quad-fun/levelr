export interface LineItem {
  description: string;
  cost: number;
  unit_cost?: number;
  quantity?: number;
  unit?: string;
  subcontractor?: string;
  notes?: string;
}

export interface CSIDivision {
  cost: number;
  items: string[];
  unit_cost?: number;
  quantity?: number;
  unit?: string;
  sub_items?: LineItem[];
  subcontractor?: string;
  scope_notes?: string;
  estimatedPercentage?: number; // Add this for compatibility
}

export interface UncategorizedCost {
  description: string;
  cost: number;
}

export interface SoftCost {
  description: string;
  cost: number;
}

export interface ProjectOverhead {
  general_conditions?: number;
  general_requirements?: number;
  cm_fee?: number;
  contractor_fee?: number;
  insurance?: number;
  bonds?: number;
  permits?: number;
  project_management?: number;
  supervision?: number;
  temporary_facilities?: number;
  total_overhead: number;
}

export interface Allowance {
  description: string;
  amount: number;
  percentage_of_total?: number;
  type: 'contingency' | 'allowance' | 'hold' | 'tbd' | 'unit_price_allowance';
  scope_description?: string;
}

export interface Subcontractor {
  name: string;
  trade: string;
  divisions: string[];
  total_amount: number;
  scope_description?: string;
  contact_info?: string;
}

// Design services analysis interfaces
export interface AIAPhaseAnalysis {
  phase_name: string;
  fee_amount: number;
  percentage_of_total: number;
  deliverables: DesignDeliverable[];
  timeline?: string;
  scope_notes?: string;
  assumptions?: string[];
  exclusions?: string[];
}

export interface DesignDeliverable {
  description: string;
  quantity?: number;
  unit?: string;
  cost_allocation?: number;
  completion_date?: string;
  responsible_discipline?: string;
  notes?: string;
}

// Trade services analysis interfaces  
export interface TechnicalSystemAnalysis {
  system_name: string;
  category: 'electrical' | 'mechanical' | 'plumbing' | 'structural' | 'civil' | 'environmental';
  total_cost: number;
  equipment_cost?: number;
  labor_cost?: number;
  installation_cost?: number;
  commissioning_cost?: number;
  specifications: EquipmentSpec[];
  testing_requirements?: string[];
  warranty_terms?: string;
  maintenance_requirements?: string[];
  scope_notes?: string;
}

export interface EquipmentSpec {
  description: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  specifications?: string[];
  certifications?: string[];
  warranty_period?: string;
  installation_notes?: string;
}

export interface AnalysisResult {
  contractor_name: string;
  total_amount: number;
  project_name?: string;
  bid_date?: string;
  gross_sqft?: number;
  proposal_date?: string;
  
  // Multi-discipline support
  discipline: 'construction' | 'design' | 'trade';
  
  // Construction analysis (legacy CSI support)
  csi_divisions: Record<string, CSIDivision>;
  
  // Design services analysis  
  aia_phases?: Record<string, AIAPhaseAnalysis>;
  design_deliverables?: DesignDeliverable[];
  
  // Trade services analysis
  technical_systems?: Record<string, TechnicalSystemAnalysis>;
  equipment_specifications?: EquipmentSpec[];
  
  uncategorizedCosts?: UncategorizedCost[];
  uncategorizedTotal?: number;
  softCosts?: SoftCost[];
  softCostsTotal?: number;
  categorizationPercentage?: number;
  timeline?: string;
  exclusions?: string[];
  assumptions?: string[];
  document_quality?: 'professional_typed' | 'scanned' | 'handwritten';
  
  // Enhanced granular data
  project_overhead?: ProjectOverhead;
  allowances?: Allowance[];
  allowances_total?: number;
  subcontractors?: Subcontractor[];
  direct_costs?: number;
  markup_percentage?: number;
  base_bid_amount?: number;
  alternate_pricing?: Record<string, number>;
}

export interface MarketVariance {
  status: 'ABOVE_MARKET' | 'BELOW_MARKET' | 'MARKET_RATE';
  message: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface RiskAssessment {
  score: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: string[];
}

export interface UsageData {
  totalAnalyses: number;
  analysesThisMonth: number;
  lastAnalysis?: string;
  resetDate: string;
}

export const CONSTRUCTION_UNITS = {
  SF: "Square Foot",
  LF: "Linear Foot", 
  CY: "Cubic Yard",
  EA: "Each",
  LS: "Lump Sum",
  SY: "Square Yard",
  TON: "Ton",
  HR: "Hour",
  DAY: "Day"
} as const;