import { AnalysisResult, Subcontractor } from '@/types/analysis';
import { ProcessedDocument } from './document-processor';

function maskStrings(s: string): { masked: string; strings: string[] } {
  const strings: string[] = [];
  let masked = '';
  let inStr = false, esc = false, buf = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      buf += c;
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') { inStr = false; strings.push(buf); masked += `__STR${strings.length - 1}__`; buf = ''; }
    } else {
      if (c === '"') { inStr = true; buf = '"'; }
      else masked += c;
    }
  }
  if (inStr) { strings.push(buf); masked += `__STR${strings.length - 1}__`; }
  return { masked, strings };
}

function unmaskStrings(s: string, strings: string[]) {
  return s.replace(/__STR(\d+)__/g, (_, i) => strings[Number(i)] ?? '""');
}

function broadCommaFix(s: string): string {
  const { masked, strings } = maskStrings(s);
  let m = masked;
  // Add commas between adjacent object tokens: }{  }\n{  }   {  }"  }123  }-45
  m = m.replace(/}\s*(?={|["\d-])/g, '},');
  // Add commas between adjacent array elements: ][  ]\n[  ]   {  ]"  ]123
  m = m.replace(/]\s*(?=\[|{|["\d-])/g, '],');
  return unmaskStrings(m, strings);
}

function sanitizeJsonStringMinimal(raw: string): string {
  let s = raw.trim();

  // Remove trailing commas before closing brackets
  s = s.replace(/,(\s*[}\]])/g, '$1');

  try {
    JSON.parse(s);
    return s;
  } catch {
    // Last-ditch string-safe broad fix
    const widened = broadCommaFix(s);
    try {
      JSON.parse(widened);
      return widened;
    } catch (finalErr) {
      // Log error context for debugging
      const pos = (finalErr as SyntaxError & { position?: number }).position ?? -1;
      if (pos >= 0) {
        const start = Math.max(0, pos - 100);
        const end = Math.min(s.length, pos + 100);
        console.error(`JSON parse error window @${pos}: ${s.slice(start, end)}`);
      }
      throw finalErr;
    }
  }
}

export async function analyzeDocumentWithClaude(processedDoc: ProcessedDocument): Promise<AnalysisResult> {
  const prompt = `
You are analyzing a construction bid document. Extract ALL cost information and map to MasterFormat 2018 CSI divisions.

CRITICAL: Use MasterFormat 2018 (50-Division System) - NOT the old 16-division format!

FACILITY CONSTRUCTION DIVISIONS (01-14):
01 - General Requirements (project management, permits, supervision, overhead, bonds)
02 - Existing Conditions (demolition, site clearing, hazmat, abatement)  
03 - Concrete (ALL structural work, foundations, construction, assembly, concrete, precast)
04 - Masonry (brick, block, stone masonry work)
05 - Metals (structural steel, metal work, steel framing)
06 - Wood, Plastics, and Composites (carpentry, framing, millwork)
07 - Thermal and Moisture Protection (roofing, waterproofing, insulation)
08 - Openings (doors, windows, glazing)
09 - Finishes (flooring, paint, ceilings, interior finishes)
10 - Specialties (toilet accessories, signage, partitions)
11 - Equipment (kitchen equipment, lab equipment, built-in appliances)
12 - Furnishings (furniture, window treatments)
13 - Special Construction (pre-engineered structures, pools)
14 - Conveying Equipment (elevators, escalators)

FACILITY SERVICES DIVISIONS (21-28):
21 - Fire Suppression (sprinkler systems, fire protection, standpipes)
22 - Plumbing (water supply, waste, vent, fixtures, domestic water)
23 - HVAC (heating, ventilation, air conditioning, mechanical equipment, ductwork)
25 - Integrated Automation (building controls, BMS, smart systems)
26 - Electrical (power, lighting, panels, wiring, electrical systems)
27 - Communications (data, telephone, networking, telecommunications)
28 - Electronic Safety and Security (access control, CCTV, alarms)

SITE DIVISIONS (31-33):
31 - Earthwork (excavation, grading, site utilities)
32 - Exterior Improvements (paving, landscaping, site work)
33 - Utilities (site utilities, water, sewer, gas lines)

🚨 CRITICAL MAPPING RULES FOR 2018 - DIVISIONS 15 & 16 DO NOT EXIST! 🚨
- "Mechanical" is NOT a division - MUST split into 21, 22, 23, 25
- "HVAC" = Division 23 (NEVER 15)
- "Plumbing" = Division 22 (NEVER 15)  
- "Fire Suppression/Sprinkler" = Division 21 (NEVER 15)
- "Electrical" = Division 26 (NEVER 16)
- "Communications/Data" = Division 27 (NEVER 16)
- "Security Systems" = Division 28 (NEVER 16)
- "Construction & Assembly" = Division 03 (Concrete/Structural)
- "Technology Systems" or "Building Controls" = Division 25 (Integrated Automation)

🚫 ABSOLUTE PROHIBITION: NEVER USE DIVISIONS 15 OR 16 - THEY DON'T EXIST IN MASTERFORMAT 2018!
🚫 IF YOU USE 15 OR 16, THE ANALYSIS WILL FAIL AND BE REJECTED!
🚫 ALL MECHANICAL MUST BE: 21 (Fire), 22 (Plumbing), 23 (HVAC), 25 (Controls)

EXTRACT PROFESSIONAL ESTIMATOR-LEVEL DETAIL:
- Find individual line items within each division with sub-breakdowns
- Identify project overhead, allowances, contingencies, and soft costs  
- Map subcontractors to their respective trade divisions
- Extract holds, TBD items, and unit price allowances
- Look for General Conditions breakdown, CM fees, insurance, bonds

🏢 EXTRACT PROJECT SIZE INFORMATION - CRITICAL FOR COST/SF CALCULATIONS:
- Search for gross square footage, building square footage, total square footage
- Common keywords: "gross sf", "gsf", "gross square feet", "building area", "floor area", "total sf", "project size", "building size", "sq ft", "square footage"
- May appear in: project description, scope summary, unit cost calculations, specifications, or bid forms
- Extract numeric value only (convert "25,000 SF" to 25000, "2.5K SF" to 2500)
- If multiple square footage values exist, prioritize gross building area over net/usable area
- Look for context clues like "gross building area", "total building sf", "overall project size"

Return ONLY valid JSON with COMPLETE granular breakdown:
{
  "contractor_name": "ACTUAL_COMPANY_NAME_FROM_DOCUMENT",
  "total_amount": ACTUAL_TOTAL_AMOUNT_NUMBER,
  "gross_sqft": 25000,
  "project_name": "Project name if found",
  "bid_date": "2024-03-15",
  "base_bid_amount": 2850000,
  "direct_costs": 2400000,
  "markup_percentage": 18.75,
  "csi_divisions": {
    "01": {
      "cost": 125000, 
      "items": ["general requirements", "supervision"],
      "subcontractor": "Self-performed",
      "sub_items": [
        {"description": "Project management", "cost": 45000, "unit": "LS", "quantity": 1},
        {"description": "Site supervision", "cost": 60000, "unit": "MONTH", "quantity": 12, "unit_cost": 5000},
        {"description": "Temporary facilities", "cost": 20000, "unit": "LS", "quantity": 1}
      ]
    },
    "03": {
      "cost": 450000, 
      "items": ["foundations", "structural concrete"],
      "subcontractor": "ABC Concrete Co.",
      "sub_items": [
        {"description": "Foundation excavation", "cost": 85000, "unit": "CY", "quantity": 340, "unit_cost": 250},
        {"description": "Concrete footings", "cost": 120000, "unit": "CY", "quantity": 150, "unit_cost": 800},
        {"description": "Slab on grade", "cost": 245000, "unit": "SF", "quantity": 24500, "unit_cost": 10}
      ]
    },
    "22": {
      "cost": 200000, 
      "items": ["plumbing fixtures", "water supply"],
      "subcontractor": "XYZ Plumbing Inc.",
      "sub_items": [
        {"description": "Rough plumbing", "cost": 125000, "unit": "SF", "quantity": 25000, "unit_cost": 5},
        {"description": "Plumbing fixtures", "cost": 75000, "unit": "EA", "quantity": 50, "unit_cost": 1500}
      ]
    }
  },
  "project_overhead": {
    "general_conditions": 85000,
    "general_requirements": 40000,
    "cm_fee": 75000,
    "insurance": 15000,
    "bonds": 12000,
    "permits": 8000,
    "total_overhead": 235000
  },
  "allowances": [
    {"description": "General contingency", "amount": 150000, "type": "contingency", "percentage_of_total": 5.26},
    {"description": "Flooring allowance", "amount": 75000, "type": "allowance", "scope_description": "Per SF allowance for tenant finishes"},
    {"description": "Mechanical equipment hold", "amount": 50000, "type": "hold", "scope_description": "Pending equipment selection"}
  ],
  "allowances_total": 275000,
  "subcontractors": [
    {"name": "ABC Concrete Co.", "trade": "Concrete", "divisions": ["03"], "total_amount": 450000},
    {"name": "XYZ Plumbing Inc.", "trade": "Plumbing", "divisions": ["22"], "total_amount": 200000},
    {"name": "DEF Electrical Corp.", "trade": "Electrical", "divisions": ["26"], "total_amount": 180000}
  ],
  "softCosts": [
    {"description": "Design fees", "cost": 15000},
    {"description": "Engineering allowance", "cost": 8000},
    {"description": "Permit contingency", "cost": 5000}
  ],
  "softCostsTotal": 28000,
  "uncategorizedCosts": [
    {"description": "Miscellaneous construction items", "cost": 25000}
  ],
  "uncategorizedTotal": 25000,
  "categorizationPercentage": 91.2,
  "timeline": "12 months",
  "exclusions": ["site utilities", "permits"],
  "assumptions": ["normal soil conditions"],
  "document_quality": "professional_typed"
}

CRITICAL REQUIREMENTS FOR PROFESSIONAL ESTIMATOR-LEVEL EXTRACTION:

GRANULAR LINE ITEM EXTRACTION:
- Extract actual numbers - convert "$1,234,567.89" to 1234567.89
- Find EVERY individual line item within each CSI division
- Create sub_items array with detailed breakdown for each division
- Include individual unit costs, quantities, and units for each line item
- Identify subcontractor assignments for each trade division
- Look for scope notes and special conditions

PROJECT OVERHEAD & SOFT COSTS:
- Separate project overhead from direct construction costs
- Extract General Conditions, CM fees, insurance, bonds, permits
- Calculate total_overhead as sum of all soft costs
- Identify markup percentage from overhead structure

SOFT COSTS VS UNCATEGORIZED SEPARATION:
- SOFT COSTS: Administrative, professional, and non-construction items that can be identified
  • Design fees, engineering costs, permits, bonds, insurance premiums
  • Management fees, supervision costs, legal fees, financing costs
  • Survey work, testing, inspection, contingency allowances
  • Keywords: design, engineering, permit, bond, insurance, contingency, allowance, fee, overhead, management, supervision, legal, survey, testing, inspection, financing, administration
- UNCATEGORIZED COSTS: Construction work that cannot be mapped to specific CSI divisions
  • Miscellaneous construction items, specialty work, unidentifiable trade work
- Create separate softCosts and uncategorizedCosts arrays with proper totals

CRITICAL VALIDATION:
- softCostsTotal MUST equal sum of all softCosts array items
- uncategorizedCosts should ONLY contain construction work not mappable to CSI
- All costs must be accounted for: CSI divisions + soft costs + uncategorized = close to total_amount
- Soft costs are typically 3-15% of total project cost

ALLOWANCES & CONTINGENCIES:
- Find ALL allowances, contingencies, holds, and TBD items
- Classify allowance type: contingency, allowance, hold, tbd, unit_price_allowance
- Calculate percentage_of_total for each allowance
- Include scope descriptions for allowances

SUBCONTRACTOR IDENTIFICATION:
- Map subcontractor names to their trade divisions
- Calculate total amount per subcontractor across all divisions
- Include trade specialization and scope descriptions

TECHNICAL REQUIREMENTS:
- "Construction & Assembly" MUST map to Division 03 (Concrete/Structural)
- Use only valid MasterFormat 2018 division numbers (01-14, 21-28, 31-33, etc.)
- Look for site work divisions (31-33): earthwork, paving, utilities
- Aim for 90%+ cost coverage with granular detail
- Use construction units: SF, LF, CY, EA, LS, SY, TON, HR, DAY, MONTH
- Calculate base_bid_amount excluding allowances and contingencies
- Track direct_costs separately from project overhead
- Calculate categorizationPercentage = (sum of categorized costs / total_amount) * 100

EXAMPLES OF CORRECT 2018 MAPPING:
- "HVAC Systems: $500,000" → Division 23: {"cost": 500000, "items": ["hvac systems"]}
- "Plumbing: $200,000" → Division 22: {"cost": 200000, "items": ["plumbing"]}
- "Electrical: $300,000" → Division 26: {"cost": 300000, "items": ["electrical"]}
- "Fire Sprinklers: $100,000" → Division 21: {"cost": 100000, "items": ["fire sprinklers"]}
- "Security System: $50,000" → Division 28: {"cost": 50000, "items": ["security system"]}

🔍 FINAL VALIDATION REQUIRED:
- Scan your JSON response for ANY occurrence of "15" or "16" in division codes
- If found, immediately correct to proper 2018 divisions:
  • Division 15 → Split into 21, 22, 23, 25
  • Division 16 → Change to 26, 27, or 28
- Verify ALL mechanical systems use divisions 21-23, 25 ONLY
- Verify ALL electrical uses divisions 26-28 ONLY

CRITICAL: Every cost must map to correct 2018 division numbers. Divisions 15 and 16 DO NOT EXIST!

Document: ${processedDoc.fileName}
File Type: ${processedDoc.fileType}

${processedDoc.isBase64 ? 'Document content (image/PDF):' : 'Document content:'}
`;

  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  try {
    // Prepare message content based on file type
    let messageContent;
    
    if (processedDoc.isBase64 && (processedDoc.fileType === 'image' || processedDoc.fileType === 'pdf')) {
      // For images and PDFs, send as base64 with the prompt
      let base64Data: string;
      
      // Handle both data URLs (from direct upload) and pure base64 (from blob storage)
      if (processedDoc.content.startsWith('data:')) {
        base64Data = processedDoc.content.split(',')[1]; // Remove data URL prefix
        console.log('Using data URL base64, length:', base64Data.length);
      } else {
        base64Data = processedDoc.content; // Already pure base64 from blob storage
        console.log('Using pure base64 from blob, length:', base64Data.length);
      }
      
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Base64 data is empty or missing');
      }
      
      let mediaType: string;
      let contentType: string;
      
      if (processedDoc.fileType === 'pdf') {
        mediaType = 'application/pdf';
        contentType = 'document';
      } else {
        // Detect image type from data URL or default to jpeg
        const mimeMatch = processedDoc.content.match(/data:([^;]+)/);
        mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        contentType = 'image';
      }
      
      messageContent = [
        {
          type: 'text',
          text: prompt
        },
        {
          type: contentType,
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data
          }
        }
      ];
    } else {
      // For text/Excel content, include it directly in the prompt
      messageContent = prompt + '\n\n' + processedDoc.content;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: messageContent
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      
      if (response.status === 413) {
        throw new Error('File too large for analysis. Please use a file smaller than 75MB or compress your document.');
      }
      
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0];
    
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response format from Claude API');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    // Pre-process JSON to auto-correct legacy divisions before parsing
    const correctedJsonString = autoCorrectLegacyDivisions(jsonMatch[0]);
    // Robust JSON sanitization with string masking
    const sanitizedJson = sanitizeJsonStringMinimal(correctedJsonString);
    console.log(`About to parse length=${sanitizedJson.length}, tail=${sanitizedJson.slice(-120)}`);
    const analysisResult: AnalysisResult = JSON.parse(sanitizedJson);
    
    // Validate required fields
    if (!analysisResult.contractor_name || !analysisResult.total_amount) {
      throw new Error('Missing required fields in analysis result');
    }

    // Post-processing validation and migration
    const migratedAnalysis = migrateMasterFormat2018Compliance(analysisResult);
    
    // Comprehensive data integrity validation and enhancement
    const validatedAnalysis = validateDataIntegrity(migratedAnalysis);
    
    // Final completeness validation on enhanced data
    validateAnalysisCompleteness(validatedAnalysis);

    // Generate detailed summary via two-pass pipeline (feature flagged)
    const enableDetailedSummary = process.env.ENABLE_DETAILED_SUMMARY !== 'false'; // Default enabled

    if (enableDetailedSummary) {
      const enhancedAnalysis = await generateDetailedSummaryInProcess(validatedAnalysis);
      return enhancedAnalysis;
    } else {
      console.log('📝 Detailed summary generation disabled via feature flag');
      return validatedAnalysis;
    }
  } catch (error) {
    console.error('Error analyzing document with Claude:', error);
    throw error instanceof Error ? error : new Error('Failed to analyze document. Please try again.');
  }
}

function validateAnalysisCompleteness(analysis: AnalysisResult): void {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const clamp0to100 = (n: number) => Math.min(100, Math.max(0, n));

  const csiTotal = Object.values(analysis.csi_divisions).reduce((sum, div) => sum + div.cost, 0);
  const overheadTotal = analysis.project_overhead?.total_overhead || 0;
  const allowancesTotal = analysis.allowances_total || 0;
  const uncategorizedTotal = analysis.uncategorizedTotal || 0;

  const totalAccountedFor = csiTotal + overheadTotal + allowancesTotal + uncategorizedTotal;

  const csiCoverage = round2((csiTotal / analysis.total_amount) * 100);
  const totalCoverage = clamp0to100(round2((totalAccountedFor / analysis.total_amount) * 100));

  console.log(`Cost coverage analysis:`, {
    totalAmount: analysis.total_amount,
    mappedTotal: csiTotal,
    overheadTotal,
    allowancesTotal,
    uncategorizedTotal,
    totalAccountedFor,
    csiCoverage: csiCoverage + '%',
    totalCoverage: totalCoverage + '%',
    divisions: Object.keys(analysis.csi_divisions),
    uncategorizedItems: analysis.uncategorizedCosts?.length || 0
  });

  // Smart warnings based on actual metrics
  if (totalCoverage < 99.0) {
    console.warn(`⚠️ Low total coverage: ${totalCoverage}% - significant costs unaccounted for`);
  } else if (csiCoverage < 85.0) {
    console.warn(`⚠️ Low CSI coverage: ${csiCoverage}% - check for misclassified soft costs or missing divisions`);
  }
  
  // Check for high uncategorized percentages
  const uncategorizedPercentage = (uncategorizedTotal / analysis.total_amount) * 100;
  if (uncategorizedPercentage > 25) {
    console.warn(`⚠️ High uncategorized costs: $${uncategorizedTotal.toLocaleString()} (${uncategorizedPercentage.toFixed(1)}%)`);
  }
  
  // Log division breakdown for debugging
  Object.entries(analysis.csi_divisions).forEach(([code, data]) => {
    const percentage = ((data.cost / analysis.total_amount) * 100).toFixed(1);
    console.log(`Division ${code}: $${data.cost.toLocaleString()} (${percentage}%) - ${data.items.join(', ')}`);
  });
  
  // Log uncategorized items
  if (analysis.uncategorizedCosts && analysis.uncategorizedCosts.length > 0) {
    console.log(`Uncategorized costs (${uncategorizedPercentage.toFixed(1)}%):`);
    analysis.uncategorizedCosts.forEach(item => {
      console.log(`  - ${item.description}: $${item.cost.toLocaleString()}`);
    });
  }
}

function validateDataIntegrity(analysis: AnalysisResult): AnalysisResult {
  console.log('🔍 Starting comprehensive data integrity validation...');
  
  const enhancedAnalysis = { ...analysis };
  const issues: string[] = [];
  const fixes: string[] = [];
  
  // 1. Calculate totals from different sources
  const csiDivisionsTotal = Object.values(analysis.csi_divisions)
    .reduce((sum, div) => sum + div.cost, 0);
  const projectOverheadTotal = analysis.project_overhead?.total_overhead || 0;
  const allowancesTotal = analysis.allowances_total || 0;
  const subcontractorTotal = analysis.subcontractors
    ?.reduce((sum, sub) => sum + sub.total_amount, 0) || 0;
  const uncategorizedTotal = analysis.uncategorizedTotal || 0;
  
  console.log('💰 Cost breakdown analysis:');
  console.log(`  CSI Divisions: $${csiDivisionsTotal.toLocaleString()} (${((csiDivisionsTotal / analysis.total_amount) * 100).toFixed(1)}%)`);
  console.log(`  Project Overhead: $${projectOverheadTotal.toLocaleString()} (${((projectOverheadTotal / analysis.total_amount) * 100).toFixed(1)}%)`);
  console.log(`  Allowances: $${allowancesTotal.toLocaleString()} (${((allowancesTotal / analysis.total_amount) * 100).toFixed(1)}%)`);
  console.log(`  Subcontractors: $${subcontractorTotal.toLocaleString()} (${((subcontractorTotal / analysis.total_amount) * 100).toFixed(1)}%)`);
  console.log(`  Uncategorized: $${uncategorizedTotal.toLocaleString()} (${((uncategorizedTotal / analysis.total_amount) * 100).toFixed(1)}%)`);
  console.log(`  Project Total: $${analysis.total_amount.toLocaleString()}`);
  
  // 2. Check for subcontractors with missing CSI divisions
  const criticalDivisions = ['22', '23', '26']; // Plumbing, HVAC, Electrical
  const missingCriticalDivisions: Array<{code: string, subcontractor: Subcontractor, estimatedCost: number}> = [];
  
  if (analysis.subcontractors) {
    analysis.subcontractors.forEach(sub => {
      sub.divisions.forEach(divCode => {
        if (criticalDivisions.includes(divCode)) {
          const existingDiv = analysis.csi_divisions[divCode];
          if (!existingDiv || existingDiv.cost === 0) {
            // Estimate cost allocation for this division
            const estimatedCost = Math.round(sub.total_amount / sub.divisions.length);
            missingCriticalDivisions.push({
              code: divCode,
              subcontractor: sub,
              estimatedCost
            });
          }
        }
      });
    });
  }
  
  // 3. Auto-create missing CSI divisions from subcontractor data
  if (missingCriticalDivisions.length > 0) {
    console.log('🔧 Auto-creating missing CSI divisions from subcontractor data...');
    
    missingCriticalDivisions.forEach(missing => {
      const { code, subcontractor, estimatedCost } = missing;
      const divisionName = {
        '22': 'Plumbing',
        '23': 'HVAC', 
        '26': 'Electrical'
      }[code] || `Division ${code}`;
      
      enhancedAnalysis.csi_divisions[code] = {
        cost: estimatedCost,
        items: [divisionName.toLowerCase()],
        subcontractor: subcontractor.name,
        scope_notes: `Auto-generated from subcontractor data: ${subcontractor.name}`,
        unit: 'LS',
        quantity: 1,
        unit_cost: estimatedCost
      };
      
      fixes.push(`Created missing Division ${code} (${divisionName}) - $${estimatedCost.toLocaleString()} from ${subcontractor.name}`);
    });
  }
  
  // 4. Validate cost distribution and flag potential issues
  const totalIdentifiedCost = Object.values(enhancedAnalysis.csi_divisions)
    .reduce((sum, div) => sum + div.cost, 0) + projectOverheadTotal + allowancesTotal;
  const coveragePercentage = (totalIdentifiedCost / analysis.total_amount) * 100;
  
  if (coveragePercentage < 75) {
    issues.push(`Low cost coverage: ${coveragePercentage.toFixed(1)}% - potential data loss or incomplete extraction`);
  }
  
  // 5. Check for subcontractor-CSI division mismatches
  if (analysis.subcontractors) {
    analysis.subcontractors.forEach(sub => {
      let subcontractorCoveredInCSI = 0;
      sub.divisions.forEach(divCode => {
        const csiDiv = enhancedAnalysis.csi_divisions[divCode];
        if (csiDiv && csiDiv.cost > 0) {
          subcontractorCoveredInCSI += csiDiv.cost;
        }
      });
      
      const discrepancy = Math.abs(sub.total_amount - subcontractorCoveredInCSI);
      const discrepancyPercentage = (discrepancy / sub.total_amount) * 100;
      
      if (discrepancyPercentage > 20 && discrepancy > 10000) {
        issues.push(`Large cost discrepancy for ${sub.name}: Subcontractor total $${sub.total_amount.toLocaleString()} vs CSI total $${subcontractorCoveredInCSI.toLocaleString()}`);
      }
    });
  }
  
  // 6. Validate total cost reconciliation
  const accountedForTotal = totalIdentifiedCost + uncategorizedTotal;
  const totalDiscrepancy = Math.abs(analysis.total_amount - accountedForTotal);
  const discrepancyPercentage = (totalDiscrepancy / analysis.total_amount) * 100;
  
  if (discrepancyPercentage > 5) {
    issues.push(`Total cost discrepancy: Project total $${analysis.total_amount.toLocaleString()} vs accounted $${accountedForTotal.toLocaleString()} (${discrepancyPercentage.toFixed(1)}% difference)`);
  }
  
  // 7. Enhance uncategorized costs tracking
  if (uncategorizedTotal / analysis.total_amount > 0.2) {
    issues.push(`High uncategorized costs: ${((uncategorizedTotal / analysis.total_amount) * 100).toFixed(1)}% may indicate incomplete data extraction`);
  }
  
  // 8. Calculate precise coverage metrics
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const clamp0to100 = (n: number) => Math.min(100, Math.max(0, n));

  const csiCoverage = round2((csiDivisionsTotal / analysis.total_amount) * 100);
  const overheadCoverage = round2((projectOverheadTotal / analysis.total_amount) * 100);
  const totalCoverage = clamp0to100(round2(csiCoverage + overheadCoverage + ((allowancesTotal + uncategorizedTotal) / analysis.total_amount) * 100));

  // 9. Log results with clear metrics
  console.log('📊 Data integrity validation results:');
  console.log(`  Enhanced CSI Divisions Coverage: ${csiCoverage}%`);
  console.log(`  Total (CSI + Overhead + Other) Coverage: ${totalCoverage}%`);
  
  if (fixes.length > 0) {
    console.log('✅ Applied automatic fixes:');
    fixes.forEach(fix => console.log(`  • ${fix}`));
  }
  
  if (issues.length > 0) {
    console.log('⚠️ Data integrity issues detected:');
    issues.forEach(issue => console.log(`  • ${issue}`));
  } else {
    console.log('✅ No major data integrity issues detected');
  }

  // Smart warnings based on precise metrics
  if (totalCoverage < 99.0) {
    console.warn(`⚠️ Total coverage warning: ${totalCoverage}% - check for missing cost categories`);
  } else if (csiCoverage < 85.0) {
    console.warn(`⚠️ CSI coverage warning: ${csiCoverage}% - may indicate misclassified overhead or missing divisions`);
  }
  
  // 9. Update category coverage percentage for better reporting
  const enhancedCoverage = (Object.values(enhancedAnalysis.csi_divisions).reduce((sum, div) => sum + div.cost, 0) / analysis.total_amount) * 100;
  enhancedAnalysis.categorizationPercentage = enhancedCoverage;
  
  console.log('🎯 Data integrity validation complete');
  return enhancedAnalysis;
}

function autoCorrectLegacyDivisions(jsonString: string): string {
  let corrected = jsonString;
  const corrections: string[] = [];
  
  // Pattern to match "15": { ... } in csi_divisions
  const div15Pattern = /("15"\s*:\s*\{[^}]*\})/g;
  if (div15Pattern.test(corrected)) {
    corrections.push('Found Division 15 - will be split during post-processing');
  }
  
  // Pattern to match "16": { ... } in csi_divisions  
  const div16Pattern = /("16"\s*:\s*\{[^}]*\})/g;
  if (div16Pattern.test(corrected)) {
    corrections.push('Found Division 16 - will be converted to Division 26 during post-processing');
  }
  
  // Pattern to match "divisions": ["15"] or "divisions": ["16"] in subcontractors
  corrected = corrected.replace(/"divisions":\s*\[([^\]]*"1[56]"[^\]]*)\]/g, (match, _divisions) => {
    corrections.push('Fixed subcontractor division references');
    return match.replace(/"15"/g, '"21", "22", "23"').replace(/"16"/g, '"26"');
  });
  
  if (corrections.length > 0) {
    console.log('🔧 JSON Auto-Correction Applied:', corrections);
  }
  
  return corrected;
}

function migrateMasterFormat2018Compliance(analysis: AnalysisResult): AnalysisResult {
  const migratedAnalysis = { ...analysis };
  const migratedDivisions = { ...analysis.csi_divisions };
  const migrations: string[] = [];
  
  // Handle Division 15 (Mechanical) - Split into 21, 22, 23
  if (migratedDivisions['15']) {
    const div15Data = migratedDivisions['15'];
    migrations.push('Division 15 (Mechanical) → Split into 21, 22, 23');
    
    // Analyze items to determine proper split
    const itemsLower = div15Data.items.map(item => item.toLowerCase()).join(' ');
    const subItemsText = div15Data.sub_items?.map(item => item.description.toLowerCase()).join(' ') || '';
    const allText = `${itemsLower} ${subItemsText}`;
    
    // Split costs based on keywords
    const totalCost = div15Data.cost;
    let remainingCost = totalCost;
    
    // Fire Suppression (Division 21)
    if (allText.includes('fire') || allText.includes('sprinkler') || allText.includes('suppression')) {
      const fireCost = Math.round(totalCost * 0.15); // Typical 15% for fire systems
      migratedDivisions['21'] = {
        cost: fireCost,
        items: div15Data.items.filter(item => 
          item.toLowerCase().includes('fire') || 
          item.toLowerCase().includes('sprinkler') || 
          item.toLowerCase().includes('suppression')
        ),
        subcontractor: div15Data.subcontractor,
        sub_items: div15Data.sub_items?.filter(item => 
          item.description.toLowerCase().includes('fire') || 
          item.description.toLowerCase().includes('sprinkler')
        )
      };
      remainingCost -= fireCost;
    }
    
    // Plumbing (Division 22)
    if (allText.includes('plumbing') || allText.includes('water') || allText.includes('fixture')) {
      const plumbingCost = Math.round(remainingCost * 0.4); // Typical 40% split
      migratedDivisions['22'] = {
        cost: plumbingCost,
        items: div15Data.items.filter(item => 
          item.toLowerCase().includes('plumbing') || 
          item.toLowerCase().includes('water') || 
          item.toLowerCase().includes('fixture')
        ),
        subcontractor: div15Data.subcontractor,
        sub_items: div15Data.sub_items?.filter(item => 
          item.description.toLowerCase().includes('plumbing') || 
          item.description.toLowerCase().includes('water')
        )
      };
      remainingCost -= plumbingCost;
    }
    
    // HVAC (Division 23) - Gets remainder
    const hvacItems = div15Data.items.filter(item => 
      item.toLowerCase().includes('hvac') || 
      item.toLowerCase().includes('heating') || 
      item.toLowerCase().includes('ventilation') ||
      item.toLowerCase().includes('air conditioning') ||
      item.toLowerCase().includes('mechanical') ||
      (!item.toLowerCase().includes('plumbing') && !item.toLowerCase().includes('fire') && !item.toLowerCase().includes('sprinkler'))
    );
    
    migratedDivisions['23'] = {
      cost: remainingCost,
      items: hvacItems.length > 0 ? hvacItems : ['hvac systems', 'mechanical equipment'],
      subcontractor: div15Data.subcontractor,
      unit_cost: div15Data.unit_cost,
      quantity: div15Data.quantity,
      unit: div15Data.unit,
      scope_notes: div15Data.scope_notes || 'Migrated from Division 15 (Mechanical)',
      sub_items: div15Data.sub_items?.filter(item => 
        item.description.toLowerCase().includes('hvac') || 
        item.description.toLowerCase().includes('heating') || 
        item.description.toLowerCase().includes('mechanical') ||
        (!item.description.toLowerCase().includes('plumbing') && !item.description.toLowerCase().includes('fire'))
      )
    };
    
    delete migratedDivisions['15'];
  }
  
  // Handle Division 16 (Electrical) - Convert to 26
  if (migratedDivisions['16']) {
    const div16Data = migratedDivisions['16'];
    migrations.push('Division 16 (Electrical) → Division 26 (Electrical)');
    
    migratedDivisions['26'] = {
      ...div16Data,
      scope_notes: div16Data.scope_notes ? 
        `${div16Data.scope_notes} (Migrated from Division 16)` : 
        'Migrated from Division 16 (Electrical)'
    };
    
    delete migratedDivisions['16'];
  }
  
  // Update the migrated analysis
  migratedAnalysis.csi_divisions = migratedDivisions;
  
  // Update subcontractor division references and recalculate totals
  if (migratedAnalysis.subcontractors) {
    migratedAnalysis.subcontractors = migratedAnalysis.subcontractors.map(sub => {
      const updatedSub = {
        ...sub,
        divisions: sub.divisions.map(div => {
          if (div === '15') return ['21', '22', '23'];
          if (div === '16') return ['26'];
          return [div];
        }).flat()
      };
      
      // Recalculate total_amount based on new division mapping
      const newTotal = updatedSub.divisions.reduce((sum, divCode) => {
        return sum + (migratedDivisions[divCode]?.cost || 0);
      }, 0);
      
      if (newTotal > 0) {
        updatedSub.total_amount = newTotal;
      }
      
      return updatedSub;
    });
  }
  
  // Ensure CSI divisions have subcontractor links
  Object.entries(migratedDivisions).forEach(([divCode, divData]) => {
    if (!divData.subcontractor && migratedAnalysis.subcontractors) {
      const matchingSub = migratedAnalysis.subcontractors.find(sub => 
        sub.divisions.includes(divCode)
      );
      if (matchingSub) {
        divData.subcontractor = matchingSub.name;
      }
    }
  });
  
  if (migrations.length > 0) {
    console.log('🔄 MasterFormat Migration Applied:', migrations);
    
    // Log migration statistics
    const totalOriginalCost = (analysis.csi_divisions['15']?.cost || 0) + (analysis.csi_divisions['16']?.cost || 0);
    const totalMigratedCost = Object.entries(migratedDivisions)
      .filter(([code]) => ['21', '22', '23', '26'].includes(code))
      .reduce((sum, [, data]) => sum + data.cost, 0);
    
    console.log(`💰 Cost Migration: $${totalOriginalCost.toLocaleString()} → $${totalMigratedCost.toLocaleString()}`);
    console.log(`📊 New Division Count: ${Object.keys(migratedDivisions).length} (was ${Object.keys(analysis.csi_divisions).length})`);
    console.log('✅ Successfully migrated from legacy divisions to MasterFormat 2018');
  } else {
    console.log('✅ MasterFormat 2018 compliance validated - no migration needed');
  }
  
  return migratedAnalysis;
}

async function generateDetailedSummaryInProcess(analysis: AnalysisResult): Promise<AnalysisResult> {
  console.log('📝 Generating detailed summary via in-process pipeline...');

  try {
    // Import the summarizer function dynamically to avoid circular imports
    const { generateDetailedSummary } = await import('./summarize');

    const startTime = Date.now();
    const markdown = await generateDetailedSummary({
      analysis,
      maxChars: 15000
    });

    const processingTime = Date.now() - startTime;

    if (markdown && markdown.trim()) {
      console.log(`✅ Detailed summary generated: ${markdown.length} chars in ${processingTime}ms`);

      return {
        ...analysis,
        detailed_summary: markdown
      };
    } else {
      console.warn('⚠️ Empty summary generated, continuing without detailed_summary');
      return analysis;
    }

  } catch (error) {
    console.warn('⚠️ Summary generation error, continuing without detailed_summary:', error instanceof Error ? error.message : 'Unknown error');
    return analysis; // Graceful degradation - don't fail main analysis
  }
}

// Server-side only - DO NOT IMPORT IN CLIENT CODE