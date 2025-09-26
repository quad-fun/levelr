// src/lib/analysis/aia-analyzer.ts

import { AnalysisResult } from '@/types/analysis';
import { ProcessedDocument } from '@/lib/document-processor';

export async function analyzeDesignProposal(processedDoc: ProcessedDocument): Promise<AnalysisResult> {
  // Route through dedicated design API endpoint
  const response = await fetch('/api/claude/design', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ processedDoc })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze design proposal');
  }

  const { analysis } = await response.json();
  return analysis;
}