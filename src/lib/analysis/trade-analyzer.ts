// src/lib/analysis/trade-analyzer.ts

import { AnalysisResult } from '@/types/analysis';
import { ProcessedDocument } from '@/lib/document-processor';

export async function analyzeTradeProposal(processedDoc: ProcessedDocument): Promise<AnalysisResult> {
  const prompt = `
You are analyzing a trade services proposal for electrical, mechanical, plumbing, or specialty trade work. Extract ALL cost information and map to technical systems.

TECHNICAL SYSTEMS TO IDENTIFY:

ELECTRICAL SYSTEMS:
- Power Distribution: Panels, switchgear, transformers, feeders
- Lighting Systems: Fixtures, controls, emergency lighting
- Fire Alarm: Detection, notification, control panels
- Security Systems: Access control, CCTV, intrusion detection
- Communications: Data/voice cabling, networking equipment

MECHANICAL SYSTEMS:
- HVAC Equipment: Units, boilers, chillers, pumps, fans
- Ductwork & Piping: Supply/return ducts, hydronic piping
- Controls: Building automation, thermostats, dampers
- Ventilation: Exhaust fans, makeup air, fume hoods

PLUMBING SYSTEMS:
- Water Supply: Domestic water, irrigation, fire suppression
- Drainage: Sanitary, storm, grease interceptors
- Fixtures: Toilets, sinks, drinking fountains
- Hot Water: Water heaters, circulation pumps

SPECIALTY SYSTEMS:
- Fire Suppression: Sprinklers, standpipes, pumps
- Conveying: Elevators, escalators, lifts
- Food Service: Kitchen equipment, grease systems
- Technology: AV systems, IT infrastructure

EQUIPMENT SPECIFICATIONS to extract:
- Manufacturer and model numbers
- Capacity/ratings (BTU, amperage, GPM, etc.)
- Quantities and unit costs
- Installation requirements
- Testing and commissioning

TRADE OVERHEAD TYPES:
- Supervision and project management
- Permits and inspections
- Insurance and bonds
- Material handling and storage
- Testing and commissioning
- Warranty and service

Return ONLY valid JSON with this exact structure:
{
  "contractor_name": "TRADE_CONTRACTOR_NAME",
  "total_amount": 450000,
  "discipline": "trade",
  "project_name": "Project name if found",
  "proposal_date": "2024-03-15",
  "base_bid_amount": 450000,
  "technical_systems": {
    "electrical_power": {
      "system_name": "Electrical Power Distribution",
      "category": "electrical",
      "total_cost": 180000,
      "equipment_cost": 120000,
      "labor_cost": 60000,
      "specifications": [
        {
          "description": "Main electrical panel",
          "quantity": 1,
          "unit_cost": 15000,
          "total_cost": 15000,
          "specifications": ["400A main breaker", "42 circuit capacity"]
        }
      ],
      "testing_requirements": ["Insulation testing", "Load testing"],
      "scope_notes": "Complete power distribution system"
    },
    "hvac_systems": {
      "system_name": "HVAC Systems",
      "category": "mechanical",
      "total_cost": 220000,
      "equipment_cost": 150000,
      "labor_cost": 70000,
      "specifications": [
        {
          "description": "Rooftop HVAC unit",
          "quantity": 2,
          "unit_cost": 35000,
          "total_cost": 70000,
          "specifications": ["25 ton capacity", "High efficiency"]
        }
      ],
      "testing_requirements": ["Air balancing", "Commissioning"],
      "scope_notes": "Complete HVAC installation"
    }
  },
  "equipment_specifications": [
    {
      "description": "Main electrical panel",
      "model": "Square D NF442L1C",
      "quantity": 1,
      "unit_cost": 15000,
      "total_cost": 15000
    }
  ],
  "project_overhead": {
    "supervision": 25000,
    "permits": 8000,
    "insurance": 12000,
    "bonds": 10000,
    "testing": 15000,
    "total_overhead": 70000
  },
  "categorizationPercentage": 88.5,
  "timeline": "6 months installation",
  "exclusions": ["utility connections", "architectural coordination"],
  "assumptions": ["normal working conditions", "material availability"],
  "document_quality": "professional_typed"
}

CRITICAL VALIDATION:
- System costs should sum close to total_amount
- Equipment and labor costs should be realistic for trade work
- Technical systems should match the trade type (electrical, mechanical, plumbing)
- Testing requirements should be trade-specific

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
  analysisResult.discipline = 'trade';
  analysisResult.csi_divisions = {}; // Empty for trade proposals

  return analysisResult;
}