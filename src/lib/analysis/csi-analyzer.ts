import { CONSTRUCTION_UNITS } from '@/types/analysis';

// MasterFormat 2018 CSI Divisions - 50-Division System
export const CSI_DIVISIONS = {
  // FACILITY CONSTRUCTION DIVISIONS (01-14)
  "01": { 
    name: "General Requirements", 
    typicalPercentage: [8, 15], 
    keywords: ["general requirements", "overhead", "supervision", "permits", "insurance", "bonds", "temporary facilities", "project management"],
    description: "Project management, overhead, permits, and general conditions"
  },
  "02": { 
    name: "Existing Conditions", 
    typicalPercentage: [2, 10], 
    keywords: ["demolition", "demo", "abatement", "site clearing", "hazmat", "asbestos", "selective demolition", "existing conditions"],
    description: "Demolition, hazmat abatement, and site preparation"
  },
  "03": { 
    name: "Concrete", 
    typicalPercentage: [15, 35], 
    keywords: ["concrete", "foundation", "footings", "slab", "cast-in-place", "rebar", "formwork", "cement", "construction", "assembly", "structural", "building", "construction & assembly", "structural work", "precast"],
    description: "All concrete work including foundations and structural elements"
  },
  "04": { 
    name: "Masonry", 
    typicalPercentage: [5, 15], 
    keywords: ["masonry", "brick", "block", "stone", "mortar", "cmu", "concrete masonry"],
    description: "Brick, block, and stone masonry work"
  },
  "05": { 
    name: "Metals", 
    typicalPercentage: [8, 20], 
    keywords: ["structural steel", "metals", "steel frame", "joists", "deck", "miscellaneous metals", "railings", "metal work"],
    description: "Structural steel and miscellaneous metal work"
  },
  "06": { 
    name: "Wood, Plastics, and Composites", 
    typicalPercentage: [5, 15], 
    keywords: ["carpentry", "framing", "lumber", "millwork", "cabinets", "trim", "finish carpentry", "wood", "plastics", "composites"],
    description: "Rough and finish carpentry, millwork"
  },
  "07": { 
    name: "Thermal and Moisture Protection", 
    typicalPercentage: [3, 8], 
    keywords: ["roofing", "waterproofing", "insulation", "sealants", "membrane", "roof system", "thermal", "moisture protection"],
    description: "Roofing, waterproofing, and insulation systems"
  },
  "08": { 
    name: "Openings", 
    typicalPercentage: [3, 10], 
    keywords: ["doors", "windows", "frames", "hardware", "glazing", "curtain wall", "storefront", "openings"],
    description: "Doors, windows, and glazing systems"
  },
  "09": { 
    name: "Finishes", 
    typicalPercentage: [12, 25], 
    keywords: ["finishes", "flooring", "carpet", "tile", "paint", "drywall", "ceiling", "wall coverings", "interior finishes"],
    description: "Interior finishes including flooring, paint, and ceilings"
  },
  "10": { 
    name: "Specialties", 
    typicalPercentage: [1, 5], 
    keywords: ["specialties", "toilet accessories", "signage", "partitions", "accessories"],
    description: "Toilet accessories, signage, and partitions"
  },
  "11": { 
    name: "Equipment", 
    typicalPercentage: [2, 8], 
    keywords: ["equipment", "kitchen equipment", "lab equipment", "built-in appliances", "commercial equipment"],
    description: "Kitchen, lab, and built-in equipment"
  },
  "12": { 
    name: "Furnishings", 
    typicalPercentage: [1, 5], 
    keywords: ["furnishings", "furniture", "window treatments", "casework"],
    description: "Furniture and window treatments"
  },
  "13": { 
    name: "Special Construction", 
    typicalPercentage: [2, 10], 
    keywords: ["special construction", "pre-engineered structures", "pools", "athletic facilities"],
    description: "Pre-engineered structures and special facilities"
  },
  "14": { 
    name: "Conveying Equipment", 
    typicalPercentage: [2, 8], 
    keywords: ["elevators", "escalators", "conveying equipment", "lifts"],
    description: "Elevators, escalators, and conveying systems"
  },

  // FACILITY SERVICES DIVISIONS (21-28)
  "21": { 
    name: "Fire Suppression", 
    typicalPercentage: [1, 4], 
    keywords: ["fire suppression", "sprinkler systems", "fire protection", "standpipes", "sprinklers", "fire safety"],
    description: "Sprinkler systems and fire protection"
  },
  "22": { 
    name: "Plumbing", 
    typicalPercentage: [4, 10], 
    keywords: ["plumbing", "water supply", "waste", "vent", "fixtures", "domestic water", "plumbing systems", "sanitary"],
    description: "Water supply, waste, vent, and plumbing fixtures"
  },
  "23": { 
    name: "HVAC", 
    typicalPercentage: [8, 18], 
    keywords: ["hvac", "heating", "ventilation", "air conditioning", "mechanical equipment", "ductwork", "hvac systems", "boiler", "chiller", "pumps"],
    description: "Heating, ventilation, and air conditioning systems"
  },
  "25": { 
    name: "Integrated Automation", 
    typicalPercentage: [1, 4], 
    keywords: ["building controls", "bms", "smart systems", "automation", "building automation", "technology systems", "integrated automation", "control systems"],
    description: "Building management and control systems"
  },
  "26": { 
    name: "Electrical", 
    typicalPercentage: [6, 12], 
    keywords: ["electrical", "power", "lighting", "panels", "wiring", "conduit", "fixtures", "electrical systems"],
    description: "Electrical power and lighting systems"
  },
  "27": { 
    name: "Communications", 
    typicalPercentage: [1, 4], 
    keywords: ["communications", "data", "telephone", "networking", "telecommunications", "cabling", "data systems"],
    description: "Data, telephone, and telecommunications"
  },
  "28": { 
    name: "Electronic Safety and Security", 
    typicalPercentage: [1, 3], 
    keywords: ["security systems", "access control", "cctv", "alarms", "electronic safety", "security", "surveillance"],
    description: "Access control, CCTV, and alarm systems"
  },

  // SITE DIVISIONS (31-33)
  "31": { 
    name: "Earthwork", 
    typicalPercentage: [3, 12], 
    keywords: ["earthwork", "excavation", "grading", "site utilities", "site work"],
    description: "Excavation, grading, and site utilities"
  },
  "32": { 
    name: "Exterior Improvements", 
    typicalPercentage: [2, 8], 
    keywords: ["exterior improvements", "paving", "landscaping", "site work", "parking", "walkways"],
    description: "Paving, landscaping, and site improvements"
  },
  "33": { 
    name: "Utilities", 
    typicalPercentage: [2, 10], 
    keywords: ["utilities", "site utilities", "water", "sewer", "gas lines", "underground utilities"],
    description: "Site utilities including water, sewer, and gas"
  }
} as const;

export function sanitizeUnitType(rawUnit: string | null): keyof typeof CONSTRUCTION_UNITS {
  if (!rawUnit) return "LS";
  
  const unit = rawUnit.trim().toUpperCase();
  
  // Direct match
  if (unit in CONSTRUCTION_UNITS) return unit as keyof typeof CONSTRUCTION_UNITS;
  
  // Common variations
  const mappings: Record<string, keyof typeof CONSTRUCTION_UNITS> = {
    "SQFT": "SF", "SQ.FT": "SF", "SQUARE FOOT": "SF", "SQUARE FEET": "SF",
    "LINFT": "LF", "LIN.FT": "LF", "LINEAR FOOT": "LF", "LINEAR FEET": "LF", 
    "CUBIC YARD": "CY", "CU YD": "CY", "YARD": "CY", "YARDS": "CY",
    "EACH": "EA", "PIECE": "EA", "UNIT": "EA", "COUNT": "EA",
    "LUMP": "LS", "LUMPSUM": "LS", "LUMP_SUM": "LS", "PACKAGE": "LS",
    "HOUR": "HR", "HOURS": "HR", "HRS": "HR"
  };
  
  return mappings[unit] || "LS";
}

export function classifyCSIDivision(itemDescription: string): string | null {
  const description = itemDescription.toLowerCase();
  
  for (const [divCode, division] of Object.entries(CSI_DIVISIONS)) {
    if (division.keywords.some(keyword => description.includes(keyword))) {
      return divCode;
    }
  }
  
  return null;
}