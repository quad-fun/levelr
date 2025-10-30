// public/workers/parser.worker.js

// Web Worker for browser-only document parsing
self.onmessage = function(event) {
  const { type, file } = event.data;

  if (type === 'parse') {
    parseDocument(file);
  }
};

async function parseDocument(file) {
  try {
    // Send initial progress
    self.postMessage({
      type: 'progress',
      progress: 10
    });

    // Mock document parsing based on file type
    const lines = await mockParseDocument(file);

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

async function mockParseDocument(file) {
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

  // Generate mock CSI line items based on file name/type
  const mockLines = [];
  const csiDivisions = [
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
  ];

  // Generate 8-15 line items
  const numLines = Math.floor(Math.random() * 8) + 8;
  const selectedDivisions = csiDivisions
    .sort(() => Math.random() - 0.5)
    .slice(0, numLines);

  selectedDivisions.forEach((div, index) => {
    const variance = Math.random() * 0.4 - 0.2; // ±20% variance
    const cost = Math.round(div.baseCost * (1 + variance));

    mockLines.push({
      id: `line-${index + 1}`,
      description: `${div.name} - ${generateMockDescription(div.name)}`,
      division: div.division, // Use 'division' to match CsiLine interface
      cost: cost, // Use 'cost' to match CsiLine interface
      quantity: Math.floor(Math.random() * 1000) + 100,
      unit: getRandomUnit(div.name),
      unitCost: Math.round(cost / (Math.floor(Math.random() * 500) + 100)),
      subcontractor: generateMockSubcontractor(div.name),
      pageRef: Math.floor(Math.random() * 5) + 1,
      confidence: Math.random() * 0.2 + 0.8 // 80-100% confidence
    });
  });

  return mockLines;
}

function generateMockDescription(divisionName) {
  const descriptions = {
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
  };

  const options = descriptions[divisionName] || ['General construction work'];
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomUnit(divisionName) {
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

  const options = units[divisionName] || ['EA'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateMockSubcontractor(divisionName) {
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

  const options = contractors[divisionName] || ['General Contractor'];
  return options[Math.floor(Math.random() * options.length)];
}