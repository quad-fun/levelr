// src/lib/summarize.ts

import { AnalysisResult } from '@/types/analysis';

interface SummaryOptions {
  analysis: AnalysisResult;
  maxChars?: number;
  _sections?: string[];
}

export async function generateDetailedSummary({
  analysis,
  maxChars = 12000,
  _sections = ['ExecutiveSummary', 'CostSnapshot', 'ScopeByDivision', 'HighRiskItems', 'BidVarianceAnalysis']
}: SummaryOptions): Promise<string> {

  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured for summary generation');
  }

  // Focused summary prompt - optimized for bid variance analysis and chat foundation
  const prompt = [
    `You produce MARKDOWN only. No code fences. No JSON.`,
    `Stay under ${maxChars} characters.`,
    ``,
    `Required sections (only if data exists):`,
    `## Executive Summary`,
    `## Cost Snapshot`,
    `## Scope by CSI Division`,
    `## High-Risk Items & Assumptions`,
    `## Bid Variance Analysis Factors`,
    `## Key Data for Chat Foundation`,
    ``,
    `Focus on:`,
    `- Specific cost breakdowns and unit pricing for variance analysis`,
    `- Risk factors that affect pricing (assumptions, exclusions, scope gaps)`,
    `- Detailed line items and specifications for chat queries`,
    `- Subcontractor assignments and trade breakdowns`,
    `- Project timeline and delivery constraints`,
    ``,
    `Use bullets, be concise. Numbers must match the provided analysis data exactly.`,
    ``,
    `DATA (read-only, do not invent):`,
    JSON.stringify(analysis, null, 2)
  ].join('\n');

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
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error for summary:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0];

    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response format from Claude API for summary');
    }

    // Ensure markdown-only output and enforce length limit
    const markdown = enforceMarkdownOnly(content.text);
    return hardCapAtParagraph(markdown, maxChars);

  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
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