'use client';

import Link from 'next/link';
import { Building2, FileSpreadsheet, Shield, AlertCircle, BarChart3, Download, Trash2, Monitor, RefreshCw } from 'lucide-react';

export default function HowToGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Levelr How To Guide</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master multi-discipline proposal analysis with construction, design, and trade bid leveling
          </p>
        </div>

        {/* CRITICAL: Browser Storage Warning */}
        <section className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-red-800">🚨 CRITICAL: Save Your Work!</h2>
          </div>

          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <p className="text-red-800 font-semibold mb-2">
              ⚠️ All analysis results are stored ONLY in your browser's local storage
            </p>
            <p className="text-red-700 text-sm">
              If you clear browser cache, switch devices, or use incognito mode, ALL your analyses will be permanently lost
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-3">Data Will Be Lost If:</h3>
              <ul className="space-y-2 text-red-700">
                <li className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  You clear browser cache/cookies
                </li>
                <li className="flex items-center">
                  <Monitor className="h-4 w-4 mr-2" />
                  You switch to a different device
                </li>
                <li className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  You use a different browser
                </li>
                <li className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  You use incognito/private mode
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-3">IMMEDIATELY Download:</h3>
              <ul className="space-y-2 text-red-700">
                <li className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  PDF/Excel reports after each analysis
                </li>
                <li className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Bid leveling comparison reports
                </li>
                <li className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Any data you want to keep long-term
                </li>
                <li className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Reports you need to share or edit
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏗️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Construction Bids</h3>
              <p className="text-gray-600 text-sm">
                Upload contractor proposals for CSI division analysis and cost benchmarking
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📐</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Design Proposals</h3>
              <p className="text-gray-600 text-sm">
                Analyze architect and engineer proposals by AIA phases and deliverables
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Trade Services</h3>
              <p className="text-gray-600 text-sm">
                Review MEP and specialty trade proposals with technical system analysis
              </p>
            </div>
          </div>
        </section>

        {/* Step-by-Step Workflow */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Step-by-Step Analysis Workflow</h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">1</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Choose Analysis Type</h3>
                <p className="text-gray-600 mb-2">Select enhanced multi-discipline analysis for advanced features, or use the original construction-only mode</p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• 🏗️ Construction: CSI divisions, subcontractors, overhead analysis</li>
                  <li>• 📐 Design: AIA phases, deliverables, design fees</li>
                  <li>• ⚡ Trade: Technical systems, equipment specs, commissioning</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">2</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Upload Documents</h3>
                <p className="text-gray-600 mb-2">Supported formats: PDF, Excel (.xlsx), Word (.docx), Images (.jpg/.png), Text (.txt)</p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Files up to 75MB are supported</li>
                  <li>• Large files automatically use secure cloud upload</li>
                  <li>• Documents are encrypted during processing</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">3</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Review Analysis Results</h3>
                <p className="text-gray-600 mb-2">Comprehensive breakdown with cost coverage, risk assessment, and market benchmarking</p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• Overview: Project details and total costs</li>
                  <li>• Scope: Detailed breakdowns by discipline</li>
                  <li>• Soft Costs: Administrative and professional fees</li>
                  <li>• Risk Assessment: Project risk factors and scores</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">4</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Download Reports Immediately</h3>
                <p className="text-gray-600 mb-2 font-semibold text-red-600">⚠️ CRITICAL: Export your analysis before leaving the page!</p>
                <ul className="text-sm text-gray-600 ml-4 space-y-1">
                  <li>• PDF Report: Professional presentation format</li>
                  <li>• Excel Data: Detailed spreadsheet for further analysis</li>
                  <li>• Both formats include all analysis data and insights</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Discipline Bid Leveling */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Multi-Discipline Bid Leveling</h2>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-semibold">
              🚨 Bid leveling data is also stored in browser only - download comparison reports immediately!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Discipline-Aware Filtering</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <p className="font-medium">All Disciplines</p>
                    <p className="text-sm text-gray-600">Compare all proposals together</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl mr-3">🏗️</span>
                  <div>
                    <p className="font-medium">Construction Only</p>
                    <p className="text-sm text-gray-600">Filter to construction bids for CSI comparison</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl mr-3">📐</span>
                  <div>
                    <p className="font-medium">Design Services</p>
                    <p className="text-sm text-gray-600">Compare design proposals by AIA phases</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl mr-3">⚡</span>
                  <div>
                    <p className="font-medium">Trade Services</p>
                    <p className="text-sm text-gray-600">Level MEP and specialty trade bids</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparison Features</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <span>Executive summary with rankings and variance analysis</span>
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <span>Side-by-side division/phase comparison tables</span>
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <span>Risk assessment scoring for each proposal</span>
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <span>Export to PDF and Excel for stakeholder review</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CSI Division Analysis */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">CSI Division Analysis (Construction)</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Divisions & Benchmarks</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">01 - General Requirements</span>
                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">8-15%</span>
                  </div>
                  <p className="text-sm text-gray-600">Project management, supervision, bonds, permits</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">03 - Concrete</span>
                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">15-35%</span>
                  </div>
                  <p className="text-sm text-gray-600">Foundations, structural concrete, assembly</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">09 - Finishes</span>
                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">12-25%</span>
                  </div>
                  <p className="text-sm text-gray-600">Flooring, paint, ceilings, interior work</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">22 - Plumbing</span>
                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">4-10%</span>
                  </div>
                  <p className="text-sm text-gray-600">Water supply, waste systems, fixtures</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">23 - HVAC</span>
                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">8-18%</span>
                  </div>
                  <p className="text-sm text-gray-600">Heating, ventilation, air conditioning</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">26 - Electrical</span>
                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">6-12%</span>
                  </div>
                  <p className="text-sm text-gray-600">Power distribution, lighting, panels</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Soft Costs Analysis</h3>
              <p className="text-gray-600 mb-4">
                Levelr now automatically identifies and categorizes soft costs (3-15% of project total):
              </p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                  Design and engineering fees
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                  Permits and regulatory approvals
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                  Insurance and bonding costs
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                  Legal and administrative expenses
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                  Project management and supervision
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                  Testing and commissioning services
                </li>
              </ul>

              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Industry Benchmark:</strong> Soft costs typically range from 3-15% of total project cost.
                  Higher percentages may indicate complex projects or comprehensive professional services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Risk Assessment Guide */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Risk Assessment Guide</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span className="font-semibold text-green-800">Low Risk (0-30)</span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Complete scope coverage (&gt;85%)</li>
                <li>• All major divisions included</li>
                <li>• Minimal uncategorized costs</li>
                <li>• Clear subcontractor breakdown</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                <span className="font-semibold text-yellow-800">Medium Risk (31-70)</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Good coverage (70-85%)</li>
                <li>• Some missing divisions</li>
                <li>• Moderate uncategorized costs</li>
                <li>• Review recommended</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span className="font-semibold text-red-800">High Risk (71-100)</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Poor coverage (&lt;70%)</li>
                <li>• Major divisions missing</li>
                <li>• High uncategorized costs</li>
                <li>• Detailed review required</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Security & Privacy</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Secure Processing</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Documents encrypted during AI analysis</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Immediately deleted after processing</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>No financial data retained on servers</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Analysis happens with Claude Sonnet 4 AI</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Best Practices</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <Download className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Download reports immediately after analysis</span>
                </li>
                <li className="flex items-start">
                  <Monitor className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Use secure networks for document upload</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Review sensitive information before upload</span>
                </li>
                <li className="flex items-start">
                  <Trash2 className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Clear browser cache after sensitive sessions</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Excel Tips */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Working with Excel Exports</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">What's Included</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  Overview sheet with project summary
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  Detailed cost breakdown by division/phase
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  Soft costs analysis (separate sheet)
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  Risk assessment and variance data
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  Pre-formatted for immediate analysis
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Analysis Tips</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Use conditional formatting for variance visualization
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Create pivot tables for multi-bid comparisons
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Add your own formulas for custom calculations
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Charts and graphs for stakeholder presentations
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Combine with your internal cost databases
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Analyze Your Proposals?</h2>
          <p className="text-blue-100 mb-6">
            Upload construction bids, design proposals, or trade estimates for comprehensive AI-powered analysis with professional reports.
          </p>

          <div className="bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-100 font-semibold">
              🚨 Remember: Download your analysis reports immediately - they're only stored in your browser!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/analyze"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
            >
              Start Analysis
            </Link>
            <Link
              href="/"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-center"
            >
              Learn More
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}