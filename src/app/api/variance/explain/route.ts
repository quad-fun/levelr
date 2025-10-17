// src/app/api/variance/explain/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { explainVariance } from '@/lib/varianceExplain';
import { withApiGate } from '@/lib/api-gate';

export async function POST(req: NextRequest) {
  // API gating for inline explanations
  const gateResult = await withApiGate(req, {
    requiredFlag: 'inlineExplanations',
    requireAuth: true,
    enforceUsageLimits: true
  });

  if ('status' in gateResult) {
    return gateResult; // Return error response
  }

  const { flags } = gateResult;
  // userId and tier available but not used in this endpoint

  // Additional check for bid leveling since this is a leveling feature
  if (!flags.bidLeveling) {
    return NextResponse.json(
      {
        reason: "feature_disabled",
        feature: "bidLeveling",
        message: "Bid leveling feature is required for variance explanations"
      },
      { status: 403 }
    );
  }

  try {
    const { rows, selectedBids, maxChars } = await req.json();

    // Basic validation
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing rows data' },
        { status: 400 }
      );
    }

    if (!selectedBids || !Array.isArray(selectedBids) || selectedBids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 selected bids required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Variance explanation request: ${rows.length} rows, ${selectedBids.length} bids`);

    const explanation = await explainVariance({
      rows,
      selectedBids,
      maxChars
    });

    return NextResponse.json(explanation);

  } catch (error) {
    console.error('Variance explanation API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint for cache statistics (useful for debugging)
export async function GET() {
  try {
    const { getCacheStats } = await import('@/lib/varianceExplain');
    const stats = getCacheStats();

    return NextResponse.json({
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}