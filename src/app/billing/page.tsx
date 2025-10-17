import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { redirect } from "next/navigation";
import { CheckCircle, CreditCard, Calendar, Zap } from 'lucide-react';

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }


  const tier = await getUserTier(userId);

  const isPro = tier === 'pro';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                Levelr
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/analyze"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Analysis
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your subscription and billing preferences
          </p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
              <p className="text-gray-600">Your current subscription status</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isPro
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </div>
          </div>

          {isPro ? (
            // Pro Plan Details
            <div className="border border-green-200 rounded-lg p-6 bg-green-50">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Levelr Pro</h3>
                  <p className="text-green-700">Active subscription</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-900 mb-3">Features Included:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Unlimited monthly analyses
                    </li>
                    <li className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      All analysis types (Construction, Design, Trade)
                    </li>
                    <li className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Advanced export features
                    </li>
                    <li className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Inline variance explanations
                    </li>
                    <li className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Priority email support
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-green-900 mb-3">Subscription Details:</h4>
                  <div className="space-y-2 text-green-700">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Monthly billing
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Next payment: Auto-renew
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-green-600">
                      Manage your subscription through the Stripe customer portal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Upgrade to Pro
            <div className="border border-blue-200 rounded-lg p-6">
              <div className="text-center mb-6">
                <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upgrade to Levelr Pro
                </h3>
                <p className="text-gray-600 mb-6">
                  Unlock unlimited analyses and advanced features
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">What you'll get:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Unlimited Analyses</div>
                        <div className="text-sm text-gray-600">No more monthly limits</div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">All Analysis Types</div>
                        <div className="text-sm text-gray-600">Construction, Design, and Trade</div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Advanced Exports</div>
                        <div className="text-sm text-gray-600">PDF and Excel reports</div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Inline Explanations</div>
                        <div className="text-sm text-gray-600">AI-powered variance insights</div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900">$49</div>
                    <div className="text-gray-600">/month</div>
                  </div>

                  <UpgradeButton />

                  <p className="text-xs text-gray-500 mt-4">
                    Cancel anytime. No long-term contracts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-600">Feature</th>
                  <th className="text-center py-3 text-gray-600">Starter</th>
                  <th className="text-center py-3 text-blue-600">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 text-gray-900">Monthly Analyses</td>
                  <td className="py-3 text-center text-gray-600">3</td>
                  <td className="py-3 text-center text-blue-600 font-semibold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-900">Construction Analysis</td>
                  <td className="py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-900">Design & Trade Analysis</td>
                  <td className="py-3 text-center text-gray-400">—</td>
                  <td className="py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-900">Export Reports</td>
                  <td className="py-3 text-center text-gray-400">—</td>
                  <td className="py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-900">Inline Explanations</td>
                  <td className="py-3 text-center text-gray-400">—</td>
                  <td className="py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// Client component for upgrade button
function UpgradeButton() {
  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?cancelled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
    >
      Upgrade to Pro
    </button>
  );
}