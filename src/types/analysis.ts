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
}

export interface UncategorizedCost {
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

export interface AnalysisResult {
  contractor_name: string;
  total_amount: number;
  project_name?: string;
  bid_date?: string;
  csi_divisions: Record<string, CSIDivision>;
  uncategorizedCosts?: UncategorizedCost[];
  uncategorizedTotal?: number;
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