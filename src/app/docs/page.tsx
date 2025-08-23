'use client';

import Link from 'next/link';
import { Building2, FileSpreadsheet, Shield, Target, AlertCircle, BarChart3, Calculator, TrendingUp } from 'lucide-react';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Levelr Documentation</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive guide to construction bid analysis, CSI benchmarking, and professional reporting
          </p>
        </div>

        {/* Application Purpose */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <Target className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Application Purpose</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">What Levelr Does</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Analyzes construction bid documents using AI technology</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Maps costs to standardized CSI (Construction Specifications Institute) divisions</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Provides market variance analysis and risk assessments</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Generates professional reports for stakeholder presentations</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Who Benefits</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Real Estate Developers:</strong> Evaluate contractor proposals</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Project Managers:</strong> Assess bid completeness and risk</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Financial Analysts:</strong> Compare multiple bids objectively</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong>Construction Consultants:</strong> Provide expert analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CSI Division Benchmarking */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">CSI Division Benchmarking Methodology</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              The Construction Specifications Institute (CSI) provides standardized divisions for organizing construction work. 
              Levelr uses <strong>MasterFormat 2018</strong> (50-division system) for accurate modern classification and maps bid costs to these divisions for industry benchmarking.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Levelr uses the current MasterFormat 2018 standard, which separates mechanical systems into distinct divisions: 
                Plumbing (22), HVAC (23), and Electrical (26) for more precise cost analysis.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Key CSI Divisions</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Division 01 - General Requirements</span>
                    <span className="text-sm text-gray-600">8-15%</span>
                  </div>
                  <p className="text-sm text-gray-600">Overhead, permits, supervision, bonds</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Division 03 - Concrete</span>
                    <span className="text-sm text-gray-600">15-35%</span>
                  </div>
                  <p className="text-sm text-gray-600">Foundations, structural work, assembly</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Division 09 - Finishes</span>
                    <span className="text-sm text-gray-600">12-25%</span>
                  </div>
                  <p className="text-sm text-gray-600">Flooring, paint, ceilings, interior work</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Division 22 - Plumbing</span>
                    <span className="text-sm text-gray-600">4-10%</span>
                  </div>
                  <p className="text-sm text-gray-600">Water supply, waste, vent, fixtures</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Division 23 - HVAC</span>
                    <span className="text-sm text-gray-600">8-18%</span>
                  </div>
                  <p className="text-sm text-gray-600">Heating, ventilation, air conditioning</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Division 26 - Electrical</span>
                    <span className="text-sm text-gray-600">6-12%</span>
                  </div>
                  <p className="text-sm text-gray-600">Power, lighting, panels, wiring</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Benchmarking Process</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">1</div>
                  <div>
                    <p className="font-medium">Cost Mapping</p>
                    <p className="text-sm text-gray-600">AI analyzes bid line items and maps them to appropriate CSI divisions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">2</div>
                  <div>
                    <p className="font-medium">Percentage Calculation</p>
                    <p className="text-sm text-gray-600">Calculate each division as percentage of total project cost</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">3</div>
                  <div>
                    <p className="font-medium">Market Comparison</p>
                    <p className="text-sm text-gray-600">Compare against industry-standard percentage ranges</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">4</div>
                  <div>
                    <p className="font-medium">Variance Analysis</p>
                    <p className="text-sm text-gray-600">Flag divisions that are significantly above or below market</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Uncategorized Costs */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Understanding Uncategorized Costs</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">What Are Uncategorized Costs?</h3>
              <p className="text-gray-700 mb-4">
                Uncategorized costs are line items in construction bids that cannot be automatically mapped to standard 
                CSI divisions using conventional construction keywords. These represent transparency gaps in cost analysis.
              </p>
              
              <h4 className="font-semibold text-gray-800 mb-2">Common Examples:</h4>
              <ul className="space-y-1 text-gray-700">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></div>
                  Contingency allowances and reserves
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></div>
                  Non-construction items (permits, bonds)
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></div>
                  Specialty work with non-standard naming
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></div>
                  Vendor-specific or proprietary system names
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2"></div>
                  Administrative or soft costs
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Risk Assessment Guidelines</h3>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium text-green-800">Low Risk: &lt;15%</span>
                  </div>
                  <p className="text-sm text-green-700">Acceptable level of uncategorized costs. Minor items that don't affect overall analysis.</p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="font-medium text-yellow-800">Moderate Risk: 15-25%</span>
                  </div>
                  <p className="text-sm text-yellow-700">Should be reviewed for proper classification. May indicate scope ambiguity.</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="font-medium text-red-800">High Risk: &gt;25%</span>
                  </div>
                  <p className="text-sm text-red-700">Significant concern. May indicate scope gaps, misclassification, or incomplete bid analysis.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Excel Analysis Tips */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Excel Analysis Tips & Best Practices</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Conditional Formatting</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 mb-2"><strong>Step 1:</strong> Select your data range containing percentages</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Step 2:</strong> Go to Home → Conditional Formatting → Color Scales</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Step 3:</strong> Choose Red-Yellow-Green scale</p>
                <p className="text-sm text-gray-700"><strong>Result:</strong> High variances show in red, normal ranges in green</p>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pivot Table Creation</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2"><strong>Purpose:</strong> Summarize and compare bid data across contractors</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Steps:</strong></p>
                <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1 ml-4">
                  <li>Select your data range</li>
                  <li>Insert → PivotTable</li>
                  <li>Drag "Division" to Rows</li>
                  <li>Drag "Contractor" to Columns</li>
                  <li>Drag "Cost" to Values (sum)</li>
                  <li>Right-click values → "Show Values As" → "% of Grand Total"</li>
                </ol>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Manual Variance Analysis</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <Calculator className="h-5 w-5 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Calculate Standard Deviation</p>
                    <p className="text-sm text-gray-600">Use =STDEV() function to measure bid spread consistency</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Create Variance Charts</p>
                    <p className="text-sm text-gray-600">Visual representation of cost distribution across divisions</p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bid Comparison Workflow</h3>
              <ol className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">1.</span>
                  <span>Review Executive Summary for initial ranking and risk assessment</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">2.</span>
                  <span>Analyze CSI Division percentages for scope completeness</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">3.</span>
                  <span>Examine uncategorized costs for transparency issues</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">4.</span>
                  <span>Cross-reference with market benchmarking data</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-blue-600 mr-2">5.</span>
                  <span>Document findings and recommendations for stakeholders</span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Security and Privacy */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Security & Privacy</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Processing</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Your documents are processed securely and never stored permanently</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Analysis happens locally in your browser with temporary cloud processing</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Data is encrypted during AI analysis and immediately deleted afterward</span>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span>No financial information is retained after your session ends</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Best Practices</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Review sensitive information before uploading</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Use secure networks for document processing</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Download and save analysis reports locally</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Clear browser cache after sensitive sessions</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Analyzing?</h2>
          <p className="text-blue-100 mb-6">
            Upload your construction bid documents and let Levelr provide comprehensive analysis and professional reports.
          </p>
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