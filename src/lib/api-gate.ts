import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "./pricing";
import { getFlags, type Flags } from "./flags";
import { NextRequest, NextResponse } from "next/server";

interface ApiGateOptions {
  requiredFlag: keyof Flags;
  requireAuth?: boolean;
  enforceUsageLimits?: boolean;
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

    // Get user tier if authenticated
    let tier;
    if (userId) {
      tier = await getUserTier(userId);
    }

    // Resolve flags
    const flags = await getFlags({ userId, tier, request });

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

    // Enforce usage limits for starter tier
    if (enforceUsageLimits && flags.usageLimits && tier === "starter") {
      // TODO: Implement actual usage tracking
      // For now, we'll allow all requests but this is where you'd check usage
      // const usageCount = await getUserUsageCount(userId);
      // if (usageCount >= USAGE_LIMIT) {
      //   return NextResponse.json(
      //     { reason: "limit_exceeded", message: "Usage limit exceeded" },
      //     { status: 403 }
      //   );
      // }
    }

    // Return success with flags and user info
    return {
      success: true,
      userId,
      tier,
      flags
    };

  } catch (error) {
    console.error('API gate error:', error);
    return NextResponse.json(
      { reason: "internal_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to check specific subfeatures
export function checkSubfeature(flags: Flags, feature: keyof Flags): boolean {
  return flags[feature] === true;
}