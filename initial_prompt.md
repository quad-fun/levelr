# Build Prompt: Browser-Only Real Estate Analysis Platform

You are building a **secure, browser-only real estate document analysis platform** that processes documents locally with no server storage. This uses Claude AI for analysis while keeping all data in the user's browser for maximum security.

## Architecture Overview

**Frontend**: Next.js 14 (Vercel deployment)
**Backend**: Vercel Edge Functions (serverless, no persistent storage)
**Database**: None - browser localStorage only
**Authentication**: Clerk for user management and usage tracking
**Payments**: Stripe for subscription billing
**AI**: Claude API for document analysis
**Analysis**: Proprietary CSI division logic embedded in frontend

# Build Prompt: Real Estate Analysis MVP with Enterprise Growth Rails

You are building a **secure, browser-only real estate document analysis MVP** that validates demand while building rails for enterprise growth. Start simple, prove value, scale up.

## MVP Strategy: Start Simple, Build Rails for Growth

**Phase 1 (MVP - Month 1)**: Validate demand with minimal viable features
**Growth Rails**: Architecture decisions that enable easy scaling to enterprise

**Business Model**: Start high-value ($299/month), validate willingness to pay, then expand

## Core Value Proposition

**Primary Message**: "Prevent million-dollar bid mistakes with AI-powered risk analysis"
**Security Promise**: "Your financial documents never leave your device"
**Target Customer**: Real estate developers managing $5M+ projects

## MVP Pricing (Test Market Acceptance)

```typescript
// MVP: Single tier to validate price point
export const MVP_PRICING = {
  professional: {
    name: 'Professional',
    price: 299,
    billingPeriod: 'month',
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

// Growth Rails: Easy to expand tiers later
interface FutureTier {
  name: string;
  price: number;
  features: string[];
  enabled: boolean; // Feature flag for future release
}
```

## Core Business Logic (CRITICAL - Include ALL of this)

The platform specializes in **CSI (Construction Specifications Institute) division analysis** with proprietary market benchmarking:

### 1. CSI Division Intelligence (Client-Side)
```typescript
// Include this EXACT CSI division mapping in frontend
export const CSI_DIVISIONS = {
  "01": { 
    name: "General Requirements", 
    typicalPercentage: [8, 15], 
    keywords: ["general requirements", "overhead", "supervision", "permits", "insurance", "bonds", "temporary facilities"],
    description: "Project management, overhead, permits, and general conditions"
  },
  "02": { 
    name: "Existing Conditions", 
    typicalPercentage: [2, 10], 
    keywords: ["demolition", "demo", "abatement", "site clearing", "hazmat", "asbestos", "selective demolition"],
    description: "Demolition, hazmat abatement, and site preparation"
  },
  "03": { 
    name: "Concrete", 
    typicalPercentage: [15, 35], 
    keywords: ["concrete", "foundation", "footings", "slab", "cast-in-place", "rebar", "formwork", "cement"],
    description: "All concrete work including foundations and structural elements"
  },
  "04": { 
    name: "Masonry", 
    typicalPercentage: [5, 15], 
    keywords: ["masonry", "brick", "block", "stone", "mortar", "cmu", "concrete masonry"],
    description: "Brick, block, and stone masonry work"
  },
  "05": { 
    name: "Metals", 
    typicalPercentage: [8, 20], 
    keywords: ["structural steel", "metals", "steel frame", "joists", "deck", "miscellaneous metals", "railings"],
    description: "Structural steel and miscellaneous metal work"
  },
  "06": { 
    name: "Wood & Plastics", 
    typicalPercentage: [5, 15], 
    keywords: ["carpentry", "framing", "lumber", "millwork", "cabinets", "trim", "finish carpentry"],
    description: "Rough and finish carpentry, millwork"
  },
  "07": { 
    name: "Thermal & Moisture", 
    typicalPercentage: [3, 8], 
    keywords: ["roofing", "waterproofing", "insulation", "sealants", "membrane", "roof system"],
    description: "Roofing, waterproofing, and insulation systems"
  },
  "08": { 
    name: "Openings", 
    typicalPercentage: [3, 10], 
    keywords: ["doors", "windows", "frames", "hardware", "glazing", "curtain wall", "storefront"],
    description: "Doors, windows, and glazing systems"
  },
  "09": { 
    name: "Finishes", 
    typicalPercentage: [12, 25], 
    keywords: ["finishes", "flooring", "carpet", "tile", "paint", "drywall", "ceiling", "wall coverings"],
    description: "Interior finishes including flooring, paint, and ceilings"
  },
  "15": { 
    name: "Mechanical", 
    typicalPercentage: [8, 15], 
    keywords: ["hvac", "heating", "ventilation", "plumbing", "mechanical", "boiler", "chiller", "pumps"],
    description: "HVAC and plumbing systems"
  },
  "16": { 
    name: "Electrical", 
    typicalPercentage: [6, 12], 
    keywords: ["electrical", "power", "lighting", "panels", "wiring", "conduit", "fixtures"],
    description: "Electrical power and lighting systems"
  }
} as const;
```

### 2. Market Analysis Functions (Client-Side)
```typescript
// Include this EXACT market analysis logic
export function analyzeMarketVariance(divisionCost: number, totalCost: number, divisionCode: string) {
  const percentage = (divisionCost / totalCost) * 100;
  const [minPct, maxPct] = CSI_DIVISIONS[divisionCode].typicalPercentage;
  
  if (percentage > maxPct) {
    const variance = percentage - maxPct;
    return {
      status: "ABOVE_MARKET",
      message: `${percentage.toFixed(1)}% vs typical ${minPct}-${maxPct}% (+${variance.toFixed(1)}% variance)`,
      severity: "high",
      recommendation: `Review specifications - ${divisionCode} costs significantly above market`
    };
  } else if (percentage < minPct) {
    const variance = minPct - percentage;
    return {
      status: "BELOW_MARKET", 
      message: `${percentage.toFixed(1)}% vs typical ${minPct}-${maxPct}% (-${variance.toFixed(1)}% variance)`,
      severity: "medium",
      recommendation: `Verify scope completeness - ${divisionCode} may be missing work items`
    };
  } else {
    return {
      status: "MARKET_RATE",
      message: `${percentage.toFixed(1)}% within typical ${minPct}-${maxPct}% range`,
      severity: "low",
      recommendation: `${divisionCode} pricing appears competitive`
    };
  }
}

export function calculateProjectRisk(categories: Record<string, number>, totalCost: number) {
  let riskScore = 0;
  const risks: string[] = [];
  
  // Missing critical divisions
  const criticalDivisions = ["01", "03", "15", "16"];
  const presentDivisions = Object.keys(categories);
  const missingCritical = criticalDivisions.filter(d => !presentDivisions.includes(d));
  
  riskScore += missingCritical.length * 25;
  if (missingCritical.length > 0) {
    risks.push(`Missing critical divisions: ${missingCritical.join(", ")}`);
  }
  
  // Cost concentration risk
  Object.entries(categories).forEach(([divCode, cost]) => {
    const percentage = (cost / totalCost) * 100;
    if (percentage > 40) {
      riskScore += (percentage - 40) * 2;
      risks.push(`High cost concentration in Division ${divCode}: ${percentage.toFixed(1)}%`);
    }
  });
  
  // Scope completeness
  if (presentDivisions.length < 5) {
    riskScore += (5 - presentDivisions.length) * 15;
    risks.push(`Limited scope coverage: only ${presentDivisions.length} divisions identified`);
  }
  
  return {
    score: Math.min(riskScore, 100),
    level: riskScore > 70 ? "HIGH" : riskScore > 40 ? "MEDIUM" : "LOW",
    factors: risks
  };
}
```

### 3. Unit Type Sanitization (Client-Side)
```typescript
// Include this EXACT unit validation
export const CONSTRUCTION_UNITS = {
  SF: "Square Foot",
  LF: "Linear Foot", 
  CY: "Cubic Yard",
  EA: "Each",
  LS: "Lump Sum",
  SY: "Square Yard",
  TON: "Ton",
  HR: "Hour",
  DAY: "Day"
} as const;

export function sanitizeUnitType(rawUnit: string | null): keyof typeof CONSTRUCTION_UNITS {
  if (!rawUnit) return "LS";
  
  const unit = rawUnit.trim().toUpperCase();
  
  // Direct match
  if (unit in CONSTRUCTION_UNITS) return unit as keyof typeof CONSTRUCTION_UNITS;
  
  // Common variations
  const mappings: Record<string, keyof typeof CONSTRUCTION_UNITS> = {
    "SQFT": "SF", "SQ.FT": "SF", "SQUARE FOOT": "SF", "SQUARE FEET": "SF",
    "LINFT": "LF", "LIN.FT": "LF", "LINEAR FOOT": "LF", "LINEAR FEET": "LF", 
    "CUBIC YARD": "CY", "CU YD": "CY", "YARD": "CY", "YARDS": "CY",
    "EACH": "EA", "PIECE": "EA", "UNIT": "EA", "COUNT": "EA",
    "LUMP": "LS", "LUMPSUM": "LS", "LUMP_SUM": "LS", "PACKAGE": "LS",
    "HOUR": "HR", "HOURS": "HR", "HRS": "HR"
  };
  
  return mappings[unit] || "LS";
}
```

## MVP File Structure (Simplified)

```
real-estate-analysis-mvp/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page with ROI value prop
│   │   ├── analyze/
│   │   │   └── page.tsx               # Main analysis workspace (MVP core)
│   │   ├── pricing/
│   │   │   └── page.tsx               # Simple pricing page
│   │   └── api/
│   │       ├── claude/
│   │       │   └── route.ts           # Claude API proxy
│   │       └── stripe/
│   │           └── route.ts           # Basic checkout (future)
│   ├── components/
│   │   ├── analysis/                  # MVP Core Components
│   │   │   ├── DocumentUpload.tsx     # File upload
│   │   │   ├── AnalysisResults.tsx    # Results display
│   │   │   ├── MarketAnalysis.tsx     # Variance analysis
│   │   │   ├── RiskAssessment.tsx     # Risk scoring
│   │   │   └── ExportTools.tsx        # PDF export
│   │   ├── auth/                      # Growth Rails
│   │   │   ├── SignInButton.tsx       # Auth ready but optional
│   │   │   └── UsageTracker.tsx       # Usage limits (disabled for MVP)
│   │   ├── ui/                        # Basic UI components
│   │   └── layout/
│   │       └── Header.tsx             # Simple header
│   ├── lib/
│   │   ├── analysis/                  # MVP Core Logic
│   │   │   ├── csi-analyzer.ts        # Your proprietary CSI logic
│   │   │   ├── market-analyzer.ts     # Market benchmarking
│   │   │   └── risk-analyzer.ts       # Risk assessment
│   │   ├── claude.ts                  # Claude integration
│   │   ├── storage.ts                 # Browser-only storage
│   │   └── auth.ts                    # Auth rails (feature flagged)
│   └── types/
│       └── analysis.ts                # Core types
├── package.json
└── next.config.js
```

**MVP Focus**: Single analysis workflow with professional results
**Growth Rails**: Auth, usage tracking, and payment systems ready but feature-flagged
│   ├── lib/
│   │   ├── analysis/
│   │   │   ├── csi-analyzer.ts        # CSI division logic
│   │   │   ├── market-analyzer.ts     # Market benchmarking  
│   │   │   ├── risk-analyzer.ts       # Risk assessment
│   │   │   └── export-generator.ts    # PDF/Excel export
│   │   ├── claude.ts                  # Claude API client
│   │   ├── storage.ts                 # localStorage utilities
│   │   ├── stripe.ts                  # Stripe integration
│   │   ├── auth.ts                    # Clerk helpers
│   │   └── utils.ts                   # General utilities
│   ├── types/
│   │   ├── analysis.ts                # Analysis result types
│   │   ├── csi.ts                     # CSI division types
│   │   └── auth.ts                    # User/subscription types
│   └── styles/
├── middleware.ts                      # Clerk auth middleware
├── package.json
├── tailwind.config.js
└── next.config.js
```

## Authentication & Billing Requirements

### Clerk Integration
```typescript
// Include complete Clerk setup
import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// User metadata for usage tracking
interface UserMetadata {
  subscription: 'free' | 'pro' | 'enterprise';
  analysesThisMonth: number;
  resetDate: string;
  stripeCustomerId?: string;
}

// MVP: Simple usage tracking (no auth required)
export function trackAnalysis() {
  const usage = getLocalUsage();
  usage.totalAnalyses += 1;
  usage.lastAnalysis = new Date().toISOString();
  localStorage.setItem('analysis_usage', JSON.stringify(usage));
}

export function canAnalyze(): boolean {
  // MVP: No limits, just track usage
  return true;
}

// Growth Rails: Ready for user-based tracking
export function trackAnalysisWithUser(userId: string) {
  const usage = getUserUsage(userId);
  const limits = MVP_PRICING.professional;
  
  usage.analysesThisMonth += 1;
  usage.lastAnalysis = new Date().toISOString();
  
  // Feature flag: Enable limits when auth is ready
  const ENABLE_LIMITS = process.env.NEXT_PUBLIC_ENABLE_USAGE_LIMITS === 'true';
  
  if (ENABLE_LIMITS) {
    localStorage.setItem(`usage_${userId}`, JSON.stringify(usage));
  }
}

export function getUsageStatus(): { canAnalyze: boolean; message?: string } {
  // MVP: Always allow
  return { canAnalyze: true };
  
  // Growth Rails: Ready for limits
  // const usage = getLocalUsage();
  // if (usage.analysesThisMonth >= 10) {
  //   return { 
  //     canAnalyze: false, 
  //     message: "Monthly limit reached. Upgrade for unlimited access." 
  //   };
  // }
  // return { canAnalyze: true };
}
```

### Stripe Integration (Future-Ready)
```typescript
// Include Stripe setup for subscriptions
import Stripe from 'stripe';

export const PRICING_PLANS = {
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

// MVP: Simple checkout (future-ready)
export async function createCheckoutSession(email: string) {
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
  return response.json();
}

// Growth Rails: ROI calculator for enterprise sales (ready but simple)
export function calculateSimpleROI(projectValue: number): {
  monthlyFee: number;
  potentialSavings: number;
  paybackDays: number;
  roi: string;
} {
  const monthlyFee = 299;
  const potentialSavings = projectValue * 0.05; // Conservative 5% cost savings
  const paybackDays = Math.round((monthlyFee / potentialSavings) * 30);
  const annualROI = ((potentialSavings * 12 - monthlyFee * 12) / (monthlyFee * 12)) * 100;
  
  return {
    monthlyFee,
    potentialSavings,
    paybackDays,
    roi: annualROI > 1000 ? "1000%+" : `${Math.round(annualROI)}%`
  };
}
```

## Claude Integration (Serverless)

### API Route for Claude Calls
```typescript
// app/api/claude/route.ts - Vercel Edge Function
export async function POST(request: Request) {
  const { fileData, userId } = await request.json();
  
  // Check user limits
  const user = await clerkClient.users.getUser(userId);
  if (!canAnalyze(userId, user.publicMetadata.subscription)) {
    return Response.json({ error: 'Analysis limit reached' }, { status: 429 });
  }
  
  // Call Claude API
  const analysis = await analyzeWithClaude(fileData);
  
  // Track usage (no server storage)
  return Response.json({ 
    analysis,
    usage: { analysesThisMonth: getUsageCount(userId) + 1 }
  });
}

async function analyzeWithClaude(fileData: string) {
  const prompt = `
  You are analyzing a construction bid document. Extract ALL cost information and map to CSI divisions.

  CRITICAL: Find total bid amount and costs for these CSI divisions:
  01 - General Requirements, 02 - Existing Conditions, 03 - Concrete, 04 - Masonry, 
  05 - Metals, 06 - Wood & Plastics, 07 - Thermal & Moisture, 08 - Openings, 
  09 - Finishes, 15 - Mechanical, 16 - Electrical

  Return ONLY valid JSON:
  {
    "contractor_name": "Company Name from document",
    "total_amount": 1234567.89,
    "project_name": "Project name if found",
    "bid_date": "2024-03-15",
    "csi_divisions": {
      "01": {"cost": 125000, "items": ["permits", "supervision"], "unit_cost": 25.50, "quantity": 5000, "unit": "SF"},
      "03": {"cost": 450000, "items": ["foundations", "slabs"], "unit_cost": 18.75, "quantity": 24000, "unit": "SF"}
    },
    "timeline": "12 months",
    "exclusions": ["permits", "utilities"],
    "assumptions": ["normal soil conditions"],
    "document_quality": "professional_typed | scanned | handwritten"
  }

  CRITICAL REQUIREMENTS:
  - Extract actual numbers - convert "$1,234,567.89" to 1234567.89  
  - Find EVERY cost associated with CSI divisions
  - Calculate realistic unit costs where possible
  - Use construction units: SF, LF, CY, EA, LS, SY, TON, HR, DAY
  - If division not found, omit it completely (don't use 0)
  `;
  
  // Claude API call implementation
}
```

## Key Features Implementation

### Document Analysis Workflow
1. **Upload**: Drag-drop PDF/Excel/Word files (browser-only, no server upload)
2. **Process**: Convert to base64, send to Claude via Vercel function
3. **Analyze**: Apply CSI logic and market analysis on client-side
4. **Display**: Rich visualization with variance analysis and risk scoring
5. **Export**: Generate PDF/Excel reports, force immediate download
6. **Clean**: Clear all data from browser after export

### Security Features
```typescript
// Data encryption before localStorage (optional)
import CryptoJS from 'crypto-js';

export function secureStore(key: string, data: any, userSecret: string) {
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), userSecret).toString();
  localStorage.setItem(key, encrypted);
}

export function secureRetrieve(key: string, userSecret: string) {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  
  const decrypted = CryptoJS.AES.decrypt(encrypted, userSecret).toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
}
```

### Export Functionality
```typescript
// PDF export with company branding
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export function exportAnalysisToPDF(analysis: AnalysisResult) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Construction Bid Analysis', 20, 20);
  doc.setFontSize(12);
  doc.text(`Contractor: ${analysis.contractor_name}`, 20, 35);
  doc.text(`Total Amount: $${analysis.total_amount.toLocaleString()}`, 20, 45);
  
  // CSI Breakdown
  let yPos = 60;
  doc.text('CSI Division Breakdown:', 20, yPos);
  
  Object.entries(analysis.csi_divisions).forEach(([code, data]) => {
    yPos += 10;
    const variance = analyzeMarketVariance(data.cost, analysis.total_amount, code);
    doc.text(`Division ${code}: $${data.cost.toLocaleString()} - ${variance.status}`, 25, yPos);
  });
  
  // Risk Assessment
  yPos += 20;
  const risk = calculateProjectRisk(analysis.csi_divisions, analysis.total_amount);
  doc.text(`Risk Level: ${risk.level} (${risk.score}/100)`, 20, yPos);
  
  // Force download
  doc.save(`analysis_${analysis.contractor_name}_${Date.now()}.pdf`);
}
```

## Deployment Configuration

### Vercel Configuration
```json
{
  "functions": {
    "app/api/claude/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "",
    "CLERK_SECRET_KEY": "",
    "CLAUDE_API_KEY": "",
    "STRIPE_PUBLISHABLE_KEY": "",
    "STRIPE_SECRET_KEY": ""
  }
}
```

### Environment Variables
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Claude API
CLAUDE_API_KEY=your_claude_api_key

# Stripe (for future billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Future Growth Rails (Pre-Built But Disabled)

### Phase 2: Activation Triggers (Month 2-3)
**When to activate each growth rail:**

```typescript
// Auth System - Activate when:
// - 5+ users requesting team sharing
// - Need usage attribution across devices
// - Ready to enforce payment gates

// Usage Limits - Activate when:  
// - Claude API costs exceed $500/month
// - Need to drive subscription conversions
// - User base exceeds 50 active users

// Payment System - Activate when:
// - 3+ users pre-commit to $299/month
// - MVP proves product-market fit
// - Ready for revenue generation

// Cloud Storage - Activate when:
// - Users requesting cross-device access
// - Team collaboration becomes essential
// - Competitive pressure requires it
```

### Phase 3: Enterprise Features (Month 4-6)
**Growth rails include foundation for:**
- Multi-user permissions and team management
- Custom branding and white-label reporting  
- API access for enterprise integrations
- Advanced analytics and contractor tracking
- Professional services and consultant access

### Phase 4: Platform Features (Month 6-12)
**Architecture supports evolution to:**
- Contractor marketplace and verification
- Industry benchmarking and market intelligence
- Predictive modeling and investment scoring
- Mobile app and on-site analysis tools
- Integration ecosystem and partner network

## Revenue Scaling Path

**MVP Validation**: $0-5K MRR (prove willingness to pay)
**Phase 2 Growth**: $5K-25K MRR (subscription model working)  
**Phase 3 Enterprise**: $25K-100K MRR (enterprise features driving growth)
**Phase 4 Platform**: $100K+ MRR (network effects and market leadership)

The completed platform should:
1. ✅ Authenticate users with Clerk and track usage limits
2. ✅ Process documents locally with no server storage
3. ✅ Analyze CSI divisions using proprietary market benchmarking
4. ✅ Display professional results with variance analysis and risk scoring
5. ✅ Export comprehensive reports as PDF/Excel with immediate download
6. ✅ Handle Stripe integration for subscription upgrades
7. ✅ Maintain security by keeping sensitive data browser-only
8. ✅ Deploy as static site to Vercel with serverless functions

**Security Promise**: "Your financial documents are processed locally and never stored on any server"
**Business Model**: Freemium with clear upgrade path to paid tiers
**Competitive Advantage**: Proprietary CSI analysis and market benchmarking algorithms

**Build this as a secure, browser-only SaaS platform that real estate professionals can trust with their most sensitive financial documents.**