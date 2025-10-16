import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types/analysis';
import { withApiGate } from '@/lib/api-gate';

// Route configuration for Vercel
export const config = {
  maxDuration: 60,
  runtime: 'nodejs18.x'
};

interface SummarizeRequest {
  analysis: AnalysisResult;
  analysis_id?: string;
  sections?: string[];
  max_chars?: number;
}

interface SummarizeResponse {
  markdown: string;
  stats: {
    chars: number;
    sections_emitted: number;
    processing_time_ms: number;
  };
}

const DEFAULT_SECTIONS = [
  'ExecutiveSummary',
  'CostSnapshot',
  'ScopeByDivision',
  'HighRiskItems',
  'BidVarianceAnalysis',
  'ChatFoundationData'
];

export async function POST(request: NextRequest) {
  // API gating for summary generation
  const gateResult = await withApiGate(request, {
    requiredFlag: 'summaryGeneration',
    requireAuth: true,
    enforceUsageLimits: true
  });

  if ('status' in gateResult) {
    return gateResult; // Return error response
  }

  // Auth context available but not used in this endpoint
  // const { userId, tier, flags } = gateResult;

  const startTime = Date.now();

  try {
    const body: SummarizeRequest = await request.json();
    const {
      analysis,
      analysis_id,
      sections = DEFAULT_SECTIONS,
      max_chars = 12000
    } = body;

    if (!analysis && !analysis_id) {
      return NextResponse.json(
        { error: 'Either analysis data or analysis_id is required' },
        { status: 400 }
      );
    }

    // For now, work with provided analysis data
    // In future: implement loadAnalysis(analysis_id) for stored analyses
    const analysisData = analysis;
    if (!analysisData) {
      return NextResponse.json(
        { error: 'Analysis data not found' },
        { status: 404 }
      );
    }

    console.log(`📝 Generating summary for ${analysisData.contractor_name} - ${analysisData.total_amount.toLocaleString()}`);

    // Chunk analysis by divisions to keep token pressure low
    const chunks = chunkAnalysisByDivision(analysisData, 6000);
    const summaryPieces: string[] = [];

    // Generate summary for each chunk
    for (const chunk of chunks) {
      const markdown = await generateMarkdownSummary(chunk, sections, max_chars);
      if (markdown.trim()) {
        summaryPieces.push(markdown);
      }
    }

    // Stitch pieces together into cohesive document
    const finalMarkdown = await stitchSummaryPieces(summaryPieces, analysisData, max_chars);

    // Apply hard character limit with clean cutoff
    const cappedMarkdown = hardCapAtParagraph(finalMarkdown, max_chars);

    const processingTime = Date.now() - startTime;

    const response: SummarizeResponse = {
      markdown: cappedMarkdown,
      stats: {
        chars: cappedMarkdown.length,
        sections_emitted: summaryPieces.length,
        processing_time_ms: processingTime
      }
    };

    console.log(`✅ Summary generated: ${response.stats.chars} chars in ${processingTime}ms`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Summary generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function chunkAnalysisByDivision(analysis: AnalysisResult, maxTokenBudget: number): AnalysisResult[] {
  // For now, return analysis as single chunk
  // TODO: Implement smart chunking based on division count and JSON size
  const jsonSize = JSON.stringify(analysis).length;

  if (jsonSize < maxTokenBudget) {
    return [analysis];
  }

  // Smart chunking: group divisions into smaller batches
  const divisionEntries = Object.entries(analysis.csi_divisions);
  const chunks: AnalysisResult[] = [];
  const divisionsPerChunk = Math.max(1, Math.floor(divisionEntries.length / 3));

  for (let i = 0; i < divisionEntries.length; i += divisionsPerChunk) {
    const chunkDivisions = Object.fromEntries(
      divisionEntries.slice(i, i + divisionsPerChunk)
    );

    chunks.push({
      ...analysis,
      csi_divisions: chunkDivisions
    });
  }

  return chunks;
}

async function generateMarkdownSummary(
  analysisChunk: AnalysisResult,
  sections: string[],
  maxChars: number
): Promise<string> {

  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  // Focused summary prompt - optimized for bid variance analysis and chat foundation
  const summaryPrompt = `You are writing a project summary for bid variance analysis and future chat queries.

Return MARKDOWN only. No code fences. No JSON. Stay under ${Math.floor(maxChars / 3)} characters.

Required sections (only if data exists):
## Executive Summary
## Cost Snapshot
## Scope by CSI Division
## High-Risk Items & Assumptions
## Bid Variance Analysis Factors
## Key Data for Chat Foundation

Focus on:
- Specific cost breakdowns and unit pricing for variance analysis
- Risk factors that affect pricing (assumptions, exclusions, scope gaps)
- Detailed line items and specifications for chat queries
- Subcontractor assignments and trade breakdowns
- Project timeline and delivery constraints

Use bullets, be concise. Numbers must match the provided analysis data exactly.

DATA (read-only, do not invent):
${JSON.stringify(analysisChunk, null, 2)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent, factual summaries
        messages: [{
          role: 'user',
          content: summaryPrompt
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text());
      return ''; // Return empty rather than failing entire summary
    }

    const data = await response.json();
    const content = data.content?.[0];

    if (!content || content.type !== 'text') {
      console.error('Unexpected response format from Claude API');
      return '';
    }

    // Ensure markdown-only output
    return enforceMarkdownOnly(content.text);

  } catch (error) {
    console.error('Error generating summary chunk:', error);
    return '';
  }
}

async function stitchSummaryPieces(
  pieces: string[],
  fullAnalysis: AnalysisResult,
  maxChars: number
): Promise<string> {

  if (pieces.length <= 1) {
    return pieces[0] || '';
  }

  if (!process.env.CLAUDE_API_KEY) {
    // Fallback: simple concatenation
    return pieces.join('\n\n---\n\n');
  }

  const stitchPrompt = `You merge MARKDOWN sections into a single cohesive document optimized for bid variance analysis.

Return MARKDOWN only. No code fences. No JSON. Stay under ${maxChars} characters.

Focus on:
- Maintaining cost accuracy and division details for variance analysis
- Preserving specific line items and pricing for chat functionality
- Creating logical flow from executive summary → detailed breakdowns
- Highlighting key risk factors and assumptions

Project: ${fullAnalysis.contractor_name} - $${fullAnalysis.total_amount.toLocaleString()}

SECTIONS TO MERGE:
${pieces.join('\n\n---\n\n')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: stitchPrompt
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API stitch error:', response.status);
      return pieces.join('\n\n---\n\n'); // Fallback
    }

    const data = await response.json();
    const content = data.content?.[0];

    if (!content || content.type !== 'text') {
      return pieces.join('\n\n---\n\n'); // Fallback
    }

    return enforceMarkdownOnly(content.text);

  } catch (error) {
    console.error('Error stitching summary pieces:', error);
    return pieces.join('\n\n---\n\n'); // Fallback
  }
}

function enforceMarkdownOnly(text: string): string {
  // Strip any accidental code fences or JSON
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/^\s*\{[\s\S]*\}\s*$/gm, '') // Remove JSON objects
    .replace(/^\s*\[[\s\S]*\]\s*$/gm, '') // Remove JSON arrays
    .trim();
}

function hardCapAtParagraph(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Find last paragraph boundary before the limit
  const truncated = text.substring(0, maxChars);
  const lastParagraph = truncated.lastIndexOf('\n\n');

  if (lastParagraph > maxChars * 0.8) { // If we're close to the limit
    return truncated.substring(0, lastParagraph) + '\n\n[Content truncated for length]';
  }

  // Fall back to sentence boundary
  const lastSentence = truncated.lastIndexOf('. ');
  if (lastSentence > maxChars * 0.8) {
    return truncated.substring(0, lastSentence + 1) + ' [Content truncated for length]';
  }

  // Hard cutoff
  return truncated + '... [Content truncated for length]';
}