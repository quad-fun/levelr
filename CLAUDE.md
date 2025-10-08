# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Levelr is a **secure, browser-only real estate document analysis platform** that processes construction bid documents locally with no server storage. It uses Claude AI for analysis while keeping all data in the user's browser for maximum security.

**Primary Message**: "Prevent million-dollar bid mistakes with AI-powered risk analysis"
**Security Promise**: "Documents encrypted during AI analysis, immediately deleted after processing"
**Target Customer**: Real estate developers managing $5M+ projects

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Architecture Overview

**Frontend**: Next.js 14 with TypeScript and Tailwind CSS
**Backend**: Vercel Edge Functions (serverless, no persistent storage)
**Database**: None - browser localStorage only for usage tracking
**Authentication**: Clerk (feature-flagged for growth)
**Payments**: Stripe (feature-flagged for growth)
**AI**: Claude API for document analysis via `/api/claude`
**Analysis**: Proprietary CSI division logic embedded in frontend

## Core Business Logic

The platform provides **multi-discipline analysis** for construction, design, and trade proposals with proprietary analysis frameworks:

### Enhanced Multi-Discipline Analysis System:

**Construction Analysis** - CSI (Construction Specifications Institute) division analysis:
- Maps costs to 50-division MasterFormat 2018 system
- Market variance analysis and ROI calculations
- Project risk assessment with proprietary scoring
- Files: `csi-analyzer.ts`, `market-analyzer.ts`, `risk-analyzer.ts`

**Design Analysis** - AIA (American Institute of Architects) phase analysis:
- Breaks down design fees by standard AIA phases (SD, DD, CD, BN, CA)
- Tracks design deliverables and responsible disciplines
- Analyzes project overhead and administrative costs
- Files: `aia-analyzer.ts`, routes through `/api/claude/design`

**Trade Analysis** - Technical systems and equipment analysis:
- Categorizes by system type (electrical, mechanical, plumbing, specialty)
- Detailed equipment specifications with model numbers and quantities
- Installation, testing, and commissioning requirements
- Files: `trade-analyzer.ts`, routes through `/api/claude/trade`

### Key Analysis Files:
- `src/lib/analysis/multi-discipline-analyzer.ts` - Intelligent routing to discipline-specific analyzers
- `src/lib/analysis/csi-analyzer.ts` - CSI division mapping and classification
- `src/lib/analysis/aia-analyzer.ts` - AIA phase analysis for design services
- `src/lib/analysis/trade-analyzer.ts` - Technical systems analysis for trade services
- `src/lib/analysis/market-analyzer.ts` - Market variance analysis and ROI calculations
- `src/lib/analysis/risk-analyzer.ts` - Project risk assessment logic

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page with value proposition
│   ├── analyze/page.tsx            # Main analysis workspace
│   ├── pricing/page.tsx            # MVP pricing page ($299/month)
│   └── api/
│       ├── claude/route.ts         # Claude API proxy (Edge Function)
│       └── stripe/checkout/route.ts # Stripe integration (growth rails)
├── components/
│   ├── analysis/                   # Core analysis components
│   │   ├── DocumentUpload.tsx      # Drag-drop file upload
│   │   ├── AnalysisResults.tsx     # Results display with variance analysis
│   │   └── ExportTools.tsx         # PDF/Excel export functionality
├── lib/
│   ├── analysis/                   # Core business logic
│   │   ├── csi-analyzer.ts         # CSI division classification
│   │   ├── market-analyzer.ts      # Market benchmarking
│   │   ├── risk-analyzer.ts        # Risk assessment
│   │   ├── aia-analyzer.ts         # AIA phase analysis for design
│   │   ├── trade-analyzer.ts       # Technical systems analysis for trade
│   │   ├── multi-discipline-analyzer.ts # Enhanced multi-discipline routing
│   │   ├── export-generator.ts     # Legacy export functions (bid leveling)
│   │   └── exports/                # Modular export system
│   │       ├── construction-exports.ts  # CSI division exports
│   │       ├── design-exports.ts        # AIA phase exports
│   │       ├── trade-exports.ts         # Technical systems exports
│   │       ├── index.ts                 # Smart export router
│   │       └── shared/                  # Common export utilities
│   │           ├── pdf-helpers.ts       # PDF formatting helpers
│   │           └── excel-helpers.ts     # Excel formatting helpers
│   ├── claude.ts                   # Claude API integration
│   ├── storage.ts                  # Browser localStorage utilities
│   └── pricing.ts                  # MVP pricing and feature flags
└── types/analysis.ts               # Core TypeScript types
```

## Security Architecture

**Browser-Only Processing**: Documents converted to base64, sent to Claude via Edge Function, results processed client-side, no server storage.

**Data Flow**:
1. User uploads document (stays in browser)
2. Convert to base64, send to discipline-specific Claude API endpoint
3. Claude analyzes with discipline-specific prompts, returns JSON
4. Client-side analysis and market benchmarking
5. Results displayed with discipline-appropriate formatting
6. Export system automatically detects discipline and routes to appropriate exporter
7. Results exported, then cleared

## Export System Architecture

**Modular Export System**: Discipline-specific PDF and Excel exports with shared utilities:

### Export Structure:
```
src/lib/analysis/exports/
├── index.ts                    # Smart export router with auto-detection
├── construction-exports.ts     # CSI divisions, market analysis, risk assessment
├── design-exports.ts          # AIA phases, design deliverables, project overhead
├── trade-exports.ts           # Technical systems, equipment specs, testing
└── shared/
    ├── pdf-helpers.ts         # Common PDF formatting (headers, footers, tables)
    └── excel-helpers.ts       # Common Excel utilities (currency, auto-sizing)
```

### Export Features:
- **Auto-Detection**: Intelligently determines discipline from analysis content
- **Consistent Branding**: All exports maintain professional Levelr styling
- **Discipline-Specific Content**: Each export optimized for its industry standards
- **Backward Compatibility**: Existing construction exports preserved exactly
- **Shared Utilities**: Common formatting functions prevent code duplication

### Export Logic:
1. `ExportTools` component calls main export functions
2. Export router detects discipline from analysis structure
3. Routes to appropriate discipline-specific exporter
4. Discipline exporter uses shared helpers for consistent formatting
5. Professional PDF/Excel generated and downloaded locally

## Feature Flags & Growth Rails

The MVP is built with growth rails that can be activated via environment variables:

```bash
# MVP Configuration (all disabled initially)
NEXT_PUBLIC_ENABLE_AUTH=false           # Clerk authentication
NEXT_PUBLIC_ENABLE_USAGE_LIMITS=false  # Analysis limits
NEXT_PUBLIC_ENABLE_PAYMENTS=false      # Stripe billing
NEXT_PUBLIC_ENABLE_TEAMS=false         # Team features
NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS=true  # Inline variance explanations (default enabled)
```

## Environment Setup

Required environment variables:
```bash
CLAUDE_API_KEY=your_claude_api_key_here  # Required for analysis
STRIPE_SECRET_KEY=sk_test_...           # Optional (growth rails)
CLERK_SECRET_KEY=sk_test_...            # Optional (growth rails)
```

## Deployment

**Platform**: Vercel with Edge Functions
**Configuration**: `vercel.json` with function timeouts and security headers
**Build**: Static optimization enabled for performance

Deploy command: `vercel --prod`

## MVP Pricing Strategy

**Single Tier**: $299/month for 10 analyses
**Value Prop**: One prevented mistake saves 10x-100x the monthly cost
**Growth Path**: Validate price point, then expand tiers

## Development Notes
- Include file pathnames at the top of files
- Always test Claude API integration with real construction documents
- CSI division logic is proprietary - handle with care
- Export functionality must work offline (browser-only)
- Security is paramount - never store sensitive financial data
- Feature flags enable gradual rollout of growth features

## Common Tasks

### Analysis System:
**Add new CSI division**: Update `CSI_DIVISIONS` in `csi-analyzer.ts`
**Modify risk scoring**: Edit `calculateProjectRisk` in `risk-analyzer.ts`
**Add new AIA phase**: Update prompts in `/api/claude/design/route.ts`
**Add new technical system**: Update prompts in `/api/claude/trade/route.ts`
**Modify discipline detection**: Edit `detectAnalysisDiscipline` in `exports/index.ts`

### Export System:
**Add new discipline**: Create new exporter in `exports/` and update router
**Modify export formatting**: Edit shared helpers in `exports/shared/`
**Add new export feature**: Update discipline-specific exporter files
**Debug export issues**: Check discipline detection and routing logic

### Configuration:
**Change pricing**: Update `MVP_PRICING` in `pricing.ts`
**Enable feature**: Set environment variable and update components
**Add new API endpoint**: Create route and update middleware matcher

## Development Log

### December 2024 - Inline Variance Explanations Feature

**Branch**: `inline-variance-explanations` (from `enhanced-bid-analysis`)

**Major Achievement**: Implemented comprehensive inline variance explanations across all disciplines with Excel-like user experience.

**Key Features Delivered:**
- **Universal ExplainCell Component**: Multi-discipline support for Construction (CSI), Design (AIA), and Trade (Technical Systems)
- **Smart Tooltip Positioning**: Auto-detects screen edges and positions tooltips optimally
- **Expandable Explanations**: "Keep reading" feature with short (≤280 chars) and long (≤800 chars) versions
- **Intelligent Caching**: 14-day TTL with deterministic cache keys for performance
- **Feature Flag Integration**: `NEXT_PUBLIC_ENABLE_INLINE_EXPLANATIONS` for controlled rollout

**Technical Implementation:**
- **API**: `/api/variance/explain` with structured Claude prompts for SHORT/LONG responses
- **Server Helper**: `src/lib/varianceExplain.ts` with crypto-based cache keys
- **UI Enhancement**: Added "Why?" columns to all bid leveling comparison tables
- **Export Fixes**: Resolved design export percentage formatting (800.0% → 8.0%) and simplified phase names

**Files Modified:**
- `src/components/analysis/BidLeveling.tsx` - ExplainCell component and table integration
- `src/lib/varianceExplain.ts` - Server-side explanation logic with caching
- `src/app/api/variance/explain/route.ts` - API endpoint with validation
- `src/lib/analysis/exports/index.ts` - Design export formatting fixes
- `CLAUDE.md` - Feature flag documentation

**User Experience:**
- Click "Why?" icon → Instant tooltip with variance explanation
- Smart positioning prevents off-screen tooltips
- "Keep reading →" for detailed analysis when available
- Professional styling with loading states and error handling

**Performance:**
- 14-day cache prevents repeated API calls for same data
- Deterministic cache keys based on row data and selected bids
- Graceful degradation when feature disabled or insufficient data

**Status**: ✅ Complete and ready for user testing
**Next Steps**: User feedback collection and potential chat integration via "Open in Chat" feature