import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const plan = {
    name: 'Professional',
    price: 299,
    billingPeriod: 'month',
    analysesPerMonth: 10,
    features: [
      'CSI division analysis with market benchmarking',
      'AI-powered risk scoring and variance detection',
      'Professional PDF and Excel reports',
      'Browser-only security - no data storage',
      'Unlimited document types (PDF, Excel, Word, Images)',
      'Expert-level analysis in minutes',
      'Email support'
    ],
    valueProposition: 'Prevent costly bid mistakes with expert-level analysis'
  };

  const roiExamples = [
    { projectSize: '$1M', monthlyCost: 299, savings: 50000, roi: '16,700%' },
    { projectSize: '$5M', monthlyCost: 299, savings: 250000, roi: '83,600%' },
    { projectSize: '$10M', monthlyCost: 299, savings: 500000, roi: '167,100%' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Levelr
              </Link>
            </div>
            <nav className="flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/docs" className="text-gray-600 hover:text-gray-900">
                Documentation
              </Link>
              <Link 
                href="/analyze" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Start Analysis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Value-Driven Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with our high-value Professional tier to validate the platform's impact on your projects.
            One saved mistake pays for itself many times over.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-16">
          <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-500 text-white px-6 py-4 text-center">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-blue-100">{plan.valueProposition}</p>
            </div>
            
            <div className="px-6 py-8">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  ${plan.price}
                </div>
                <div className="text-gray-600">
                  per {plan.billingPeriod} • {plan.analysesPerMonth} analyses
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href="/analyze"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                Try one free analysis to experience the quality
              </p>
            </div>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            ROI Calculator: See Your Savings
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Project Size</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Monthly Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Potential Savings*</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Annual ROI</th>
                </tr>
              </thead>
              <tbody>
                {roiExamples.map((example, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-semibold">{example.projectSize}</td>
                    <td className="py-4 px-4">${example.monthlyCost}</td>
                    <td className="py-4 px-4 text-green-600 font-semibold">${example.savings.toLocaleString()}</td>
                    <td className="py-4 px-4 text-green-600 font-bold">{example.roi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-sm text-gray-600 mt-4">
            *Conservative 5% cost savings estimate based on identifying bid variances and missing scope items.
            Actual savings may be significantly higher when major issues are caught early.
          </p>
        </div>

        {/* Value Proposition */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why $299/Month is a Bargain
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Expert Analysis at Scale
                </h3>
                <p className="text-gray-600">
                  What would typically cost $5,000-15,000 in consultant fees per project 
                  is now available for $30 per analysis. Get expert-level insights instantly.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Risk Mitigation
                </h3>
                <p className="text-gray-600">
                  A single prevented cost overrun or identified missing scope item 
                  can save 10x-100x the monthly subscription cost.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Time Savings
                </h3>
                <p className="text-gray-600">
                  Replace weeks of manual analysis with minutes of AI-powered insights. 
                  Your time is worth far more than $299/month.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Real-World Impact
            </h3>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">$2.3M</div>
                <p className="text-gray-700">Average cost overrun Levelr helps prevent</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">94%</div>
                <p className="text-gray-700">Accuracy in identifying bid variances</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">15 min</div>
                <p className="text-gray-700">Average analysis time vs 2-3 weeks manual</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Promise */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Your Security is Our Promise
          </h3>
          
          <p className="text-gray-700 text-center max-w-3xl mx-auto">
            Your sensitive financial documents never leave your browser. All processing happens locally 
            on your device, with analysis results cleared immediately after export. Zero server storage, 
            maximum security.
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-600 rounded-lg p-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Prevent Your Next Million-Dollar Mistake?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start with a free analysis and see the quality of our expert-level insights
          </p>
          <Link 
            href="/analyze" 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
          >
            Try Free Analysis Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}