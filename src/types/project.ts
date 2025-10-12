// src/types/project.ts

import { ProjectDiscipline } from './rfp';

// Re-export for convenience
export type { ProjectDiscipline } from './rfp';

// Core project management types
export interface ProjectEcosystem {
  id: string;
  name: string;
  description: string;
  disciplines: ProjectDiscipline[]; // Projects can include multiple disciplines
  projectType: string;
  totalBudget: number;
  baselineSchedule: ProjectSchedule;
  currentSchedule: ProjectSchedule;
  status: 'planning' | 'bidding' | 'pre-construction' | 'active' | 'completed';
  rfpIds: string[]; // RFPs are discipline-specific but linked to project
  awardedBids: AwardedBid[];
  budgetAllocations: BudgetAllocation[]; // Budget allocated by discipline
  location?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSchedule {
  startDate: string;
  endDate: string;
  milestones: ProjectMilestone[];
  phases: ProjectPhase[];
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  date: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'delayed';
  dependencies: string[];
  linkedRfpId?: string;
  actualDate?: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
  budgetAllocated: number;
  budgetUsed: number;
  milestoneIds: string[];
  discipline?: ProjectDiscipline;
  actualStartDate?: string;
  actualEndDate?: string;
}

export interface AwardedBid {
  id: string;
  rfpId: string;
  analysisId: string;
  contractorName: string;
  originalBudget: number;
  awardedAmount: number;
  awardDate: string;
  discipline: ProjectDiscipline;
  status: 'awarded' | 'contracted' | 'active' | 'completed';
  contractType: 'lump_sum' | 'unit_price' | 'cost_plus' | 'hourly';
  phaseId?: string;
  notes?: string;
}

export interface BudgetAllocation {
  id: string;
  name: string;
  discipline: ProjectDiscipline;
  category: string; // CSI division, AIA phase, or technical system
  allocatedAmount: number;
  committedAmount: number;
  actualAmount: number;
  variance: number;
  status: 'open' | 'committed' | 'completed';
  linkedRfpIds: string[];
  notes?: string;
}

export interface ProjectDashboardMetrics {
  totalBudget: number;
  committedBudget: number;
  remainingBudget: number;
  budgetVariance: number;
  scheduleVariance: number; // days ahead/behind
  totalRfps: number;
  completedRfps: number;
  activeRfps: number;
  totalBids: number;
  awardedBids: number;
  riskScore: number; // 0-100
  completionPercentage: number;
}

export interface ProjectChangeOrder {
  id: string;
  projectId: string;
  awardedBidId?: string;
  title: string;
  description: string;
  budgetImpact: number;
  scheduleImpact: number; // days
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
  requestedBy: string;
  requestedDate: string;
  approvedDate?: string;
  reason: string;
  discipline: ProjectDiscipline;
}

// Gantt chart specific types
export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  dependencies: string[];
  type: 'milestone' | 'phase' | 'rfp' | 'award';
  color?: string;
  linkedEntityId?: string; // RFP ID, milestone ID, etc.
  critical?: boolean;
}

export interface GanttChartConfig {
  showCriticalPath: boolean;
  showMilestones: boolean;
  showDependencies: boolean;
  timeUnit: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
}

// Project templates and defaults - discipline-specific templates that can be combined
export interface DisciplineTemplate {
  id: string;
  name: string;
  description: string;
  discipline: ProjectDiscipline;
  defaultBudgetAllocations: Omit<BudgetAllocation, 'id' | 'actualAmount' | 'variance' | 'linkedRfpIds'>[];
  defaultPhases: Omit<ProjectPhase, 'id' | 'budgetUsed' | 'actualStartDate' | 'actualEndDate'>[];
  defaultMilestones: Omit<ProjectMilestone, 'id' | 'actualDate'>[];
  estimatedDuration: number; // days
  budgetPercentage: number; // typical percentage of total project budget
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  projectType: string;
  disciplines: ProjectDiscipline[]; // Multiple disciplines for complete projects
  estimatedDuration: number; // days
}

// Saved project for storage
export interface SavedProject {
  id: string;
  timestamp: string;
  project: ProjectEcosystem;
  metrics: ProjectDashboardMetrics;
  lastActivity: string;
}

// Project creation wizard steps
export interface ProjectCreationStep {
  step: number;
  title: string;
  description: string;
  component: string;
  completed: boolean;
}

export interface ProjectCreationData {
  basicInfo: {
    name: string;
    description: string;
    disciplines: ProjectDiscipline[]; // Changed to support multiple disciplines
    projectType: string;
    totalBudget: number;
    location?: ProjectEcosystem['location'];
  };
  schedule: {
    startDate: string;
    endDate: string;
    phases: Omit<ProjectPhase, 'id' | 'budgetUsed' | 'actualStartDate' | 'actualEndDate'>[];
    milestones: Omit<ProjectMilestone, 'id' | 'actualDate'>[];
  };
  budget: {
    allocations: Omit<BudgetAllocation, 'id' | 'actualAmount' | 'variance' | 'linkedRfpIds'>[];
  };
  rfps: {
    createNew: boolean;
    linkExisting: string[];
    generateFromTemplate: boolean;
  };
}

// Risk assessment for projects
export interface ProjectRiskAssessment {
  projectId: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetRisk: number; // 0-100
  scheduleRisk: number; // 0-100
  technicalRisk: number; // 0-100
  marketRisk: number; // 0-100
  riskFactors: ProjectRiskFactor[];
  recommendations: string[];
  lastAssessed: string;
}

export interface ProjectRiskFactor {
  category: 'budget' | 'schedule' | 'technical' | 'market' | 'regulatory';
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation: string;
}

// Discipline-specific templates that can be combined into multi-discipline projects
export const DISCIPLINE_TEMPLATES: Record<ProjectDiscipline, DisciplineTemplate[]> = {
  construction: [
    {
      id: 'commercial_construction',
      name: 'Commercial Construction',
      description: 'General construction work and trades coordination',
      discipline: 'construction',
      defaultBudgetAllocations: [
        { name: 'Site Preparation', discipline: 'construction', category: '01', allocatedAmount: 0.05, committedAmount: 0, status: 'open', notes: 'General conditions and site work' },
        { name: 'Concrete Work', discipline: 'construction', category: '03', allocatedAmount: 0.15, committedAmount: 0, status: 'open', notes: 'Foundations and structure' },
        { name: 'Masonry', discipline: 'construction', category: '04', allocatedAmount: 0.08, committedAmount: 0, status: 'open', notes: 'Exterior walls' },
        { name: 'Steel Structure', discipline: 'construction', category: '05', allocatedAmount: 0.12, committedAmount: 0, status: 'open', notes: 'Structural steel' },
        { name: 'Carpentry', discipline: 'construction', category: '06', allocatedAmount: 0.10, committedAmount: 0, status: 'open', notes: 'Framing and millwork' },
        { name: 'Roofing', discipline: 'construction', category: '07', allocatedAmount: 0.06, committedAmount: 0, status: 'open', notes: 'Roof systems' },
        { name: 'Doors & Windows', discipline: 'construction', category: '08', allocatedAmount: 0.08, committedAmount: 0, status: 'open', notes: 'Openings' },
        { name: 'Finishes', discipline: 'construction', category: '09', allocatedAmount: 0.12, committedAmount: 0, status: 'open', notes: 'Interior finishes' }
      ],
      defaultPhases: [
        { name: 'Site Work', description: 'Site preparation and utilities', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.15, milestoneIds: [] },
        { name: 'Structure', description: 'Foundation and framing', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.40, milestoneIds: [] },
        { name: 'Envelope', description: 'Building envelope completion', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.30, milestoneIds: [] },
        { name: 'Finishes', description: 'Interior finishes and closeout', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.15, milestoneIds: [] }
      ],
      defaultMilestones: [
        { name: 'Site Cleared', description: 'Site preparation completed', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Foundation Complete', description: 'Foundation work finished', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Structure Complete', description: 'Structural framing finished', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Envelope Complete', description: 'Building weatherproof', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Final Inspections', description: 'All final inspections passed', date: '', status: 'upcoming', dependencies: [] }
      ],
      estimatedDuration: 300,
      budgetPercentage: 0.65 // 65% of total project budget typically
    }
  ],
  design: [
    {
      id: 'architectural_design',
      name: 'Architectural Design Services',
      description: 'Complete architectural design using AIA phases',
      discipline: 'design',
      defaultBudgetAllocations: [
        { name: 'Schematic Design', discipline: 'design', category: 'schematic_design', allocatedAmount: 0.15, committedAmount: 0, status: 'open', notes: 'Conceptual design phase' },
        { name: 'Design Development', discipline: 'design', category: 'design_development', allocatedAmount: 0.20, committedAmount: 0, status: 'open', notes: 'Design refinement' },
        { name: 'Construction Documents', discipline: 'design', category: 'construction_documents', allocatedAmount: 0.40, committedAmount: 0, status: 'open', notes: 'Final drawings and specs' },
        { name: 'Bidding Support', discipline: 'design', category: 'bidding', allocatedAmount: 0.05, committedAmount: 0, status: 'open', notes: 'Contractor selection' },
        { name: 'Construction Administration', discipline: 'design', category: 'construction_administration', allocatedAmount: 0.20, committedAmount: 0, status: 'open', notes: 'Construction oversight' }
      ],
      defaultPhases: [
        { name: 'Programming', description: 'Project requirements definition', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.05, milestoneIds: [] },
        { name: 'Schematic Design', description: 'Conceptual design development', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.15, milestoneIds: [] },
        { name: 'Design Development', description: 'Design refinement and coordination', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.20, milestoneIds: [] },
        { name: 'Construction Documents', description: 'Final documentation', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.40, milestoneIds: [] },
        { name: 'Construction Administration', description: 'Construction oversight', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.20, milestoneIds: [] }
      ],
      defaultMilestones: [
        { name: 'Programming Complete', description: 'Requirements finalized', date: '', status: 'upcoming', dependencies: [] },
        { name: 'SD Submittal', description: 'Schematic design submitted', date: '', status: 'upcoming', dependencies: [] },
        { name: 'DD Submittal', description: 'Design development submitted', date: '', status: 'upcoming', dependencies: [] },
        { name: 'CD Submittal', description: 'Construction documents submitted', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Permit Submission', description: 'Permits submitted to authorities', date: '', status: 'upcoming', dependencies: [] }
      ],
      estimatedDuration: 180,
      budgetPercentage: 0.12 // 12% of total project budget typically
    }
  ],
  trade: [
    {
      id: 'electrical_systems',
      name: 'Electrical Systems',
      description: 'Electrical design and installation services',
      discipline: 'trade',
      defaultBudgetAllocations: [
        { name: 'Design & Engineering', discipline: 'trade', category: 'design', allocatedAmount: 0.15, committedAmount: 0, status: 'open', notes: 'Electrical design services' },
        { name: 'Power Distribution', discipline: 'trade', category: 'power_distribution', allocatedAmount: 0.30, committedAmount: 0, status: 'open', notes: 'Main distribution equipment' },
        { name: 'Branch Circuits', discipline: 'trade', category: 'branch_circuits', allocatedAmount: 0.25, committedAmount: 0, status: 'open', notes: 'Wiring and devices' },
        { name: 'Lighting Systems', discipline: 'trade', category: 'lighting', allocatedAmount: 0.15, committedAmount: 0, status: 'open', notes: 'Lighting fixtures and controls' },
        { name: 'Fire Alarm', discipline: 'trade', category: 'fire_alarm', allocatedAmount: 0.10, committedAmount: 0, status: 'open', notes: 'Life safety systems' },
        { name: 'Testing & Commissioning', discipline: 'trade', category: 'testing', allocatedAmount: 0.05, committedAmount: 0, status: 'open', notes: 'System testing and startup' }
      ],
      defaultPhases: [
        { name: 'Design Phase', description: 'Electrical system design', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.15, milestoneIds: [] },
        { name: 'Rough-in', description: 'Conduit and cable installation', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.40, milestoneIds: [] },
        { name: 'Equipment Installation', description: 'Panels and major equipment', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.25, milestoneIds: [] },
        { name: 'Trim-out', description: 'Devices and final connections', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.15, milestoneIds: [] },
        { name: 'Testing', description: 'System testing and commissioning', startDate: '', endDate: '', status: 'not-started', budgetAllocated: 0.05, milestoneIds: [] }
      ],
      defaultMilestones: [
        { name: 'Design Complete', description: 'Electrical design approved', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Material Delivery', description: 'Major materials on site', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Rough-in Complete', description: 'All conduit and cable installed', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Equipment Set', description: 'All electrical equipment installed', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Energization', description: 'System energized and operational', date: '', status: 'upcoming', dependencies: [] },
        { name: 'Final Testing', description: 'All testing completed', date: '', status: 'upcoming', dependencies: [] }
      ],
      estimatedDuration: 120,
      budgetPercentage: 0.23 // 23% of total project budget typically
    }
  ]
};

// Multi-discipline project templates that combine the above disciplines
export const DEFAULT_PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'commercial_office',
    name: 'Commercial Office Building',
    description: 'Complete commercial office development with design, construction, and trade coordination',
    projectType: 'commercial_office',
    disciplines: ['design', 'construction', 'trade'],
    estimatedDuration: 450 // Design (180) + overlap with Construction (300) + MEP trades (120)
  },
  {
    id: 'retail_development',
    name: 'Retail Development',
    description: 'Multi-tenant retail development project',
    projectType: 'retail',
    disciplines: ['design', 'construction', 'trade'],
    estimatedDuration: 365
  },
  {
    id: 'industrial_facility',
    name: 'Industrial Facility',
    description: 'Manufacturing or warehouse facility development',
    projectType: 'industrial',
    disciplines: ['design', 'construction', 'trade'],
    estimatedDuration: 400
  },
  {
    id: 'design_only',
    name: 'Design Services Only',
    description: 'Architectural and engineering design services',
    projectType: 'design_services',
    disciplines: ['design'],
    estimatedDuration: 180
  },
  {
    id: 'construction_only',
    name: 'Construction Services Only',
    description: 'General contracting and construction management',
    projectType: 'construction_services',
    disciplines: ['construction'],
    estimatedDuration: 300
  },
  {
    id: 'tenant_improvement',
    name: 'Tenant Improvement',
    description: 'Interior renovation and improvement project',
    projectType: 'tenant_improvement',
    disciplines: ['design', 'construction'],
    estimatedDuration: 120
  }
];

// Status color mappings for consistent UI
export const PROJECT_STATUS_COLORS = {
  planning: 'bg-gray-100 text-gray-800',
  bidding: 'bg-yellow-100 text-yellow-800',
  'pre-construction': 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800'
};

export const PHASE_STATUS_COLORS = {
  'not-started': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-800'
};

export const MILESTONE_STATUS_COLORS = {
  upcoming: 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-800'
};