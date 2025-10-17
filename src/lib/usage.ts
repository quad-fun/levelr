// src/lib/usage.ts

import { kv } from '@vercel/kv';
import type { UserTier } from './flags';

// Usage limit configuration per tier
const USAGE_LIMITS = {
  starter: 3,
  pro: -1,     // unlimited
  team: -1,    // unlimited
  enterprise: -1 // unlimited
} as const;

/**
 * Generate a month key in YYYY-MM format
 */
export function getMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Generate the KV key for a user's usage count
 */
function getUserUsageKey(userId: string, monthKey: string): string {
  return `usage:${userId}:${monthKey}`;
}

/**
 * Record an analysis for a user in the current month
 */
export async function recordAnalysis(userId: string): Promise<void> {
  try {
    const monthKey = getMonthKey();
    const key = getUserUsageKey(userId, monthKey);

    // Increment the counter, with expiry after 2 months (to clean up old data)
    await kv.incr(key);
    await kv.expire(key, 60 * 60 * 24 * 62); // 62 days in seconds

    console.log(`📊 Recorded analysis for user ${userId} in ${monthKey}`);
  } catch (error) {
    console.error('Failed to record analysis usage:', error);
    // Don't throw - usage tracking is not critical to core functionality
  }
}

/**
 * Get the current usage count for a user in a specific month
 */
export async function getUsageCount(userId: string, monthKey: string): Promise<number> {
  try {
    const key = getUserUsageKey(userId, monthKey);
    const count = await kv.get<number>(key);
    return count || 0;
  } catch (error) {
    console.error('Failed to get usage count:', error);
    return 0; // Fail open - don't block users on KV errors
  }
}

/**
 * Check if a user can perform another analysis based on their tier and current usage
 */
export async function canAnalyze(userId: string, tier: UserTier): Promise<boolean> {
  try {
    const limit = USAGE_LIMITS[tier];

    // Unlimited tiers can always analyze
    if (limit === -1) {
      return true;
    }

    // Check current usage for limited tiers
    const monthKey = getMonthKey();
    const currentUsage = await getUsageCount(userId, monthKey);

    const canUse = currentUsage < limit;

    if (!canUse) {
      console.log(`🚫 Usage limit exceeded for user ${userId} (${tier}): ${currentUsage}/${limit} in ${monthKey}`);
    }

    return canUse;
  } catch (error) {
    console.error('Failed to check usage limits:', error);
    return true; // Fail open - don't block users on errors
  }
}

/**
 * Get detailed usage information for a user
 */
export async function getUserUsageInfo(userId: string, tier: UserTier) {
  const monthKey = getMonthKey();
  const currentUsage = await getUsageCount(userId, monthKey);
  const limit = USAGE_LIMITS[tier];
  const canUse = await canAnalyze(userId, tier);

  return {
    tier,
    monthKey,
    currentUsage,
    limit: limit === -1 ? 'unlimited' : limit,
    remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - currentUsage),
    canAnalyze: canUse,
    isUnlimited: limit === -1
  };
}

/**
 * Development helper: Reset usage for a user (only in development)
 */
export async function resetUserUsage(userId: string): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('resetUserUsage can only be called in development');
  }

  try {
    const monthKey = getMonthKey();
    const key = getUserUsageKey(userId, monthKey);
    await kv.del(key);
    console.log(`🔄 Reset usage for user ${userId} in ${monthKey}`);
  } catch (error) {
    console.error('Failed to reset user usage:', error);
  }
}