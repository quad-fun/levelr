// src/app/api/blob/delete/route.ts

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { withApiGate } from '@/lib/api-gate';

export const runtime = 'edge';

interface BlobDeleteRequest {
  url?: string;
  token?: string;
}

export async function POST(request: NextRequest) {
  // API gating - require authentication
  const gateResult = await withApiGate(request, {
    requiredFlag: 'blobStorage',
    requireAuth: true,
    enforceUsageLimits: false
  });

  if ('status' in gateResult) {
    return gateResult;
  }

  try {
    const body: BlobDeleteRequest = await request.json();
    const { url, token } = body;

    let blobUrl: string;

    if (token) {
      // Decode cleanup token to get URL
      try {
        const decoded = JSON.parse(
          Buffer.from(token, 'base64url').toString('utf-8')
        );
        blobUrl = decoded.url;

        // Check if blob is not too old (safety check)
        const created = decoded.created;
        const maxAge = 60 * 60 * 1000; // 1 hour max age
        if (Date.now() - created > maxAge) {
          console.warn('Blob cleanup token expired:', token);
        }
      } catch (_error) {
        return NextResponse.json(
          { error: 'Invalid cleanup token' },
          { status: 400 }
        );
      }
    } else if (url) {
      blobUrl = url;
    } else {
      return NextResponse.json(
        { error: 'Either url or token is required' },
        { status: 400 }
      );
    }

    // Validate URL format (basic security check)
    if (!blobUrl.includes('blob.vercel-storage.com')) {
      return NextResponse.json(
        { error: 'Invalid blob URL format' },
        { status: 400 }
      );
    }

    // Delete the blob
    await del(blobUrl);

    return NextResponse.json(
      { success: true, message: 'Blob deleted successfully' }
    );

  } catch (error) {
    console.error('Blob delete error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        // Blob already deleted or doesn't exist - this is OK
        return NextResponse.json(
          { success: true, message: 'Blob not found (may already be deleted)' }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }

      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete blob. This may not be critical.' },
      { status: 500 }
    );
  }
}