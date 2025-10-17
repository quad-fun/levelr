import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { ProcessedDocument } from '@/lib/document-processor';
import { withApiGate, recordAnalysisUsage } from '@/lib/api-gate';

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
  // API gating for bid analysis
  const gateResult = await withApiGate(request, {
    requiredFlag: 'bidAnalysis',
    requireAuth: true,
    enforceUsageLimits: true,
    isAnalysisEndpoint: true
  });

  if ('status' in gateResult) {
    return gateResult; // Return error response
  }

  const { userId } = gateResult;

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

    // Record usage for analysis tracking
    await recordAnalysisUsage(userId);

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
async function analyzeDocumentDirectly(processedDoc: ProcessedDocument) {
  // Import the enhanced prompt from claude.ts to ensure consistency
  const { analyzeDocumentWithClaude } = await import('@/lib/claude');

  // Use the enhanced analysis function that includes detailed_summary generation
  return await analyzeDocumentWithClaude(processedDoc);
}