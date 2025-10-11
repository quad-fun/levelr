// src/lib/project-storage.ts
// Comprehensive project storage and management functions

import {
  Project,
  SavedProject,
  ProjectFilter,
  ProjectSearchResult,
  ProjectBudget,
  ProjectMilestone,
  ProjectRFP,
  ProjectBid,
  ProjectAnalytics,
  GanttData,
  GanttTask,
  MilestoneStatus,
  ProjectStatus,
  ProjectWizardData,
  ProjectTemplate
} from '@/types/project';
import { SavedRFP } from '@/types/rfp';
import { SavedAnalysis } from '@/lib/storage';
import {
  isDemoModeEnabled,
  getDemoProjects,
  getDemoAnalytics
} from '@/lib/demo-data';

const PROJECTS_STORAGE_KEY = 'levelr_projects';
const PROJECT_TEMPLATES_KEY = 'levelr_project_templates';
const PROJECT_ANALYTICS_KEY = 'levelr_project_analytics';

// Core CRUD operations
export function saveProject(project: Project): string {
  const projects = getAllProjects();
  const savedProject: SavedProject = {
    ...project,
    archivedRFPs: [],
    archivedAnalyses: [],
    updatedAt: new Date().toISOString()
  };

  const existingIndex = projects.findIndex(p => p.id === project.id);
  if (existingIndex >= 0) {
    projects[existingIndex] = savedProject;
  } else {
    projects.push(savedProject);
  }

  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));

  // Update analytics
  updateProjectAnalytics(project.id);

  return project.id;
}

export function getProject(projectId: string): SavedProject | null {
  const projects = getAllProjects();
  return projects.find(p => p.id === projectId) || null;
}

export function getAllProjects(): SavedProject[] {
  try {
    // Use demo data if demo mode is enabled
    if (isDemoModeEnabled()) {
      return getDemoProjects();
    }

    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

export function deleteProject(projectId: string): boolean {
  try {
    const projects = getAllProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filteredProjects));

    // Clean up analytics
    deleteProjectAnalytics(projectId);

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

export function updateProjectStatus(projectId: string, status: ProjectStatus): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    project.status = status;
    project.updatedAt = new Date().toISOString();

    saveProject(project);
    return true;
  } catch (error) {
    console.error('Error updating project status:', error);
    return false;
  }
}

// Search and filtering
export function searchProjects(query: string, filters?: ProjectFilter): ProjectSearchResult {
  let projects = getAllProjects();

  // Apply text search
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    projects = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm) ||
      project.description.toLowerCase().includes(searchTerm) ||
      project.location.city.toLowerCase().includes(searchTerm) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Apply filters
  if (filters) {
    if (filters.status && filters.status.length > 0) {
      projects = projects.filter(p => filters.status!.includes(p.status));
    }

    if (filters.discipline && filters.discipline.length > 0) {
      projects = projects.filter(p => filters.discipline!.includes(p.discipline));
    }

    if (filters.priority && filters.priority.length > 0) {
      projects = projects.filter(p => filters.priority!.includes(p.priority));
    }

    if (filters.budgetRange) {
      projects = projects.filter(p =>
        p.budget.totalBudget >= filters.budgetRange!.min &&
        p.budget.totalBudget <= filters.budgetRange!.max
      );
    }

    if (filters.dateRange) {
      projects = projects.filter(p =>
        p.timeline.startDate >= filters.dateRange!.start &&
        p.timeline.endDate <= filters.dateRange!.end
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      projects = projects.filter(p =>
        filters.tags!.some(tag => p.tags.includes(tag))
      );
    }

    if (filters.teamMember) {
      projects = projects.filter(p =>
        p.team.members.some(member =>
          member.name.toLowerCase().includes(filters.teamMember!.toLowerCase()) ||
          member.email.toLowerCase().includes(filters.teamMember!.toLowerCase())
        )
      );
    }
  }

  return {
    projects,
    totalCount: projects.length,
    filters: filters || {}
  };
}

// Budget management functions
export function updateProjectBudget(projectId: string, budget: Partial<ProjectBudget>): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    project.budget = { ...project.budget, ...budget };
    project.updatedAt = new Date().toISOString();

    // Recalculate budget breakdown
    project.budget = calculateBudgetBreakdown(project.budget);

    saveProject(project);
    return true;
  } catch (error) {
    console.error('Error updating project budget:', error);
    return false;
  }
}

export function calculateBudgetBreakdown(budget: ProjectBudget): ProjectBudget {
  const breakdown = budget.breakdown.map(category => {
    const percentOfTotal = budget.totalBudget > 0 ? (category.allocated / budget.totalBudget) * 100 : 0;
    const remaining = category.allocated - category.spent;

    return {
      ...category,
      remaining,
      percentOfTotal
    };
  });

  return {
    ...budget,
    breakdown,
    allocatedBudget: breakdown.reduce((sum, cat) => sum + cat.allocated, 0),
    spentBudget: breakdown.reduce((sum, cat) => sum + cat.spent, 0)
  };
}

// Milestone management
export function updateMilestone(projectId: string, milestone: ProjectMilestone): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    const milestoneIndex = project.timeline.milestones.findIndex(m => m.id === milestone.id);
    if (milestoneIndex >= 0) {
      project.timeline.milestones[milestoneIndex] = milestone;
    } else {
      project.timeline.milestones.push(milestone);
    }

    project.updatedAt = new Date().toISOString();
    saveProject(project);
    return true;
  } catch (error) {
    console.error('Error updating milestone:', error);
    return false;
  }
}

export function completeMilestone(projectId: string, milestoneId: string): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    const milestone = project.timeline.milestones.find(m => m.id === milestoneId);
    if (!milestone) return false;

    milestone.status = 'completed';
    milestone.completedDate = new Date().toISOString();
    milestone.progress = 100;

    saveProject(project);
    return true;
  } catch (error) {
    console.error('Error completing milestone:', error);
    return false;
  }
}

// RFP management within projects
export function addRFPToProject(projectId: string, rfp: ProjectRFP): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    project.rfps.push(rfp);
    project.updatedAt = new Date().toISOString();

    saveProject(project);
    return true;
  } catch (error) {
    console.error('Error adding RFP to project:', error);
    return false;
  }
}

export function updateProjectRFP(projectId: string, rfpId: string, updates: Partial<ProjectRFP>): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    const rfpIndex = project.rfps.findIndex(r => r.id === rfpId);
    if (rfpIndex < 0) return false;

    project.rfps[rfpIndex] = { ...project.rfps[rfpIndex], ...updates };
    project.updatedAt = new Date().toISOString();

    saveProject(project);
    return true;
  } catch (error) {
    console.error('Error updating project RFP:', error);
    return false;
  }
}

export function awardBid(projectId: string, rfpId: string, bidId: string): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    const rfp = project.rfps.find(r => r.id === rfpId);
    if (!rfp) return false;

    const bid = rfp.bids.find(b => b.id === bidId);
    if (!bid) return false;

    // Mark bid as awarded
    bid.awarded = true;
    rfp.awardedBid = bidId;
    rfp.status = 'awarded';

    // Update budget
    const budgetCategory = project.budget.breakdown.find(b => b.category === 'rfp_budget');
    if (budgetCategory) {
      budgetCategory.spent += bid.bidAmount;
    }

    project.budget = calculateBudgetBreakdown(project.budget);
    project.updatedAt = new Date().toISOString();

    saveProject(project);
    return true;
  } catch (error) {
    console.error('Error awarding bid:', error);
    return false;
  }
}

// Analytics and reporting
export function generateProjectAnalytics(projectId: string): ProjectAnalytics | null {
  try {
    const project = getProject(projectId);
    if (!project) return null;

    const analytics: ProjectAnalytics = {
      projectId,

      // Budget trends (mock data - in real app would come from historical data)
      budgetTrends: generateBudgetTrends(project),

      // Schedule trends
      scheduleTrends: generateScheduleTrends(project),

      // RFP metrics
      rfpMetrics: calculateRFPMetrics(project),

      // Risk trends
      riskTrends: generateRiskTrends(project),

      generatedAt: new Date().toISOString()
    };

    // Save analytics
    const allAnalytics = getAllProjectAnalytics();
    const existingIndex = allAnalytics.findIndex(a => a.projectId === projectId);
    if (existingIndex >= 0) {
      allAnalytics[existingIndex] = analytics;
    } else {
      allAnalytics.push(analytics);
    }

    localStorage.setItem(PROJECT_ANALYTICS_KEY, JSON.stringify(allAnalytics));

    return analytics;
  } catch (error) {
    console.error('Error generating project analytics:', error);
    return null;
  }
}

function generateBudgetTrends(project: Project) {
  // Generate monthly budget trend data
  const trends = [];
  const startDate = new Date(project.timeline.startDate);
  const endDate = new Date(project.timeline.endDate);

  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    trends.push({
      date: date.toISOString().substring(0, 7), // YYYY-MM format
      allocatedBudget: project.budget.allocatedBudget,
      spentBudget: project.budget.spentBudget,
      forecastBudget: project.budget.totalBudget
    });
  }

  return trends;
}

function generateScheduleTrends(project: Project) {
  // Generate schedule performance data
  const trends = [];
  const completedMilestones = project.timeline.milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = project.timeline.milestones.length;
  const actualProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  // Calculate planned progress based on time elapsed
  const startDate = new Date(project.timeline.startDate);
  const endDate = new Date(project.timeline.endDate);
  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const plannedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  trends.push({
    date: now.toISOString().substring(0, 10),
    plannedProgress,
    actualProgress
  });

  return trends;
}

function calculateRFPMetrics(project: Project) {
  const rfps = project.rfps;
  const totalBids = rfps.reduce((sum, rfp) => sum + rfp.bids.length, 0);
  const averageBidCount = rfps.length > 0 ? totalBids / rfps.length : 0;
  const awardedRFPs = rfps.filter(rfp => rfp.status === 'awarded').length;
  const awardRate = rfps.length > 0 ? (awardedRFPs / rfps.length) * 100 : 0;

  // Calculate average savings (difference between highest and awarded bid)
  let totalSavings = 0;
  let savingsCount = 0;

  rfps.forEach(rfp => {
    if (rfp.awardedBid && rfp.bids.length > 1) {
      const awardedBid = rfp.bids.find(b => b.id === rfp.awardedBid);
      const highestBid = Math.max(...rfp.bids.map(b => b.bidAmount));
      if (awardedBid) {
        totalSavings += highestBid - awardedBid.bidAmount;
        savingsCount++;
      }
    }
  });

  const averageSavings = savingsCount > 0 ? totalSavings / savingsCount : 0;

  return {
    totalRFPs: rfps.length,
    averageResponseTime: 0, // Would need historical data
    averageBidCount,
    awardRate,
    averageSavings
  };
}

function generateRiskTrends(project: Project) {
  const risks = project.risks;
  const totalRisks = risks.length;
  const highRisks = risks.filter(r => r.riskScore >= 7).length;
  const mitigatedRisks = risks.filter(r => r.status === 'mitigating' || r.status === 'closed').length;

  return [{
    date: new Date().toISOString().substring(0, 10),
    totalRisks,
    highRisks,
    mitigatedRisks
  }];
}

export function getAllProjectAnalytics(): ProjectAnalytics[] {
  try {
    // Use demo data if demo mode is enabled
    if (isDemoModeEnabled()) {
      return getDemoAnalytics();
    }

    const stored = localStorage.getItem(PROJECT_ANALYTICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading project analytics:', error);
    return [];
  }
}

export function updateProjectAnalytics(projectId: string): void {
  generateProjectAnalytics(projectId);
}

export function deleteProjectAnalytics(projectId: string): void {
  try {
    const analytics = getAllProjectAnalytics();
    const filtered = analytics.filter(a => a.projectId !== projectId);
    localStorage.setItem(PROJECT_ANALYTICS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting project analytics:', error);
  }
}

// Gantt chart data generation
export function generateGanttData(project: Project): GanttData {
  const tasks: GanttTask[] = [];

  // Add project as main task
  tasks.push({
    id: project.id,
    name: project.name,
    start: new Date(project.timeline.startDate),
    end: new Date(project.timeline.endDate),
    progress: calculateOverallProgress(project),
    dependencies: [],
    type: 'project',
    critical: false,
    color: '#3B82F6'
  });

  // Add milestones as tasks
  project.timeline.milestones.forEach(milestone => {
    tasks.push({
      id: milestone.id,
      name: milestone.name,
      start: new Date(milestone.dueDate),
      end: new Date(milestone.dueDate),
      progress: milestone.progress,
      dependencies: milestone.dependencies,
      type: 'milestone',
      critical: milestone.critical,
      rfpId: milestone.associatedRFP,
      color: milestone.critical ? '#EF4444' : '#10B981'
    });
  });

  // Add RFPs as tasks
  project.rfps.forEach(rfp => {
    tasks.push({
      id: rfp.id,
      name: rfp.name,
      start: new Date(rfp.issueDate),
      end: new Date(rfp.awardDate || rfp.evaluationDeadline),
      progress: rfp.status === 'awarded' ? 100 : rfp.status === 'evaluated' ? 80 : rfp.status === 'responses_received' ? 60 : 20,
      dependencies: [],
      type: 'task',
      critical: false,
      rfpId: rfp.id,
      color: '#8B5CF6'
    });
  });

  return {
    tasks,
    criticalPath: project.timeline.milestones.filter(m => m.critical).map(m => m.id),
    projectStart: new Date(project.timeline.startDate),
    projectEnd: new Date(project.timeline.endDate)
  };
}

function calculateOverallProgress(project: Project): number {
  const milestones = project.timeline.milestones;
  if (milestones.length === 0) return 0;

  const totalProgress = milestones.reduce((sum, milestone) => sum + milestone.progress, 0);
  return totalProgress / milestones.length;
}

// Project creation helpers
export function createProjectFromWizard(wizardData: ProjectWizardData): Project {
  const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  // Create milestones from wizard data
  const milestones: ProjectMilestone[] = wizardData.keyMilestones.map((name, index) => ({
    id: `milestone_${index}_${Date.now()}`,
    name,
    description: `Key milestone: ${name}`,
    dueDate: new Date(new Date(wizardData.startDate).getTime() + (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending' as MilestoneStatus,
    dependencies: index > 0 ? [`milestone_${index - 1}_${Date.now()}`] : [],
    critical: index === 0 || index === wizardData.keyMilestones.length - 1,
    progress: 0
  }));

  // Create budget breakdown
  const budgetBreakdown = wizardData.budgetCategories.map(category => ({
    category,
    allocated: category === 'rfp_budget' ? wizardData.totalBudget * 0.8 : wizardData.totalBudget * 0.05,
    spent: 0,
    remaining: category === 'rfp_budget' ? wizardData.totalBudget * 0.8 : wizardData.totalBudget * 0.05,
    percentOfTotal: category === 'rfp_budget' ? 80 : 5
  }));

  const project: Project = {
    id: projectId,
    name: wizardData.name,
    description: wizardData.description,
    discipline: wizardData.discipline,
    projectType: wizardData.projectType,
    status: 'planning',
    phase: 'initiation',
    priority: wizardData.priority,

    location: wizardData.location,

    timeline: {
      startDate: wizardData.startDate,
      endDate: wizardData.endDate,
      milestones
    },

    budget: {
      totalBudget: wizardData.totalBudget,
      allocatedBudget: 0,
      spentBudget: 0,
      contingencyBudget: wizardData.totalBudget * (wizardData.contingencyPercentage / 100),
      categories: wizardData.budgetCategories,
      breakdown: budgetBreakdown,
      cashFlow: []
    },

    team: {
      owner: { ...wizardData.owner, id: `member_${Date.now()}`, permissions: ['admin'] },
      projectManager: wizardData.projectManager ? { ...wizardData.projectManager, id: `pm_${Date.now()}`, permissions: ['edit', 'rfp_management'] } : undefined,
      members: wizardData.additionalMembers.map((member, index) => ({ ...member, id: `member_${index}_${Date.now()}`, permissions: ['view'] })),
      consultants: []
    },

    rfps: wizardData.anticipatedRFPs.map((rfp, index) => ({
      id: `rfp_${index}_${Date.now()}`,
      name: rfp.name,
      description: `Anticipated RFP for ${rfp.name}`,
      discipline: rfp.discipline,
      status: 'draft',
      allocatedBudget: rfp.estimatedBudget,
      expectedResponses: 3,
      receivedResponses: 0,
      issueDate: new Date(new Date(wizardData.startDate).getTime() + index * 30 * 24 * 60 * 60 * 1000).toISOString(),
      responseDeadline: new Date(new Date(wizardData.startDate).getTime() + (index * 30 + 14) * 24 * 60 * 60 * 1000).toISOString(),
      evaluationDeadline: new Date(new Date(wizardData.startDate).getTime() + (index * 30 + 21) * 24 * 60 * 60 * 1000).toISOString(),
      bids: [],
      evaluationCriteria: [],
      evaluationNotes: ''
    })),

    analyses: [],
    documents: [],
    risks: [],

    performance: {
      schedulePerformance: {
        plannedValue: 0,
        earnedValue: 0,
        actualCost: 0,
        scheduleVariance: 0,
        costVariance: 0,
        spi: 1,
        cpi: 1
      },
      budgetPerformance: {
        budgetUtilization: 0,
        forecastAtCompletion: wizardData.totalBudget,
        varianceAtCompletion: 0
      },
      qualityMetrics: {
        defectRate: 0,
        reworkHours: 0,
        clientSatisfaction: 8
      },
      lastUpdated: now
    },

    createdAt: now,
    updatedAt: now,
    createdBy: wizardData.owner.name,
    tags: [wizardData.discipline, wizardData.projectType],
    notes: ''
  };

  return project;
}

// Integration helpers
export function linkAnalysisToProject(projectId: string, analysisId: string, rfpId?: string): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    // Add analysis to project
    if (!project.analyses.includes(analysisId)) {
      project.analyses.push(analysisId);
    }

    // If RFP specified, create bid entry
    if (rfpId) {
      const rfp = project.rfps.find(r => r.id === rfpId);
      if (rfp) {
        // Get analysis details
        const analyses = JSON.parse(localStorage.getItem('levelr_analyses') || '[]') as SavedAnalysis[];
        const analysis = analyses.find(a => a.id === analysisId);

        if (analysis) {
          const bid: ProjectBid = {
            id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            bidderName: analysis.result.contractor_name,
            bidAmount: analysis.result.total_amount,
            analysisId,
            submissionDate: analysis.timestamp,
            scores: [],
            totalScore: 0,
            rank: rfp.bids.length + 1,
            notes: '',
            awarded: false,
            riskLevel: analysis.riskAssessment?.level.toLowerCase() as 'low' | 'medium' | 'high' || 'medium',
            riskFactors: analysis.riskAssessment?.factors || []
          };

          rfp.bids.push(bid);
          rfp.receivedResponses = rfp.bids.length;
        }
      }
    }

    project.updatedAt = new Date().toISOString();
    saveProject(project);
    return true;
  } catch (error) {
    console.error('Error linking analysis to project:', error);
    return false;
  }
}

export function linkRFPToProject(projectId: string, rfpId: string): boolean {
  try {
    const project = getProject(projectId);
    if (!project) return false;

    // Get RFP details
    const rfps = JSON.parse(localStorage.getItem('levelr_rfps') || '[]') as SavedRFP[];
    const savedRFP = rfps.find(r => r.id === rfpId);

    if (savedRFP) {
      const projectRFP: ProjectRFP = {
        id: rfpId,
        name: savedRFP.project.projectName,
        description: savedRFP.project.description,
        discipline: savedRFP.project.discipline as 'construction' | 'design' | 'trade',
        status: savedRFP.status === 'draft' ? 'draft' : savedRFP.status === 'issued' ? 'issued' : 'responses_received',
        allocatedBudget: savedRFP.project.estimatedValue,
        expectedResponses: 3,
        receivedResponses: savedRFP.receivedBids?.length || 0,
        issueDate: savedRFP.project.timeline.rfpIssueDate,
        responseDeadline: savedRFP.project.timeline.proposalDeadline,
        evaluationDeadline: savedRFP.project.timeline.awardDate,
        bids: [],
        evaluationCriteria: [],
        evaluationNotes: ''
      };

      // Add received bids if any
      if (savedRFP.receivedBids) {
        const analyses = JSON.parse(localStorage.getItem('levelr_analyses') || '[]') as SavedAnalysis[];

        savedRFP.receivedBids.forEach(analysisId => {
          const analysis = analyses.find(a => a.id === analysisId);
          if (analysis) {
            const bid: ProjectBid = {
              id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
              bidderName: analysis.result.contractor_name,
              bidAmount: analysis.result.total_amount,
              analysisId,
              submissionDate: analysis.timestamp,
              scores: [],
              totalScore: 0,
              rank: projectRFP.bids.length + 1,
              notes: '',
              awarded: false,
              riskLevel: analysis.riskAssessment?.level.toLowerCase() as 'low' | 'medium' | 'high' || 'medium',
              riskFactors: analysis.riskAssessment?.factors || []
            };

            projectRFP.bids.push(bid);
          }
        });
      }

      // Add or update RFP in project
      const existingIndex = project.rfps.findIndex(r => r.id === rfpId);
      if (existingIndex >= 0) {
        project.rfps[existingIndex] = projectRFP;
      } else {
        project.rfps.push(projectRFP);
      }

      project.updatedAt = new Date().toISOString();
      saveProject(project);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error linking RFP to project:', error);
    return false;
  }
}

// Project templates
export function getProjectTemplates(): ProjectTemplate[] {
  try {
    const stored = localStorage.getItem(PROJECT_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : getDefaultProjectTemplates();
  } catch (error) {
    console.error('Error loading project templates:', error);
    return getDefaultProjectTemplates();
  }
}

function getDefaultProjectTemplates(): ProjectTemplate[] {
  return [
    {
      id: 'template_commercial_construction',
      name: 'Commercial Construction',
      description: 'Template for commercial building construction projects',
      discipline: 'construction',
      projectType: 'commercial_office',
      defaultMilestones: [
        { name: 'Design Phase Complete', description: 'Architectural and engineering design completed', dependencies: [], critical: true, progress: 0 },
        { name: 'Permits Obtained', description: 'All required permits secured', dependencies: [], critical: true, progress: 0 },
        { name: 'Construction Start', description: 'Ground breaking and construction commencement', dependencies: [], critical: true, progress: 0 },
        { name: 'Shell Complete', description: 'Building shell and core completed', dependencies: [], critical: false, progress: 0 },
        { name: 'MEP Rough-in Complete', description: 'Mechanical, electrical, plumbing rough-in', dependencies: [], critical: false, progress: 0 },
        { name: 'Final Inspection', description: 'Final building inspection and approval', dependencies: [], critical: true, progress: 0 },
        { name: 'Project Closeout', description: 'Project completion and handover', dependencies: [], critical: true, progress: 0 }
      ],
      defaultBudgetCategories: ['rfp_budget', 'contingency', 'soft_costs'],
      defaultRisks: [
        { title: 'Weather Delays', description: 'Potential construction delays due to weather', category: 'schedule', probability: 5, impact: 4, riskScore: 20, mitigation: 'Build weather contingency into schedule', owner: '' },
        { title: 'Permit Delays', description: 'Delays in obtaining building permits', category: 'regulatory', probability: 3, impact: 6, riskScore: 18, mitigation: 'Early permit application and follow-up', owner: '' },
        { title: 'Cost Escalation', description: 'Material and labor cost increases', category: 'budget', probability: 6, impact: 5, riskScore: 30, mitigation: 'Lock in material prices early', owner: '' }
      ],
      defaultTeamRoles: ['Project Manager', 'Architect', 'Structural Engineer', 'MEP Engineer', 'General Contractor'],
      estimatedDuration: 365,
      criticalPath: ['Design Phase Complete', 'Permits Obtained', 'Construction Start', 'Final Inspection', 'Project Closeout']
    },
    {
      id: 'template_design_services',
      name: 'Architectural Design Services',
      description: 'Template for architectural design projects',
      discipline: 'design',
      projectType: 'architectural',
      defaultMilestones: [
        { name: 'Programming Complete', description: 'Project programming and requirements analysis', dependencies: [], critical: true, progress: 0 },
        { name: 'Schematic Design', description: 'Conceptual design and layouts', dependencies: [], critical: true, progress: 0 },
        { name: 'Design Development', description: 'Detailed design development', dependencies: [], critical: true, progress: 0 },
        { name: 'Construction Documents', description: 'Final construction drawings and specifications', dependencies: [], critical: true, progress: 0 },
        { name: 'Permit Submission', description: 'Submit for building permits', dependencies: [], critical: true, progress: 0 },
        { name: 'Bidding Support', description: 'Support contractor bidding process', dependencies: [], critical: false, progress: 0 }
      ],
      defaultBudgetCategories: ['rfp_budget', 'contingency'],
      defaultRisks: [
        { title: 'Scope Creep', description: 'Uncontrolled expansion of project scope', category: 'budget', probability: 7, impact: 5, riskScore: 35, mitigation: 'Clear scope definition and change order process', owner: '' },
        { title: 'Code Compliance Issues', description: 'Building code compliance challenges', category: 'regulatory', probability: 4, impact: 6, riskScore: 24, mitigation: 'Early code review and consultation', owner: '' }
      ],
      defaultTeamRoles: ['Principal Architect', 'Project Architect', 'Design Team', 'Client Representative'],
      estimatedDuration: 180,
      criticalPath: ['Programming Complete', 'Schematic Design', 'Design Development', 'Construction Documents', 'Permit Submission']
    }
  ];
}