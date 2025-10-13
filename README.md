# Levelr - Complete Construction Procurement Platform

**Prevent million-dollar bid mistakes with AI-powered risk analysis and professional RFP generation**

Levelr is the first complete construction bidding ecosystem that combines AI-enhanced RFP generation with comprehensive bid analysis. From creating professional RFPs to analyzing received bids, Levelr provides end-to-end procurement intelligence for real estate developers managing $5M+ projects.

## 🚀 Platform Overview

### **Complete Project Procurement & Management Workflow**
1. **Generate RFPs**: AI-powered professional RFP creation with market intelligence
2. **Receive Bids**: Distribute to contractors via multiple channels
3. **Analyze Bids**: Instant CSI division mapping and risk assessment
4. **Level & Compare**: Side-by-side bid comparison with AI variance analysis
5. **Manage Projects**: Interactive phase management with bid workflow and budget controls
6. **Export Reports**: Professional PDF and Excel deliverables with executive dashboards

### **Core Value Propositions**
- **RFP Quality**: "Generate better RFPs that attract more competitive bids"
- **Risk Prevention**: "Prevent million-dollar bid mistakes with AI-powered risk analysis"
- **Market Intelligence**: "Leverage historical data for smarter procurement decisions"
- **Security Promise**: "Documents encrypted during AI analysis, immediately deleted after processing"

## 🏗️ Key Features

### **🔍 AI-Powered Bid Analysis**
- **CSI Division Mapping**: Automatic categorization using MasterFormat 2018 (50-division system)
- **Risk Assessment**: AI-powered risk scoring identifies cost overruns and missing scope
- **Cost/SF Intelligence**: Comprehensive cost per square foot analysis and benchmarking
- **Soft Costs Separation**: Distinguishes administrative costs from construction work
- **Market Benchmarking**: Compare against historical project data and industry standards

### **📝 Professional RFP Generation** 
- **5-Step Wizard**: Project setup → scope definition → commercial terms → preview → export
- **Smart Scope Building**: AI-powered CSI division suggestions based on project type
- **Market Intelligence Integration**: Scope recommendations using historical bid analysis data
- **Professional Content Generation**: Claude AI creates industry-standard RFP language
- **Comprehensive Templates**: Cover 6 project types with 33 CSI divisions
- **Export Options**: Professional PDF, Word, and Excel generation with real document creation (not demos)

### **⚖️ Advanced Bid Leveling**
- **Multi-Bid Comparison**: Compare up to 5 bids side-by-side with AI-powered variance analysis
- **AI Variance Explanations**: Intelligent explanations for cost differences between competing proposals
- **Multi-Discipline Intelligence**: Specialized analysis for CSI divisions, AIA phases, and technical systems
- **Professional Reports**: Leveled comparison sheets with variance explanations included
- **Markup Transparency**: Shows CM fees, insurance, bonds, and general conditions
- **Executive Summaries**: Rankings, recommendations, and comprehensive risk assessments
- **Export Excellence**: Professional Excel workbooks with dedicated variance explanation sheets

### **🏗️ Interactive Project Management**
- **Complete Project Lifecycle**: Track projects from planning to completion with real-time updates
- **Phase & Milestone Management**: Interactive status updates with automatic phase advancement
- **Bid Workflow Management**: Full bid lifecycle from submission to award with contractor evaluation
- **Budget Control System**: Real-time budget editing with variance tracking and discipline-based organization
- **Change Order Management**: Complete change order workflow with impact analysis and approval tracking
- **Executive Dashboard**: Multi-view reporting with risk assessment and progress analytics
- **Mock Data Testing**: Toggle realistic project data for comprehensive workflow testing

### **🔒 Security & Privacy**
- **Browser-Only Processing**: All analysis happens locally with no server storage
- **Document Encryption**: Files encrypted during AI analysis, immediately deleted afterward
- **Zero Data Retention**: No permanent storage of financial documents or data
- **Session-Based**: Automatic cleanup with localStorage for analysis history only

## 🏢 Target Market

**Primary**: Real estate developers managing $5M+ construction projects  
**Secondary**: General contractors, construction managers, and procurement professionals

**Business Model**: $299/month for 10 analyses  
**ROI Examples**:
- $5M Project: $299/month cost, $250K potential savings = 83,600% ROI
- $10M Project: $299/month cost, $500K potential savings = 167,100% ROI

## 🛠️ Technical Architecture

### **Frontend**
- **Framework**: Next.js 14 with TypeScript and Tailwind CSS
- **Components**: 25+ React components with comprehensive RFP and analysis workflows
- **Storage**: Browser localStorage for session data and analysis history
- **Security**: Client-side processing with encrypted cloud AI integration

### **Backend**
- **Infrastructure**: Vercel Edge Functions (serverless, no persistent storage)
- **AI Integration**: Claude 3.5 Sonnet for document analysis and RFP content generation
- **APIs**: RESTful endpoints for analysis (`/api/claude`) and RFP generation (`/api/rfp/generate`)
- **File Processing**: Multi-format support (PDF, Excel, images, text) with proper content extraction

### **Core Libraries**
- **AI**: Claude API for document analysis and content generation
- **Export**: jsPDF + autoTable for PDF generation, XLSX for Excel workbooks
- **Upload**: React Dropzone with drag-and-drop interface
- **UI**: Lucide React icons, date-fns for formatting, crypto-js for encryption

## 🚦 Development Setup

### **Prerequisites**
- Node.js 18+ and npm
- Claude API key from Anthropic
- Optional: Stripe keys for payment processing (growth features)

### **Installation**
1. **Clone and install:**
   ```bash
   git clone https://github.com/quad-fun/levelr.git
   cd levelr
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Required
   CLAUDE_API_KEY=your_claude_api_key_here
   
   # Optional (Growth Rails)
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # Authentication (if enabled)
   BASIC_AUTH_USER=levelr
   BASIC_AUTH_PASSWORD=demo2024
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

## 📋 Recent Updates

### Latest Release - Interactive Project Management (December 2024)
- **🎯 NEW FEATURE: Complete Project Management System**
- ✅ **Interactive Phase & Milestone Management** with real-time status updates and automatic progression
- ✅ **Comprehensive Bid Management** with full contractor evaluation and award workflow
- ✅ **Advanced Budget Controls** with real-time editing, variance tracking, and discipline organization
- ✅ **Change Order Management** with impact analysis and approval tracking
- ✅ **Executive Dashboard** with multi-view reporting and risk assessment
- ✅ **Mock Data Integration** for comprehensive workflow testing
- ✅ **Full TypeScript Coverage** with comprehensive interface definitions

### Previous Major Updates
- **🚨 CRITICAL UPDATE: MasterFormat 2018 Compliance**
- ✅ **UPGRADED to MasterFormat 2018** (50-division system) from obsolete 16-division format
- ✅ **Fixed mechanical division error** - now properly separates HVAC (23), Plumbing (22), Electrical (26)
- ✅ **Enhanced accuracy** with 39 additional CSI divisions for precise cost classification
- ✅ **AI Variance Explanations** with inline explanations and expandable tooltips
- ✅ **Enhanced Excel exports** with auto-fit columns and uncategorized costs analysis
- ✅ **Professional RFP Generation** with 5-step wizard and AI-powered content creation

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
   vercel --prod
   ```

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page with value proposition
│   ├── analyze/page.tsx            # Main platform workspace
│   ├── pricing/page.tsx            # Pricing and business model
│   └── api/
│       ├── claude/route.ts         # Bid analysis Claude integration
│       └── rfp/generate/route.ts   # RFP content generation
├── components/
│   ├── analysis/                   # Bid analysis workflow
│   │   ├── DocumentUpload.tsx      # Secure file upload
│   │   ├── AnalysisResults.tsx     # Results visualization
│   │   ├── AnalysisHistory.tsx     # Project dashboard
│   │   └── BidLeveling.tsx         # Multi-bid comparison with AI explanations
│   ├── rfp/                        # RFP generation workflow
│   │   ├── RFPBuilder.tsx          # Main 5-step wizard
│   │   ├── ProjectSetupWizard.tsx  # Step 1: Project basics
│   │   ├── ScopeBuilder.tsx        # Step 2: CSI scope definition
│   │   ├── CommercialTermsBuilder.tsx # Step 3: Terms & qualifications
│   │   ├── RFPPreview.tsx          # Step 4: Document preview
│   │   └── RFPExportTools.tsx      # Step 5: Export & distribution
│   └── ecosystem/                  # Project management system
│       ├── ProjectManager.tsx      # Main project management interface
│       ├── ProjectCreator.tsx      # New project creation wizard
│       ├── TimelineManager.tsx     # Interactive phase & milestone management
│       ├── BidManager.tsx          # Bid workflow and contractor evaluation
│       ├── BudgetManager.tsx       # Real-time budget editing and tracking
│       ├── ChangeOrderManager.tsx  # Change order lifecycle management
│       └── ProjectReports.tsx      # Executive dashboard and reporting
├── lib/
│   ├── analysis/                   # Core analysis logic
│   │   ├── csi-analyzer.ts         # MasterFormat 2018 division mapping
│   │   ├── risk-analyzer.ts        # Project risk assessment
│   │   └── export-generator.ts     # Professional report generation
│   ├── rfp/                        # RFP generation logic
│   │   ├── csi-data.ts             # CSI division metadata and intelligence
│   │   └── rfp-generator.ts        # Claude integration for content creation
│   ├── claude.ts                   # Core AI analysis integration
│   ├── storage.ts                  # Browser localStorage management
│   └── document-processor.ts       # Multi-format file processing
├── types/
│   ├── analysis.ts                 # Bid analysis type definitions
│   └── rfp.ts                      # RFP generation type definitions
└── CLAUDE.md                       # Development guidance and architecture
```

## 🔄 Complete Workflow

### **1. RFP Generation Workflow**
1. **Project Setup**: Define project type, timeline, location, estimated value
2. **Scope Definition**: Select CSI divisions with AI-powered suggestions and market intelligence
3. **Commercial Terms**: Set pricing structure, insurance requirements, qualifications
4. **Preview & Review**: Professional document preview with full RFP formatting
5. **Export & Distribute**: Generate PDF, Word, Excel formats with distribution tools

### **2. Bid Analysis Workflow**
1. **Document Upload**: Secure multi-format file processing (PDF, Excel, images)
2. **AI Analysis**: Claude extracts costs, maps to CSI divisions, identifies soft costs
3. **Risk Assessment**: Comprehensive project risk scoring and variance analysis
4. **Results Review**: Detailed cost breakdown with market benchmarking
5. **Export Reports**: Professional PDF and Excel reports with recommendations

### **3. Bid Leveling Workflow**
1. **Multi-Bid Selection**: Add up to 5 bids for comparison
2. **Automated Leveling**: Side-by-side cost comparison with variance analysis
3. **AI Variance Analysis**: Generate intelligent explanations for cost differences
4. **Executive Summary**: Rankings, recommendations, and risk assessments
5. **Professional Export**: Comprehensive Excel workbooks with variance explanation sheets

### **4. Project Management Workflow**
1. **Project Creation**: Multi-discipline project setup with timeline and budget allocation
2. **Phase Management**: Interactive phase progression with milestone tracking
3. **Bid Management**: Complete bid lifecycle from submission to contractor award
4. **Budget Control**: Real-time budget editing with variance tracking across disciplines
5. **Change Orders**: Impact analysis and approval workflow for project modifications
6. **Executive Reporting**: Multi-view dashboard with progress analytics and risk assessment

## 🎯 Business Intelligence

### **Market Intelligence Engine**
- **Historical Data**: Leverage stored analysis data for scope recommendations
- **CSI Benchmarking**: Compare division percentages against market standards
- **Risk Pattern Recognition**: Identify common scope gaps and cost overruns
- **Project Type Intelligence**: AI suggestions based on 6 project categories

### **Reporting Capabilities**
- **Professional PDFs**: Multi-section documents with cover pages and table of contents
- **Excel Workbooks**: Multiple sheets with leveling, analysis, and evaluation matrices  
- **Executive Summaries**: High-level insights for stakeholders
- **Distribution Tools**: Email integration and sharing capabilities

## 🚀 Deployment & Scaling

### **Production Environment**
- **Platform**: Vercel with Edge Functions for global distribution
- **Performance**: <30 second analysis time, <5 second page loads
- **Scalability**: Serverless architecture handles variable load
- **Security**: Enterprise-grade with encrypted processing and zero data retention

### **Feature Flags (Growth Rails)**
```bash
# MVP Configuration (all disabled initially)
NEXT_PUBLIC_ENABLE_AUTH=false           # Clerk authentication
NEXT_PUBLIC_ENABLE_USAGE_LIMITS=false  # Analysis limits
NEXT_PUBLIC_ENABLE_PAYMENTS=false      # Stripe billing
NEXT_PUBLIC_ENABLE_TEAMS=false         # Team features
```

**Scaling Path**:
- **Phase 1**: MVP validation with unlimited usage
- **Phase 2**: Authentication and usage limits
- **Phase 3**: Payment processing and team features
- **Phase 4**: Enterprise integrations and partnerships

## 📊 Success Metrics

### **Platform KPIs**
- **User Engagement**: RFPs generated per month, bids analyzed per user
- **Quality Metrics**: 90%+ accuracy in variance detection, <5% false positives
- **Performance**: <30 second analysis time, 99.9% uptime
- **Security**: Zero data breaches, 100% document deletion compliance

### **Business Metrics**
- **Revenue**: $299/month per user, 10 analyses included
- **Retention**: Target 85%+ monthly retention
- **Expansion**: Track usage patterns for upselling opportunities
- **ROI Validation**: Customer-reported savings vs. platform cost

## 🆘 Support & Documentation

### **Development Resources**
- **Architecture Guide**: `CLAUDE.md` - Comprehensive development guidance
- **Development Log**: `DEVELOPMENT_LOG.md` - Major features and solutions
- **Type Definitions**: Comprehensive TypeScript interfaces
- **Component Documentation**: Inline JSDoc comments

### **Troubleshooting**
- **Claude API**: Verify API key validity and rate limits
- **File Processing**: Check supported formats and size limits (10MB)
- **Export Issues**: Ensure browser supports PDF/Excel downloads
- **Performance**: Monitor Edge Function timeouts (30s limit)

## 📜 License & Ownership

**Proprietary - Levelr Platform**  
© 2024-2025 All rights reserved

---

## 🎯 Ready to Transform Your Construction Procurement?

**Generate professional RFPs in minutes, not days**  
**Analyze bids with AI-powered intelligence, not guesswork**  
**Prevent million-dollar mistakes with comprehensive risk assessment**

Start building better projects with Levelr - the complete construction procurement platform.