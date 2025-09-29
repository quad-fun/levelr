import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

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

      safeLog('Manual parsing successful, body size:', `${Math.round(bodyBuffer.length / (1024 * 1024))}MB`);
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

    // Analyze trade document with Claude
    safeLog('Analyzing trade document:', `${finalProcessedDoc.fileName} (Type: ${finalProcessedDoc.fileType})`);
    const analysis = await analyzeTradeDocument(finalProcessedDoc);

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

// Trade-specific Claude API integration
async function analyzeTradeDocument(processedDoc: {
  fileName: string;
  fileType: string;
  content: string;
  isBase64?: boolean;
}) {
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
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ]
  };

  // Log payload for debugging (dev only)
  safeLog("Claude trade request payload:", {
    model: payload.model,
    max_tokens: payload.max_tokens,
    messageContentType: Array.isArray(messageContent) ? 'multipart' : 'text',
    messageLength: Array.isArray(messageContent)
      ? messageContent.length
      : (typeof messageContent === 'string' ? messageContent.length : 0)
  });

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
  safeLog("Claude trade response status:", response.status);
  safeLog("Claude trade response:", rawText.substring(0, 500));

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

  // Parse the extracted JSON
  let analysisResult;
  try {
    analysisResult = JSON.parse(jsonMatch[0]);
  } catch (jsonError) {
    console.error('Analysis JSON parse error:', jsonError);
    console.error('JSON string that failed to parse:', jsonMatch[0].substring(0, 500));
    throw new Error(`Failed to parse analysis JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
  }

  // Validate required fields
  if (!analysisResult.contractor_name || !analysisResult.total_amount) {
    throw new Error('Missing required fields in analysis result');
  }

  // Ensure correct discipline and structure
  analysisResult.discipline = 'trade';
  analysisResult.csi_divisions = {}; // Empty for trade proposals

  safeLog("Trade analysis result parsed successfully:", {
    contractor: analysisResult.contractor_name,
    total: analysisResult.total_amount,
    systems: Object.keys(analysisResult.technical_systems || {}).length
  });

  return analysisResult;
}