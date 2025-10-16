import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { withApiGate } from '@/lib/api-gate';

export async function POST(request: NextRequest) {
  // API gating for blob storage
  const gateResult = await withApiGate(request, {
    requiredFlag: 'blobStorage',
    requireAuth: true,
    enforceUsageLimits: false // File cleanup doesn't count against analysis limits
  });

  if ('status' in gateResult) {
    return gateResult; // Return error response
  }

  // Auth context available but not used in this endpoint
  // const { userId, tier, flags } = gateResult;

  try {
    const { blobUrl } = await request.json();
    
    if (!blobUrl) {
      return NextResponse.json(
        { error: 'Blob URL is required' },
        { status: 400 }
      );
    }

    // Delete the blob from storage
    await del(blobUrl);
    
    console.log('Blob deleted:', blobUrl);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Blob deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete temporary file' },
      { status: 500 }
    );
  }
}