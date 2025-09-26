# Levelr Development Log

## Overview
Browser-only real estate document analysis platform with Claude AI integration for CSI division mapping and bid leveling.

## Major Issues & Solutions

### 1. Document Processing Crisis (Fixed)
**Issue**: Claude receiving base64 gibberish instead of readable text  
**Impact**: All analysis results were bogus  
**Solution**: Created proper document processing pipeline (`document-processor.ts`)
- Excel: Extract text content directly
- PDF/Images: Send as base64 to Claude's document/image endpoints
- Text: Process directly

### 2. PDF Analysis Failure (Fixed)
**Issue**: 500 Internal Server Error when processing PDFs  
**Solution**: Use Claude's document endpoint with `type: "document"` and `media_type: "application/pdf"`

### 3. Analysis Accuracy Problems (Fixed)
**Issue**: System missed $315M in construction costs, showed 29.7% coverage instead of 92.1%  
**Solution**: 
- Enhanced Claude prompt with specific CSI mapping rules
- Added "Construction & Assembly" → Division 03 mapping
- Improved keyword recognition for structural work

### 4. Bid Leveling Implementation (Completed)
**Features Added**:
- Multi-bid comparison interface (up to 5 bids)
- Executive summary with rankings and variance analysis
- CSI division comparison matrix
- Professional Excel/PDF export with multiple analysis sheets

### 5. Enhanced Leveling Exports (December 2024)
**Major Improvements**:
- **Professional Leveled Comparison Sheet**: New primary export with side-by-side bid comparison
- **Complete Cost Breakdown**: Shows all CSI divisions with cost, cost/SF, and intelligent comments
- **Markup Transparency**: Added CM Fee, Insurance, Bond, General Conditions rows between totals
- **Soft Costs Separation**: Distinguishes administrative costs from construction items
- **Legacy Division Cleanup**: Removed confusing 15/16 divisions, uses modern MasterFormat 2018
- **Smart Comments**: Contextual explanations (e.g., "Excluded per bid (Security)", "5.23% of Trades Subtotal")

**Technical Enhancements**:
- Added `gross_sqft` and `proposal_date` fields for cost/SF calculations
- Created `classifyItemType()` function for soft costs identification
- Enhanced Claude prompt to separate soft costs, CSI divisions, and uncategorized items
- Professional Excel formatting with freeze panes, merged headers, currency formatting
- Comprehensive Grand Total: Trades + Overhead + Soft Costs + Uncategorized

## Current Architecture

### Core Components
- **Document Processing**: `src/lib/document-processor.ts` - Handles file type detection and content extraction
- **Claude Integration**: `src/lib/claude.ts` - AI analysis with enhanced soft costs separation
- **RFP Generation**: `src/app/api/rfp/generate/route.ts` - Claude-powered professional RFP content creation
- **Storage**: Browser-only localStorage with `src/lib/storage.ts` - Analysis and RFP lifecycle management
- **CSI Analysis**: `src/lib/analysis/csi-analyzer.ts` - MasterFormat 2018 division mapping with soft costs classification
- **RFP Components**: `src/components/rfp/` - 5-step RFP generation workflow with 6 specialized components
- **Risk Assessment**: `src/lib/analysis/risk-analyzer.ts` - Project risk calculation
- **Export Generation**: `src/lib/analysis/export-generator.ts` - Professional leveled comparison sheets and analysis reports

### Key Features
- **Secure**: Browser-only, no server-side storage
- **Multi-format**: Excel, PDF, images, text support
- **Complete Bidding Ecosystem**: RFP generation → bid receipt → analysis → leveling comparison
- **AI-Enhanced RFP Generation**: Professional RFP creation with Claude-powered content generation
- **Smart Scope Building**: CSI division selection with AI-powered suggestions and market intelligence
- **Professional Leveled Comparison**: Side-by-side bid analysis with cost/SF calculations
- **Intelligent Cost Classification**: Separates CSI divisions, soft costs, and uncategorized items
- **Complete Transparency**: Shows markup breakdown (CM fees, insurance, bonds) with percentages
- **Real-time Analysis**: Instant MasterFormat 2018 division mapping and risk assessment

## Technical Decisions

### Security Model
- Browser-only processing to protect sensitive bid documents
- localStorage for analysis history
- No server-side document retention

### AI Integration
- Claude 3.5 Sonnet for document analysis
- Separate endpoints for different file types (document vs image)
- Post-processing validation for analysis completeness

### Export Strategy
- jsPDF with autoTable for professional PDF generation
- XLSX library for multi-sheet Excel reports
- Market benchmarking against CSI industry standards

## Dependencies
- Next.js 14 with App Router
- Claude AI API
- jsPDF + jsPDF-autoTable for PDF generation
- XLSX for Excel export
- React Dropzone for file upload

## Performance Notes
- Build size: ~463kB for analyze page (includes RFP components and export libraries)
- Vercel Edge Functions with 30s timeout for Claude API calls
- Client-side processing for optimal security
- RFP workflow adds ~100kB for comprehensive 5-step wizard interface

## Known Limitations
- 10MB file size limit for uploads
- 5 bid maximum for leveling comparison
- Browser localStorage dependency for persistence

## Recent Development Activity

### Enhanced Leveling Branch (December 2024)
**Branch**: `enhanced-leveling`  
**Status**: Active development  
**Key Commits**:
- Added leveling export foundation with gross_sqft and proposal_date fields
- Implemented professional leveled comparison sheet with 3-row headers
- Fixed legacy division duplicates (removed 15/16, kept modern 21-28)
- Added markup transparency with CM Fee, Insurance, Bond breakdown
- Implemented soft costs separation from uncategorized items
- Enhanced Claude prompt for three-way cost classification

### 6. Complete Soft Costs Integration (December 2024)
**Issue**: Soft costs functionality was partially implemented but not consistently applied  
**Impact**: Claude wasn't extracting soft costs, leveling exports showed "No soft costs identified"  
**Solution**: Comprehensive soft costs integration
- **Enhanced Claude Prompts**: Added explicit soft costs identification instructions in both API routes
- **New UI Components**: Added dedicated Soft Costs section to AnalysisResults.tsx with purple-themed display
- **Enhanced Risk Analysis**: Updated calculateProjectRisk to validate soft costs percentages (2-20% range)
- **Complete Integration**: Connected all pieces from Claude extraction to UI display to export functionality

**Key Features Added**:
- Proper soft costs identification: design fees, permits, bonds, insurance, legal, consulting
- Clear separation between CSI divisions, soft costs, and uncategorized construction items
- Itemized soft costs breakdown with individual cost and percentage displays
- Enhanced validation ensuring softCostsTotal equals sum of softCosts array items
- Risk assessment flags for unusually high (>20%) or low (<2%) soft costs percentages

**Technical Implementation**:
- Updated Claude prompts with specific soft costs keywords and validation requirements
- Added purple-themed UI section showing itemized breakdown of administrative costs
- Enhanced risk analyzer with comprehensive coverage calculations including soft costs
- All existing leveling export functionality now populates with actual soft costs data

### 7. Comprehensive RFP Generator Feature (August 2025)
**Objective**: Create complete bidding ecosystem by adding professional RFP generation capability  
**Impact**: Transform Levelr from analysis-only tool to full-cycle construction procurement platform  
**Solution**: 5-step RFP generation workflow with AI-enhanced content creation

**Major Features Implemented**:
- **Multi-Step Wizard Interface**: Progressive 5-step process with completion validation
- **Project Setup Wizard**: Project type selection, timeline management, delivery method configuration
- **Smart CSI Scope Builder**: AI-powered scope suggestions based on project type with market intelligence integration
- **Commercial Terms Builder**: Comprehensive insurance, qualifications, evaluation criteria, and pricing structure management
- **Professional RFP Preview**: Live document formatting with professional layout and full content preview
- **Export Tools Framework**: PDF, Word, and Excel export capabilities with distribution tools

**Technical Architecture**:
- **12 New React Components**: Complete TypeScript implementation with consistent UI/UX patterns
- **Claude API Integration**: New `/api/rfp/generate` endpoint for professional RFP content generation
- **CSI Division Intelligence**: Leverages existing CSI data with 33-division MasterFormat 2018 support
- **Browser-Only Storage**: RFP lifecycle management with localStorage persistence
- **Market Intelligence Integration**: Uses existing bid analysis data for scope recommendations

**Key Implementation Details**:
- **Component Structure**: `src/components/rfp/` with RFPBuilder, ProjectSetupWizard, ScopeBuilder, CommercialTermsBuilder, RFPPreview, RFPExportTools
- **Type System**: Comprehensive `src/types/rfp.ts` with RFPProject, CSIScopeItem, InsuranceRequirement interfaces
- **Data Management**: Enhanced `src/lib/storage.ts` with RFP CRUD operations and bid linking
- **Content Generation**: `src/lib/rfp/rfp-generator.ts` with Claude integration for professional language generation
- **CSI Data Enhancement**: `src/lib/rfp/csi-data.ts` with division metadata, risk factors, and typical percentages

**Business Value**:
- **Complete Workflow**: RFP generation → bid receipt → analysis → leveling comparison
- **AI-Enhanced Quality**: Professional RFP language with proper legal terminology and industry standards
- **Market Intelligence**: Scope suggestions based on project type and historical bid data
- **Risk Prevention**: Comprehensive scope definition reduces scope gaps and change orders
- **Professional Output**: Export-ready documents suitable for contractor distribution

**Branch**: `rfp-generator`  
**Status**: Feature complete and ready for production deployment  
**Total Implementation**: 12 files changed, 4,643 insertions across 11 commits

**Key Development Milestones**:
1. **Foundation** (`dddd588`): Initial RFP generator with 5-step workflow and basic components
2. **Multi-Discipline Enhancement** (`62641e0`): Added construction, design, and trade service support with discipline-specific templates
3. **Commercial Templates** (`0260fe7`): Comprehensive commercial terms, qualifications, and evaluation criteria with Claude API integration
4. **Workflow Refinement** (`f72a8b7-8135f1f`): Fixed discipline selection, scope framework detection, and CSI division sorting
5. **UX Improvements** (`230c1d0-b8d23d3`): Enhanced scope selection, framework persistence, and delivery method configuration
6. **Export Implementation** (`bbdbaf1`): Complete document generation with real PDF, Word, and Excel exports replacing demo functionality

**Final Export Capabilities**:
- **PDF Export**: Professional document with cover page, project details, scope breakdown, commercial terms using jsPDF
- **Word Export**: Editable document format for customization and branding using docx library  
- **Excel Export**: Multi-sheet workbook with project summary, scope matrix, evaluation criteria, and bid comparison using xlsx
- **Distribution Tools**: Email distribution preview, print functionality, and link sharing capabilities
- **Real Document Generation**: Replaced all demo implementations with functional exports generating actual downloadable files

### 8. Enhanced Multi-Discipline Analysis Implementation (September 2024)
**Objective**: Add AI-powered analysis for design and trade disciplines beyond construction CSI analysis
**Impact**: Complete the Enhanced Multi-Discipline Analysis (Beta) feature with full Claude AI integration
**Solution**: Dedicated analyzers for AIA phases (design) and technical systems (trade)

**Major Features Implemented**:
- **AI-Powered AIA Phase Analysis**: Design proposal analysis with Schematic Design, Design Development, Construction Documents, Bidding, and Construction Administration phase identification
- **AI-Powered Technical Systems Analysis**: Trade proposal analysis for electrical, HVAC, plumbing, fire suppression, and specialty systems
- **Discipline-Specific Claude Integration**: Separate analyzer files with specialized prompts for design and trade documents
- **Smart Routing System**: Construction uses proven CSI system, design/trade use new AI analyzers
- **Enhanced Excel Exports**: Moved Soft Costs to dedicated sheet after CSI Analysis for better organization

**Technical Architecture**:
- **New Analyzer Files**: `src/lib/analysis/aia-analyzer.ts` and `src/lib/analysis/trade-analyzer.ts` with direct Claude API integration
- **Enhanced Multi-Discipline Router**: Updated `src/lib/analysis/multi-discipline-analyzer.ts` to route disciplines to appropriate analyzers
- **Preserved Construction System**: Existing proven CSI analysis unchanged, new disciplines use dedicated AI-powered analysis
- **Export Enhancement**: Separate Soft Costs sheet in Excel exports with proper formatting and currency display

**Key Implementation Details**:
- **AIA Phase Analysis**: Extracts design fees by phase (SD: 15%, DD: 20%, CD: 40%, BN: 5%, CA: 20%) with deliverable identification
- **Technical Systems Analysis**: Maps trade work to electrical power, HVAC systems, plumbing, fire suppression with equipment specifications
- **Market Analysis Integration**: Discipline-specific market variance analysis and risk assessment generation
- **Consistent UI/UX**: Same interface and export functionality across all disciplines

**Business Value**:
- **Complete Multi-Discipline Support**: True analysis for construction, design, and trade proposals
- **AI-Powered Intelligence**: Claude analysis for design deliverables and technical system specifications
- **Risk Prevention**: Proper scope analysis across all construction industry disciplines
- **Professional Reports**: Discipline-specific export formats with appropriate cost breakdowns

**Branch**: `rfp-generator`
**Status**: Complete and deployed
**Implementation**: 2 new analyzer files, enhanced routing system, improved Excel exports

### Known Issues
- **Subcontractor null values**: Some legacy data may have null total_amount causing toLocaleString() errors
- **Cost/SF calculations**: Require gross_sqft field to be extracted by Claude

## Deployment Status
✅ Main: https://levelr-quad-funs-projects.vercel.app
✅ GitHub: https://github.com/quad-fun/levelr
✅ Enhanced Multi-Discipline Analysis complete with AI-powered design and trade analysis