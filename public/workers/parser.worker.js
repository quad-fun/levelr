// public/workers/parser.worker.js

// Web Worker for browser-only document parsing
self.onmessage = function(event) {
  const { type, file, discipline } = event.data;

  if (type === 'parse') {
    parseDocument(file, discipline);
  }
};

async function parseDocument(file, discipline = 'construction') {
  try {
    // Send initial progress
    self.postMessage({
      type: 'progress',
      progress: 10
    });

    // Mock document parsing based on file type and discipline
    const lines = await mockParseDocument(file, discipline);

    // Send completion progress
    self.postMessage({
      type: 'progress',
      progress: 100
    });

    // Send results
    self.postMessage({
      type: 'success',
      data: {
        lines,
        parseConfidence: Math.random() * 0.2 + 0.8, // 80-100%
        totalPages: Math.floor(Math.random() * 20) + 1
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
}

async function mockParseDocument(file, discipline = 'construction') {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send progress updates
  for (let i = 20; i <= 90; i += 20) {
    self.postMessage({
      type: 'progress',
      progress: i
    });
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Generate discipline-specific mock data
  const mockLines = [];
  const disciplineData = getDisciplineData(discipline);

  function getDisciplineData(discipline) {
    switch (discipline) {
      case 'construction':
        return {
          items: [
            { division: '03', name: 'Concrete', baseCost: 50000 },
            { division: '04', name: 'Masonry', baseCost: 30000 },
            { division: '05', name: 'Metals', baseCost: 25000 },
            { division: '06', name: 'Wood, Plastics, Composites', baseCost: 20000 },
            { division: '07', name: 'Thermal and Moisture Protection', baseCost: 35000 },
            { division: '08', name: 'Openings', baseCost: 15000 },
            { division: '09', name: 'Finishes', baseCost: 40000 },
            { division: '21', name: 'Fire Suppression', baseCost: 18000 },
            { division: '22', name: 'Plumbing', baseCost: 28000 },
            { division: '23', name: 'HVAC', baseCost: 45000 },
            { division: '26', name: 'Electrical', baseCost: 35000 },
            { division: '31', name: 'Earthwork', baseCost: 22000 },
            { division: '32', name: 'Exterior Improvements', baseCost: 16000 }
          ],
          type: 'csi'
        };

      case 'design':
        return {
          items: [
            { division: 'SD', name: 'Schematic Design', baseCost: 25000 },
            { division: 'DD', name: 'Design Development', baseCost: 35000 },
            { division: 'CD', name: 'Construction Documents', baseCost: 45000 },
            { division: 'BN', name: 'Bidding/Negotiation', baseCost: 8000 },
            { division: 'CA', name: 'Construction Administration', baseCost: 22000 },
            { division: 'SD-A', name: 'Architectural Schematic Design', baseCost: 15000 },
            { division: 'SD-S', name: 'Structural Schematic Design', baseCost: 12000 },
            { division: 'SD-M', name: 'MEP Schematic Design', baseCost: 18000 },
            { division: 'DD-A', name: 'Architectural Design Development', baseCost: 20000 },
            { division: 'DD-S', name: 'Structural Design Development', baseCost: 16000 },
            { division: 'DD-M', name: 'MEP Design Development', baseCost: 24000 },
            { division: 'CD-A', name: 'Architectural Construction Documents', baseCost: 25000 },
            { division: 'CD-S', name: 'Structural Construction Documents', baseCost: 20000 }
          ],
          type: 'aia'
        };

      case 'trade':
        return {
          items: [
            { division: 'ELEC', name: 'Electrical Systems', baseCost: 85000 },
            { division: 'HVAC', name: 'HVAC Systems', baseCost: 120000 },
            { division: 'PLUMB', name: 'Plumbing Systems', baseCost: 65000 },
            { division: 'FIRE', name: 'Fire Protection Systems', baseCost: 45000 },
            { division: 'SECU', name: 'Security Systems', baseCost: 35000 },
            { division: 'COMM', name: 'Communications Systems', baseCost: 25000 },
            { division: 'ELEV', name: 'Elevator Systems', baseCost: 95000 },
            { division: 'SPEC', name: 'Specialty Equipment', baseCost: 55000 },
            { division: 'AUTO', name: 'Building Automation', baseCost: 40000 },
            { division: 'LIFE', name: 'Life Safety Systems', baseCost: 30000 },
            { division: 'TEST', name: 'Testing & Commissioning', baseCost: 20000 },
            { division: 'MAINT', name: 'Maintenance Systems', baseCost: 15000 }
          ],
          type: 'technical'
        };

      default:
        return getDisciplineData('construction');
    }
  }

  // Generate 8-15 line items based on discipline
  const numLines = Math.floor(Math.random() * 8) + 8;
  const selectedItems = disciplineData.items
    .sort(() => Math.random() - 0.5)
    .slice(0, numLines);

  selectedItems.forEach((item, index) => {
    const variance = Math.random() * 0.4 - 0.2; // ±20% variance
    const cost = Math.round(item.baseCost * (1 + variance));

    mockLines.push({
      id: `line-${index + 1}`,
      description: `${item.name} - ${generateMockDescription(item.name, discipline)}`,
      division: item.division,
      cost: cost,
      quantity: Math.floor(Math.random() * 1000) + 100,
      unit: getRandomUnit(item.name, discipline),
      unitCost: Math.round(cost / (Math.floor(Math.random() * 500) + 100)),
      subcontractor: generateMockSubcontractor(item.name, discipline),
      pageRef: Math.floor(Math.random() * 5) + 1,
      confidence: Math.random() * 0.2 + 0.8 // 80-100% confidence
    });
  });

  return mockLines;
}

function generateMockDescription(itemName, discipline) {
  const descriptions = {
    construction: {
      'Concrete': ['Cast-in-place concrete footings', 'Concrete slabs on grade', 'Reinforced concrete walls'],
      'Masonry': ['CMU block walls', 'Brick veneer installation', 'Stone masonry work'],
      'Metals': ['Structural steel framing', 'Metal decking', 'Steel stairs and railings'],
      'Wood, Plastics, Composites': ['Wood framing lumber', 'Engineered lumber beams', 'Composite decking'],
      'Thermal and Moisture Protection': ['Built-up roofing system', 'Insulation installation', 'Waterproofing membrane'],
      'Openings': ['Aluminum windows', 'Hollow metal doors', 'Hardware installation'],
      'Finishes': ['Drywall and paint', 'Ceramic tile flooring', 'Suspended ceiling system'],
      'Fire Suppression': ['Sprinkler system installation', 'Fire pump equipment', 'Fire alarm system'],
      'Plumbing': ['Domestic water piping', 'Sanitary sewer system', 'Plumbing fixtures'],
      'HVAC': ['Rooftop HVAC units', 'Ductwork installation', 'VAV boxes and controls'],
      'Electrical': ['Electrical distribution panels', 'Power and lighting circuits', 'Emergency lighting'],
      'Earthwork': ['Site excavation', 'Backfill and compaction', 'Site grading'],
      'Exterior Improvements': ['Asphalt paving', 'Concrete sidewalks', 'Site landscaping']
    },
    design: {
      'Schematic Design': ['Conceptual design development', 'Site analysis and programming', 'Design alternatives study'],
      'Design Development': ['Detailed design refinement', 'Material and system selection', 'Coordination drawings'],
      'Construction Documents': ['Technical specifications', 'Detailed drawings and plans', 'Code compliance review'],
      'Bidding/Negotiation': ['Bid document preparation', 'Contractor prequalification', 'Bid evaluation'],
      'Construction Administration': ['Construction observation', 'Shop drawing review', 'Change order processing'],
      'Architectural Schematic Design': ['Space planning and layout', 'Building massing studies', 'Aesthetic concept development'],
      'Structural Schematic Design': ['Structural system selection', 'Load path analysis', 'Foundation design concept'],
      'MEP Schematic Design': ['System sizing and layout', 'Equipment selection', 'Energy modeling'],
      'Architectural Design Development': ['Material specifications', 'Detail development', 'Building envelope design'],
      'Structural Design Development': ['Structural calculations', 'Connection details', 'Foundation sizing'],
      'MEP Design Development': ['System optimization', 'Equipment specifications', 'Control strategies'],
      'Architectural Construction Documents': ['Working drawings', 'Detail specifications', 'Material schedules'],
      'Structural Construction Documents': ['Structural drawings', 'Steel details', 'Concrete specifications']
    },
    trade: {
      'Electrical Systems': ['Power distribution design', 'Lighting system installation', 'Emergency power systems'],
      'HVAC Systems': ['Air handling unit installation', 'Ductwork fabrication', 'Control system programming'],
      'Plumbing Systems': ['Water distribution piping', 'Waste and vent systems', 'Fixture installation'],
      'Fire Protection Systems': ['Sprinkler system design', 'Fire alarm installation', 'Emergency egress lighting'],
      'Security Systems': ['Access control installation', 'CCTV system setup', 'Intrusion detection systems'],
      'Communications Systems': ['Data cabling installation', 'Telephone system setup', 'Wireless network design'],
      'Elevator Systems': ['Elevator installation', 'Modernization services', 'Maintenance programs'],
      'Specialty Equipment': ['Kitchen equipment installation', 'Medical equipment setup', 'Laboratory systems'],
      'Building Automation': ['BMS programming', 'Sensor installation', 'System integration'],
      'Life Safety Systems': ['Emergency communication', 'Mass notification systems', 'Evacuation systems'],
      'Testing & Commissioning': ['System performance testing', 'Equipment commissioning', 'Documentation'],
      'Maintenance Systems': ['Preventive maintenance setup', 'Service agreements', 'Spare parts supply']
    }
  };

  const disciplineDescriptions = descriptions[discipline] || descriptions.construction;
  const options = disciplineDescriptions[itemName] || ['General service work'];
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomUnit(itemName, discipline) {
  const units = {
    'Concrete': ['CY', 'SF', 'LF'],
    'Masonry': ['SF', 'LF', 'EA'],
    'Metals': ['LB', 'SF', 'LF'],
    'Wood, Plastics, Composites': ['BF', 'LF', 'SF'],
    'Thermal and Moisture Protection': ['SF', 'SQ', 'LF'],
    'Openings': ['EA', 'SF', 'LF'],
    'Finishes': ['SF', 'SY', 'LF'],
    'Fire Suppression': ['SF', 'EA', 'LF'],
    'Plumbing': ['EA', 'LF', 'SF'],
    'HVAC': ['EA', 'LB', 'SF'],
    'Electrical': ['EA', 'LF', 'SF'],
    'Earthwork': ['CY', 'SF', 'LF'],
    'Exterior Improvements': ['SF', 'SY', 'LF']
  };

  if (discipline === 'design') {
    return ['HR', 'EA', 'LS'][Math.floor(Math.random() * 3)]; // Hours, Each, Lump Sum
  } else if (discipline === 'trade') {
    return ['EA', 'SF', 'LF', 'SYS'][Math.floor(Math.random() * 4)]; // Each, Square Feet, Linear Feet, System
  }

  const options = units[itemName] || ['EA'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateMockSubcontractor(itemName, discipline) {
  const contractors = {
    'Concrete': ['ABC Concrete Co.', 'Premier Concrete', 'Solid Foundation Inc.'],
    'Masonry': ['Master Masonry', 'Stone & Block Co.', 'Heritage Masonry'],
    'Metals': ['Steel Fabricators Inc.', 'Metro Steel Works', 'Precision Metal Co.'],
    'Wood, Plastics, Composites': ['Timber Frame LLC', 'Wood Works Co.', 'Composite Solutions'],
    'Thermal and Moisture Protection': ['Roof Systems Inc.', 'Weather Shield Co.', 'Thermal Solutions'],
    'Openings': ['Window & Door Co.', 'Openings Unlimited', 'Access Solutions'],
    'Finishes': ['Elite Finishes', 'Perfect Paint Co.', 'Interior Solutions'],
    'Fire Suppression': ['Fire Safety Systems', 'Sprinkler Pro Inc.', 'Safety First Co.'],
    'Plumbing': ['Premier Plumbing', 'Flow Systems Inc.', 'Pipe Masters LLC'],
    'HVAC': ['Climate Control Co.', 'Air Systems Inc.', 'Comfort Solutions'],
    'Electrical': ['Power Pro Electric', 'Current Solutions', 'Bright Ideas Electric'],
    'Earthwork': ['Earth Movers Inc.', 'Excavation Pro', 'Site Prep LLC'],
    'Exterior Improvements': ['Landscape Pro', 'Exterior Solutions', 'Site Works Co.']
  };

  if (discipline === 'design') {
    const designFirms = ['Architectural Studio LLC', 'Design Associates', 'Creative Design Group', 'Urban Planning Co.', 'Engineering Consultants'];
    return designFirms[Math.floor(Math.random() * designFirms.length)];
  } else if (discipline === 'trade') {
    const tradeFirms = ['Systems Integration Inc.', 'Technical Services LLC', 'Specialty Contractors', 'Equipment Specialists', 'Installation Experts'];
    return tradeFirms[Math.floor(Math.random() * tradeFirms.length)];
  }

  const options = contractors[itemName] || ['General Contractor'];
  return options[Math.floor(Math.random() * options.length)];
}