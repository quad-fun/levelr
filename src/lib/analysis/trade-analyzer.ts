// src/lib/analysis/trade-analyzer.ts

import { AnalysisResult } from '@/types/analysis';
import { ProcessedDocument } from '@/lib/document-processor';

export async function analyzeTradeProposal(processedDoc: ProcessedDocument): Promise<AnalysisResult> {
  // Route through dedicated trade API endpoint
  const response = await fetch('/api/claude/trade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ processedDoc })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze trade proposal');
  }

  const { analysis } = await response.json();
  return analysis;
}