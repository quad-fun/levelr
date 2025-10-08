// src/lib/varianceExplain.ts
import 'server-only';
import crypto from 'crypto';

export type VarianceExplanation = {
  key: string;          // hash of {division, scopePath/item, selectedBids, datasetVersion}
  short: string;        // 1–2 sentences (≤ 280 chars)
  long?: string;        // optional detailed text for future use
  at: string;           // ISO timestamp
  model?: string;       // provenance
};

// Simple in-memory cache with TTL (replace with Redis/KV in production)
const cache = new Map<string, { data: VarianceExplanation; expiry: number }>();
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function generateCacheKey(opts: {
  rows: Record<string, unknown>[];
  selectedBids: string[];
}): string {
  const payload = {
    rows: opts.rows.map(row => ({
      division: row.division,
      scopePath: row.scopePath || row.item,
      bids: row.bids,
      varianceAbs: row.varianceAbs,
      variancePct: row.variancePct
    })),
    selectedBids: opts.selectedBids.sort(), // normalize order
    v: 'v1' // version for cache invalidation
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .substring(0, 16); // shorter key for logs
}

function getCachedExplanation(key: string): VarianceExplanation | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedExplanation(key: string, explanation: VarianceExplanation): void {
  cache.set(key, {
    data: explanation,
    expiry: Date.now() + CACHE_TTL_MS
  });
}

async function callClaudeForVarianceExplanation(
  rows: Record<string, unknown>[],
  selectedBids: string[],
  maxChars: number
): Promise<{ short: string; long: string }> {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const bidNames = selectedBids.length > 0 ? selectedBids.join(' vs ') : 'selected bids';
  const rowsData = JSON.stringify(rows, null, 2);

  const prompt = `Analyze why costs differ between ${bidNames}. Provide TWO versions:

1. SHORT (≤${maxChars} chars): Brief explanation of main variance drivers
2. LONG (≤800 chars): Detailed analysis including specific scope differences, material choices, allowances, and recommendations

Format as:
SHORT: [brief explanation]
LONG: [detailed analysis]

Call out scope adds/substitutions/allowances and likely cost drivers (materials, systems, labor). Use ONLY the provided data.

DATA:
${rowsData}`;

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
        max_tokens: 400, // More tokens for both versions
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error for variance explanation:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0];

    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response format from Claude API');
    }

    const fullText = content.text.trim();

    // Parse the SHORT and LONG sections
    const shortMatch = fullText.match(/SHORT:\s*([\s\S]*?)(?=\nLONG:|$)/);
    const longMatch = fullText.match(/LONG:\s*([\s\S]*?)$/);

    let shortExplanation = shortMatch?.[1]?.trim() || fullText.substring(0, maxChars);
    let longExplanation = longMatch?.[1]?.trim() || fullText;

    // Ensure length limits
    if (shortExplanation.length > maxChars) {
      shortExplanation = shortExplanation.substring(0, maxChars - 3) + '...';
    }

    if (longExplanation.length > 800) {
      longExplanation = longExplanation.substring(0, 797) + '...';
    }

    return {
      short: shortExplanation,
      long: longExplanation
    };
  } catch (error) {
    console.error('Error calling Claude for variance explanation:', error);
    throw error;
  }
}

export async function explainVariance(opts: {
  rows: Record<string, unknown>[];
  selectedBids: string[];
  maxChars?: number;
}): Promise<VarianceExplanation> {
  const { rows, selectedBids, maxChars = 280 } = opts;

  if (!rows || rows.length === 0) {
    throw new Error('No rows provided for variance explanation');
  }

  if (!selectedBids || selectedBids.length < 2) {
    throw new Error('At least 2 bids required for variance explanation');
  }

  const key = generateCacheKey({ rows, selectedBids });

  // Check cache first
  const cached = getCachedExplanation(key);
  if (cached) {
    console.log(`📋 Cache hit for variance explanation: ${key}`);
    return cached;
  }

  console.log(`🔍 Generating variance explanation for key: ${key}`);

  try {
    const startTime = Date.now();
    const explanations = await callClaudeForVarianceExplanation(rows, selectedBids, maxChars);
    const duration = Date.now() - startTime;

    const explanation: VarianceExplanation = {
      key,
      short: explanations.short,
      long: explanations.long,
      at: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514'
    };

    // Cache the result
    setCachedExplanation(key, explanation);

    console.log(`✅ Variance explanation generated in ${duration}ms: ${explanations.short.length}/${explanations.long.length} chars`);
    return explanation;

  } catch (error) {
    console.error('Failed to generate variance explanation:', error);

    // Return fallback explanation on error
    const fallbackExplanation: VarianceExplanation = {
      key,
      short: 'Unable to generate explanation at this time.',
      long: 'Unable to generate detailed explanation at this time. Please try again later or check your network connection.',
      at: new Date().toISOString(),
      model: 'fallback'
    };

    return fallbackExplanation;
  }
}

// Helper function for Excel exports to get cached explanations without triggering LLM calls
export async function getCachedVarianceExplanation(
  rows: Record<string, unknown>[],
  selectedBids: string[]
): Promise<VarianceExplanation | null> {
  const key = generateCacheKey({ rows, selectedBids });
  return getCachedExplanation(key);
}

// Utility function for cache statistics (useful for telemetry)
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; at: string; chars: number }>;
} {
  const entries = Array.from(cache.entries()).map(([key, { data }]) => ({
    key,
    at: data.at,
    chars: data.short.length
  }));

  return {
    size: cache.size,
    entries
  };
}