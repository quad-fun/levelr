export type UserTier = "starter" | "pro" | "team" | "enterprise";

export type Flags = {
  // platform
  auth: boolean;
  payments: boolean;
  usageLimits: boolean;

  // modules
  bidAnalysis: boolean;
  generateRfp: boolean;
  projectManagement: boolean;
  analysisHistory: boolean;
  bidLeveling: boolean;

  // bid leveling subfeatures
  blVarianceExplanation: boolean;
  blVarianceAnalysis: boolean;

  // exports
  exportBidAnalysis: boolean;
  exportBidLeveling: boolean;
};

// Environment variable defaults
function getEnvDefaults(): Flags {
  return {
    // platform
    auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    payments: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
    usageLimits: process.env.NEXT_PUBLIC_ENABLE_USAGE_LIMITS === 'true',

    // modules - core modules ready for launch default true
    bidAnalysis: process.env.NEXT_PUBLIC_ENABLE_BID_ANALYSIS !== 'false', // default true
    generateRfp: process.env.NEXT_PUBLIC_ENABLE_GENERATE_RFP !== 'false', // default true
    projectManagement: process.env.NEXT_PUBLIC_ENABLE_PROJECT_MANAGEMENT === 'true', // default false
    analysisHistory: process.env.NEXT_PUBLIC_ENABLE_ANALYSIS_HISTORY !== 'false', // default true
    bidLeveling: process.env.NEXT_PUBLIC_ENABLE_BID_LEVELING !== 'false', // default true

    // bid leveling subfeatures
    blVarianceExplanation: process.env.NEXT_PUBLIC_ENABLE_BL_VARIANCE_EXPLANATION !== 'false', // default true
    blVarianceAnalysis: process.env.NEXT_PUBLIC_ENABLE_BL_VARIANCE_ANALYSIS !== 'false', // default true

    // exports
    exportBidAnalysis: process.env.NEXT_PUBLIC_ENABLE_EXPORT_BID_ANALYSIS !== 'false', // default true
    exportBidLeveling: process.env.NEXT_PUBLIC_ENABLE_EXPORT_BID_LEVELING !== 'false', // default true
  };
}

// Tier presets
function getTierPreset(tier: UserTier): Partial<Flags> {
  switch (tier) {
    case "starter":
      return {
        payments: true,
        usageLimits: true,
        bidAnalysis: true,
        bidLeveling: true,
        blVarianceExplanation: false,
        blVarianceAnalysis: true,
        exportBidAnalysis: false,
        exportBidLeveling: false,
        generateRfp: true,
        projectManagement: false,
        analysisHistory: true,
      };

    case "pro":
      return {
        payments: true,
        usageLimits: false,
        bidAnalysis: true,
        bidLeveling: true,
        blVarianceExplanation: true,
        blVarianceAnalysis: true,
        exportBidAnalysis: true,
        exportBidLeveling: true,
        generateRfp: true,
        projectManagement: false,
        analysisHistory: true,
      };

    case "team":
      return {
        ...getTierPreset("pro"),
        projectManagement: true,
      };

    case "enterprise":
      return {
        auth: true,
        payments: true,
        usageLimits: false,
        bidAnalysis: true,
        generateRfp: true,
        projectManagement: true,
        analysisHistory: true,
        bidLeveling: true,
        blVarianceExplanation: true,
        blVarianceAnalysis: true,
        exportBidAnalysis: true,
        exportBidLeveling: true,
      };

    default:
      return {};
  }
}

// Dev overrides from headers or cookies
function getDevOverrides(request?: Request): Partial<Flags> {
  if (typeof window !== 'undefined') {
    // Client-side: read from cookie
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('ff='))
        ?.split('=')[1];

      if (cookieValue) {
        const decoded = atob(cookieValue);
        return JSON.parse(decoded);
      }
    } catch (error) {
      console.warn('Failed to parse dev overrides from cookie:', error);
    }
  } else if (request) {
    // Server-side: read from header
    try {
      const headerValue = request.headers.get('x-ff');
      if (headerValue) {
        const decoded = atob(headerValue);
        return JSON.parse(decoded);
      }
    } catch (error) {
      console.warn('Failed to parse dev overrides from header:', error);
    }
  }

  return {};
}

export async function getFlags({
  userId: _userId,
  tier,
  request
}: {
  userId?: string;
  tier?: UserTier;
  request?: Request;
} = {}): Promise<Flags> {
  // Merge in order: env defaults < tier preset < dev overrides
  const envDefaults = getEnvDefaults();
  const tierPreset = tier ? getTierPreset(tier) : {};
  const devOverrides = getDevOverrides(request);

  const flags: Flags = {
    ...envDefaults,
    ...tierPreset,
    ...devOverrides,
  };

  return flags;
}

// Safe client serialization - strips any sensitive server-only flags
export function toClientFlags(flags: Flags): Flags {
  // For now, all flags are safe to send to client
  // In the future, we might want to strip sensitive ones
  return { ...flags };
}