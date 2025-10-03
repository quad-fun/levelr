// src/lib/analysis/comparative-analyzer.ts

import { AnalysisResult, ComparativeAnalysis } from '@/types/analysis';

export async function compareDetailedBids(bids: AnalysisResult[]): Promise<ComparativeAnalysis> {
  if (bids.length < 2) {
    throw new Error('At least 2 bids are required for comparative analysis');
  }

  // Validate that all bids have detailed summaries
  const bidsWithSummaries = bids.filter(bid => bid.detailed_summary && bid.detailed_summary.length > 1000);
  if (bidsWithSummaries.length < 2) {
    throw new Error('At least 2 bids must have detailed summaries for comparative analysis');
  }

  console.log(`🔍 Starting comparative analysis of ${bidsWithSummaries.length} bids`);

  // Create the comparison prompt for Claude
  const comparisonPrompt = buildComparisonPrompt(bidsWithSummaries);

  // Call Claude API for comparative analysis
  const claudeResponse = await callClaudeForComparison(comparisonPrompt);

  // Build bid comparison matrix from structured data
  const bidComparisonMatrix = buildBidComparisonMatrix(bidsWithSummaries);

  // Combine Claude analysis with structured comparison data
  const comparativeAnalysis: ComparativeAnalysis = {
    ...claudeResponse,
    bid_comparison_matrix: bidComparisonMatrix
  };

  console.log('✅ Comparative analysis completed');
  return comparativeAnalysis;
}

function buildComparisonPrompt(bids: AnalysisResult[]): string {
  const bidSummaries = bids.map((bid, index) => {
    return `
## BID ${index + 1}: ${bid.contractor_name} - $${bid.total_amount.toLocaleString()}

${bid.detailed_summary}

---
`;
  }).join('\n');

  return `
You are analyzing multiple construction bids to identify key differences, scope gaps, and pricing variances. Perform a comprehensive comparative analysis.

${bidSummaries}

ANALYZE THE ABOVE BIDS AND PROVIDE A DETAILED COMPARISON IN THE FOLLOWING JSON FORMAT:

{
  "summary": "Executive summary of the key differences between the bids, including overall pricing spread, major scope variations, and primary risk factors (2-3 paragraphs)",
  "division_comparisons": {
    "01": {
      "variance_explanation": "Explanation of why costs differ for this division",
      "scope_differences": ["Specific differences in scope between bidders"],
      "missing_in_bids": ["Contractor names that are missing this division"],
      "pricing_outliers": ["Contractor names with unusually high/low pricing"]
    },
    "03": {
      "variance_explanation": "Explanation for concrete/structural differences",
      "scope_differences": ["Foundation approach differences", "Structural system variations"],
      "missing_in_bids": ["Any contractors missing structural work"],
      "pricing_outliers": ["Contractors with outlier pricing"]
    }
  },
  "major_differences": [
    "Top 5-10 most significant differences between the bids",
    "Include scope gaps, methodology differences, quality variations",
    "Focus on items that could impact project success or cost"
  ],
  "scope_gaps": [
    {
      "description": "Description of work that appears in some bids but not others",
      "affected_bids": ["Contractor names missing this scope"],
      "estimated_impact": "Financial and schedule impact assessment"
    }
  ],
  "pricing_explanations": [
    "Explanation 1: Why Contractor A is higher - includes premium finishes",
    "Explanation 2: Why Contractor B is lower - excludes site utilities",
    "Explanation 3: Different overhead structures and markup approaches"
  ]
}

CRITICAL ANALYSIS REQUIREMENTS:

1. **Division-by-Division Analysis**: For each CSI division that appears in any bid, explain:
   - Why costs vary between contractors
   - What scope differences exist
   - Which contractors are missing this work entirely
   - Who has outlier pricing (high/low)

2. **Scope Gap Identification**: Find work that appears in some bids but not others:
   - Identify missing scope items that could cause change orders
   - Estimate the impact if missing work needs to be added
   - Note which contractors included comprehensive vs. minimal scope

3. **Pricing Variance Explanations**: Explain WHY bid totals differ:
   - Different quality levels or specifications
   - Included vs. excluded scope items
   - Overhead and markup differences
   - Risk pricing and contingency approaches
   - Subcontractor vs. self-performed work

4. **Risk Assessment**: Identify potential risks in each approach:
   - Low bidders who may have missed scope
   - High bidders who may be over-engineering
   - Exclusions that could become expensive change orders
   - Assumptions that may not hold true

5. **Competitive Intelligence**: Provide insights for bid evaluation:
   - Which bid offers the best value (not just lowest price)
   - What questions to ask each contractor
   - What scope items need clarification
   - Which contractors have the most comprehensive approach

Focus on actionable insights that help with contractor selection and risk mitigation. Be specific about dollar amounts, percentages, and scope items wherever possible.

Return ONLY valid JSON with the exact structure shown above.
`;
}

async function callClaudeForComparison(prompt: string): Promise<Omit<ComparativeAnalysis, 'bid_comparison_matrix'>> {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error for comparison:', response.status, errorText);
    throw new Error(`Comparative analysis failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0];

  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response format from Claude API');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON found in Claude comparison response:', content.text.substring(0, 500));
    throw new Error('No valid JSON found in comparative analysis response');
  }

  try {
    const analysisResult = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!analysisResult.summary || !analysisResult.major_differences) {
      throw new Error('Missing required fields in comparative analysis result');
    }

    return analysisResult;
  } catch (error) {
    console.error('Failed to parse comparative analysis JSON:', error);
    throw new Error('Invalid comparative analysis response format');
  }
}

function buildBidComparisonMatrix(bids: AnalysisResult[]): ComparativeAnalysis['bid_comparison_matrix'] {
  const matrix: ComparativeAnalysis['bid_comparison_matrix'] = {};

  // Get all CSI divisions across all bids
  const allDivisions = new Set<string>();
  bids.forEach(bid => {
    if (bid.csi_divisions) {
      Object.keys(bid.csi_divisions).forEach(div => allDivisions.add(div));
    }
  });

  bids.forEach(bid => {
    const contractorName = bid.contractor_name;
    const bidDivisions = bid.csi_divisions ? Object.keys(bid.csi_divisions) : [];
    const missingDivisions = Array.from(allDivisions).filter(div => !bidDivisions.includes(div));

    // Extract unique scope items from detailed summary
    const uniqueScopeItems = extractUniqueScopeItems(bid.detailed_summary || '', bids.filter(b => b !== bid));

    // Extract risk factors from exclusions and assumptions
    const riskFactors = [
      ...(bid.exclusions || []).map(ex => `Excludes: ${ex}`),
      ...(bid.assumptions || []).map(ass => `Assumes: ${ass}`)
    ];

    matrix[contractorName] = {
      total_amount: bid.total_amount,
      divisions_included: bidDivisions,
      missing_divisions: missingDivisions,
      unique_scope_items: uniqueScopeItems,
      risk_factors: riskFactors
    };
  });

  return matrix;
}

function extractUniqueScopeItems(bidSummary: string, otherBids: AnalysisResult[]): string[] {
  // This is a simplified implementation
  // In a real implementation, you might use more sophisticated NLP
  const uniqueItems: string[] = [];

  // Look for items mentioned in this bid but not in others
  const otherSummaries = otherBids.map(bid => bid.detailed_summary || '').join(' ').toLowerCase();

  // Extract potential scope items from the bid summary
  const scopeKeywords = [
    'includes', 'provides', 'supplies', 'installs', 'performs',
    'features', 'covers', 'encompasses', 'delivers'
  ];

  const lines = bidSummary.toLowerCase().split('\n');
  lines.forEach(line => {
    scopeKeywords.forEach(keyword => {
      if (line.includes(keyword) && line.length < 200) {
        // Check if this line appears in other bids
        if (!otherSummaries.includes(line.trim())) {
          uniqueItems.push(line.trim());
        }
      }
    });
  });

  // Return top 10 unique items to avoid overwhelming output
  return uniqueItems.slice(0, 10);
}

// Helper function to get stored analysis results by IDs
export async function getBidAnalysesForComparison(bidIds: string[]): Promise<AnalysisResult[]> {
  // This would typically fetch from a database
  // For now, we'll assume the analyses are stored in localStorage
  // In a real implementation, this would be a database query

  const analyses: AnalysisResult[] = [];

  bidIds.forEach(bidId => {
    try {
      const stored = localStorage.getItem(`analysis_${bidId}`);
      if (stored) {
        const analysis = JSON.parse(stored) as AnalysisResult;
        analyses.push(analysis);
      }
    } catch (error) {
      console.warn(`Failed to load analysis ${bidId}:`, error);
    }
  });

  return analyses;
}