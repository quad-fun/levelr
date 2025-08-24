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
- **Storage**: Browser-only localStorage with `src/lib/storage.ts`
- **CSI Analysis**: `src/lib/analysis/csi-analyzer.ts` - MasterFormat 2018 division mapping with soft costs classification
- **Risk Assessment**: `src/lib/analysis/risk-analyzer.ts` - Project risk calculation
- **Export Generation**: `src/lib/analysis/export-generator.ts` - Professional leveled comparison sheets and analysis reports

### Key Features
- **Secure**: Browser-only, no server-side storage
- **Multi-format**: Excel, PDF, images, text support
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
- Build size: ~422kB for analyze page (includes all export libraries)
- Vercel Edge Functions with 30s timeout for Claude API calls
- Client-side processing for optimal security

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

### Known Issues
- **Soft costs data**: New analyses needed to populate itemized soft costs
- **Subcontractor null values**: Some legacy data may have null total_amount causing toLocaleString() errors
- **Cost/SF calculations**: Require gross_sqft field to be extracted by Claude

## Deployment Status
✅ Main: https://levelr-quad-funs-projects.vercel.app  
✅ GitHub: https://github.com/quad-fun/levelr  
✅ Enhanced leveling features in development