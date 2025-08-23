import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocumentWithClaude } from '@/lib/claude';
import { del } from '@vercel/blob';

// Route configuration for Vercel Pro large file handling
export const config = {
  maxDuration: 300,
  runtime: 'nodejs18.x'  // Required for large request bodies
};

export async function POST(request: NextRequest) {
  let blobUrl: string | null = null; // Declare at function level for error cleanup
  
  try {
    // Log request size for debugging
    const contentLength = request.headers.get('content-length');
    console.log('Request size:', contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB` : 'unknown');
    
    // Use Vercel Pro 100MB limit (allows ~75MB original files after base64 encoding)
    if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Please use files smaller than 75MB.' },
        { status: 413 }
      );
    }

    // Parse the stream manually for large files to bypass Next.js 1MB limit
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
      
      console.log('Manual parsing successful, body size:', Math.round(bodyBuffer.length / (1024 * 1024)), 'MB');
    } catch (error) {
      console.error('Manual body parsing failed:', error);
      return NextResponse.json(
        { error: 'Invalid request format. Please try uploading your file again.' },
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
      console.log('Processing blob storage file:', processedDoc.content);
      blobUrl = processedDoc.content; // Store for cleanup
      
      try {
        // Retry logic for fetching blob content (handles propagation delays)
        let blobResponse: Response | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          console.log(`Fetching blob content (attempt ${retryCount + 1}/${maxRetries}):`, processedDoc.content);
          blobResponse = await fetch(processedDoc.content);
          
          if (blobResponse.ok) {
            break;
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Blob fetch failed with ${blobResponse.status}, retrying in 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        if (!blobResponse || !blobResponse.ok) {
          throw new Error(`Failed to fetch blob after ${maxRetries} attempts: ${blobResponse?.status || 'unknown'}`);
        }
        
        const arrayBuffer = await blobResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Content = buffer.toString('base64');
        
        // Create new processed doc with actual content
        finalProcessedDoc = {
          ...processedDoc,
          content: base64Content,
          isBase64: true,
          useBlobStorage: false // Clear flag since we now have the content
        };
        
        console.log('Blob content fetched successfully:', Math.round(buffer.length / (1024 * 1024)), 'MB');
        
      } catch (error) {
        console.error('Failed to fetch blob content:', error);
        return NextResponse.json(
          { error: 'Failed to retrieve uploaded file. The file may still be processing. Please wait a moment and try again.' },
          { status: 500 }
        );
      }
    } else {
      // Check file content size with Vercel Pro limits for direct uploads
      if (processedDoc.content.length > 90 * 1024 * 1024) { // ~90MB for base64 content (leaves room for JSON overhead)
        return NextResponse.json(
          { error: 'File content too large. Please use a file smaller than 70MB.' },
          { status: 413 }
        );
      }
      
      // Additional debug logging
      console.log('Processed document size:', Math.round(processedDoc.content.length / (1024 * 1024)), 'MB');
    }

    // Check API key
    if (!process.env.CLAUDE_API_KEY) {
      console.error('Missing CLAUDE_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Analyze document with Claude
    console.log('Analyzing document:', finalProcessedDoc.fileName, 'Type:', finalProcessedDoc.fileType);
    const analysis = await analyzeDocumentWithClaude(finalProcessedDoc);

    // Clean up blob storage if used
    if (blobUrl) {
      try {
        await del(blobUrl);
        console.log('Blob cleanup completed:', blobUrl);
      } catch (cleanupError) {
        console.error('Blob cleanup failed (non-critical):', cleanupError);
        // Don't fail the request for cleanup errors
      }
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    // Clean up blob storage if used (even in error cases)
    if (typeof blobUrl === 'string' && blobUrl) {
      try {
        await del(blobUrl);
        console.log('Blob cleanup completed after error:', blobUrl);
      } catch (cleanupError) {
        console.error('Blob cleanup failed after error (non-critical):', cleanupError);
      }
    }

    console.error('Claude API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error,
      apiKeyPresent: !!process.env.CLAUDE_API_KEY
    });
    
    // Better error handling for large files
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
    }
    
    return NextResponse.json(
      { error: 'Analysis failed. Please try again or contact support if the problem persists.' },
      { status: 500 }
    );
  }
}

// Using nodejs18.x runtime for better large file handling