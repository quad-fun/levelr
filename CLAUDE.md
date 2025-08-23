# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProLeveler is a **secure, browser-only real estate document analysis platform** that processes construction bid documents locally with no server storage. It uses Claude AI for analysis while keeping all data in the user's browser for maximum security.

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

The platform specializes in **CSI (Construction Specifications Institute) division analysis** with proprietary market benchmarking:

### Key Files:
- `src/lib/analysis/csi-analyzer.ts` - CSI division mapping and classification
- `src/lib/analysis/market-analyzer.ts` - Market variance analysis and ROI calculations
- `src/lib/analysis/risk-analyzer.ts` - Project risk assessment logic
- `src/lib/claude.ts` - Claude API integration for document analysis

### Critical CSI Logic:
The system maps construction costs to 11 CSI divisions (01-General, 02-Demo, 03-Concrete, 04-Masonry, 05-Metals, 06-Wood, 07-Thermal, 08-Openings, 09-Finishes, 15-Mechanical, 16-Electrical) with typical percentage ranges for market benchmarking.

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
│   │   └── export-generator.ts     # PDF/Excel generation
│   ├── claude.ts                   # Claude API integration
│   ├── storage.ts                  # Browser localStorage utilities
│   └── pricing.ts                  # MVP pricing and feature flags
└── types/analysis.ts               # Core TypeScript types
```

## Security Architecture

**Browser-Only Processing**: Documents converted to base64, sent to Claude via Edge Function, results processed client-side, no server storage.

**Data Flow**:
1. User uploads document (stays in browser)
2. Convert to base64, send to `/api/claude`
3. Claude analyzes, returns JSON
4. Client-side CSI analysis and market benchmarking
5. Results displayed, exported, then cleared

## Feature Flags & Growth Rails

The MVP is built with growth rails that can be activated via environment variables:

```bash
# MVP Configuration (all disabled initially)
NEXT_PUBLIC_ENABLE_AUTH=false           # Clerk authentication
NEXT_PUBLIC_ENABLE_USAGE_LIMITS=false  # Analysis limits
NEXT_PUBLIC_ENABLE_PAYMENTS=false      # Stripe billing
NEXT_PUBLIC_ENABLE_TEAMS=false         # Team features
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

**Add new CSI division**: Update `CSI_DIVISIONS` in `csi-analyzer.ts`
**Modify risk scoring**: Edit `calculateProjectRisk` in `risk-analyzer.ts`
**Change pricing**: Update `MVP_PRICING` in `pricing.ts`
**Enable feature**: Set environment variable and update components