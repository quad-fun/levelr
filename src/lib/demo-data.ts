// src/lib/demo-data.ts
// Demo data for project management features

import { SavedProject, ProjectAnalytics } from '@/types/project';
import { SavedAnalysis } from '@/lib/storage';
import { SavedRFP } from '@/types/rfp';

// Demo Projects
export const DEMO_PROJECTS: SavedProject[] = [
  {
    id: 'demo_project_1',
    name: 'Downtown Office Complex',
    description: 'A 15-story mixed-use development featuring office spaces, retail, and underground parking. LEED Gold certification target.',
    discipline: 'construction',
    projectType: 'commercial_office',
    status: 'active',
    phase: 'execution',
    priority: 'high',

    location: {
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105'
    },

    timeline: {
      startDate: '2024-01-15',
      endDate: '2025-08-30',
      actualStartDate: '2024-01-15',
      milestones: [
        {
          id: 'milestone_1',
          name: 'Design Phase Complete',
          description: 'Finalize all architectural and engineering drawings',
          dueDate: '2024-03-15',
          completedDate: '2024-03-12',
          status: 'completed',
          dependencies: [],
          critical: true,
          progress: 100
        },
        {
          id: 'milestone_2',
          name: 'Permits Obtained',
          description: 'Secure all required building permits',
          dueDate: '2024-04-30',
          completedDate: '2024-04-28',
          status: 'completed',
          dependencies: ['milestone_1'],
          critical: true,
          progress: 100
        },
        {
          id: 'milestone_3',
          name: 'Foundation Complete',
          description: 'Complete excavation and foundation work',
          dueDate: '2024-08-15',
          status: 'in_progress',
          dependencies: ['milestone_2'],
          critical: true,
          progress: 75
        },
        {
          id: 'milestone_4',
          name: 'Structural Steel Complete',
          description: 'Complete structural steel installation',
          dueDate: '2024-12-20',
          status: 'pending',
          dependencies: ['milestone_3'],
          critical: true,
          progress: 0
        },
        {
          id: 'milestone_5',
          name: 'MEP Rough-in Complete',
          description: 'Complete mechanical, electrical, plumbing rough-in',
          dueDate: '2025-04-15',
          status: 'pending',
          dependencies: ['milestone_4'],
          critical: false,
          progress: 0
        },
        {
          id: 'milestone_6',
          name: 'Final Inspection',
          description: 'Pass final building inspection',
          dueDate: '2025-07-30',
          status: 'pending',
          dependencies: ['milestone_5'],
          critical: true,
          progress: 0
        }
      ]
    },

    budget: {
      totalBudget: 45000000,
      allocatedBudget: 38500000,
      spentBudget: 18750000,
      contingencyBudget: 4500000,
      categories: ['rfp_budget', 'contingency', 'soft_costs'],
      breakdown: [
        {
          category: 'rfp_budget',
          allocated: 35000000,
          spent: 16800000,
          remaining: 18200000,
          percentOfTotal: 77.8
        },
        {
          category: 'contingency',
          allocated: 4500000,
          spent: 450000,
          remaining: 4050000,
          percentOfTotal: 10.0
        },
        {
          category: 'soft_costs',
          allocated: 5500000,
          spent: 1500000,
          remaining: 4000000,
          percentOfTotal: 12.2
        }
      ],
      cashFlow: []
    },

    team: {
      owner: {
        id: 'owner_1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@citydev.com',
        role: 'Development Director',
        company: 'City Development Group',
        phone: '(555) 123-4567',
        responsibility: ['Project Oversight', 'Stakeholder Management'],
        permissions: ['admin']
      },
      projectManager: {
        id: 'pm_1',
        name: 'Michael Chen',
        email: 'mchen@constructionpro.com',
        role: 'Senior Project Manager',
        company: 'Construction Pro LLC',
        phone: '(555) 987-6543',
        responsibility: ['Daily Operations', 'Schedule Management', 'Quality Control'],
        permissions: ['edit', 'rfp_management']
      },
      members: [
        {
          id: 'member_1',
          name: 'Emily Rodriguez',
          email: 'erodriguez@archstudio.com',
          role: 'Lead Architect',
          company: 'Arch Studio Partners',
          phone: '(555) 456-7890',
          responsibility: ['Design Coordination', 'Code Compliance'],
          permissions: ['edit']
        },
        {
          id: 'member_2',
          name: 'David Kim',
          email: 'dkim@structengine.com',
          role: 'Structural Engineer',
          company: 'Structural Engineering Inc.',
          phone: '(555) 234-5678',
          responsibility: ['Structural Design', 'Safety Analysis'],
          permissions: ['view', 'edit']
        }
      ],
      consultants: [
        {
          id: 'consultant_1',
          name: 'Lisa Park',
          email: 'lpark@sustain-consult.com',
          role: 'Sustainability Consultant',
          company: 'Sustainable Design Consultants',
          phone: '(555) 345-6789',
          responsibility: ['LEED Certification', 'Energy Modeling'],
          permissions: ['view']
        }
      ]
    },

    rfps: [
      {
        id: 'rfp_1',
        name: 'General Construction Services',
        description: 'General contractor services for 15-story office complex',
        discipline: 'construction',
        status: 'awarded',
        allocatedBudget: 28000000,
        expectedResponses: 5,
        receivedResponses: 4,
        issueDate: '2024-02-01',
        responseDeadline: '2024-03-01',
        evaluationDeadline: '2024-03-15',
        awardDate: '2024-03-20',
        awardedBid: 'bid_1_1',
        bids: [
          {
            id: 'bid_1_1',
            bidderName: 'Premier Construction Corp',
            bidAmount: 26800000,
            analysisId: 'analysis_demo_1',
            submissionDate: '2024-02-28',
            scores: [],
            totalScore: 92,
            rank: 1,
            notes: 'Strong technical proposal with excellent safety record',
            awarded: true,
            riskLevel: 'low',
            riskFactors: ['Excellent safety record', 'Local experience']
          },
          {
            id: 'bid_1_2',
            bidderName: 'Metro Builders LLC',
            bidAmount: 27200000,
            analysisId: 'analysis_demo_2',
            submissionDate: '2024-02-27',
            scores: [],
            totalScore: 87,
            rank: 2,
            notes: 'Competitive pricing with good references',
            awarded: false,
            riskLevel: 'medium',
            riskFactors: ['Limited high-rise experience']
          }
        ],
        evaluationCriteria: [],
        evaluationNotes: 'Premier Construction selected based on technical excellence and competitive pricing'
      },
      {
        id: 'rfp_2',
        name: 'MEP Engineering Services',
        description: 'Mechanical, electrical, and plumbing engineering and installation',
        discipline: 'trade',
        status: 'responses_received',
        allocatedBudget: 6500000,
        expectedResponses: 4,
        receivedResponses: 3,
        issueDate: '2024-09-01',
        responseDeadline: '2024-10-01',
        evaluationDeadline: '2024-10-15',
        bids: [
          {
            id: 'bid_2_1',
            bidderName: 'Advanced MEP Systems',
            bidAmount: 6200000,
            analysisId: 'analysis_demo_3',
            submissionDate: '2024-09-30',
            scores: [],
            totalScore: 0,
            rank: 1,
            notes: 'Comprehensive BIM modeling approach',
            awarded: false,
            riskLevel: 'low',
            riskFactors: []
          },
          {
            id: 'bid_2_2',
            bidderName: 'City MEP Contractors',
            bidAmount: 6800000,
            analysisId: 'analysis_demo_4',
            submissionDate: '2024-09-29',
            scores: [],
            totalScore: 0,
            rank: 2,
            notes: 'Strong local presence and support',
            awarded: false,
            riskLevel: 'medium',
            riskFactors: ['Higher than budget estimate']
          }
        ],
        evaluationCriteria: [],
        evaluationNotes: ''
      },
      {
        id: 'rfp_3',
        name: 'Elevator Systems',
        description: 'High-speed elevator systems for 15-story building',
        discipline: 'trade',
        status: 'issued',
        allocatedBudget: 1200000,
        expectedResponses: 3,
        receivedResponses: 0,
        issueDate: '2024-10-15',
        responseDeadline: '2024-11-15',
        evaluationDeadline: '2024-11-30',
        bids: [],
        evaluationCriteria: [],
        evaluationNotes: ''
      }
    ],

    analyses: ['analysis_demo_1', 'analysis_demo_2', 'analysis_demo_3', 'analysis_demo_4'],
    documents: [],
    risks: [
      {
        id: 'risk_1',
        title: 'Weather Delays',
        description: 'Potential construction delays due to winter weather conditions',
        category: 'schedule',
        probability: 6,
        impact: 5,
        riskScore: 30,
        status: 'mitigating',
        mitigation: 'Adjusted schedule for weather windows, indoor work prioritized during winter months',
        owner: 'Michael Chen',
        identifiedDate: '2024-01-20',
        lastUpdated: '2024-10-01'
      },
      {
        id: 'risk_2',
        title: 'Steel Price Volatility',
        description: 'Fluctuating steel prices may impact budget',
        category: 'budget',
        probability: 7,
        impact: 6,
        riskScore: 42,
        status: 'monitoring',
        mitigation: 'Locked in steel pricing through Q2 2025, monitoring market trends',
        owner: 'Sarah Johnson',
        identifiedDate: '2024-02-15',
        lastUpdated: '2024-09-30'
      }
    ],

    performance: {
      schedulePerformance: {
        plannedValue: 18750000,
        earnedValue: 19200000,
        actualCost: 18750000,
        scheduleVariance: 450000,
        costVariance: 450000,
        spi: 1.02,
        cpi: 1.02
      },
      budgetPerformance: {
        budgetUtilization: 41.7,
        forecastAtCompletion: 44100000,
        varianceAtCompletion: -900000
      },
      qualityMetrics: {
        defectRate: 0.8,
        reworkHours: 120,
        clientSatisfaction: 9.2
      },
      lastUpdated: '2024-10-01'
    },

    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-10-01T15:30:00Z',
    createdBy: 'Sarah Johnson',
    tags: ['construction', 'commercial', 'high-rise', 'LEED'],
    notes: 'Project proceeding well ahead of schedule. Strong team collaboration.',
    archivedRFPs: [],
    archivedAnalyses: []
  },

  {
    id: 'demo_project_2',
    name: 'Riverside Residential Complex',
    description: 'Luxury residential development with 120 units, amenities, and riverfront park.',
    discipline: 'mixed',
    projectType: 'mixed_use',
    status: 'planning',
    phase: 'planning',
    priority: 'medium',

    location: {
      address: '456 River Drive',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201'
    },

    timeline: {
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      milestones: [
        {
          id: 'milestone_r1',
          name: 'Environmental Impact Study',
          description: 'Complete environmental assessment for riverfront development',
          dueDate: '2025-03-15',
          status: 'pending',
          dependencies: [],
          critical: true,
          progress: 0
        },
        {
          id: 'milestone_r2',
          name: 'Design Development',
          description: 'Finalize architectural and landscape design',
          dueDate: '2025-06-30',
          status: 'pending',
          dependencies: ['milestone_r1'],
          critical: true,
          progress: 0
        },
        {
          id: 'milestone_r3',
          name: 'Site Preparation',
          description: 'Clear and prepare construction site',
          dueDate: '2025-09-15',
          status: 'pending',
          dependencies: ['milestone_r2'],
          critical: true,
          progress: 0
        }
      ]
    },

    budget: {
      totalBudget: 25000000,
      allocatedBudget: 2500000,
      spentBudget: 180000,
      contingencyBudget: 2500000,
      categories: ['rfp_budget', 'contingency', 'soft_costs'],
      breakdown: [
        {
          category: 'rfp_budget',
          allocated: 20000000,
          spent: 0,
          remaining: 20000000,
          percentOfTotal: 80.0
        },
        {
          category: 'contingency',
          allocated: 2500000,
          spent: 0,
          remaining: 2500000,
          percentOfTotal: 10.0
        },
        {
          category: 'soft_costs',
          allocated: 2500000,
          spent: 180000,
          remaining: 2320000,
          percentOfTotal: 10.0
        }
      ],
      cashFlow: []
    },

    team: {
      owner: {
        id: 'owner_2',
        name: 'Robert Martinez',
        email: 'rmartinez@riversiddev.com',
        role: 'Project Director',
        company: 'Riverside Development',
        phone: '(555) 777-8888',
        responsibility: ['Project Leadership', 'Community Relations'],
        permissions: ['admin']
      },
      members: [
        {
          id: 'member_r1',
          name: 'Amanda Foster',
          email: 'afoster@greenarch.com',
          role: 'Principal Architect',
          company: 'Green Architecture Studio',
          phone: '(555) 333-4444',
          responsibility: ['Design Leadership', 'Sustainability Planning'],
          permissions: ['edit']
        }
      ],
      consultants: []
    },

    rfps: [
      {
        id: 'rfp_r1',
        name: 'Environmental Consulting Services',
        description: 'Environmental impact assessment and regulatory compliance',
        discipline: 'design',
        status: 'draft',
        allocatedBudget: 150000,
        expectedResponses: 3,
        receivedResponses: 0,
        issueDate: '2025-01-15',
        responseDeadline: '2025-02-15',
        evaluationDeadline: '2025-03-01',
        bids: [],
        evaluationCriteria: [],
        evaluationNotes: ''
      }
    ],

    analyses: [],
    documents: [],
    risks: [],

    performance: {
      schedulePerformance: {
        plannedValue: 0,
        earnedValue: 0,
        actualCost: 180000,
        scheduleVariance: 0,
        costVariance: -180000,
        spi: 1.0,
        cpi: 0.0
      },
      budgetPerformance: {
        budgetUtilization: 0.7,
        forecastAtCompletion: 25000000,
        varianceAtCompletion: 0
      },
      qualityMetrics: {
        defectRate: 0,
        reworkHours: 0,
        clientSatisfaction: 8.5
      },
      lastUpdated: '2024-10-01'
    },

    createdAt: '2024-09-15T14:20:00Z',
    updatedAt: '2024-10-01T16:45:00Z',
    createdBy: 'Robert Martinez',
    tags: ['residential', 'luxury', 'riverfront', 'sustainability'],
    notes: 'Early planning phase. Focus on environmental compliance and community engagement.',
    archivedRFPs: [],
    archivedAnalyses: []
  }
];

// Demo Analytics
export const DEMO_ANALYTICS: ProjectAnalytics[] = [
  {
    projectId: 'demo_project_1',
    budgetTrends: [
      { date: '2024-01', allocatedBudget: 5000000, spentBudget: 850000, forecastBudget: 45000000 },
      { date: '2024-02', allocatedBudget: 8500000, spentBudget: 2100000, forecastBudget: 44800000 },
      { date: '2024-03', allocatedBudget: 12000000, spentBudget: 4200000, forecastBudget: 44600000 },
      { date: '2024-04', allocatedBudget: 15500000, spentBudget: 6800000, forecastBudget: 44400000 },
      { date: '2024-05', allocatedBudget: 18000000, spentBudget: 9200000, forecastBudget: 44300000 },
      { date: '2024-06', allocatedBudget: 22000000, spentBudget: 11800000, forecastBudget: 44200000 },
      { date: '2024-07', allocatedBudget: 26500000, spentBudget: 14500000, forecastBudget: 44100000 },
      { date: '2024-08', allocatedBudget: 30000000, spentBudget: 16200000, forecastBudget: 44100000 },
      { date: '2024-09', allocatedBudget: 34000000, spentBudget: 17800000, forecastBudget: 44100000 },
      { date: '2024-10', allocatedBudget: 38500000, spentBudget: 18750000, forecastBudget: 44100000 }
    ],
    scheduleTrends: [
      { date: '2024-10-01', plannedProgress: 42, actualProgress: 45 }
    ],
    rfpMetrics: {
      totalRFPs: 3,
      averageResponseTime: 28,
      averageBidCount: 2.3,
      awardRate: 33.3,
      averageSavings: 1200000
    },
    riskTrends: [
      { date: '2024-10-01', totalRisks: 2, highRisks: 1, mitigatedRisks: 0 }
    ],
    generatedAt: '2024-10-01T12:00:00Z'
  },
  {
    projectId: 'demo_project_2',
    budgetTrends: [
      { date: '2024-09', allocatedBudget: 500000, spentBudget: 80000, forecastBudget: 25000000 },
      { date: '2024-10', allocatedBudget: 2500000, spentBudget: 180000, forecastBudget: 25000000 }
    ],
    scheduleTrends: [
      { date: '2024-10-01', plannedProgress: 2, actualProgress: 1 }
    ],
    rfpMetrics: {
      totalRFPs: 1,
      averageResponseTime: 0,
      averageBidCount: 0,
      awardRate: 0,
      averageSavings: 0
    },
    riskTrends: [
      { date: '2024-10-01', totalRisks: 0, highRisks: 0, mitigatedRisks: 0 }
    ],
    generatedAt: '2024-10-01T12:00:00Z'
  }
];

// Demo Analyses (linked to RFPs)
export const DEMO_ANALYSES: SavedAnalysis[] = [
  {
    id: 'analysis_demo_1',
    timestamp: '2024-02-28T14:30:00Z',
    result: {
      contractor_name: 'Premier Construction Corp',
      total_amount: 26800000,
      discipline: 'construction',
      project_name: 'Downtown Office Complex - General Construction',
      categorizationPercentage: 94.5,
      line_items: [
        { division: '01', name: 'General Requirements', amount: 1200000, percentage: 4.5 },
        { division: '03', name: 'Concrete', amount: 4800000, percentage: 17.9 },
        { division: '05', name: 'Metals', amount: 3200000, percentage: 11.9 },
        { division: '06', name: 'Wood & Plastics', amount: 1600000, percentage: 6.0 },
        { division: '07', name: 'Thermal & Moisture Protection', amount: 2400000, percentage: 9.0 },
        { division: '08', name: 'Openings', amount: 1800000, percentage: 6.7 },
        { division: '09', name: 'Finishes', amount: 3600000, percentage: 13.4 },
        { division: '21', name: 'Fire Suppression', amount: 800000, percentage: 3.0 },
        { division: '22', name: 'Plumbing', amount: 2400000, percentage: 9.0 },
        { division: '23', name: 'HVAC', amount: 3200000, percentage: 11.9 },
        { division: '26', name: 'Electrical', amount: 1800000, percentage: 6.7 }
      ],
      exclusions: ['Site utilities beyond 5 feet from building', 'Furniture and equipment'],
      assumptions: ['Normal soil conditions', 'No hazardous materials'],
      potential_issues: ['Tight construction schedule', 'Urban site constraints']
    },
    riskAssessment: {
      score: 85,
      level: 'LOW',
      factors: ['Strong safety record', 'Local market experience', 'Competitive pricing']
    }
  },
  {
    id: 'analysis_demo_2',
    timestamp: '2024-02-27T16:45:00Z',
    result: {
      contractor_name: 'Metro Builders LLC',
      total_amount: 27200000,
      discipline: 'construction',
      project_name: 'Downtown Office Complex - General Construction',
      categorizationPercentage: 89.2,
      line_items: [
        { division: '01', name: 'General Requirements', amount: 1360000, percentage: 5.0 },
        { division: '03', name: 'Concrete', amount: 4896000, percentage: 18.0 },
        { division: '05', name: 'Metals', amount: 3264000, percentage: 12.0 },
        { division: '06', name: 'Wood & Plastics', amount: 1632000, percentage: 6.0 },
        { division: '07', name: 'Thermal & Moisture Protection', amount: 2448000, percentage: 9.0 },
        { division: '08', name: 'Openings', amount: 1904000, percentage: 7.0 },
        { division: '09', name: 'Finishes', amount: 3808000, percentage: 14.0 },
        { division: '21', name: 'Fire Suppression', amount: 816000, percentage: 3.0 },
        { division: '22', name: 'Plumbing', amount: 2448000, percentage: 9.0 },
        { division: '23', name: 'HVAC', amount: 3264000, percentage: 12.0 },
        { division: '26', name: 'Electrical', amount: 1360000, percentage: 5.0 }
      ],
      exclusions: ['Site work beyond property line', 'Special testing'],
      assumptions: ['Standard building codes', 'Material availability'],
      potential_issues: ['Limited high-rise experience', 'Subcontractor coordination']
    },
    riskAssessment: {
      score: 72,
      level: 'MEDIUM',
      factors: ['Higher pricing than competitors', 'Limited high-rise experience']
    }
  },
  {
    id: 'analysis_demo_3',
    timestamp: '2024-09-30T11:20:00Z',
    result: {
      contractor_name: 'Advanced MEP Systems',
      total_amount: 6200000,
      discipline: 'trade',
      project_name: 'Downtown Office Complex - MEP Systems',
      categorizationPercentage: 96.8,
      technical_systems: [
        { system: 'HVAC', amount: 2480000, percentage: 40.0 },
        { system: 'Electrical', amount: 2170000, percentage: 35.0 },
        { system: 'Plumbing', amount: 930000, percentage: 15.0 },
        { system: 'Fire Protection', amount: 372000, percentage: 6.0 },
        { system: 'Building Automation', amount: 248000, percentage: 4.0 }
      ],
      exclusions: ['Tenant improvements', 'Special equipment'],
      assumptions: ['Standard efficiency requirements', 'Normal operating hours'],
      potential_issues: ['Complex coordination with structure', 'Energy code compliance']
    },
    riskAssessment: {
      score: 88,
      level: 'LOW',
      factors: ['Comprehensive BIM approach', 'Strong technical team', 'Competitive pricing']
    }
  },
  {
    id: 'analysis_demo_4',
    timestamp: '2024-09-29T09:15:00Z',
    result: {
      contractor_name: 'City MEP Contractors',
      total_amount: 6800000,
      discipline: 'trade',
      project_name: 'Downtown Office Complex - MEP Systems',
      categorizationPercentage: 91.5,
      technical_systems: [
        { system: 'HVAC', amount: 2720000, percentage: 40.0 },
        { system: 'Electrical', amount: 2380000, percentage: 35.0 },
        { system: 'Plumbing', amount: 1020000, percentage: 15.0 },
        { system: 'Fire Protection', amount: 408000, percentage: 6.0 },
        { system: 'Building Automation', amount: 272000, percentage: 4.0 }
      ],
      exclusions: ['Owner-furnished equipment', 'Testing beyond standard'],
      assumptions: ['Local code requirements', 'Standard warranties'],
      potential_issues: ['Higher than budget estimate', 'Schedule coordination']
    },
    riskAssessment: {
      score: 75,
      level: 'MEDIUM',
      factors: ['Local presence advantage', 'Higher pricing', 'Standard approach']
    }
  }
];

// Demo RFPs
export const DEMO_RFPS: SavedRFP[] = [
  {
    id: 'demo_rfp_1',
    timestamp: '2024-02-01T10:00:00Z',
    project: {
      id: 'demo_rfp_project_1',
      projectName: 'Downtown Office Complex - General Construction',
      discipline: 'construction' as const,
      projectType: 'commercial_office',
      description: 'General contractor services for 15-story mixed-use office complex',
      estimatedValue: 28000000,
      location: {
        address: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105'
      },
      timeline: {
        rfpIssueDate: '2024-02-01',
        questionsDeadline: '2024-02-15',
        proposalDeadline: '2024-03-01',
        awardDate: '2024-03-20',
        constructionStart: '2024-04-01',
        completion: '2025-08-30'
      },
      scopeDefinition: {
        specialRequirements: ['LEED Gold certification', 'Union labor requirements'],
        exclusions: ['Site utilities beyond building footprint', 'Furniture and equipment'],
        deliveryMethod: 'design_bid_build',
        contractType: 'lump_sum'
      },
      siteConditions: {
        siteAccess: 'Urban site with limited staging area',
        utilitiesAvailable: ['Electricity', 'Water', 'Sewer', 'Gas'],
        environmentalConcerns: ['Noise restrictions during construction'],
        specialConstraints: ['Active street frontage', 'Pedestrian safety requirements']
      },
      commercialTerms: {
        pricingStructure: 'lump_sum',
        paymentSchedule: 'monthly',
        retainage: 10,
        bondingRequired: true,
        insuranceRequirements: [],
        changeOrderProcedures: 'Written approval required for changes over $10,000'
      },
      qualificationCriteria: {
        minimumExperience: 10,
        requiredProjectTypes: ['High-rise construction', 'Commercial office buildings'],
        minimumAnnualRevenue: 50000000,
        keyPersonnelRequirements: ['Licensed project manager', 'OSHA 30-hour certified superintendent'],
        safetyRequirements: ['EMR below 1.0', 'Written safety program'],
        certificationRequirements: ['California contractor license', 'Bonding capacity']
      },
      submissionRequirements: {
        technicalProposal: ['Construction methodology', 'Project schedule', 'Quality plan'],
        commercialProposal: ['Base bid amount', 'Unit prices', 'Allowances'],
        qualifications: ['Company profile', 'Project team', 'References'],
        references: 5,
        presentationRequired: true,
        evaluationCriteria: [
          { category: 'Technical Approach', weight: 30, description: 'Construction methodology and feasibility' },
          { category: 'Experience', weight: 25, description: 'Relevant project experience' },
          { category: 'Price', weight: 25, description: 'Competitive pricing' },
          { category: 'Schedule', weight: 10, description: 'Realistic timeline' },
          { category: 'Safety', weight: 10, description: 'Safety record and program' }
        ]
      },
      createdAt: '2024-02-01T10:00:00Z',
      updatedAt: '2024-03-20T15:30:00Z'
    },
    status: 'closed',
    receivedBids: ['analysis_demo_1', 'analysis_demo_2']
  }
];

// Demo mode storage keys
export const DEMO_STORAGE_KEYS = {
  projects: 'levelr_demo_projects',
  analytics: 'levelr_demo_analytics',
  analyses: 'levelr_demo_analyses',
  rfps: 'levelr_demo_rfps',
  enabled: 'levelr_demo_mode_enabled'
};

// Demo mode management functions
export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_STORAGE_KEYS.enabled) === 'true';
}

export function enableDemoMode(): void {
  if (typeof window === 'undefined') return;

  // Save demo data
  localStorage.setItem(DEMO_STORAGE_KEYS.projects, JSON.stringify(DEMO_PROJECTS));
  localStorage.setItem(DEMO_STORAGE_KEYS.analytics, JSON.stringify(DEMO_ANALYTICS));
  localStorage.setItem(DEMO_STORAGE_KEYS.analyses, JSON.stringify(DEMO_ANALYSES));
  localStorage.setItem(DEMO_STORAGE_KEYS.rfps, JSON.stringify(DEMO_RFPS));

  // Enable demo mode
  localStorage.setItem(DEMO_STORAGE_KEYS.enabled, 'true');

  console.log('Demo mode enabled with sample project data');
}

export function disableDemoMode(): void {
  if (typeof window === 'undefined') return;

  // Remove demo data
  localStorage.removeItem(DEMO_STORAGE_KEYS.projects);
  localStorage.removeItem(DEMO_STORAGE_KEYS.analytics);
  localStorage.removeItem(DEMO_STORAGE_KEYS.analyses);
  localStorage.removeItem(DEMO_STORAGE_KEYS.rfps);

  // Disable demo mode
  localStorage.setItem(DEMO_STORAGE_KEYS.enabled, 'false');

  console.log('Demo mode disabled, demo data cleared');
}

export function getDemoProjects(): SavedProject[] {
  if (!isDemoModeEnabled()) return [];
  if (typeof window === 'undefined') return DEMO_PROJECTS;

  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEYS.projects);
    return stored ? JSON.parse(stored) : DEMO_PROJECTS;
  } catch (error) {
    console.error('Error loading demo projects:', error);
    return DEMO_PROJECTS;
  }
}

export function getDemoAnalytics(): ProjectAnalytics[] {
  if (!isDemoModeEnabled()) return [];
  if (typeof window === 'undefined') return DEMO_ANALYTICS;

  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEYS.analytics);
    return stored ? JSON.parse(stored) : DEMO_ANALYTICS;
  } catch (error) {
    console.error('Error loading demo analytics:', error);
    return DEMO_ANALYTICS;
  }
}

export function getDemoAnalyses(): SavedAnalysis[] {
  if (!isDemoModeEnabled()) return [];
  if (typeof window === 'undefined') return DEMO_ANALYSES;

  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEYS.analyses);
    return stored ? JSON.parse(stored) : DEMO_ANALYSES;
  } catch (error) {
    console.error('Error loading demo analyses:', error);
    return DEMO_ANALYSES;
  }
}

export function getDemoRFPs(): SavedRFP[] {
  if (!isDemoModeEnabled()) return [];
  if (typeof window === 'undefined') return DEMO_RFPS;

  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEYS.rfps);
    return stored ? JSON.parse(stored) : DEMO_RFPS;
  } catch (error) {
    console.error('Error loading demo RFPs:', error);
    return DEMO_RFPS;
  }
}