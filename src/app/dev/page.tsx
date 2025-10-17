import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { redirect } from "next/navigation";

export default async function DevPage() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    redirect("/");
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const currentTier = await getUserTier(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-orange-600">
                Dev Tools
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Development Tools</h1>
          <p className="mt-2 text-lg text-gray-600">
            Testing utilities for tier management
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">User:</span>
              <p className="text-gray-900">{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Current Tier:</span>
              <p className="text-2xl font-bold text-blue-600 capitalize">{currentTier}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">User ID:</span>
              <p className="text-gray-900 font-mono text-sm">{userId}</p>
            </div>
          </div>
        </div>

        {/* Tier Testing */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Testing</h3>
          <p className="text-gray-600 mb-6">
            Click on a tier below to update your account and test different feature access levels.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['starter', 'pro', 'team', 'enterprise'] as const).map((tier) => (
              <a
                key={tier}
                href={`/api/dev/set-tier?tier=${tier}`}
                className={`block p-4 border-2 rounded-lg text-center transition-colors ${
                  currentTier === tier
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold capitalize">{tier}</div>
                {currentTier === tier && (
                  <div className="text-xs text-blue-600 mt-1">Current</div>
                )}
              </a>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800">How to Test:</h4>
            <ol className="mt-2 text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Click on a tier above to update your account</li>
              <li>Visit the dashboard to see the updated tier displayed</li>
              <li>Check feature access changes in the analyze page</li>
              <li>Verify that feature flags update according to the new tier</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}