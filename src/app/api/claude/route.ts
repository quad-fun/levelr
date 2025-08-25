import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

// Route configuration for Vercel Pro large file handling
export const config = {
  maxDuration: 300,
  runtime: 'nodejs18.x'  // Required for large request bodies
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
    safeLog('Request size:', contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB` : 'unknown');
    
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

    // Analyze document with Claude - call our new direct analysis function
    safeLog('Analyzing document:', `${finalProcessedDoc.fileName} (Type: ${finalProcessedDoc.fileType})`);
    const analysis = await analyzeDocumentDirectly(finalProcessedDoc);

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

    console.error('Claude API route error:', {
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
        error: 'Analysis failed. Please try again or contact support if the problem persists.',
        details: isDev && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Direct Claude API integration with proper error handling
async function analyzeDocumentDirectly(processedDoc: {
  fileName: string;
  fileType: string;
  content: string;
  isBase64?: boolean;
}) {
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

🎯 CRITICAL COST SEPARATION REQUIREMENTS:

**CSI DIVISIONS**: Construction work that maps to specific CSI divisions
**SOFT COSTS**: Administrative, professional, and non-construction costs
**UNCATEGORIZED**: Construction work that cannot be mapped to CSI divisions

SOFT COSTS IDENTIFICATION (These should NEVER be in CSI divisions):
• Design fees, architectural services, engineering costs
• Permits, bonds, insurance premiums (not construction insurance)
• Legal fees, financing costs, consultant fees
• Survey work, testing, inspection services not part of construction
• Project management fees, owner's representative costs
• Marketing, advertising, sales expenses
• Financing costs, loan fees, interest during construction
• Administrative overhead not related to construction activities
• Professional services (legal, accounting, real estate)

Keywords for SOFT COSTS: design, engineering, architect, permit, bond, insurance, legal, finance, consultant, survey, test, inspection, management fee, overhead, administration, professional, loan, interest

UNCATEGORIZED COSTS should only be construction work that doesn't fit CSI divisions.

Return ONLY valid JSON with this exact structure:
{
  "contractor_name": "ACTUAL_COMPANY_NAME_FROM_DOCUMENT",
  "total_amount": 2850000,
  "project_name": "Project name if found",
  "bid_date": "2024-03-15",
  "base_bid_amount": 2850000,
  "direct_costs": 2400000,
  "markup_percentage": 18.75,
  "csi_divisions": {
    "01": {
      "cost": 125000, 
      "items": ["general requirements", "supervision"],
      "subcontractor": "Self-performed"
    },
    "03": {
      "cost": 450000, 
      "items": ["foundations", "structural concrete"],
      "subcontractor": "ABC Concrete Co."
    }
  },
  "subcontractors": [
    {"name": "ABC Concrete Co.", "trade": "Concrete", "divisions": ["03"], "total_amount": 450000}
  ],
  "softCosts": [
    {"description": "Design fees", "cost": 15000},
    {"description": "Engineering services", "cost": 8000},
    {"description": "Permit fees", "cost": 5000}
  ],
  "softCostsTotal": 28000,
  "uncategorizedCosts": [
    {"description": "Miscellaneous construction items not mappable to CSI", "cost": 25000}
  ],
  "uncategorizedTotal": 25000,
  "categorizationPercentage": 91.2,
  "timeline": "12 months",
  "exclusions": ["site utilities", "permits"],
  "assumptions": ["normal soil conditions"],
  "document_quality": "professional_typed"
}

CRITICAL VALIDATION:
- softCostsTotal MUST equal sum of all softCosts array items
- uncategorizedCosts should ONLY contain construction work not mappable to CSI
- All costs must be accounted for: CSI divisions + soft costs + uncategorized = close to total_amount
- Soft costs are typically 3-15% of total project cost

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
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ]
  };

  // Log payload for debugging (dev only)
  safeLog("Claude request payload:", {
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
  safeLog("Claude raw response status:", response.status);
  safeLog("Claude raw response:", rawText.substring(0, 500));

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

  safeLog("Analysis result parsed successfully:", {
    contractor: analysisResult.contractor_name,
    total: analysisResult.total_amount,
    divisions: Object.keys(analysisResult.csi_divisions || {}).length
  });

  return analysisResult;
}