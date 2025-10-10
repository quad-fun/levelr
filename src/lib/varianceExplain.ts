// src/lib/varianceExplain.ts
import crypto from 'crypto';

export type VarianceExplanation = {
  key: string;          // hash of {division, scopePath/item, selectedBids, datasetVersion}
  short: string;        // 1–2 sentences (≤ 280 chars)
  long?: string;        // optional detailed text for future use
  at: string;           // ISO timestamp
  model?: string;       // provenance
};

// Browser-based cache with TTL (works across server instances)
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const CACHE_KEY_PREFIX = 'levelr_variance_cache_';

function generateCacheKey(opts: {
  rows: Record<string, unknown>[];
  selectedBids: string[];
}): string {
  const payload = {
    rows: opts.rows.map(row => ({
      division: row.division,
      scopePath: row.scopePath || row.item,
      bids: row.bids
      // Exclude varianceAbs and variancePct as they're calculated values that may differ slightly
    })),
    selectedBids: opts.selectedBids.sort(), // normalize order
    v: 'v1' // version for cache invalidation
  };

  const key = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .substring(0, 16); // shorter key for logs

  console.log('🔑 Cache key generated:', key, 'for payload:', JSON.stringify(payload, null, 2));
  return key;
}

function getCachedExplanation(key: string): VarianceExplanation | null {
  // Check if we're in browser environment
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached);

    // Check if expired
    if (Date.now() > parsedCache.expiry) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }

    return parsedCache.data;
  } catch (error) {
    console.warn('Error reading from variance cache:', error);
    return null;
  }
}

function setCachedExplanation(key: string, explanation: VarianceExplanation): void {
  // Check if we're in browser environment
  if (typeof window === 'undefined') return;

  try {
    const cacheEntry = {
      data: explanation,
      expiry: Date.now() + CACHE_TTL_MS
    };

    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheEntry));
    console.log(`💾 Cached variance explanation: ${key}`);
  } catch (error) {
    console.warn('Error writing to variance cache:', error);
  }
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
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return { size: 0, entries: [] };
  }

  const entries: Array<{ key: string; at: string; chars: number }> = [];
  let size = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            // Check if expired
            if (Date.now() <= parsedCache.expiry) {
              const shortKey = key.replace(CACHE_KEY_PREFIX, '');
              entries.push({
                key: shortKey,
                at: parsedCache.data.at,
                chars: parsedCache.data.short.length
              });
              size++;
            } else {
              // Clean up expired entries
              localStorage.removeItem(key);
            }
          } catch {
            // Invalid cache entry, remove it
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error reading cache stats:', error);
  }

  return { size, entries };
}