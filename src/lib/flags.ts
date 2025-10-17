export type UserTier = "starter" | "pro" | "team" | "enterprise";

export type Flags = {
  // platform
  auth: boolean;
  payments: boolean;
  usageLimits: boolean;

  // core analysis modules
  bidAnalysis: boolean;
  designAnalysis: boolean;
  tradeAnalysis: boolean;
  summaryGeneration: boolean;

  // advanced modules
  generateRfp: boolean;
  projectManagement: boolean;
  analysisHistory: boolean;
  bidLeveling: boolean;

  // bid leveling subfeatures
  blVarianceExplanation: boolean;
  blVarianceAnalysis: boolean;
  blComparativeAnalysis: boolean;

  // exports
  exportBidAnalysis: boolean;
  exportBidLeveling: boolean;
  exportRfp: boolean;

  // file management
  blobStorage: boolean;
};

// Environment variable defaults
function getEnvDefaults(): Flags {
  return {
    // platform
    auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    payments: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
    usageLimits: process.env.NEXT_PUBLIC_ENABLE_USAGE_LIMITS === 'true',

    // core analysis modules - all default true for MVP
    bidAnalysis: process.env.NEXT_PUBLIC_ENABLE_BID_ANALYSIS !== 'false', // default true
    designAnalysis: process.env.NEXT_PUBLIC_ENABLE_DESIGN_ANALYSIS !== 'false', // default true
    tradeAnalysis: process.env.NEXT_PUBLIC_ENABLE_TRADE_ANALYSIS !== 'false', // default true
    summaryGeneration: process.env.NEXT_PUBLIC_ENABLE_SUMMARY_GENERATION !== 'false', // default true

    // advanced modules
    generateRfp: process.env.NEXT_PUBLIC_ENABLE_GENERATE_RFP !== 'false', // default true
    projectManagement: process.env.NEXT_PUBLIC_ENABLE_PROJECT_MANAGEMENT === 'true', // default false
    analysisHistory: process.env.NEXT_PUBLIC_ENABLE_ANALYSIS_HISTORY !== 'false', // default true
    bidLeveling: process.env.NEXT_PUBLIC_ENABLE_BID_LEVELING !== 'false', // default true

    // bid leveling subfeatures
    blVarianceExplanation: process.env.NEXT_PUBLIC_ENABLE_BL_VARIANCE_EXPLANATION !== 'false', // default true
    blVarianceAnalysis: process.env.NEXT_PUBLIC_ENABLE_BL_VARIANCE_ANALYSIS !== 'false', // default true
    blComparativeAnalysis: process.env.NEXT_PUBLIC_ENABLE_BL_COMPARATIVE_ANALYSIS !== 'false', // default true

    // exports
    exportBidAnalysis: process.env.NEXT_PUBLIC_ENABLE_EXPORT_BID_ANALYSIS !== 'false', // default true
    exportBidLeveling: process.env.NEXT_PUBLIC_ENABLE_EXPORT_BID_LEVELING !== 'false', // default true
    exportRfp: process.env.NEXT_PUBLIC_ENABLE_EXPORT_RFP !== 'false', // default true

    // file management
    blobStorage: process.env.NEXT_PUBLIC_ENABLE_BLOB_STORAGE !== 'false', // default true
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
        designAnalysis: false,
        tradeAnalysis: false,
        summaryGeneration: true,
        bidLeveling: true,
        blVarianceExplanation: false,
        blVarianceAnalysis: true,
        blComparativeAnalysis: false,
        exportBidAnalysis: false,
        exportBidLeveling: false,
        exportRfp: false,
        generateRfp: true,
        projectManagement: false,
        analysisHistory: true,
        blobStorage: true,
      };

    case "pro":
      return {
        payments: true,
        usageLimits: false,
        bidAnalysis: true,
        designAnalysis: true,
        tradeAnalysis: true,
        summaryGeneration: true,
        bidLeveling: true,
        blVarianceExplanation: true,
        blVarianceAnalysis: true,
        blComparativeAnalysis: true,
        exportBidAnalysis: true,
        exportBidLeveling: true,
        exportRfp: true,
        generateRfp: true,
        projectManagement: false,
        analysisHistory: true,
        blobStorage: true,
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
        designAnalysis: true,
        tradeAnalysis: true,
        summaryGeneration: true,
        generateRfp: true,
        projectManagement: true,
        analysisHistory: true,
        bidLeveling: true,
        blVarianceExplanation: true,
        blVarianceAnalysis: true,
        blComparativeAnalysis: true,
        exportBidAnalysis: true,
        exportBidLeveling: true,
        exportRfp: true,
        blobStorage: true,
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

// Admin user whitelist
const ADMIN_USERS = [
  'johnny@quadfund.io'
];

// Check if user is admin
function isAdminUser(email?: string): boolean {
  if (!email) return false;
  return ADMIN_USERS.includes(email.toLowerCase());
}

// Admin preset - all features enabled
function getAdminPreset(): Flags {
  return {
    auth: true,
    payments: true,
    usageLimits: false,
    bidAnalysis: true,
    designAnalysis: true,
    tradeAnalysis: true,
    summaryGeneration: true,
    generateRfp: true,
    projectManagement: true,
    analysisHistory: true,
    bidLeveling: true,
    blVarianceExplanation: true,
    blVarianceAnalysis: true,
    blComparativeAnalysis: true,
    exportBidAnalysis: true,
    exportBidLeveling: true,
    exportRfp: true,
    blobStorage: true,
  };
}

export async function getFlags({
  userId,
  userEmail,
  tier,
  request
}: {
  userId?: string;
  userEmail?: string;
  tier?: UserTier;
  request?: Request;
} = {}): Promise<Flags> {
  // Check if user is admin first
  if (isAdminUser(userEmail)) {
    const adminFlags = getAdminPreset();
    const devOverrides = getDevOverrides(request);
    return {
      ...adminFlags,
      ...devOverrides, // Dev overrides can still override admin settings
    };
  }

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