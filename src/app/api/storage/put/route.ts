// src/app/api/storage/put/route.ts
import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'edge';

interface PutRequest {
  kind: 'bid-artifact' | 'leveling-artifact' | 'analysis-artifact';
  runId: string;
  payload: unknown; // JSON payload only
  ttl?: number; // Optional TTL in seconds
}

/**
 * Store derived artifacts in Vercel Blob
 * Only accepts small JSON payloads - never raw documents
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request
    const body: PutRequest = await request.json();

    // Validate payload size (max 1MB for artifacts)
    const payloadStr = JSON.stringify(body.payload);
    const payloadSize = new TextEncoder().encode(payloadStr).length;

    if (payloadSize > 1024 * 1024) { // 1MB limit
      return NextResponse.json(
        { error: 'Payload too large. Maximum 1MB for artifacts.' },
        { status: 400 }
      );
    }

    // Validate kind
    const validKinds = ['bid-artifact', 'leveling-artifact', 'analysis-artifact'];
    if (!validKinds.includes(body.kind)) {
      return NextResponse.json(
        { error: 'Invalid artifact kind' },
        { status: 400 }
      );
    }

    // Create blob filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${body.kind}/${timestamp}/${body.runId}.json`;

    // Upload to Vercel Blob
    const blob = await put(filename, payloadStr, {
      access: 'public', // Artifacts can be publicly accessible via signed URLs
      contentType: 'application/json',
      metadata: {
        kind: body.kind,
        runId: body.runId,
        size: payloadSize.toString(),
        createdAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      key: blob.pathname,
      url: blob.url,
      size: payloadSize,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Blob storage error:', error);

    return NextResponse.json(
      { error: 'Failed to store artifact' },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}