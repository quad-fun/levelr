// src/lib/ai/tools/index.ts

export { analyzeMarketRisks, type MarketToolResult } from './market';
export { analyzeScheduleRisks, type ScheduleToolResult } from './schedule';
export { analyzeContractRisks, type ContractToolResult } from './contract';

// Tool registry for dynamic execution
export const AVAILABLE_TOOLS = {
  market: analyzeMarketRisks,
  schedule: analyzeScheduleRisks,
  contract: analyzeContractRisks
} as const;

export type ToolName = keyof typeof AVAILABLE_TOOLS;