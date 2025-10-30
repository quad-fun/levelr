// src/app/api/ai/route.ts
import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import type { BidArtifact } from '@/types/analysis';

export const runtime = 'edge';

interface AIRequest {
  structured: true;
  prompt: string;
  bidArtifact?: BidArtifact; // Only derived artifacts, never raw documents
  maxTokens?: number;
}

interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  timestamp: string;
}

/**
 * Tiny Claude proxy for Pro Mode
 * Only accepts small structured inputs - no raw documents
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key exists
    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request
    const body: AIRequest = await request.json();

    // Strict validation - only structured prompts allowed
    if (!body.structured || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Only structured prompts are supported' },
        { status: 400 }
      );
    }

    // Size limits for security
    if (body.prompt.length > 10000) { // 10KB prompt limit
      return NextResponse.json(
        { error: 'Prompt too large' },
        { status: 400 }
      );
    }

    // If bid artifact is included, validate it's reasonable size
    if (body.bidArtifact) {
      const artifactSize = JSON.stringify(body.bidArtifact).length;
      if (artifactSize > 50000) { // 50KB artifact limit
        return NextResponse.json(
          { error: 'Artifact too large' },
          { status: 400 }
        );
      }
    }

    // Build Claude request
    const claudeRequest = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: Math.min(body.maxTokens || 1000, 2000), // Cap at 2000 tokens
      messages: [
        {
          role: 'user' as const,
          content: body.prompt
        }
      ]
    };

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);

      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    const claudeResult = await claudeResponse.json();

    // Extract content from Claude response
    const content = claudeResult.content?.[0]?.text || '';

    // Build response
    const response: AIResponse = {
      content,
      usage: claudeResult.usage ? {
        inputTokens: claudeResult.usage.input_tokens || 0,
        outputTokens: claudeResult.usage.output_tokens || 0
      } : undefined,
      model: claudeResult.model || 'claude-3-5-sonnet-20241022',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI proxy error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}