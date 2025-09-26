// src/lib/analysis/aia-analyzer.ts

import { AnalysisResult, AIAPhaseAnalysis } from '@/types/analysis';
import { ProcessedDocument } from '@/lib/document-processor';
import { AIA_PHASES } from '@/types/rfp';

export async function analyzeDesignProposal(processedDoc: ProcessedDocument): Promise<AnalysisResult> {
  const prompt = `
You are analyzing a design services proposal for architecture, engineering, or design services. Extract ALL cost information and map to AIA phases.

AIA PHASES:
- Schematic Design (SD): 15% typical fee - Conceptual design, programming, site analysis
- Design Development (DD): 20% typical fee - Design refinement, coordination, material selection
- Construction Documents (CD): 40% typical fee - Final drawings, specifications, permitting
- Bidding/Negotiation (BN): 5% typical fee - Bidding assistance, contractor selection
- Construction Administration (CA): 20% typical fee - Construction oversight, shop drawing review

DESIGN DELIVERABLES to identify:
- Drawings: architectural plans, elevations, sections, details
- Specifications: technical specifications, material schedules
- Reports: feasibility studies, code analysis, sustainability reports
- Models: 3D models, renderings, virtual reality
- Studies: site analysis, programming, zoning analysis

DESIGN OVERHEAD TYPES:
- Project management fees
- Administrative costs
- Insurance (professional liability)
- Travel and expenses
- Consultation fees
- Subconsultant coordination

Return ONLY valid JSON with this exact structure:
{
  "contractor_name": "DESIGN_FIRM_NAME",
  "total_amount": 250000,
  "discipline": "design",
  "project_name": "Project name if found",
  "proposal_date": "2024-03-15",
  "base_bid_amount": 250000,
  "aia_phases": {
    "schematic_design": {
      "phase_name": "Schematic Design",
      "fee_amount": 37500,
      "percentage_of_total": 15,
      "deliverables": [
        {"description": "Conceptual drawings", "cost_allocation": 25000},
        {"description": "Programming study", "cost_allocation": 12500}
      ],
      "scope_notes": "Basic design concepts and programming"
    },
    "design_development": {
      "phase_name": "Design Development",
      "fee_amount": 50000,
      "percentage_of_total": 20,
      "deliverables": [
        {"description": "Design development drawings", "cost_allocation": 35000},
        {"description": "Material specifications", "cost_allocation": 15000}
      ],
      "scope_notes": "Refined design with material selection"
    }
  },
  "design_deliverables": [
    {"description": "Architectural drawings", "responsible_discipline": "Architecture"},
    {"description": "Structural drawings", "responsible_discipline": "Structural Engineering"}
  ],
  "project_overhead": {
    "project_management": 15000,
    "administration": 8000,
    "insurance": 5000,
    "travel_expenses": 3000,
    "subconsultants": 12000,
    "total_overhead": 43000
  },
  "categorizationPercentage": 85.5,
  "timeline": "8 months design phase",
  "exclusions": ["construction cost estimation", "landscape design"],
  "assumptions": ["client approval at each phase", "no major design changes"],
  "document_quality": "professional_typed"
}

CRITICAL VALIDATION:
- Fee amounts in aia_phases should sum close to total_amount
- Percentage allocations should reflect typical AIA fee distribution
- Design deliverables should be specific to architecture/engineering
- Project overhead should be design-related administrative costs

Document: ${processedDoc.fileName}
File Type: ${processedDoc.fileType}
`;

  return await callClaudeAPI(processedDoc, prompt);
}

async function callClaudeAPI(processedDoc: ProcessedDocument, prompt: string) {
  // Prepare message content based on file type
  let messageContent;

  if (processedDoc.isBase64 && (processedDoc.fileType === 'image' || processedDoc.fileType === 'pdf')) {
    let base64Data: string;

    if (processedDoc.content.startsWith('data:')) {
      base64Data = processedDoc.content.split(',')[1];
    } else {
      base64Data = processedDoc.content;
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
    messageContent = prompt + '\n\n' + processedDoc.content;
  }

  // Prepare the payload
  const payload = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ]
  };

  // Make the request to Claude
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  // Get raw response text first
  const rawText = await response.text();

  // Handle non-200 responses
  if (!response.ok) {
    console.error('Claude API error:', response.status, rawText);
    throw new Error(`Claude API error: ${response.status} - ${rawText}`);
  }

  // Parse the response
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    throw new Error(`Failed to parse Claude API response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
  }

  const content = data.content?.[0];

  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response format from Claude API');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in Claude response');
  }

  // Parse the extracted JSON
  let analysisResult;
  try {
    analysisResult = JSON.parse(jsonMatch[0]);
  } catch (jsonError) {
    console.error('Analysis JSON parse error:', jsonError);
    throw new Error(`Failed to parse analysis JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
  }

  // Validate required fields
  if (!analysisResult.contractor_name || !analysisResult.total_amount) {
    throw new Error('Missing required fields in analysis result');
  }

  // Set discipline and ensure required structure
  analysisResult.discipline = 'design';
  analysisResult.csi_divisions = {}; // Empty for design proposals

  return analysisResult;
}