// src/lib/mock-data.ts

import { ProjectEcosystem, ProjectDiscipline, ProjectBid } from '@/types/project';
import { RFPProject } from '@/types/rfp';
import { saveProject, saveRFP, linkRFPToProject } from '@/lib/storage';

// Mock project templates with realistic data
const MOCK_PROJECTS: Partial<ProjectEcosystem>[] = [
  {
    name: 'Downtown Office Complex',
    description: 'A 12-story mixed-use office building with ground-floor retail and underground parking. LEED Gold certification target with sustainable design features.',
    disciplines: ['design', 'construction', 'trade'],
    projectType: 'commercial_office',
    totalBudget: 15000000,
    status: 'bidding',
    location: {
      address: '123 Main Street',
      city: 'Portland',
      state: 'OR',
      zipCode: '97205'
    }
  },
  {
    name: 'Riverside Apartments',
    description: 'A 4-story residential apartment complex with 80 units, including affordable housing units and community amenities.',
    disciplines: ['design', 'construction', 'trade'],
    projectType: 'residential_multifamily',
    totalBudget: 8500000,
    status: 'active',
    location: {
      address: '456 River Drive',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101'
    }
  },
  {
    name: 'Tech Campus Design Services',
    description: 'Architectural and MEP engineering services for a new technology campus including 3 buildings and central utilities.',
    disciplines: ['design'],
    projectType: 'design_services',
    totalBudget: 1200000,
    status: 'active',
    location: {
      address: '789 Innovation Blvd',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701'
    }
  },
  {
    name: 'Westside Shopping Center',
    description: 'Mixed-use retail and residential development with 150,000 sq ft retail space and 200 residential units above.',
    disciplines: ['design', 'construction', 'trade'],
    projectType: 'mixed_use',
    totalBudget: 45000000,
    status: 'planning',
    location: {
      address: '321 Westside Ave',
      city: 'Denver',
      state: 'CO',
      zipCode: '80202'
    }
  },
  {
    name: 'Medical Office Building',
    description: 'A 6-story medical office building with specialized HVAC, medical gas systems, and imaging equipment infrastructure.',
    disciplines: ['design', 'construction', 'trade'],
    projectType: 'healthcare',
    totalBudget: 22000000,
    status: 'pre-construction',
    location: {
      address: '555 Health Plaza',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001'
    }
  },
  {
    name: 'University Student Housing',
    description: 'New student housing complex with 300 beds, study areas, and recreational facilities for State University.',
    disciplines: ['design', 'construction', 'trade'],
    projectType: 'educational',
    totalBudget: 18000000,
    status: 'bidding',
    location: {
      address: '100 University Circle',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30309'
    }
  },
  {
    name: 'Luxury Resort Construction',
    description: 'A 200-room luxury resort with spa, conference center, and multiple dining venues. High-end finishes and sustainable design.',
    disciplines: ['construction', 'trade'],
    projectType: 'hospitality',
    totalBudget: 35000000,
    status: 'active',
    location: {
      address: '777 Resort Drive',
      city: 'Napa',
      state: 'CA',
      zipCode: '94558'
    }
  },
  {
    name: 'Historic Building Renovation',
    description: 'Tenant improvement and renovation of a historic 1920s building into modern office space while preserving historic features.',
    disciplines: ['design', 'construction'],
    projectType: 'tenant_improvement',
    totalBudget: 2800000,
    status: 'completed',
    location: {
      address: '888 Historic Square',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101'
    }
  }
];

// Mock RFP templates
const MOCK_RFPS: Partial<RFPProject>[] = [
  {
    projectName: 'Downtown Office Complex - General Construction',
    discipline: 'construction',
    projectType: 'commercial_office',
    description: 'General contracting services for 12-story office building including structure, envelope, and interior build-out.',
    estimatedValue: 12000000,
    location: {
      address: '123 Main Street',
      city: 'Portland',
      state: 'OR',
      zipCode: '97205'
    }
  },
  {
    projectName: 'Riverside Apartments - MEP Design',
    discipline: 'design',
    projectType: 'residential_multifamily',
    description: 'Complete MEP engineering design services for 80-unit apartment complex including energy modeling and commissioning.',
    estimatedValue: 450000,
    location: {
      address: '456 River Drive',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101'
    }
  },
  {
    projectName: 'Medical Building - HVAC Systems',
    discipline: 'trade',
    projectType: 'healthcare',
    description: 'Design-build HVAC systems including medical-grade air handling, emergency power HVAC, and building automation.',
    estimatedValue: 1800000,
    location: {
      address: '555 Health Plaza',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001'
    }
  }
];

// Generate realistic schedule and budget data
function generateProjectSchedule(project: Partial<ProjectEcosystem>) {
  const startDate = new Date();
  const duration = project.totalBudget && project.totalBudget > 20000000 ? 720 :
                  project.totalBudget && project.totalBudget > 10000000 ? 540 : 365;
  const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

  const phases = [
    {
      id: 'phase_1',
      name: 'Planning & Design',
      description: 'Project planning, design development, and permitting',
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date(startDate.getTime() + (duration * 0.3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed' as const,
      budgetAllocated: (project.totalBudget || 1000000) * 0.15,
      budgetUsed: (project.totalBudget || 1000000) * 0.14,
      milestoneIds: []
    },
    {
      id: 'phase_2',
      name: 'Pre-Construction',
      description: 'Bidding, contractor selection, and construction preparation',
      startDate: new Date(startDate.getTime() + (duration * 0.25) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(startDate.getTime() + (duration * 0.4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: project.status === 'planning' ? 'not-started' as const :
             project.status === 'bidding' ? 'in-progress' as const : 'completed' as const,
      budgetAllocated: (project.totalBudget || 1000000) * 0.05,
      budgetUsed: (project.totalBudget || 1000000) * (project.status === 'bidding' ? 0.02 : 0.05),
      milestoneIds: []
    },
    {
      id: 'phase_3',
      name: 'Construction',
      description: 'Main construction phase',
      startDate: new Date(startDate.getTime() + (duration * 0.4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(startDate.getTime() + (duration * 0.9) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: ['active', 'pre-construction'].includes(project.status || '') ?
             (project.status === 'active' ? 'in-progress' as const : 'not-started' as const) :
             project.status === 'completed' ? 'completed' as const : 'not-started' as const,
      budgetAllocated: (project.totalBudget || 1000000) * 0.75,
      budgetUsed: (project.totalBudget || 1000000) * (project.status === 'active' ? 0.35 :
                   project.status === 'completed' ? 0.73 : 0),
      milestoneIds: []
    },
    {
      id: 'phase_4',
      name: 'Closeout',
      description: 'Final inspections, commissioning, and project handover',
      startDate: new Date(startDate.getTime() + (duration * 0.85) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: project.status === 'completed' ? 'completed' as const : 'not-started' as const,
      budgetAllocated: (project.totalBudget || 1000000) * 0.05,
      budgetUsed: (project.totalBudget || 1000000) * (project.status === 'completed' ? 0.05 : 0),
      milestoneIds: []
    }
  ];

  const milestones = [
    {
      id: 'milestone_1',
      name: 'Design Approval',
      description: 'Final design approved by client and authorities',
      date: new Date(startDate.getTime() + (duration * 0.25) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed' as const,
      dependencies: [],
      linkedRfpId: undefined,
      actualDate: new Date(startDate.getTime() + (duration * 0.24) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: 'milestone_2',
      name: 'Permits Issued',
      description: 'All necessary permits obtained',
      date: new Date(startDate.getTime() + (duration * 0.35) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: ['planning', 'bidding'].includes(project.status || '') ? 'upcoming' as const : 'completed' as const,
      dependencies: ['milestone_1'],
      linkedRfpId: undefined,
      actualDate: ['planning', 'bidding'].includes(project.status || '') ? undefined :
                  new Date(startDate.getTime() + (duration * 0.33) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: 'milestone_3',
      name: 'Construction Start',
      description: 'Construction phase begins',
      date: new Date(startDate.getTime() + (duration * 0.4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: project.status === 'active' ? 'completed' as const :
             project.status === 'pre-construction' ? 'in-progress' as const :
             project.status === 'completed' ? 'completed' as const : 'upcoming' as const,
      dependencies: ['milestone_2'],
      linkedRfpId: undefined,
      actualDate: project.status === 'active' || project.status === 'completed' ?
                  new Date(startDate.getTime() + (duration * 0.42) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
    },
    {
      id: 'milestone_4',
      name: 'Substantial Completion',
      description: 'Project substantially complete',
      date: new Date(startDate.getTime() + (duration * 0.9) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: project.status === 'completed' ? 'completed' as const : 'upcoming' as const,
      dependencies: ['milestone_3'],
      linkedRfpId: undefined,
      actualDate: project.status === 'completed' ?
                  new Date(startDate.getTime() + (duration * 0.88) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
    }
  ];

  return { phases, milestones };
}

// Generate budget allocations
function generateBudgetAllocations(project: Partial<ProjectEcosystem>) {
  const budget = project.totalBudget || 1000000;
  const disciplines = project.disciplines || ['construction'];

  const allocations = [];

  if (disciplines.includes('design')) {
    allocations.push(
      {
        id: 'alloc_design_arch',
        name: 'Architectural Design',
        discipline: 'design' as ProjectDiscipline,
        category: 'architectural',
        allocatedAmount: budget * 0.06,
        actualAmount: budget * (project.status === 'completed' ? 0.058 :
                               ['active', 'pre-construction'].includes(project.status || '') ? 0.045 : 0),
        variance: budget * -0.002,
        status: 'committed' as const,
        notes: 'Design services contract executed',
        committedAmount: budget * 0.06,
        linkedRfpIds: []
      },
      {
        id: 'alloc_design_mep',
        name: 'MEP Engineering',
        discipline: 'design' as ProjectDiscipline,
        category: 'mep_engineering',
        allocatedAmount: budget * 0.04,
        actualAmount: budget * (project.status === 'completed' ? 0.041 :
                               ['active', 'pre-construction'].includes(project.status || '') ? 0.025 : 0),
        variance: budget * 0.001,
        status: 'committed' as const,
        notes: 'MEP engineering services',
        committedAmount: budget * 0.04,
        linkedRfpIds: []
      }
    );
  }

  if (disciplines.includes('construction')) {
    allocations.push(
      {
        id: 'alloc_const_general',
        name: 'General Construction',
        discipline: 'construction' as ProjectDiscipline,
        category: 'general_conditions',
        allocatedAmount: budget * 0.65,
        actualAmount: budget * (project.status === 'completed' ? 0.68 :
                               project.status === 'active' ? 0.35 : 0),
        variance: budget * (project.status === 'completed' ? 0.03 : 0),
        status: ['bidding', 'active', 'pre-construction', 'completed'].includes(project.status || '') ? 'committed' as const : 'open' as const,
        notes: project.status === 'completed' ? 'Final costs exceeded due to change orders' :
               project.status === 'active' ? 'Construction in progress' :
               'General contractor to be selected',
        committedAmount: ['bidding', 'active', 'pre-construction', 'completed'].includes(project.status || '') ? budget * 0.65 : 0,
        linkedRfpIds: []
      }
    );
  }

  if (disciplines.includes('trade')) {
    allocations.push(
      {
        id: 'alloc_trade_electrical',
        name: 'Electrical Systems',
        discipline: 'trade' as ProjectDiscipline,
        category: 'electrical',
        allocatedAmount: budget * 0.12,
        actualAmount: budget * (project.status === 'completed' ? 0.115 :
                               project.status === 'active' ? 0.06 : 0),
        variance: budget * (project.status === 'completed' ? -0.005 : 0),
        status: ['active', 'pre-construction', 'completed'].includes(project.status || '') ? 'committed' as const : 'open' as const,
        notes: 'Specialized electrical and low-voltage systems',
        committedAmount: ['active', 'pre-construction', 'completed'].includes(project.status || '') ? budget * 0.12 : 0,
        linkedRfpIds: []
      },
      {
        id: 'alloc_trade_plumbing',
        name: 'Plumbing & HVAC',
        discipline: 'trade' as ProjectDiscipline,
        category: 'mechanical',
        allocatedAmount: budget * 0.08,
        actualAmount: budget * (project.status === 'completed' ? 0.082 :
                               project.status === 'active' ? 0.04 : 0),
        variance: budget * (project.status === 'completed' ? 0.002 : 0),
        status: ['active', 'pre-construction', 'completed'].includes(project.status || '') ? 'committed' as const : 'open' as const,
        notes: 'Mechanical systems and plumbing',
        committedAmount: ['active', 'pre-construction', 'completed'].includes(project.status || '') ? budget * 0.08 : 0,
        linkedRfpIds: []
      }
    );
  }

  return allocations;
}

// Generate complete project with realistic data
function generateCompleteProject(mockProject: Partial<ProjectEcosystem>): ProjectEcosystem {
  const { phases, milestones } = generateProjectSchedule(mockProject);
  const budgetAllocations = generateBudgetAllocations(mockProject);

  const now = new Date().toISOString();

  return {
    id: '',
    name: mockProject.name || 'Mock Project',
    description: mockProject.description || 'Mock project for testing',
    disciplines: mockProject.disciplines || ['construction'],
    projectType: mockProject.projectType || 'commercial_office',
    totalBudget: mockProject.totalBudget || 1000000,
    location: mockProject.location,
    baselineSchedule: {
      startDate: phases[0].startDate,
      endDate: phases[phases.length - 1].endDate,
      phases: phases,
      milestones: milestones
    },
    currentSchedule: {
      startDate: phases[0].startDate,
      endDate: phases[phases.length - 1].endDate,
      phases: phases,
      milestones: milestones
    },
    status: mockProject.status || 'planning',
    rfpIds: [],
    bids: generateMockBids(mockProject),
    awardedBids: [],
    budgetAllocations: budgetAllocations,
    createdAt: now,
    updatedAt: now
  };
}

// Generate RFP with realistic timeline
function generateCompleteRFP(mockRFP: Partial<RFPProject>): RFPProject {
  const now = new Date();
  const rfpIssue = now.toISOString().split('T')[0];
  const questionsDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const proposalDeadline = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const awardDate = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const constructionStart = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const completion = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    id: '',
    projectName: mockRFP.projectName || 'Mock RFP',
    discipline: mockRFP.discipline || 'construction',
    projectType: mockRFP.projectType || 'commercial_office',
    projectSubtype: undefined,
    description: mockRFP.description || 'Mock RFP for testing',
    estimatedValue: mockRFP.estimatedValue || 1000000,
    location: mockRFP.location || {
      address: '123 Mock St',
      city: 'Test City',
      state: 'CA',
      zipCode: '90210'
    },
    timeline: {
      rfpIssueDate: rfpIssue,
      questionsDeadline: questionsDeadline,
      proposalDeadline: proposalDeadline,
      awardDate: awardDate,
      constructionStart: constructionStart,
      completion: completion
    },
    scopeDefinition: {
      specialRequirements: ['LEED Gold certification required'],
      exclusions: ['Site utility connections'],
      deliveryMethod: 'design_bid_build',
      contractType: 'lump_sum',
      csiDivisions: {},
      framework: {
        type: mockRFP.discipline === 'design' ? 'aia' :
              mockRFP.discipline === 'trade' ? 'technical' : 'csi',
        sections: {}
      }
    },
    siteConditions: {
      siteAccess: 'Standard street access available',
      utilitiesAvailable: ['Electric', 'Water', 'Sewer', 'Gas'],
      environmentalConcerns: [],
      specialConstraints: ['Construction hours: 7 AM - 6 PM weekdays only']
    },
    commercialTerms: {
      pricingStructure: 'lump_sum',
      paymentSchedule: 'monthly',
      retainage: 5,
      insuranceRequirements: [
        { type: 'general_liability', minimumAmount: 2000000, description: 'General liability coverage', additionalInsureds: [] },
        { type: 'workers_comp', minimumAmount: 1000000, description: 'Workers compensation coverage', additionalInsureds: [] },
        { type: 'professional', minimumAmount: 1000000, description: 'Professional liability coverage', additionalInsureds: [] }
      ],
      bondingRequired: true,
      changeOrderProcedures: 'Change orders require written approval with cost breakdown'
    },
    submissionRequirements: {
      technicalProposal: ['Project approach and methodology', 'Construction schedule', 'Quality control plan'],
      commercialProposal: ['Detailed cost breakdown', 'Payment schedule', 'Change order procedures'],
      qualifications: ['Company experience', 'Key personnel resumes', 'Financial statements'],
      references: 3,
      presentationRequired: false,
      evaluationCriteria: [
        { category: 'Price', weight: 40, description: 'Competitive pricing and value proposition' },
        { category: 'Experience', weight: 30, description: 'Relevant project experience and qualifications' },
        { category: 'Schedule', weight: 20, description: 'Realistic timeline and milestone planning' },
        { category: 'References', weight: 10, description: 'Quality of client references and past performance' }
      ]
    },
    qualificationCriteria: {
      minimumExperience: 5,
      requiredProjectTypes: ['Similar project type'],
      minimumAnnualRevenue: (mockRFP.estimatedValue || 1000000) * 3,
      keyPersonnelRequirements: ['Licensed project manager', 'Certified safety officer'],
      safetyRequirements: ['OSHA 30-hour training', 'Safety record review'],
      certificationRequirements: ['General contractor license', 'Bonding capacity']
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

// Main functions to generate and load mock data
export function generateMockProjects(): string[] {
  const projectIds: string[] = [];

  MOCK_PROJECTS.forEach(mockProject => {
    const completeProject = generateCompleteProject(mockProject);
    const projectId = saveProject(completeProject);
    projectIds.push(projectId);
  });

  return projectIds;
}

export function generateMockRFPs(): { rfpIds: string[], projectLinks: { projectId: string, rfpId: string }[] } {
  const rfpIds: string[] = [];
  const projectLinks: { projectId: string, rfpId: string }[] = [];

  MOCK_RFPS.forEach(mockRFP => {
    const completeRFP = generateCompleteRFP(mockRFP);
    const rfpId = saveRFP(completeRFP);
    rfpIds.push(rfpId);

    // Link some RFPs to projects (simplified matching by name)
    // This would be more sophisticated in practice
    if (mockRFP.projectName?.includes('Downtown Office')) {
      projectLinks.push({ projectId: 'mock_project_1', rfpId });
    } else if (mockRFP.projectName?.includes('Riverside')) {
      projectLinks.push({ projectId: 'mock_project_2', rfpId });
    } else if (mockRFP.projectName?.includes('Medical')) {
      projectLinks.push({ projectId: 'mock_project_5', rfpId });
    }
  });

  return { rfpIds, projectLinks };
}

export function loadMockData(): void {
  console.log('Loading mock data for project management testing...');

  const projectIds = generateMockProjects();
  const { rfpIds, projectLinks } = generateMockRFPs();

  // Link RFPs to projects (simplified approach)
  projectLinks.forEach(link => {
    try {
      linkRFPToProject(link.projectId, link.rfpId);
    } catch (error) {
      console.warn('Could not link RFP to project:', error);
    }
  });

  console.log(`Generated ${projectIds.length} mock projects and ${rfpIds.length} mock RFPs`);
}

export function clearMockData(): void {
  try {
    // Clear project data
    const projectKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('project_')) {
        projectKeys.push(key);
      }
    }
    projectKeys.forEach(key => localStorage.removeItem(key));

    // Clear RFP data
    const rfpKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('rfp_')) {
        rfpKeys.push(key);
      }
    }
    rfpKeys.forEach(key => localStorage.removeItem(key));

    // Clear indexes
    localStorage.removeItem('project_index');
    localStorage.removeItem('rfp_index');

    console.log(`Cleared ${projectKeys.length} projects and ${rfpKeys.length} RFPs from storage`);
  } catch (error) {
    console.error('Error clearing mock data:', error);
  }
}

export function isMockDataEnabled(): boolean {
  return localStorage.getItem('mock_data_enabled') === 'true';
}

function generateMockBids(mockProject: Partial<ProjectEcosystem>): ProjectBid[] {
  if (!mockProject.status || ['planning'].includes(mockProject.status)) {
    return []; // No bids yet for early stage projects
  }

  const budget = mockProject.totalBudget || 1000000;
  const baseAmount = budget * 0.65; // Assuming construction portion
  const bidCount = mockProject.status === 'bidding' ? Math.floor(Math.random() * 3) + 2 : // 2-4 bids
                   mockProject.status === 'active' || mockProject.status === 'pre-construction' ? Math.floor(Math.random() * 2) + 3 : // 3-4 bids
                   Math.floor(Math.random() * 4) + 3; // 3-6 bids for completed projects

  const contractors = [
    'ABC Construction Co.',
    'BuildRight Partners',
    'Elite Builders LLC',
    'Metro Construction Group',
    'Premier General Contractors',
    'Skyline Construction Inc.',
    'United Building Solutions'
  ];

  const capabilities = [
    ['LEED Certified', 'Fast Track Construction'],
    ['Union Labor', 'Historic Renovation'],
    ['Healthcare Specialization', 'BIM/VDC'],
    ['Retail Experience', 'Design-Build'],
    ['Educational Projects', 'Sustainable Construction'],
    ['High-Rise Experience', 'Prefab Construction'],
    ['MEP Self-Perform', 'Concrete Specialization']
  ];

  const bids: ProjectBid[] = [];
  const selectedContractors = contractors.sort(() => 0.5 - Math.random()).slice(0, bidCount);

  selectedContractors.forEach((contractorName, index) => {
    const variance = (Math.random() - 0.5) * 0.3; // ±15% variance
    const bidAmount = Math.round(baseAmount * (1 + variance));
    const submissionDate = new Date();
    submissionDate.setDate(submissionDate.getDate() - Math.floor(Math.random() * 30));

    const status: ProjectBid['status'] =
      mockProject.status === 'bidding' ?
        (index === 0 ? 'under-review' : 'submitted') :
      mockProject.status === 'active' || mockProject.status === 'pre-construction' ?
        (index === 0 ? 'awarded' : index === 1 ? 'shortlisted' : 'rejected') :
      mockProject.status === 'completed' ?
        (index === 0 ? 'awarded' : 'rejected') :
        'submitted';

    bids.push({
      id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${index}`,
      contractorName,
      bidAmount,
      submissionDate: submissionDate.toISOString().split('T')[0],
      status,
      bondingCapacity: bidAmount * (1.5 + Math.random() * 0.5), // 150-200% of bid
      yearsExperience: Math.floor(Math.random() * 20) + 10, // 10-30 years
      similarProjectsCount: Math.floor(Math.random() * 15) + 5, // 5-20 projects
      proposedDuration: Math.floor(Math.random() * 60) + 180, // 180-240 days
      specialCapabilities: capabilities[index % capabilities.length],
      notes: index === 0 && status === 'awarded' ? 'Selected for competitive pricing and strong qualifications' :
             status === 'rejected' ? 'Did not meet technical requirements' :
             status === 'shortlisted' ? 'Strong candidate, under final review' :
             'Bid under evaluation',
      evaluationScore: status === 'awarded' ? Math.floor(Math.random() * 10) + 90 :
                      status === 'shortlisted' ? Math.floor(Math.random() * 15) + 75 :
                      status === 'rejected' ? Math.floor(Math.random() * 30) + 40 :
                      Math.floor(Math.random() * 40) + 60
    });
  });

  // Sort bids by amount (lowest first)
  return bids.sort((a, b) => a.bidAmount - b.bidAmount);
}

export function toggleMockData(): boolean {
  const isEnabled = !isMockDataEnabled();
  localStorage.setItem('mock_data_enabled', isEnabled.toString());

  if (isEnabled) {
    loadMockData();
  } else {
    clearMockData();
  }

  return isEnabled;
}