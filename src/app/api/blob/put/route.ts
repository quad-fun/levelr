// src/app/api/blob/put/route.ts

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { withApiGate } from '@/lib/api-gate';

export const runtime = 'edge';

interface BlobPutRequest {
  name: string;
  size: number;
  contentType: string;
}

interface BlobPutResponse {
  uploadUrl: string;
  getUrl: string;
  token: string; // For cleanup
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
    const body: BlobPutRequest = await request.json();
    const { name, size, contentType } = body;

    // Validate input
    if (!name || !size || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, size, contentType' },
        { status: 400 }
      );
    }

    // Size limits (200MB max)
    const maxSize = 200 * 1024 * 1024;
    if (size > maxSize) {
      return NextResponse.json(
        { error: `File size ${(size / 1024 / 1024).toFixed(1)}MB exceeds limit of 200MB` },
        { status: 413 }
      );
    }

    // Validate content type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Unsupported content type: ${contentType}` },
        { status: 400 }
      );
    }

    // Create ephemeral blob object
    const filename = `temp-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${name}`;

    // Use Vercel Blob to create upload URL
    const blob = await put(filename, Buffer.alloc(0), {
      access: 'public',
      contentType,
      addRandomSuffix: true
    });

    // Generate a cleanup token
    const cleanupToken = Buffer.from(
      JSON.stringify({
        url: blob.url,
        created: Date.now()
      })
    ).toString('base64url');

    const response: BlobPutResponse = {
      uploadUrl: blob.url,
      getUrl: blob.url,
      token: cleanupToken
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Blob put error:', error);

    if (error instanceof Error) {
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
      { error: 'Failed to create upload URL. Please try again.' },
      { status: 500 }
    );
  }
}