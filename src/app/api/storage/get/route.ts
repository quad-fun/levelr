// src/app/api/storage/get/route.ts
import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Retrieve artifacts from Vercel Blob
 * Returns JSON artifacts by key
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    // Validate key format (security)
    if (!key.match(/^[a-zA-Z0-9\-\/\.]+\.json$/)) {
      return NextResponse.json(
        { error: 'Invalid key format' },
        { status: 400 }
      );
    }

    // For now, return a simple response since @vercel/blob get()
    // isn't needed if we have the public URL
    // In a real implementation, you'd use the blob URL directly from the PUT response

    return NextResponse.json({
      error: 'Use the direct blob URL returned from PUT request',
      hint: 'Artifacts are stored with public access for direct retrieval'
    }, { status: 400 });

  } catch (error) {
    console.error('Blob retrieval error:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve artifact' },
      { status: 500 }
    );
  }
}