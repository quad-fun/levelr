// src/app/api/leveling/compare/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { compareDetailedBids } from '@/lib/analysis/comparative-analyzer';
import { BidComparisonRequest, AnalysisResult } from '@/types/analysis';

// Route configuration
export const config = {
  maxDuration: 300,
  runtime: 'nodejs18.x'
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: BidComparisonRequest = await request.json();

    if (!body.bid_ids || !Array.isArray(body.bid_ids) || body.bid_ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 bid IDs are required for comparison' },
        { status: 400 }
      );
    }

    if (body.bid_ids.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 bids can be compared at once' },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting comparative analysis for ${body.bid_ids.length} bids`);

    // For now, we'll retrieve bids from the request body since we don't have persistent storage
    // In a real implementation, this would fetch from a database using the bid_ids
    const bids = await getBidsFromStorage(body.bid_ids);

    if (bids.length < 2) {
      return NextResponse.json(
        { error: 'Could not find enough valid bids for comparison. Please ensure bids have been analyzed and stored.' },
        { status: 400 }
      );
    }

    // Validate that bids have detailed summaries
    const bidsWithSummaries = bids.filter(bid => bid.detailed_summary && bid.detailed_summary.length > 1000);
    if (bidsWithSummaries.length < 2) {
      return NextResponse.json(
        {
          error: 'At least 2 bids must have detailed summaries for comparative analysis. Please re-analyze older bids to generate summaries.',
          found_summaries: bidsWithSummaries.length,
          total_bids: bids.length
        },
        { status: 400 }
      );
    }

    // Perform comparative analysis
    const comparativeAnalysis = await compareDetailedBids(bidsWithSummaries);

    console.log('✅ Comparative analysis completed successfully');

    return NextResponse.json({
      analysis: comparativeAnalysis,
      metadata: {
        bids_compared: bidsWithSummaries.length,
        comparison_focus: body.comparison_focus || 'comprehensive',
        analysis_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Comparative analysis error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack trace'
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Service configuration error. Please contact support.' },
          { status: 503 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      if (error.message.includes('detailed summaries')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Comparative analysis failed. Please try again or contact support if the problem persists.',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to retrieve bids from storage
// In a real implementation, this would be a database query
async function getBidsFromStorage(bidIds: string[]): Promise<AnalysisResult[]> {
  const bids: AnalysisResult[] = [];

  // This is a simplified implementation for the browser-only storage approach
  // In a real production system, this would query a database
  for (const bidId of bidIds) {
    try {
      // For the API route, we can't access localStorage directly
      // The client would need to send the full analysis data in the request
      // or we'd need to implement server-side storage

      // For now, we'll expect the analyses to be sent in the request body
      // This is a temporary implementation
      console.log(`Looking for bid analysis: ${bidId}`);
    } catch (error) {
      console.warn(`Failed to load analysis ${bidId}:`, error);
    }
  }

  return bids;
}

// Alternative endpoint that accepts full analysis data in the request
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.analyses || !Array.isArray(body.analyses) || body.analyses.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 analysis objects are required for comparison' },
        { status: 400 }
      );
    }

    if (body.analyses.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 bids can be compared at once' },
        { status: 400 }
      );
    }

    const analyses: AnalysisResult[] = body.analyses;

    // Validate analyses structure
    for (const analysis of analyses) {
      if (!analysis.contractor_name || !analysis.total_amount) {
        return NextResponse.json(
          { error: 'Invalid analysis data: missing contractor_name or total_amount' },
          { status: 400 }
        );
      }
    }

    console.log(`🔍 Starting comparative analysis for ${analyses.length} bids using full data`);

    // Perform comparative analysis
    const comparativeAnalysis = await compareDetailedBids(analyses);

    console.log('✅ Comparative analysis completed successfully');

    return NextResponse.json({
      analysis: comparativeAnalysis,
      metadata: {
        bids_compared: analyses.length,
        comparison_focus: body.comparison_focus || 'comprehensive',
        analysis_timestamp: new Date().toISOString(),
        contractors: analyses.map(a => a.contractor_name)
      }
    });

  } catch (error) {
    console.error('Comparative analysis error (PUT):', error);

    if (error instanceof Error) {
      if (error.message.includes('detailed summaries')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Comparative analysis failed. Please try again.',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}