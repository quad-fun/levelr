import { RiskAssessment, AnalysisResult } from '@/types/analysis';
import { CSI_DIVISIONS } from './csi-analyzer';

export function calculateProjectRisk(
  categories: Record<string, number>, 
  totalCost: number, 
  uncategorizedTotal: number = 0,
  analysisResult?: AnalysisResult
): RiskAssessment {
  let riskScore = 0;
  const risks: string[] = [];
  
  // Missing critical divisions (MasterFormat 2018) - Enhanced with subcontractor checking
  const criticalDivisions = ["01", "03", "22", "23", "26"];
  const presentDivisions = Object.keys(categories);
  
  // Check if critical divisions exist either in CSI divisions OR in subcontractors
  const missingCritical = criticalDivisions.filter(divCode => {
    // First check if it's in CSI divisions
    if (presentDivisions.includes(divCode)) return false;
    
    // If analysisResult provided, check subcontractors for this division
    if (analysisResult?.subcontractors) {
      const hasSubcontractorForDivision = analysisResult.subcontractors.some(sub => 
        sub.divisions.includes(divCode) && sub.total_amount > 0
      );
      if (hasSubcontractorForDivision) return false;
    }
    
    return true; // Missing from both CSI divisions and subcontractors
  });
  
  riskScore += missingCritical.length * 25;
  if (missingCritical.length > 0) {
    const divisionNames = missingCritical.map(d => CSI_DIVISIONS[d as keyof typeof CSI_DIVISIONS]?.name || d);
    risks.push(`Missing critical divisions: ${divisionNames.join(", ")}`);
  }
  
  // Check for divisions that exist in subcontractors but not in CSI breakdown
  if (analysisResult?.subcontractors) {
    const subcontractorOnlyDivisions: string[] = [];
    criticalDivisions.forEach(divCode => {
      const inCSI = presentDivisions.includes(divCode);
      const inSubcontractors = analysisResult.subcontractors?.some(sub => 
        sub.divisions.includes(divCode) && sub.total_amount > 0
      );
      
      if (!inCSI && inSubcontractors) {
        const divisionName = CSI_DIVISIONS[divCode as keyof typeof CSI_DIVISIONS]?.name || divCode;
        subcontractorOnlyDivisions.push(divisionName);
      }
    });
    
    if (subcontractorOnlyDivisions.length > 0) {
      riskScore += subcontractorOnlyDivisions.length * 10; // Lower penalty than missing entirely
      risks.push(`Divisions found in subcontractors but missing from CSI breakdown: ${subcontractorOnlyDivisions.join(", ")}`);
    }
  }
  
  // Cost concentration risk
  Object.entries(categories).forEach(([divCode, cost]) => {
    const percentage = (cost / totalCost) * 100;
    if (percentage > 40) {
      riskScore += (percentage - 40) * 2;
      const divisionName = CSI_DIVISIONS[divCode as keyof typeof CSI_DIVISIONS]?.name || divCode;
      risks.push(`High cost concentration in ${divisionName}: ${percentage.toFixed(1)}%`);
    }
  });
  
  // Calculate coverage for more nuanced risk assessment
  const totalIdentifiedCost = Object.values(categories).reduce((sum, cost) => sum + cost, 0);
  const coveragePercentage = (totalIdentifiedCost / totalCost) * 100;
  const uncategorizedPercentage = (uncategorizedTotal / totalCost) * 100;
  
  // Risk assessment for uncategorized costs
  if (uncategorizedPercentage > 25) {
    riskScore += (uncategorizedPercentage - 25) * 1.5;
    risks.push(`High uncategorized costs: ${uncategorizedPercentage.toFixed(1)}% may indicate scope gaps or misclassification`);
  } else if (uncategorizedPercentage > 15) {
    riskScore += (uncategorizedPercentage - 15) * 0.8;
    risks.push(`Moderate uncategorized costs: ${uncategorizedPercentage.toFixed(1)}% should be reviewed for proper classification`);
  }
  
  // Only penalize if coverage is very low AND major divisions are missing
  if (coveragePercentage < 70) {
    riskScore += (70 - coveragePercentage) * 0.5; // Reduced penalty
    risks.push(`Incomplete cost breakdown: ${coveragePercentage.toFixed(1)}% of costs categorized`);
  } else if (coveragePercentage >= 90) {
    // Bonus for good coverage
    riskScore = Math.max(0, riskScore - 10);
  }
  
  // Scope completeness check - more lenient
  if (presentDivisions.length < 3) {
    riskScore += (3 - presentDivisions.length) * 15;
    risks.push(`Very limited scope coverage: only ${presentDivisions.length} divisions identified`);
  } else if (presentDivisions.length < 5) {
    riskScore += (5 - presentDivisions.length) * 5; // Reduced penalty
    risks.push(`Limited scope coverage: ${presentDivisions.length} divisions identified`);
  }
  
  // Check for suspicious zero costs
  const zeroCostDivisions = Object.entries(categories).filter(([_, cost]) => cost === 0);
  if (zeroCostDivisions.length > 0) {
    riskScore += zeroCostDivisions.length * 10;
    const divisionNames = zeroCostDivisions.map(([code]) => 
      CSI_DIVISIONS[code as keyof typeof CSI_DIVISIONS]?.name || code
    );
    risks.push(`Zero-cost divisions detected: ${divisionNames.join(", ")}`);
  }
  
  return {
    score: Math.min(riskScore, 100),
    level: riskScore > 70 ? "HIGH" : riskScore > 40 ? "MEDIUM" : "LOW",
    factors: risks
  };
}

export function assessDivisionRisk(divisionCode: string, cost: number, totalCost: number): {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: string[];
} {
  const factors: string[] = [];
  const percentage = (cost / totalCost) * 100;
  const division = CSI_DIVISIONS[divisionCode as keyof typeof CSI_DIVISIONS];
  
  if (!division) {
    factors.push("Unrecognized CSI division");
    return { level: 'MEDIUM', factors };
  }
  
  const [minPct, maxPct] = division.typicalPercentage;
  
  if (percentage > maxPct * 1.5) {
    factors.push(`Extremely high cost: ${percentage.toFixed(1)}% vs typical ${maxPct}% maximum`);
    return { level: 'HIGH', factors };
  }
  
  if (percentage < minPct * 0.5 && percentage > 0) {
    factors.push(`Suspiciously low cost: ${percentage.toFixed(1)}% vs typical ${minPct}% minimum`);
    return { level: 'MEDIUM', factors };
  }
  
  if (cost === 0) {
    factors.push("Zero cost may indicate missing scope items");
    return { level: 'MEDIUM', factors };
  }
  
  factors.push("Cost appears reasonable for division scope");
  return { level: 'LOW', factors };
}

// Enhanced Professional Estimator-Level Risk Analysis
export function calculateEnhancedProjectRisk(analysis: AnalysisResult): RiskAssessment {
  let riskScore = 0;
  const risks: string[] = [];
  
  // 1. Check for missing soft costs (General Conditions risk)
  if (!analysis.project_overhead?.general_conditions || analysis.project_overhead.general_conditions === 0) {
    riskScore += 30;
    risks.push("🚨 CRITICAL: No General Conditions identified - major cost component missing");
  } else {
    const gcPercentage = (analysis.project_overhead.general_conditions / analysis.total_amount) * 100;
    if (gcPercentage < 5) {
      riskScore += 20;
      risks.push(`⚠️ Low General Conditions (${gcPercentage.toFixed(1)}%) - may indicate incomplete overhead`);
    } else if (gcPercentage > 20) {
      riskScore += 15;
      risks.push(`⚠️ High General Conditions (${gcPercentage.toFixed(1)}%) - verify scope accuracy`);
    }
  }

  // 2. Validate allowance percentages (excessive = scope uncertainty)
  if (analysis.allowances && analysis.allowances.length > 0) {
    const totalAllowancePercentage = ((analysis.allowances_total || 0) / analysis.total_amount) * 100;
    
    if (totalAllowancePercentage > 25) {
      riskScore += 25;
      risks.push(`🚨 CRITICAL: Excessive allowances (${totalAllowancePercentage.toFixed(1)}%) indicate significant scope uncertainty`);
    } else if (totalAllowancePercentage > 15) {
      riskScore += 15;
      risks.push(`⚠️ High allowances (${totalAllowancePercentage.toFixed(1)}%) may indicate scope gaps`);
    }

    // Check for specific high-risk allowance types
    const contingencies = analysis.allowances.filter(a => a.type === 'contingency');
    const totalContingency = contingencies.reduce((sum, c) => sum + c.amount, 0);
    const contingencyPercentage = (totalContingency / analysis.total_amount) * 100;
    
    if (contingencyPercentage > 15) {
      riskScore += 20;
      risks.push(`🚨 Excessive contingency (${contingencyPercentage.toFixed(1)}%) suggests high project uncertainty`);
    }
  } else {
    // No allowances at all might be suspicious
    riskScore += 10;
    risks.push("⚠️ No allowances or contingencies identified - verify if complete");
  }

  // 3. Check for missing site work divisions (31-33)
  const siteWorkDivisions = ["31", "32", "33"];
  const presentDivisions = Object.keys(analysis.csi_divisions);
  const missingSiteWork = siteWorkDivisions.filter(d => !presentDivisions.includes(d));
  
  if (missingSiteWork.length === 3) {
    riskScore += 15;
    risks.push("⚠️ No site work divisions (31-33) identified - verify if site work is excluded");
  } else if (missingSiteWork.length > 0) {
    const divisionNames = missingSiteWork.map(d => CSI_DIVISIONS[d as keyof typeof CSI_DIVISIONS]?.name || d);
    riskScore += 10;
    risks.push(`⚠️ Missing site work: ${divisionNames.join(", ")}`);
  }

  // 4. Flag major trades without subcontractor assignments - Enhanced with subcontractor cross-check
  const majorTrades = ["03", "22", "23", "26"]; // Concrete, Plumbing, HVAC, Electrical
  const tradesWithoutSubs: string[] = [];
  
  majorTrades.forEach(tradeCode => {
    const divisionInCSI = analysis.csi_divisions[tradeCode];
    const subcontractorForDiv = analysis.subcontractors?.find(sub => 
      sub.divisions.includes(tradeCode) && sub.total_amount > 0
    );
    
    // Check if division exists in either CSI breakdown or subcontractors
    if (divisionInCSI || subcontractorForDiv) {
      // If in CSI but no subcontractor assigned and no matching subcontractor found
      if (divisionInCSI && 
          (!divisionInCSI.subcontractor || divisionInCSI.subcontractor === 'TBD' || divisionInCSI.subcontractor === '') && 
          !subcontractorForDiv) {
        const divisionName = CSI_DIVISIONS[tradeCode as keyof typeof CSI_DIVISIONS]?.name || tradeCode;
        tradesWithoutSubs.push(divisionName);
      }
    }
  });

  if (tradesWithoutSubs.length > 0) {
    riskScore += tradesWithoutSubs.length * 10;
    risks.push(`⚠️ Major trades without subcontractor assignments: ${tradesWithoutSubs.join(", ")}`);
  }

  // 5. Check overhead structure completeness
  if (analysis.project_overhead) {
    const overheadItems = [
      analysis.project_overhead.general_conditions,
      analysis.project_overhead.insurance,
      analysis.project_overhead.bonds
    ].filter(item => item && item > 0);

    if (overheadItems.length < 2) {
      riskScore += 15;
      risks.push("⚠️ Incomplete overhead structure - missing insurance, bonds, or other soft costs");
    }
  }

  // 6. Validate markup structure
  if (analysis.markup_percentage !== undefined) {
    if (analysis.markup_percentage > 25) {
      riskScore += 15;
      risks.push(`⚠️ High markup (${analysis.markup_percentage.toFixed(1)}%) - verify reasonableness`);
    } else if (analysis.markup_percentage < 5) {
      riskScore += 10;
      risks.push(`⚠️ Low markup (${analysis.markup_percentage.toFixed(1)}%) - may indicate aggressive pricing or missing costs`);
    }
  }

  // 7. Site work cost validation
  const siteWorkCost = siteWorkDivisions.reduce((sum, code) => {
    return sum + (analysis.csi_divisions[code]?.cost || 0);
  }, 0);
  
  if (siteWorkCost > 0) {
    const siteWorkPercentage = (siteWorkCost / analysis.total_amount) * 100;
    if (siteWorkPercentage > 25) {
      riskScore += 15;
      risks.push(`⚠️ High site work costs (${siteWorkPercentage.toFixed(1)}%) - verify scope accuracy`);
    }
  }

  // 8. Check for subcontractor concentration risk and validate division mapping
  if (analysis.subcontractors && analysis.subcontractors.length > 0) {
    analysis.subcontractors.forEach(sub => {
      const subPercentage = (sub.total_amount / analysis.total_amount) * 100;
      if (subPercentage > 40) {
        riskScore += 20;
        risks.push(`🚨 High subcontractor concentration: ${sub.name} (${subPercentage.toFixed(1)}%)`);
      }
      
      // Check if subcontractor's divisions actually exist in CSI breakdown
      const unmappedDivisions = sub.divisions.filter(divCode => 
        !analysis.csi_divisions[divCode] || analysis.csi_divisions[divCode].cost === 0
      );
      
      if (unmappedDivisions.length > 0) {
        riskScore += unmappedDivisions.length * 5;
        const divisionNames = unmappedDivisions.map(d => CSI_DIVISIONS[d as keyof typeof CSI_DIVISIONS]?.name || d);
        risks.push(`⚠️ Subcontractor ${sub.name} assigned to divisions not in CSI breakdown: ${divisionNames.join(", ")}`);
      }
    });
  }

  // Include original risk analysis with full analysis result for subcontractor checking
  const originalRisk = calculateProjectRisk(
    Object.fromEntries(Object.entries(analysis.csi_divisions).map(([code, data]) => [code, data.cost])),
    analysis.total_amount,
    analysis.uncategorizedTotal || 0,
    analysis // Pass full analysis result for enhanced validation
  );

  // Combine risks and adjust score
  risks.push(...originalRisk.factors);
  riskScore += originalRisk.score * 0.5; // Weight original score at 50%

  return {
    score: Math.min(riskScore, 100),
    level: riskScore > 70 ? "HIGH" : riskScore > 40 ? "MEDIUM" : "LOW",
    factors: risks
  };
}