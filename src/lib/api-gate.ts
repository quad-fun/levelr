import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserTier } from "./pricing";
import { getFlags, type Flags } from "./flags";
import { canAnalyze, recordAnalysis } from "./usage";
import { NextRequest, NextResponse } from "next/server";

interface ApiGateOptions {
  requiredFlag: keyof Flags;
  requireAuth?: boolean;
  enforceUsageLimits?: boolean;
  isAnalysisEndpoint?: boolean; // Mark as analysis endpoint for usage tracking
}

export async function withApiGate(
  request: NextRequest,
  options: ApiGateOptions
) {
  const { requiredFlag, requireAuth = true, enforceUsageLimits = true } = options;

  try {
    // Get user authentication
    const { userId } = await auth();

    // Check if auth is required
    if (requireAuth && !userId) {
      return NextResponse.json(
        { reason: "authentication_required", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user data if authenticated
    let tier;
    let userEmail;
    if (userId) {
      tier = await getUserTier(userId);
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        userEmail = user.emailAddresses?.[0]?.emailAddress;
      } catch (error) {
        console.warn('Failed to get user email in API gate:', error);
      }
    }

    // Resolve flags
    const flags = await getFlags({ userId: userId || undefined, userEmail, tier, request });

    // Check if auth is enabled
    if (flags.auth && !userId) {
      return NextResponse.json(
        { reason: "authentication_required", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if the required feature is enabled
    if (!flags[requiredFlag]) {
      return NextResponse.json(
        {
          reason: "feature_disabled",
          feature: requiredFlag,
          message: `Feature ${requiredFlag} is not available on your current plan`
        },
        { status: 403 }
      );
    }

    // Enforce usage limits when enabled
    if (enforceUsageLimits && flags.usageLimits && userId && tier) {
      const canPerformAnalysis = await canAnalyze(userId, tier);
      if (!canPerformAnalysis) {
        return NextResponse.json(
          {
            reason: "limit_exceeded",
            message: "Free plan includes 3 analyses per month. Upgrade to Pro for unlimited access.",
            tier,
            upgradeUrl: "/pricing"
          },
          { status: 403 }
        );
      }
    }

    // Return success with flags and user info
    return {
      success: true,
      userId,
      tier,
      flags,
      isAnalysisEndpoint: options.isAnalysisEndpoint || false
    };

  } catch (error) {
    console.error('API gate error:', error);
    return NextResponse.json(
      { reason: "internal_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Record usage for analysis endpoints after successful completion
 */
export async function recordAnalysisUsage(userId: string | null | undefined): Promise<void> {
  if (userId) {
    await recordAnalysis(userId);
  }
}

// Helper function to check specific subfeatures
export function checkSubfeature(flags: Flags, feature: keyof Flags): boolean {
  return flags[feature] === true;
}