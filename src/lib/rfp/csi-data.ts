// src/lib/rfp/csi-data.ts

import { CSIDivisionInfo } from '@/types/rfp';

// CSI Division definitions for RFP scope building
export const CSI_DIVISIONS: Record<string, CSIDivisionInfo> = {
  '01': {
    code: '01',
    name: 'General Requirements',
    description: 'Project management, permits, supervision, overhead, bonds',
    commonItems: [
      'Project management',
      'General conditions',
      'Permits and fees',
      'Temporary facilities',
      'Construction documents',
      'Project meetings',
      'Quality control',
      'Safety program',
      'Insurance and bonds',
      'Cleanup and closeout'
    ],
    typicalPercentage: { commercial: 8, residential: 6, industrial: 10 },
    dependencies: [],
    riskFactors: ['Schedule coordination', 'Permit delays', 'Site security']
  },
  '02': {
    code: '02',
    name: 'Existing Conditions',
    description: 'Demolition, site clearing, hazmat, abatement',
    commonItems: [
      'Site assessment',
      'Demolition',
      'Hazardous material removal',
      'Site clearing',
      'Environmental testing',
      'Utility disconnection',
      'Salvage operations',
      'Waste disposal'
    ],
    typicalPercentage: { commercial: 5, residential: 3, industrial: 8 },
    dependencies: [],
    riskFactors: ['Unknown conditions', 'Environmental hazards', 'Utility conflicts']
  },
  '03': {
    code: '03',
    name: 'Concrete',
    description: 'Structural work, foundations, concrete construction, precast',
    commonItems: [
      'Excavation and earthwork',
      'Foundations',
      'Structural concrete',
      'Concrete slabs',
      'Precast elements',
      'Cast-in-place concrete',
      'Concrete finishes',
      'Reinforcing steel',
      'Concrete testing'
    ],
    typicalPercentage: { commercial: 15, residential: 12, industrial: 20 },
    dependencies: ['02', '31'],
    riskFactors: ['Soil conditions', 'Weather delays', 'Material quality']
  },
  '04': {
    code: '04',
    name: 'Masonry',
    description: 'Brick, block, stone masonry work',
    commonItems: [
      'Concrete masonry units',
      'Clay brick masonry',
      'Stone masonry',
      'Masonry restoration',
      'Mortar and grout',
      'Masonry accessories',
      'Structural masonry'
    ],
    typicalPercentage: { commercial: 4, residential: 8, industrial: 3 },
    dependencies: ['03'],
    riskFactors: ['Weather sensitivity', 'Material matching', 'Skilled labor availability']
  },
  '05': {
    code: '05',
    name: 'Metals',
    description: 'Structural steel, metal work, steel framing',
    commonItems: [
      'Structural steel',
      'Metal joists',
      'Metal decking',
      'Cold-formed framing',
      'Metal fabrications',
      'Expansion joints',
      'Ornamental metals',
      'Steel connections'
    ],
    typicalPercentage: { commercial: 8, residential: 2, industrial: 15 },
    dependencies: ['03'],
    riskFactors: ['Steel prices', 'Fabrication lead times', 'Crane access']
  },
  '06': {
    code: '06',
    name: 'Wood, Plastics, and Composites',
    description: 'Carpentry, framing, millwork',
    commonItems: [
      'Rough carpentry',
      'Finish carpentry',
      'Architectural millwork',
      'Structural framing',
      'Sheathing and subflooring',
      'Wood trusses',
      'Plastic fabrications',
      'Composite materials'
    ],
    typicalPercentage: { commercial: 6, residential: 20, industrial: 4 },
    dependencies: [],
    riskFactors: ['Lumber prices', 'Moisture content', 'Fire treatment requirements']
  },
  '07': {
    code: '07',
    name: 'Thermal and Moisture Protection',
    description: 'Roofing, waterproofing, insulation',
    commonItems: [
      'Waterproofing',
      'Insulation',
      'Roofing systems',
      'Membrane roofing',
      'Roof accessories',
      'Sealants and caulking',
      'Air barriers',
      'Vapor barriers'
    ],
    typicalPercentage: { commercial: 7, residential: 8, industrial: 6 },
    dependencies: ['05', '06'],
    riskFactors: ['Weather dependency', 'Material compatibility', 'Warranty requirements']
  },
  '08': {
    code: '08',
    name: 'Openings',
    description: 'Doors, windows, glazing',
    commonItems: [
      'Metal doors and frames',
      'Wood doors',
      'Windows',
      'Curtain wall systems',
      'Skylights',
      'Door hardware',
      'Glazing',
      'Specialty openings'
    ],
    typicalPercentage: { commercial: 6, residential: 10, industrial: 4 },
    dependencies: ['04', '05', '06'],
    riskFactors: ['Custom fabrication', 'Energy code compliance', 'Security requirements']
  },
  '09': {
    code: '09',
    name: 'Finishes',
    description: 'Flooring, paint, ceilings, interior finishes',
    commonItems: [
      'Gypsum board',
      'Tile work',
      'Flooring',
      'Painting and coatings',
      'Wall coverings',
      'Acoustical treatment',
      'Ceiling systems',
      'Interior trim'
    ],
    typicalPercentage: { commercial: 12, residential: 15, industrial: 8 },
    dependencies: ['06', '08'],
    riskFactors: ['Schedule coordination', 'Damage protection', 'Finish quality expectations']
  },
  '10': {
    code: '10',
    name: 'Specialties',
    description: 'Toilet accessories, signage, partitions',
    commonItems: [
      'Toilet and bath accessories',
      'Signage',
      'Compartments and partitions',
      'Louvers and vents',
      'Wall and corner guards',
      'Access flooring',
      'Pest control',
      'Fireplaces'
    ],
    typicalPercentage: { commercial: 2, residential: 1, industrial: 1 },
    dependencies: ['09'],
    riskFactors: ['Custom requirements', 'ADA compliance', 'Coordination with finishes']
  },
  '11': {
    code: '11',
    name: 'Equipment',
    description: 'Kitchen equipment, lab equipment, built-in appliances',
    commonItems: [
      'Commercial kitchen equipment',
      'Laboratory equipment',
      'Medical equipment',
      'Athletic equipment',
      'Loading dock equipment',
      'Maintenance equipment',
      'Security equipment',
      'Theatrical equipment'
    ],
    typicalPercentage: { commercial: 3, residential: 2, industrial: 5 },
    dependencies: ['22', '23', '26'],
    riskFactors: ['Lead times', 'Installation coordination', 'Utility connections']
  },
  '12': {
    code: '12',
    name: 'Furnishings',
    description: 'Furniture, window treatments',
    commonItems: [
      'Fixed furniture',
      'Window treatments',
      'Casework',
      'Built-in seating',
      'Artwork and murals',
      'Interior plants',
      'Rugs and mats'
    ],
    typicalPercentage: { commercial: 2, residential: 3, industrial: 1 },
    dependencies: ['09'],
    riskFactors: ['Design coordination', 'Delivery timing', 'Installation access']
  },
  '13': {
    code: '13',
    name: 'Special Construction',
    description: 'Pre-engineered structures, pools',
    commonItems: [
      'Pre-engineered structures',
      'Swimming pools',
      'Ice rinks',
      'Special purpose rooms',
      'Sound and vibration control',
      'Lightning protection',
      'Cathodic protection'
    ],
    typicalPercentage: { commercial: 1, residential: 2, industrial: 3 },
    dependencies: [],
    riskFactors: ['Specialized contractors', 'Code compliance', 'Performance guarantees']
  },
  '14': {
    code: '14',
    name: 'Conveying Equipment',
    description: 'Elevators, escalators',
    commonItems: [
      'Elevators',
      'Escalators',
      'Moving walkways',
      'Dumbwaiters',
      'Material handling systems',
      'Pneumatic systems',
      'Hoists and cranes'
    ],
    typicalPercentage: { commercial: 3, residential: 1, industrial: 2 },
    dependencies: ['26'],
    riskFactors: ['Code compliance', 'Long lead times', 'Shaft coordination']
  },
  '21': {
    code: '21',
    name: 'Fire Suppression',
    description: 'Sprinkler systems, fire protection, standpipes',
    commonItems: [
      'Fire sprinkler systems',
      'Standpipe systems',
      'Fire pumps',
      'Fire suppression specialties',
      'Clean agent systems',
      'Water mist systems',
      'Foam systems'
    ],
    typicalPercentage: { commercial: 2, residential: 1, industrial: 3 },
    dependencies: ['22'],
    riskFactors: ['Code compliance', 'Water supply adequacy', 'System testing']
  },
  '22': {
    code: '22',
    name: 'Plumbing',
    description: 'Water supply, waste, vent, fixtures, domestic water',
    commonItems: [
      'Plumbing fixtures',
      'Domestic water distribution',
      'Sanitary waste systems',
      'Vent systems',
      'Storm drainage',
      'Special plumbing systems',
      'Water treatment',
      'Plumbing specialties'
    ],
    typicalPercentage: { commercial: 4, residential: 8, industrial: 3 },
    dependencies: ['33'],
    riskFactors: ['Code requirements', 'Water pressure', 'Utility connections']
  },
  '23': {
    code: '23',
    name: 'HVAC',
    description: 'Heating, ventilation, air conditioning, mechanical equipment, ductwork',
    commonItems: [
      'HVAC systems',
      'Ductwork',
      'Air handling equipment',
      'Heating equipment',
      'Cooling equipment',
      'Controls and instrumentation',
      'Ventilation systems',
      'Energy recovery'
    ],
    typicalPercentage: { commercial: 15, residential: 12, industrial: 18 },
    dependencies: ['26'],
    riskFactors: ['Energy codes', 'Equipment lead times', 'Balancing and commissioning']
  },
  '25': {
    code: '25',
    name: 'Integrated Automation',
    description: 'Building controls, BMS, smart systems',
    commonItems: [
      'Building automation systems',
      'Integrated control systems',
      'Monitoring and control',
      'Energy management',
      'Facility automation',
      'Smart building systems'
    ],
    typicalPercentage: { commercial: 2, residential: 1, industrial: 3 },
    dependencies: ['23', '26', '27'],
    riskFactors: ['System integration', 'Programming complexity', 'Commissioning']
  },
  '26': {
    code: '26',
    name: 'Electrical',
    description: 'Power, lighting, panels, wiring, electrical systems',
    commonItems: [
      'Electrical service',
      'Power distribution',
      'Branch wiring',
      'Lighting systems',
      'Emergency power',
      'Electrical specialties',
      'Controls and relays',
      'Grounding systems'
    ],
    typicalPercentage: { commercial: 8, residential: 6, industrial: 12 },
    dependencies: [],
    riskFactors: ['Utility coordination', 'Code compliance', 'Load calculations']
  },
  '27': {
    code: '27',
    name: 'Communications',
    description: 'Data, telephone, networking, telecommunications',
    commonItems: [
      'Structured cabling',
      'Telecommunications systems',
      'Audio-visual systems',
      'Public address systems',
      'Intercom systems',
      'Clock systems',
      'Mass notification'
    ],
    typicalPercentage: { commercial: 2, residential: 1, industrial: 2 },
    dependencies: ['26'],
    riskFactors: ['Technology changes', 'Coordination with IT', 'Future capacity']
  },
  '28': {
    code: '28',
    name: 'Electronic Safety and Security',
    description: 'Access control, CCTV, alarms',
    commonItems: [
      'Access control systems',
      'Video surveillance',
      'Intrusion detection',
      'Fire alarm systems',
      'Security specialties',
      'Electronic detection',
      'Monitoring systems'
    ],
    typicalPercentage: { commercial: 1, residential: 1, industrial: 2 },
    dependencies: ['26', '27'],
    riskFactors: ['Security requirements', 'Integration complexity', 'Future upgrades']
  },
  '31': {
    code: '31',
    name: 'Earthwork',
    description: 'Excavation, grading, site utilities',
    commonItems: [
      'Site preparation',
      'Excavation and fill',
      'Grading',
      'Soil treatment',
      'Site utilities',
      'Dewatering',
      'Shoring and underpinning'
    ],
    typicalPercentage: { commercial: 4, residential: 6, industrial: 8 },
    dependencies: [],
    riskFactors: ['Soil conditions', 'Utility conflicts', 'Environmental issues']
  },
  '32': {
    code: '32',
    name: 'Exterior Improvements',
    description: 'Paving, landscaping, site work',
    commonItems: [
      'Paving',
      'Site development',
      'Landscaping',
      'Irrigation',
      'Site furnishings',
      'Fencing and gates',
      'Retaining walls',
      'Athletic surfaces'
    ],
    typicalPercentage: { commercial: 3, residential: 4, industrial: 2 },
    dependencies: ['31', '33'],
    riskFactors: ['Weather dependency', 'Seasonal restrictions', 'Maintenance requirements']
  },
  '33': {
    code: '33',
    name: 'Utilities',
    description: 'Site utilities, water, sewer, gas lines',
    commonItems: [
      'Water distribution',
      'Sanitary sewer',
      'Storm drainage',
      'Natural gas systems',
      'Electrical distribution',
      'Communications utilities',
      'District systems'
    ],
    typicalPercentage: { commercial: 2, residential: 3, industrial: 4 },
    dependencies: ['31'],
    riskFactors: ['Utility company coordination', 'Permit requirements', 'Connection fees']
  }
};

// Helper functions for CSI data
export function getCSIDivisionsForProjectType(projectType: string): string[] {
  const templates = {
    commercial_office: ['01', '03', '05', '06', '07', '08', '09', '21', '22', '23', '26', '27'],
    retail: ['01', '03', '06', '07', '08', '09', '11', '22', '23', '26'],
    industrial: ['01', '03', '05', '07', '11', '22', '23', '26', '31', '32'],
    residential: ['01', '03', '06', '07', '08', '09', '22', '23', '26'],
    mixed_use: ['01', '03', '05', '06', '07', '08', '09', '21', '22', '23', '26', '27'],
    infrastructure: ['01', '02', '03', '31', '32', '33']
  };
  
  return templates[projectType as keyof typeof templates] || [];
}

export function getTypicalPercentage(divisionCode: string, projectType: 'commercial' | 'residential' | 'industrial'): number {
  const division = CSI_DIVISIONS[divisionCode];
  return division?.typicalPercentage[projectType] || 0;
}

export function getDivisionDependencies(divisionCode: string): string[] {
  return CSI_DIVISIONS[divisionCode]?.dependencies || [];
}

export function getDivisionRiskFactors(divisionCode: string): string[] {
  return CSI_DIVISIONS[divisionCode]?.riskFactors || [];
}