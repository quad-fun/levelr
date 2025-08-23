// Client-side Claude API interface - NO ANTHROPIC SDK HERE
import { AnalysisResult } from '@/types/analysis';
import { ProcessedDocument } from './document-processor';

export async function analyzeDocument(processedDoc: ProcessedDocument): Promise<AnalysisResult> {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ processedDoc })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze document');
  }

  const { analysis } = await response.json();
  return analysis;
}