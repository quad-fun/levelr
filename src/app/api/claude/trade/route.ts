import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { ProcessedDocument } from '@/lib/document-processor';

// Route configuration for Vercel Pro large file handling
export const config = {
  maxDuration: 300,
  runtime: 'nodejs18.x'
};

const isDev = process.env.NODE_ENV !== 'production';

function safeLog(message: string, data?: unknown) {
  if (isDev) {
    if (data !== undefined) {
      console.log(message, typeof data === 'string' && data.length > 1000
        ? data.substring(0, 1000) + '...'
        : data);
    } else {
      console.log(message);
    }
  }
}

export async function POST(request: NextRequest) {
  let blobUrl: string | null = null;

  try {
    // Log request size for debugging
    const contentLength = request.headers.get('content-length');
    safeLog('Trade analysis request size:', contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB` : 'unknown');

    // Use Vercel Pro 100MB limit
    if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Please use files smaller than 75MB.' },
        { status: 413 }
      );
    }

    // Parse the request body
    let body;
    try {
      const chunks = [];
      const reader = request.body?.getReader();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      }

      const bodyBuffer = Buffer.concat(chunks);
      const bodyText = bodyBuffer.toString();
      body = JSON.parse(bodyText);

      safeLog('Trade analysis manual parsing successful, body size:', `${Math.round(bodyBuffer.length / (1024 * 1024))}MB`);
    } catch (error) {
      console.error('Body parsing error:', error);
      return NextResponse.json(
        {
          error: 'Invalid request format. Please try uploading your file again.',
          details: error instanceof Error ? error.message : 'Unknown parsing error'
        },
        { status: 400 }
      );
    }

    const { processedDoc } = body;

    if (!processedDoc || !processedDoc.content) {
      return NextResponse.json(
        { error: 'Processed document is required. Please select a file to upload.' },
        { status: 400 }
      );
    }

    let finalProcessedDoc = processedDoc;

    // Handle blob storage files
    if (processedDoc.useBlobStorage) {
      safeLog('Processing blob storage file:', processedDoc.content);
      blobUrl = processedDoc.content;

      try {
        let blobResponse: Response | null = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          safeLog(`Fetching blob content (attempt ${retryCount + 1}/${maxRetries}):`, processedDoc.content);
          blobResponse = await fetch(processedDoc.content);

          if (blobResponse.ok) {
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            safeLog(`Blob fetch failed with ${blobResponse.status}, retrying in 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        if (!blobResponse || !blobResponse.ok) {
          throw new Error(`Failed to fetch blob after ${maxRetries} attempts: ${blobResponse?.status || 'unknown'}`);
        }

        const arrayBuffer = await blobResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Content = buffer.toString('base64');

        finalProcessedDoc = {
          ...processedDoc,
          content: base64Content,
          isBase64: true,
          useBlobStorage: false
        };

        safeLog('Blob content fetched successfully:', `${Math.round(buffer.length / (1024 * 1024))}MB`);

      } catch (error) {
        console.error('Failed to fetch blob content:', error);
        return NextResponse.json(
          { error: 'Failed to retrieve uploaded file. The file may still be processing. Please wait a moment and try again.' },
          { status: 500 }
        );
      }
    } else {
      if (processedDoc.content.length > 90 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File content too large. Please use a file smaller than 70MB.' },
          { status: 413 }
        );
      }

      safeLog('Processed document size:', `${Math.round(processedDoc.content.length / (1024 * 1024))}MB`);
    }

    // Check API key
    if (!process.env.CLAUDE_API_KEY) {
      console.error('Missing CLAUDE_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Analyze trade document with specialized trade analysis + detailed summary
    safeLog('Analyzing trade document:', `${finalProcessedDoc.fileName} (Type: ${finalProcessedDoc.fileType})`);
    const analysis = await analyzeTradeDocumentWithSummary(finalProcessedDoc as ProcessedDocument);

    // Clean up blob storage if used
    if (blobUrl) {
      try {
        await del(blobUrl);
        safeLog('Blob cleanup completed:', blobUrl);
      } catch (cleanupError) {
        console.error('Blob cleanup failed (non-critical):', cleanupError);
      }
    }

    return NextResponse.json({ analysis });

  } catch (error) {
    // Clean up blob storage if used (even in error cases)
    if (typeof blobUrl === 'string' && blobUrl) {
      try {
        await del(blobUrl);
        safeLog('Blob cleanup completed after error:', blobUrl);
      } catch (cleanupError) {
        console.error('Blob cleanup failed after error (non-critical):', cleanupError);
      }
    }

    console.error('Trade analysis API route error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack trace',
      type: typeof error
    });

    // Better error handling
    if (error instanceof Error) {
      if (error.message?.includes('PayloadTooLargeError') || error.message?.includes('413')) {
        return NextResponse.json(
          { error: 'File too large for processing. Please use a file smaller than 100MB.' },
          { status: 413 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      if (error.message.includes('context length')) {
        return NextResponse.json(
          { error: 'Document too long for analysis. Please use a shorter document.' },
          { status: 413 }
        );
      }
      if (error.message.includes('authentication') || error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Service configuration error. Please contact support.' },
          { status: 503 }
        );
      }
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        return NextResponse.json(
          {
            error: 'Analysis response format error. Please try again.',
            details: isDev ? error.message : undefined
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Trade analysis failed. Please try again or contact support if the problem persists.',
        details: isDev && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Enhanced Trade-specific Claude API integration with detailed summary
async function analyzeTradeDocumentWithSummary(processedDoc: ProcessedDocument) {
  const prompt = `
You are analyzing a trade services proposal for electrical, mechanical, plumbing, or specialty trade services. Extract ALL cost information and map to technical systems, AND generate a comprehensive detailed summary.

TECHNICAL SYSTEMS CATEGORIES:
- Electrical Systems: Power distribution, lighting, panels, wiring, controls
- Mechanical Systems: HVAC equipment, ductwork, piping, ventilation, controls
- Plumbing Systems: Water supply, waste, vent, fixtures, equipment
- Fire Protection: Sprinkler systems, alarm systems, suppression equipment
- Technology Systems: Data, telecommunications, security, AV equipment
- Specialty Systems: Elevators, kitchen equipment, medical gas, etc.

TRADE ANALYSIS COMPONENTS:
- Equipment Lists: Model numbers, quantities, specifications, costs
- Installation Requirements: Labor, coordination, testing, commissioning
- Materials: Conduit, piping, fittings, accessories, consumables
- System Testing: Commissioning, startup, performance testing
- Permits & Inspections: Trade-specific permits and inspection requirements
- Warranty Terms: Equipment warranties, installation warranties, service

Return ONLY valid JSON with this exact structure:
{
  "contractor_name": "TRADE_CONTRACTOR_NAME",
  "total_amount": 150000,
  "discipline": "trade",
  "project_name": "Project name if found",
  "proposal_date": "2024-03-15",
  "base_bid_amount": 150000,
  "technical_systems": {
    "electrical_power": {
      "system_name": "Electrical Power Distribution",
      "total_cost": 45000,
      "equipment": [
        {"description": "Main electrical panel", "model": "Square D QO142M200", "quantity": 1, "unit_cost": 2500, "total_cost": 2500},
        {"description": "Distribution panels", "model": "Square D QO124L125", "quantity": 3, "unit_cost": 800, "total_cost": 2400}
      ],
      "installation_scope": "Power distribution installation with all feeders and branch circuits",
      "testing_requirements": "System commissioning and electrical testing per code",
      "warranty_terms": "1 year parts and labor, 10 year equipment warranty"
    },
    "lighting_systems": {
      "system_name": "LED Lighting Systems",
      "total_cost": 25000,
      "equipment": [
        {"description": "LED fixtures", "model": "Lithonia 2GTL4", "quantity": 50, "unit_cost": 150, "total_cost": 7500},
        {"description": "Emergency lighting", "model": "Lithonia ELM2", "quantity": 12, "unit_cost": 200, "total_cost": 2400}
      ],
      "installation_scope": "Complete lighting installation with controls",
      "testing_requirements": "Photometric testing and emergency lighting test",
      "warranty_terms": "5 year LED warranty, 1 year installation"
    }
  },
  "installation_requirements": {
    "labor_hours": 480,
    "crew_size": 4,
    "duration_weeks": 3,
    "coordination_requirements": ["structural trades", "HVAC rough-in"],
    "special_equipment": ["lift rental", "testing equipment"]
  },
  "project_overhead": {
    "project_management": 8000,
    "permits_inspections": 3000,
    "testing_commissioning": 5000,
    "cleanup_protection": 2000,
    "total_overhead": 18000
  },
  "softCosts": [],
  "softCostsTotal": 0,
  "uncategorizedCosts": [],
  "uncategorizedTotal": 0,
  "categorizationPercentage": 100,
  "timeline": "3 weeks",
  "exclusions": ["structural modifications", "painting", "final cleanup"],
  "assumptions": ["power available for construction", "access provided by GC"],
  "document_quality": "professional_typed",
  "detailed_summary": "# ABC Electrical Contractors - Comprehensive Trade Proposal Analysis\\n\\n## Project Overview\\n- Project: Office Building Electrical Installation\\n- Proposal Date: March 15, 2024\\n- Total Contract: $150,000\\n- Trade: Electrical Systems\\n- Project Duration: 3 weeks\\n\\n## Technical Systems Breakdown\\n\\n### Electrical Power Distribution\\n**Total Cost**: $45,000\\n**Equipment Provided**:\\n- Main electrical panel (Square D QO142M200): $2,500\\n- Distribution panels (3x Square D QO124L125): $2,400\\n- Conduit and wiring: $15,000\\n- Electrical feeders and branch circuits: $25,100\\n**Installation Scope**: Complete power distribution system installation including all feeders, branch circuits, and connections\\n**Testing**: System commissioning and electrical testing per NEC requirements\\n**Warranty**: 1 year parts and labor, 10 year equipment manufacturer warranty\\n\\n### LED Lighting Systems\\n**Total Cost**: $25,000\\n**Equipment Provided**:\\n- LED light fixtures (50x Lithonia 2GTL4): $7,500\\n- Emergency lighting (12x Lithonia ELM2): $2,400\\n- Lighting controls and switches: $8,500\\n- Installation materials: $6,600\\n**Installation Scope**: Complete lighting installation with automated controls and emergency systems\\n**Testing**: Photometric testing and 90-minute emergency lighting test\\n**Warranty**: 5 year LED manufacturer warranty, 1 year installation warranty\\n\\n## Installation Requirements\\n**Labor**: 480 hours with 4-person crew\\n**Duration**: 3 weeks\\n**Coordination**: Must coordinate with structural trades and HVAC rough-in\\n**Special Equipment**: Scissor lift rental and electrical testing equipment included\\n\\n## Project Management & Overhead\\n**Project Management**: $8,000\\n**Permits & Inspections**: $3,000 (electrical permit and city inspections)\\n**Testing & Commissioning**: $5,000 (third-party commissioning)\\n**Cleanup & Protection**: $2,000\\n**Total Overhead**: $18,000 (12%)\\n\\n## Exclusions & Assumptions\\n**Excluded from Scope**:\\n- Structural modifications or core drilling\\n- Painting or patching of walls\\n- Final cleaning beyond electrical work areas\\n- Generator or emergency power systems\\n\\n**Key Assumptions**:\\n- Temporary power available for construction use\\n- Access to work areas provided by general contractor\\n- Materials can be delivered directly to floors\\n- No hazardous materials or asbestos present\\n\\n## Timeline & Schedule\\n- **Week 1**: Rough-in electrical work, panel installation\\n- **Week 2**: Fixture installation and wiring connections\\n- **Week 3**: Testing, commissioning, and final connections\\n\\n## Quality & Code Compliance\\n- All work per National Electrical Code (NEC) 2020\\n- Local electrical code compliance\\n- NECA installation standards\\n- UL listed equipment and materials only\\n\\nThis comprehensive electrical installation provides full building power and lighting systems with professional installation and testing."
}

**CRITICAL REQUIREMENTS FOR TRADE ANALYSIS:**
- Extract actual contractor name, not placeholder
- Map ALL systems to technical categories (electrical, mechanical, plumbing, etc.)
- Include specific equipment with model numbers, quantities, costs
- Detail installation requirements and timeline
- Separate equipment costs from installation labor
- Note testing, commissioning, and warranty requirements
- Extract permits, inspections, and compliance requirements

**DETAILED SUMMARY REQUIREMENTS:**
- Generate a comprehensive markdown summary in the detailed_summary field
- Include all technical systems, equipment specs, installation details
- Keep summary between 5-15KB for optimal processing
- Properly escape all quotes and newlines for valid JSON
- Include model numbers, quantities, costs, and technical specifications
- Structure with clear headers for equipment, installation, testing, warranties

**CRITICAL JSON FORMATTING REQUIREMENTS:**
- The detailed_summary field MUST be valid JSON string content
- Escape all quotes within the summary using \\"
- Replace all newlines with \\n
- Replace all tabs with \\t
- Do not include unescaped quotes, line breaks, or control characters

Document: ${processedDoc.fileName}
File Type: ${processedDoc.fileType}

${processedDoc.isBase64 ? 'Document content (image/PDF):' : 'Document content:'}
`;

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

  // Make the request to Claude
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    })
  });

  // Get raw response text first
  const rawText = await response.text();
  safeLog("Trade Claude raw response status:", response.status);
  safeLog("Trade Claude raw response:", rawText.substring(0, 500));

  // Handle non-200 responses
  if (!response.ok) {
    console.error('Claude API error:', response.status, rawText);

    if (response.status === 413) {
      throw new Error('File too large for analysis. Please use a file smaller than 75MB or compress your document.');
    }

    throw new Error(`Claude API error: ${response.status} - ${rawText}`);
  }

  // Parse the response
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Raw response that failed to parse:', rawText);
    throw new Error(`Failed to parse Claude API response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
  }

  const content = data.content?.[0];

  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response format from Claude API');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    safeLog("Claude response text (no JSON found):", content.text);
    throw new Error('No valid JSON found in Claude response');
  }

  // Clean and validate JSON before parsing (using the same sanitization logic)
  const cleanedJsonString = sanitizeJsonString(jsonMatch[0]);

  let analysisResult;
  try {
    analysisResult = JSON.parse(cleanedJsonString);
  } catch (jsonError) {
    console.error('Analysis JSON parse error:', jsonError);
    console.error('JSON string that failed to parse:', cleanedJsonString.substring(0, 500));
    throw new Error(`Failed to parse analysis JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
  }

  // Validate required fields
  if (!analysisResult.contractor_name || !analysisResult.total_amount) {
    throw new Error('Missing required fields in analysis result');
  }

  // Ensure correct discipline and structure for trade
  analysisResult.discipline = 'trade';
  analysisResult.csi_divisions = {}; // Empty for trade proposals

  // Log detailed summary status
  if (analysisResult.detailed_summary) {
    const summaryLength = analysisResult.detailed_summary.length;
    console.log(`✅ Trade detailed summary generated: ${(summaryLength / 1024).toFixed(1)}KB`);
  } else {
    console.warn('⚠️ No detailed_summary field found in trade analysis result');
  }

  safeLog("Trade analysis result parsed successfully:", {
    contractor: analysisResult.contractor_name,
    total: analysisResult.total_amount,
    systems: Object.keys(analysisResult.technical_systems || {}).length,
    summaryLength: analysisResult.detailed_summary?.length || 0
  });

  return analysisResult;
}

// JSON sanitization function (reused from design route)
function sanitizeJsonString(jsonString: string): string {
  console.log('🧹 Sanitizing trade JSON string of length:', jsonString.length);

  try {
    JSON.parse(jsonString);
    console.log('✅ Trade JSON is already valid, no sanitization needed');
    return jsonString;
  } catch {
    console.log('⚠️ Trade JSON needs sanitization, attempting to fix...');
  }

  let sanitized = jsonString;

  // Find the detailed_summary field and extract it safely
  const detailedSummaryMatch = sanitized.match(/"detailed_summary"\s*:\s*"([\s\S]*?)"\s*[,}]/);

  if (detailedSummaryMatch) {
    const [fullMatch, summaryContent] = detailedSummaryMatch;

    // Properly escape the summary content
    const escapedSummary = summaryContent
      .replace(/\\/g, '\\\\')      // Escape backslashes first
      .replace(/"/g, '\\"')        // Escape quotes
      .replace(/\n/g, '\\n')       // Escape newlines
      .replace(/\r/g, '\\r')       // Escape carriage returns
      .replace(/\t/g, '\\t')       // Escape tabs
      .replace(/\f/g, '\\f')       // Escape form feeds
      .replace(/\b/g, '\\b');      // Escape backspaces

    const newSummaryField = `"detailed_summary": "${escapedSummary}"`;
    const endChar = fullMatch.endsWith(',') ? ',' : '';

    sanitized = sanitized.replace(fullMatch, newSummaryField + endChar);
  }

  // Fix any trailing commas before closing braces/brackets
  sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');

  // Remove any remaining unescaped control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  try {
    JSON.parse(sanitized);
    console.log('✅ Trade JSON sanitization successful');
    return sanitized;
  } catch (error) {
    console.error('❌ Trade JSON sanitization failed, attempting robust fallback');

    try {
      const withoutSummary = sanitized.replace(
        /"detailed_summary"\s*:\s*"[\s\S]*?"\s*,?/g,
        ''
      );

      const cleanedWithoutSummary = withoutSummary
        .replace(/,\s*,/g, ',')
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/{\s*,/g, '{')
        .replace(/,\s*}/g, '}');

      const baseResult = JSON.parse(cleanedWithoutSummary);
      baseResult.detailed_summary = "Trade summary was sanitized due to special characters - specialized technical systems analysis completed successfully";

      console.log('⚡ Trade robust fallback successful');
      return JSON.stringify(baseResult);

    } catch {
      console.error('💥 Trade JSON sanitization completely failed');
      throw new Error(`Trade JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}