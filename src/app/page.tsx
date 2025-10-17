import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags } from "@/lib/flags";
import { headers } from "next/headers";
import { FeatureGate } from "@/components/common/FeatureGate";
import { BarChart3, FileText, Building2, TrendingUp, History, Settings } from 'lucide-react';

export default async function HomePage() {
  const { userId } = await auth();
  const headersList = await headers();
  const request = new Request('http://localhost', { headers: headersList });

  // Get user data if authenticated
  let tier;
  let userEmail;
  if (userId) {
    tier = await getUserTier(userId);
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      userEmail = user.emailAddresses?.[0]?.emailAddress;
    } catch (error) {
      console.warn('Failed to get user email:', error);
    }
  }

  // Resolve flags
  const flags = await getFlags({ userId: userId || undefined, userEmail, tier, request });

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Construction Analysis Platform</h1>
          <p className="mt-2 text-lg text-gray-600">
            Prevent million-dollar bid mistakes with AI-powered risk analysis
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureGate
            enabled={flags.bidAnalysis}
            title="Bid Analysis"
            blurb="Upload construction bids and detect cost risks with CSI division analysis."
          >
            <a
              href="/analyze"
              className="block rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Bid Analysis</h3>
              </div>
              <p className="text-gray-600 text-sm">
                AI-powered analysis of construction bids with market benchmarking and risk scoring.
              </p>
            </a>
          </FeatureGate>

          <FeatureGate
            enabled={flags.bidLeveling}
            title="Bid Leveling"
            blurb="Compare up to 5 bids side-by-side with variance analysis."
          >
            <a
              href="/leveling"
              className="block rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Bid Leveling</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Side-by-side bid comparison with automated variance detection and explanations.
              </p>
            </a>
          </FeatureGate>

          <FeatureGate
            enabled={flags.generateRfp}
            title="Generate RFP"
            blurb="Create professional RFPs with CSI scopes and commercial terms."
          >
            <a
              href="/rfp"
              className="block rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Generate RFP</h3>
              </div>
              <p className="text-gray-600 text-sm">
                AI-assisted RFP creation with professional templates and scope frameworks.
              </p>
            </a>
          </FeatureGate>

          <FeatureGate
            enabled={flags.projectManagement}
            title="Project Management"
            blurb="Timelines, budgets, change orders, and team collaboration."
          >
            <a
              href="/projects"
              className="block rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-8 h-8 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Project Management</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Complete project lifecycle management with budgets and milestone tracking.
              </p>
            </a>
          </FeatureGate>

          <FeatureGate
            enabled={flags.analysisHistory}
            title="Analysis History"
            blurb="Search prior analyses and create benchmarks."
          >
            <a
              href="/history"
              className="block rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <History className="w-8 h-8 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Analysis History</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Browse past analyses and build custom benchmarking datasets.
              </p>
            </a>
          </FeatureGate>

          {/* Settings/Profile always available */}
          <a
            href={flags.auth ? "/user-profile" : "/pricing"}
            className="block rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow bg-white"
          >
            <div className="flex items-center gap-3 mb-3">
              <Settings className="w-8 h-8 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {flags.auth ? "Account Settings" : "Get Started"}
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              {flags.auth
                ? "Manage your profile, billing, and preferences."
                : "Sign up to start analyzing construction bids with AI."
              }
            </p>
          </a>
        </div>

        {/* Quick Stats or CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Trusted by construction professionals for accurate bid analysis
          </p>
        </div>
      </main>
    </div>
  );
}
