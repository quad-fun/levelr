import { NextRequest, NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { withApiGate } from '@/lib/api-gate';

export async function POST(request: NextRequest) {
  // API gating for blob storage
  const gateResult = await withApiGate(request, {
    requiredFlag: 'blobStorage',
    requireAuth: true,
    enforceUsageLimits: false // File uploads don't count against analysis limits
  });

  if ('status' in gateResult) {
    return gateResult; // Return error response
  }

  // Auth context available but not used in this endpoint
  // const { userId, tier, flags } = gateResult;

  try {
    const body = await request.json();
    
    console.log('Handling blob upload request for:', body.filename, 'Size:', body.size ? Math.round(body.size / (1024 * 1024)) + 'MB' : 'unknown');
    
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        // Generate a unique path for the temporary file
        const uniquePath = `temp/${body.filename}-${Date.now()}`;
        
        console.log('Generating token for:', uniquePath);
        
        return {
          allowedContentTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/png',
            'image/jpeg'
          ],
          addRandomSuffix: true, // Important for multipart uploads
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB - supports large files with multipart
          tokenPayload: JSON.stringify({ pathname: uniquePath })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload: _tokenPayload }) => {
        console.log('Upload completed:', blob.url);
        // Optional: Store blob metadata if needed
      },
    });
    
    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      { error: 'Failed to handle upload' },
      { status: 500 }
    );
  }
}