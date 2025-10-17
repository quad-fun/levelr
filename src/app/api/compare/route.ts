// src/app/api/compare/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withApiGate } from '@/lib/api-gate';

export async function POST(req: NextRequest) {
  // Gate on inlineExplanations flag - returns 403 if disabled
  const gateResult = await withApiGate(req, {
    requiredFlag: 'inlineExplanations',
    requireAuth: true,
    enforceUsageLimits: true
  });

  if ('status' in gateResult) {
    return gateResult; // Return error response (403 if flag disabled)
  }

  const { flags, userId, tier } = gateResult;

  try {
    const { items } = await req.json();

    // Basic validation
    if (!items || !Array.isArray(items) || items.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 items required for comparison' },
        { status: 400 }
      );
    }

    console.log(`🔍 Compare request from user ${userId} (${tier}): ${items.length} items`);

    // Mock comparison logic - in real implementation this would
    // compare the items and return analysis
    const comparison = {
      summary: `Compared ${items.length} items`,
      differences: items.map((item, index) => ({
        item: `Item ${index + 1}`,
        value: item.value || 0,
        variance: Math.random() * 100 - 50 // Mock variance
      })),
      recommendation: "Based on the comparison, Item 1 offers the best value.",
      userTier: tier,
      flagsEnabled: {
        inlineExplanations: flags.inlineExplanations,
        bidLeveling: flags.bidLeveling
      }
    };

    return NextResponse.json(comparison);

  } catch (error) {
    console.error('Compare API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint for testing flag status
export async function GET(req: NextRequest) {
  const gateResult = await withApiGate(req, {
    requiredFlag: 'inlineExplanations',
    requireAuth: false,
    enforceUsageLimits: false
  });

  if ('status' in gateResult) {
    return gateResult; // Return error response
  }

  const { flags, userId, tier } = gateResult;

  return NextResponse.json({
    message: 'Compare API is available',
    userId: userId || 'anonymous',
    tier: tier || 'none',
    flagsStatus: {
      inlineExplanations: flags.inlineExplanations,
      teams: flags.teams,
      bidLeveling: flags.bidLeveling
    },
    timestamp: new Date().toISOString()
  });
}