import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Shield, Clock, TrendingUp, FileText, Zap, BarChart3, Building2, DollarSign, Target, ArrowRight, Play, Star } from 'lucide-react';

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Levelr
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium">Pricing</a>
              <a href="/docs" className="text-gray-600 hover:text-blue-600 font-medium">Docs</a>
              {userId ? (
                <a href="/analyze" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Open App
                </a>
              ) : (
                <a href="/analyze" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Get Started
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                AI-Powered Construction Analysis
              </div>

              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                Prevent Million-Dollar
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Bid Mistakes
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Advanced AI analysis of construction bids identifies hidden risks, cost variances, and market discrepancies
                in seconds. Make confident decisions with professional reports and data-driven insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="/analyze"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  Start Analyzing Bids
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
                <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-500 mr-2" />
                  Secure document processing
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-green-500 mr-2" />
                  Results in seconds
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Lowest Bid: Metro Construction</span>
                    <span className="text-lg font-bold text-green-700">$2.4M</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Variance Detected: ABC Builders</span>
                    <span className="text-lg font-bold text-yellow-700">+15%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-800">Risk Alert: Steel Prices</span>
                    <span className="text-sm font-semibold text-red-700">HIGH</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-600 text-white p-3 rounded-full shadow-lg z-20">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Trusted by Construction Professionals</h2>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="text-lg font-semibold">$500M+</div>
            <div className="text-gray-400">|</div>
            <div className="text-lg font-semibold">Projects Analyzed</div>
            <div className="text-gray-400">|</div>
            <div className="text-lg font-semibold">99.2%</div>
            <div className="text-gray-400">|</div>
            <div className="text-lg font-semibold">Accuracy Rate</div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Construction Pros Choose Levelr
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced AI technology combined with construction expertise to deliver insights that protect your bottom line
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="bg-blue-600 text-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Risk Detection</h3>
              <p className="text-gray-600">
                AI identifies cost anomalies, missing items, and market discrepancies that human reviewers often miss.
                Catch issues before they become expensive problems.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="bg-purple-600 text-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Save 90% Time</h3>
              <p className="text-gray-600">
                What takes hours of manual review now happens in seconds. Structured outputs with CSI divisions,
                risk scoring, and professional reports ready for stakeholders.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100">
              <div className="bg-green-600 text-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ROI Protection</h3>
              <p className="text-gray-600">
                One prevented mistake pays for years of service. Market benchmarking and variance analysis
                ensure you never overpay or underestimate project costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Analysis Platform</h2>
            <p className="text-xl text-gray-600">Everything you need for professional bid analysis and project management</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-600 text-white p-3 rounded-lg">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Discipline Analysis</h3>
                    <p className="text-gray-600">CSI divisions for construction, AIA phases for design, technical systems for trades - all with specialized AI analysis.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-600 text-white p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Bid Leveling & Comparison</h3>
                    <p className="text-gray-600">Side-by-side comparison of up to 5 bids with automated variance detection and AI explanations for cost differences.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-600 text-white p-3 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Reports</h3>
                    <p className="text-gray-600">Comprehensive PDF and Excel exports with executive summaries, risk assessments, and recommendation matrices.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-orange-600 text-white p-3 rounded-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Project Lifecycle Management</h3>
                    <p className="text-gray-600">From RFP generation to project completion - timelines, budgets, change orders, and team collaboration.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Risk Analysis Summary</h4>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">High Risk</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Steel Market Volatility</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-red-200 rounded-full h-2 mr-3">
                        <div className="bg-red-600 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-red-600">85%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Labor Availability</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-yellow-200 rounded-full h-2 mr-3">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-yellow-600">60%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Schedule Compression</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-green-200 rounded-full h-2 mr-3">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '25%'}}></div>
                      </div>
                      <span className="text-sm font-medium text-green-600">25%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>AI Recommendation:</strong> Consider fixed-price contracts for steel components and include escalation clauses for labor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Construction Pros Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Levelr caught a $200K pricing error that our team missed. The AI analysis is incredibly thorough."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  JS
                </div>
                <div>
                  <div className="font-semibold text-gray-900">John Stevens</div>
                  <div className="text-sm text-gray-600">Project Manager, Metro Construction</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "The bid leveling feature saves us hours of manual comparison. The variance explanations are spot-on."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  MR
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria Rodriguez</div>
                  <div className="text-sm text-gray-600">Senior Estimator, BuildRight Inc</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Finally, a tool that understands construction. The CSI division analysis is exactly what we needed."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  DL
                </div>
                <div>
                  <div className="font-semibold text-gray-900">David Lee</div>
                  <div className="text-sm text-gray-600">VP Operations, Summit Builders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Prevent Your Next Million-Dollar Mistake?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of construction professionals who trust Levelr for accurate bid analysis and risk detection.
          </p>

          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto shadow-2xl">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">$49</div>
              <div className="text-gray-600 mb-6">/month</div>

              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Unlimited bid analysis</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">All analysis types</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Professional reports</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Variance explanations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>

              <a
                href="/analyze"
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>

              <p className="text-sm text-gray-500 mt-4">
                No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Levelr
              </div>
              <p className="text-gray-400">
                AI-powered construction analysis platform for smarter bidding decisions.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/analyze" className="hover:text-white">Bid Analysis</a></li>
                <li><a href="#" className="hover:text-white">Bid Leveling</a></li>
                <li><a href="#" className="hover:text-white">RFP Generator</a></li>
                <li><a href="#" className="hover:text-white">Project Management</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">Tutorials</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Levelr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}