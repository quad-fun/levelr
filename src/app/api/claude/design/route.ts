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
    safeLog('Design analysis request size:', contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB` : 'unknown');

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

    // Analyze design document with Claude
    safeLog('Analyzing design document:', `${finalProcessedDoc.fileName} (Type: ${finalProcessedDoc.fileType})`);
    const analysis = await analyzeDesignDocument(finalProcessedDoc);

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

    console.error('Design analysis API route error:', {
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
        error: 'Design analysis failed. Please try again or contact support if the problem persists.',
        details: isDev && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Design-specific Claude API integration
async function analyzeDesignDocument(processedDoc: {
  fileName: string;
  fileType: string;
  content: string;
  isBase64?: boolean;
}) {
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
  safeLog("Claude design request payload:", {
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
  safeLog("Claude design response status:", response.status);
  safeLog("Claude design response:", rawText.substring(0, 500));

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
  analysisResult.discipline = 'design';
  analysisResult.csi_divisions = {}; // Empty for design proposals

  safeLog("Design analysis result parsed successfully:", {
    contractor: analysisResult.contractor_name,
    total: analysisResult.total_amount,
    phases: Object.keys(analysisResult.aia_phases || {}).length
  });

  return analysisResult;
}