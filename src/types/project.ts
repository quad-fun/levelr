// src/types/project.ts
// Comprehensive project management types for Project Ecosystem V2

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPhase = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closure';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type BudgetCategory = 'rfp_budget' | 'contingency' | 'soft_costs' | 'hard_costs' | 'other';

// Core project interface
export interface Project {
  id: string;
  name: string;
  description: string;
  discipline: 'construction' | 'design' | 'trade' | 'mixed';
  projectType: string;
  status: ProjectStatus;
  phase: ProjectPhase;
  priority: ProjectPriority;

  // Location information
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };

  // Timeline
  timeline: {
    startDate: string;
    endDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
    milestones: ProjectMilestone[];
  };

  // Budget management
  budget: ProjectBudget;

  // Team management
  team: ProjectTeam;

  // RFPs and procurement
  rfps: ProjectRFP[];

  // Related analyses and documents
  analyses: string[]; // Analysis IDs
  documents: ProjectDocument[];

  // Risk and performance tracking
  risks: ProjectRisk[];
  performance: ProjectPerformance;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  notes: string;
}

// Budget management interfaces
export interface ProjectBudget {
  totalBudget: number;
  allocatedBudget: number; // Sum of all RFP budgets
  spentBudget: number; // Sum of awarded bids
  contingencyBudget: number;
  categories: BudgetCategory[];
  breakdown: BudgetBreakdown[];
  cashFlow: CashFlowProjection[];
}

export interface BudgetBreakdown {
  category: BudgetCategory;
  allocated: number;
  spent: number;
  remaining: number;
  percentOfTotal: number;
}

export interface CashFlowProjection {
  month: string; // YYYY-MM format
  plannedInflow: number;
  plannedOutflow: number;
  actualInflow?: number;
  actualOutflow?: number;
  cumulativeSpend: number;
}

// Timeline and milestone management
export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  completedDate?: string;
  status: MilestoneStatus;
  dependencies: string[]; // Other milestone IDs
  associatedRFP?: string; // RFP ID if milestone is RFP-related
  critical: boolean; // Is this on critical path
  progress: number; // 0-100
}

// Team management
export interface ProjectTeam {
  owner: TeamMember;
  projectManager?: TeamMember;
  members: TeamMember[];
  consultants: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  phone?: string;
  responsibility: string[];
  permissions: TeamPermission[];
}

export type TeamPermission = 'view' | 'edit' | 'admin' | 'financial' | 'rfp_management';

// RFP management within projects
export interface ProjectRFP {
  id: string; // Links to SavedRFP.id
  name: string;
  description: string;
  discipline: 'construction' | 'design' | 'trade';
  status: 'draft' | 'issued' | 'responses_received' | 'evaluated' | 'awarded' | 'cancelled';

  // Budget allocation
  allocatedBudget: number;
  expectedResponses: number;
  receivedResponses: number;

  // Timeline
  issueDate: string;
  responseDeadline: string;
  evaluationDeadline: string;
  awardDate?: string;

  // Bid management
  bids: ProjectBid[];
  awardedBid?: string; // Bid ID

  // Evaluation criteria and scoring
  evaluationCriteria: RFPEvaluationCriterion[];
  evaluationNotes: string;
}

export interface ProjectBid {
  id: string; // Links to analysis ID
  bidderName: string;
  bidAmount: number;
  analysisId: string; // Links to SavedAnalysis
  submissionDate: string;

  // Evaluation
  scores: BidScore[];
  totalScore: number;
  rank: number;
  notes: string;
  awarded: boolean;

  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export interface BidScore {
  criterionId: string;
  score: number; // 0-100
  weight: number;
  weightedScore: number;
  notes: string;
}

export interface RFPEvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of total
  scoringMethod: 'numeric' | 'ranking' | 'pass_fail';
}

// Document management
export interface ProjectDocument {
  id: string;
  name: string;
  type: 'contract' | 'drawing' | 'specification' | 'report' | 'correspondence' | 'other';
  url: string;
  uploadDate: string;
  uploadedBy: string;
  size: number;
  tags: string[];
  analysisId?: string; // If document was analyzed
  rfpId?: string; // If document is related to specific RFP
}

// Risk management
export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  category: 'budget' | 'schedule' | 'quality' | 'safety' | 'regulatory' | 'market' | 'technical';
  probability: number; // 1-10
  impact: number; // 1-10
  riskScore: number; // probability * impact
  status: 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'closed';
  mitigation: string;
  owner: string;
  identifiedDate: string;
  lastUpdated: string;
}

// Performance tracking
export interface ProjectPerformance {
  schedulePerformance: {
    plannedValue: number;
    earnedValue: number;
    actualCost: number;
    scheduleVariance: number;
    costVariance: number;
    spi: number; // Schedule Performance Index
    cpi: number; // Cost Performance Index
  };

  budgetPerformance: {
    budgetUtilization: number; // Percentage of budget used
    forecastAtCompletion: number;
    varianceAtCompletion: number;
  };

  qualityMetrics: {
    defectRate: number;
    reworkHours: number;
    clientSatisfaction: number; // 1-10
  };

  lastUpdated: string;
}

// Project templates for quick setup
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  discipline: 'construction' | 'design' | 'trade' | 'mixed';
  projectType: string;

  // Template defaults
  defaultMilestones: Omit<ProjectMilestone, 'id' | 'dueDate' | 'completedDate' | 'status' | 'progress'>[];
  defaultBudgetCategories: BudgetCategory[];
  defaultRisks: Omit<ProjectRisk, 'id' | 'identifiedDate' | 'lastUpdated' | 'status'>[];
  defaultTeamRoles: string[];

  // Estimated timeline
  estimatedDuration: number; // In days
  criticalPath: string[]; // Milestone names
}

// Project creation wizard data
export interface ProjectWizardData {
  // Step 1: Basics
  name: string;
  description: string;
  discipline: 'construction' | 'design' | 'trade' | 'mixed';
  projectType: string;
  priority: ProjectPriority;
  location: Project['location'];

  // Step 2: Budget
  totalBudget: number;
  contingencyPercentage: number;
  budgetCategories: BudgetCategory[];

  // Step 3: Timeline
  startDate: string;
  endDate: string;
  keyMilestones: string[]; // Milestone names

  // Step 4: Team
  owner: Omit<TeamMember, 'id'>;
  projectManager?: Omit<TeamMember, 'id'>;
  additionalMembers: Omit<TeamMember, 'id'>[];

  // Step 5: RFPs (optional)
  anticipatedRFPs: {
    name: string;
    discipline: 'construction' | 'design' | 'trade';
    estimatedBudget: number;
    timeline: string;
  }[];

  // Step 6: Documents (optional)
  projectDocuments?: File[];
}

// Project analytics and reporting
export interface ProjectAnalytics {
  projectId: string;

  // Financial analytics
  budgetTrends: {
    date: string;
    allocatedBudget: number;
    spentBudget: number;
    forecastBudget: number;
  }[];

  // Schedule analytics
  scheduleTrends: {
    date: string;
    plannedProgress: number;
    actualProgress: number;
  }[];

  // RFP analytics
  rfpMetrics: {
    totalRFPs: number;
    averageResponseTime: number;
    averageBidCount: number;
    awardRate: number;
    averageSavings: number;
  };

  // Risk analytics
  riskTrends: {
    date: string;
    totalRisks: number;
    highRisks: number;
    mitigatedRisks: number;
  }[];

  generatedAt: string;
}

// Storage interfaces for localStorage integration
export interface SavedProject extends Project {
  // Additional fields for saved projects
  archivedRFPs: string[]; // IDs of archived RFPs
  archivedAnalyses: string[]; // IDs of archived analyses
}

// Project search and filtering
export interface ProjectFilter {
  status?: ProjectStatus[];
  discipline?: ('construction' | 'design' | 'trade' | 'mixed')[];
  priority?: ProjectPriority[];
  budgetRange?: { min: number; max: number };
  dateRange?: { start: string; end: string };
  tags?: string[];
  teamMember?: string;
}

export interface ProjectSearchResult {
  projects: Project[];
  totalCount: number;
  filters: ProjectFilter;
}

// Gantt chart specific types
export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  type: 'milestone' | 'task' | 'project';
  critical: boolean;
  rfpId?: string;
  color?: string;
}

export interface GanttData {
  tasks: GanttTask[];
  criticalPath: string[];
  projectStart: Date;
  projectEnd: Date;
}

// Export types for project reports
export interface ProjectReportData {
  project: Project;
  analytics: ProjectAnalytics;
  rfpSummary: {
    totalBudget: number;
    awardedBudget: number;
    pendingBudget: number;
    averageSavings: number;
  };
  riskSummary: {
    totalRisks: number;
    criticalRisks: number;
    mitigatedRisks: number;
  };
  timelineSummary: {
    totalMilestones: number;
    completedMilestones: number;
    overdueMilestones: number;
    criticalPathStatus: 'on_track' | 'at_risk' | 'delayed';
  };
}