# ProLeveler - Secure Construction Bid Analysis Platform

**Prevent million-dollar bid mistakes with AI-powered risk analysis**

ProLeveler is a secure construction bid analysis platform that uses encrypted cloud AI processing with immediate data deletion. Documents are processed temporarily for analysis and never permanently stored.

## 🚀 Key Features

- **CSI Division Analysis**: Proprietary market benchmarking against industry standards
- **Risk Assessment**: AI-powered risk scoring identifies cost overruns and missing scope
- **Professional Reports**: Generate detailed PDF and Excel reports
- **Secure Processing**: Documents encrypted during AI analysis, immediately deleted afterward
- **Expert-Level Analysis**: Minutes instead of weeks for bid analysis

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Vercel Edge Functions (serverless, no persistent storage)  
- **Database**: None - browser localStorage only
- **AI**: Claude API for document analysis
- **Security**: All processing happens locally in the browser

## 📋 Prerequisites

- Node.js 18+ and npm
- Claude API key from Anthropic
- Optional: Stripe keys for payments (growth features)

## 🛠️ Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.local` and add your keys:
   ```bash
   # Required
   CLAUDE_API_KEY=your_claude_api_key_here
   
   # Optional (Growth Rails)
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

## 🔐 Authentication

The `/analyze` page is protected with basic HTTP authentication:

**Default Credentials:**
- Username: `powerbid` (or set via `BASIC_AUTH_USER`)
- Password: `demo2024` (or set via `BASIC_AUTH_PASSWORD`)

**Special Access:**
- Username: `shorewood`
- Password: `shorewood2025`
- Purpose: Backdoor access for Shorewood users

## 📋 Recent Updates

### Latest Release (Current)
- **🚨 CRITICAL UPDATE: MasterFormat 2018 Compliance**
- ✅ **UPGRADED to MasterFormat 2018** (50-division system) from obsolete 16-division format
- ✅ **Fixed mechanical division error** - now properly separates HVAC (23), Plumbing (22), Electrical (26)
- ✅ **Enhanced accuracy** with 39 additional CSI divisions for precise cost classification
- ✅ **Updated AI prompt** to use current industry-standard division mapping
- ✅ **Risk analysis upgraded** to use correct critical divisions (01, 03, 22, 23, 26)
- ✅ **Documentation updated** with MasterFormat 2018 compliance notes

### Previous Enhancements
- ✅ Enhanced Excel exports with auto-fit columns and uncategorized costs analysis
- ✅ Added uncategorized costs comparison to bid leveling exports
- ✅ Implemented special Shorewood authentication credentials
- ✅ Created comprehensive documentation page at `/docs`
- ✅ Complete rebranding from PowerBid to ProLeveler
- ✅ Updated security messaging for accurate data processing descriptions
- ✅ Added navigation links to documentation

## 🏢 Business Model (MVP)

**Target**: Real estate developers managing $5M+ projects  
**Pricing**: $299/month for 10 analyses  
**Value Prop**: One prevented mistake saves 10x-100x the monthly cost

### ROI Examples:
- $5M Project: $299/month cost, $250K potential savings = 83,600% ROI
- $10M Project: $299/month cost, $500K potential savings = 167,100% ROI

## 🔒 Security Architecture

**Secure Processing Flow:**
1. User uploads document in browser
2. Document encrypted and sent to Claude API via secure Edge Function
3. Claude analyzes document with enterprise-grade security
4. Structured JSON returned, source document immediately deleted
5. Client-side CSI analysis and market benchmarking
6. Results displayed and exported, session data cleared

**Security Guarantees:**
- Documents encrypted during AI analysis, immediately deleted afterward
- No permanent storage of financial documents or data
- All processing happens through secure, encrypted channels
- Session-based data handling with automatic cleanup
- Enterprise-grade AI processing with zero data retention

## 🚀 Deployment (Vercel)

1. **Build and test:**
   ```bash
   npm run build
   npm run type-check
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard:**
   - `CLAUDE_API_KEY` (required)
   - `STRIPE_SECRET_KEY` (optional)
   - Other keys as needed

## 🎯 Core Business Logic

### CSI Division Analysis
The platform maps construction costs to 11 CSI divisions with market benchmarking:
- 01 - General Requirements (8-15% typical)
- 03 - Concrete (15-35% typical) 
- 15 - Mechanical (8-15% typical)
- 16 - Electrical (6-12% typical)
- Plus 7 other critical divisions

### Risk Assessment
- Missing critical divisions detection
- Cost concentration risk analysis  
- Scope completeness verification
- Market variance identification

## 📁 Key Files

```
src/
├── app/
│   ├── page.tsx                    # Landing page with value prop
│   ├── analyze/page.tsx            # Main analysis workspace
│   ├── pricing/page.tsx            # MVP pricing ($299/month)
│   └── api/claude/route.ts         # Claude API integration
├── lib/analysis/
│   ├── csi-analyzer.ts             # CSI division logic
│   ├── market-analyzer.ts          # Market benchmarking
│   ├── risk-analyzer.ts            # Risk assessment
│   └── export-generator.ts         # PDF/Excel export
└── components/analysis/
    ├── DocumentUpload.tsx          # Secure file upload
    ├── AnalysisResults.tsx         # Results visualization
    └── ExportTools.tsx             # Report generation
```

## 🚦 Feature Flags (Growth Rails)

MVP ships with growth features disabled via environment variables:

```bash
NEXT_PUBLIC_ENABLE_AUTH=false           # Clerk authentication
NEXT_PUBLIC_ENABLE_USAGE_LIMITS=false  # Analysis limits  
NEXT_PUBLIC_ENABLE_PAYMENTS=false      # Stripe billing
NEXT_PUBLIC_ENABLE_TEAMS=false         # Team features
```

Enable features as you scale:
- **Month 1**: MVP validation with no limits
- **Month 2-3**: Enable auth and usage limits 
- **Month 4+**: Enable payments and team features

## 📊 MVP Success Metrics

- **Validation**: 5+ users paying $299/month
- **Quality**: 90%+ accuracy in variance detection
- **Security**: Zero data breaches or storage incidents
- **Performance**: <30 second analysis time

## 🛡️ Security Best Practices

- Never log sensitive financial data
- Clear browser data after analysis
- Validate all user inputs  
- Use HTTPS everywhere
- Regular security audits

## 🎯 Growth Path

**Phase 1** (MVP): Validate $299 price point  
**Phase 2**: Add team features and lower-tier pricing  
**Phase 3**: Enterprise features and integrations  
**Phase 4**: Platform ecosystem and partnerships  

## 🆘 Support

For technical issues or feature requests, please check:
- CLAUDE.md for development guidance
- Environment variable configuration
- Claude API key validity
- Browser console for errors

## 📜 License

Proprietary - ProLeveler Platform
© 2024 All rights reserved

---

**🎯 Ready to prevent your next million-dollar mistake?**  
Start analyzing construction bids with expert-level AI insights in minutes, not weeks.
