// src/lib/ai/tools/schedule.ts

import type { CsiLine, Risk } from '@/types/analysis';

export interface ScheduleToolResult {
  risks: Risk[];
  insights: string[];
}

/**
 * Schedule and delivery risk detector
 * Browser-first deterministic analysis
 */
export function analyzeScheduleRisks(lines: CsiLine[], metadata: {
  fileName: string;
  totalAmount: number;
  contractorName: string;
}): ScheduleToolResult {
  const risks: Risk[] = [];
  const insights: string[] = [];

  // Check for project timeline
  const hasTimeline = lines.some(line =>
    line.description.toLowerCase().includes('schedule') ||
    line.description.toLowerCase().includes('timeline') ||
    line.description.toLowerCase().includes('duration') ||
    line.description.toLowerCase().includes('completion')
  );

  if (!hasTimeline) {
    risks.push({
      id: `schedule-timeline-${Date.now()}`,
      category: 'Schedule',
      severity: 4,
      title: 'Incomplete Project Timeline',
      description: 'Limited or missing project schedule information',
      evidence: ['No schedule or timeline found in bid'],
      pageRefs: [],
      explanation: 'Schedule conflicts and delivery delays may occur without clear timeline',
      impact: {
        timeline: 30, // 30-day delay risk
        probability: 0.6
      }
    });
    insights.push('Request detailed project schedule with key milestones');
  }

  // Analyze subcontractor coordination complexity
  const uniqueSubcontractors = new Set(
    lines
      .filter(line => line.subcontractor && line.subcontractor !== 'Self-performed')
      .map(line => line.subcontractor)
  );

  if (uniqueSubcontractors.size > 8) {
    risks.push({
      id: `schedule-coordination-${Date.now()}`,
      category: 'Schedule',
      severity: 3,
      title: 'Complex Subcontractor Coordination',
      description: `${uniqueSubcontractors.size} subcontractors require coordination`,
      evidence: [`Subcontractors: ${Array.from(uniqueSubcontractors).slice(0, 5).join(', ')}${uniqueSubcontractors.size > 5 ? '...' : ''}`],
      pageRefs: [],
      explanation: 'Multiple trades may create scheduling conflicts and delay risk',
      impact: {
        timeline: Math.min(60, uniqueSubcontractors.size * 5), // 5 days per additional subcontractor
        probability: 0.4
      }
    });
    insights.push('Develop comprehensive coordination plan for multiple trades');
  }

  // Check for weather-dependent work
  const outdoorWork = lines.filter(line => {
    const desc = line.description.toLowerCase();
    return desc.includes('exterior') ||
           desc.includes('roofing') ||
           desc.includes('siding') ||
           desc.includes('paving') ||
           desc.includes('landscaping') ||
           desc.includes('site work') ||
           ['31', '32', '33'].includes(line.division); // Site divisions
  });

  if (outdoorWork.length > 0) {
    const outdoorCost = outdoorWork.reduce((sum, line) => sum + line.cost, 0);

    if (outdoorCost > metadata.totalAmount * 0.15) { // >15% outdoor work
      risks.push({
        id: `schedule-weather-${Date.now()}`,
        category: 'Schedule',
        severity: 2,
        title: 'Weather-Dependent Work Not Addressed',
        description: 'Outdoor work identified but no weather considerations mentioned',
        evidence: [`Outdoor work: $${outdoorCost.toLocaleString()}`],
        pageRefs: [],
        explanation: 'Seasonal delays could extend project timeline significantly',
        impact: {
          timeline: 45, // 1.5 month weather delay risk
          probability: 0.3
        }
      });
      insights.push('Consider weather protection measures and seasonal scheduling');
    }
  }

  // Check for long-lead-time items
  const longLeadItems = lines.filter(line => {
    const desc = line.description.toLowerCase();
    return desc.includes('elevator') ||
           desc.includes('equipment') ||
           desc.includes('custom') ||
           desc.includes('specialty') ||
           line.cost > metadata.totalAmount * 0.05; // >5% of total cost
  });

  if (longLeadItems.length > 3) {
    risks.push({
      id: `schedule-leadtime-${Date.now()}`,
      category: 'Schedule',
      severity: 2,
      title: 'Multiple Long-Lead-Time Items',
      description: `${longLeadItems.length} items may require extended procurement`,
      evidence: longLeadItems.slice(0, 3).map(item => item.description),
      pageRefs: [],
      explanation: 'Procurement delays could impact critical path',
      impact: {
        timeline: longLeadItems.length * 14, // 2 weeks per item
        probability: 0.25
      }
    });
    insights.push('Identify procurement schedule for long-lead-time items');
  }

  return { risks, insights };
}