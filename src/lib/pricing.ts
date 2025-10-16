// MVP Pricing Configuration
export const MVP_PRICING = {
  professional: {
    name: 'Professional',
    price: 299,
    billingPeriod: 'month' as const,
    analysesPerMonth: 10,
    features: [
      'CSI division analysis with market benchmarking',
      'Risk scoring and variance detection',
      'Professional PDF reports',
      'Email support'
    ],
    valueProposition: 'Prevent costly bid mistakes with expert-level analysis'
  },
  
  trial: {
    name: 'Free Analysis',
    price: 0,
    analysesPerMonth: 1,
    features: ['Single analysis to test platform quality'],
    valueProposition: 'See our analysis quality before committing'
  }
} as const;

// Growth Rails: Future pricing tiers (feature flagged)
export const FUTURE_PRICING = {
  free: {
    name: 'Free',
    price: 0,
    analysesPerMonth: 3,
    features: ['Basic CSI analysis', 'Market comparison', 'PDF export']
  },
  pro: {
    name: 'Professional', 
    price: 49,
    analysesPerMonth: -1, // unlimited
    features: ['Unlimited analyses', 'Advanced risk scoring', 'Excel export', 'Team sharing']
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    analysesPerMonth: -1,
    features: ['Everything in Pro', 'Priority support', 'Custom integrations', 'Advanced analytics']
  }
} as const;

// ROI calculation for enterprise sales
export function calculateSimpleROI(projectValue: number): {
  monthlyFee: number;
  potentialSavings: number;
  paybackDays: number;
  roi: string;
} {
  const monthlyFee = MVP_PRICING.professional.price;
  const potentialSavings = projectValue * 0.05; // Conservative 5% cost savings
  const paybackDays = Math.round((monthlyFee / potentialSavings) * 30);
  const annualROI = ((potentialSavings * 12 - monthlyFee * 12) / (monthlyFee * 12)) * 100;
  
  return {
    monthlyFee,
    potentialSavings,
    paybackDays: Math.max(paybackDays, 1),
    roi: annualROI > 1000 ? "1000%+" : `${Math.round(annualROI)}%`
  };
}

// Stripe integration ready (growth rails)
export async function createCheckoutSession(email: string): Promise<{ url: string }> {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email,
      priceId: 'price_professional_299', // Single product for MVP
      successUrl: `/analyze?upgraded=true`,
      cancelUrl: `/pricing?cancelled=true`
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }
  
  return response.json();
}

// Feature flags for gradual rollout
export const FEATURE_FLAGS = {
  ENABLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
  ENABLE_USAGE_LIMITS: process.env.NEXT_PUBLIC_ENABLE_USAGE_LIMITS === 'true',
  ENABLE_PAYMENTS: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
  ENABLE_TEAM_FEATURES: process.env.NEXT_PUBLIC_ENABLE_TEAMS === 'true'
} as const;

// Tier helpers for Clerk integration
import { clerkClient } from "@clerk/nextjs/server";
import type { UserTier } from "./flags";

export async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const tier = user.publicMetadata?.tier as UserTier;
    return tier || "starter";
  } catch (error) {
    console.warn('Failed to get user tier:', error);
    return "starter";
  }
}

export async function setUserTier(userId: string, tier: UserTier): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        tier
      }
    });
  } catch (error) {
    console.error('Failed to set user tier:', error);
    throw error;
  }
}