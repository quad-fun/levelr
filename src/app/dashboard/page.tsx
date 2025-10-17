import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags } from "@/lib/flags";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const tier = await getUserTier(userId);

  const headersList = await headers();
  const request = new Request('http://localhost', { headers: headersList });
  const flags = await getFlags({
    userId,
    userEmail: user?.emailAddresses?.[0]?.emailAddress,
    tier,
    request
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                Levelr Dashboard
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/analyze"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Back to Analysis
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName || 'User'}!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your account and view your subscription details
          </p>
        </div>

        {/* User Info Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* User Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{user?.emailAddresses?.[0]?.emailAddress}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">User ID:</span>
                <p className="text-gray-900 font-mono text-sm">{userId}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Member Since:</span>
                <p className="text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Current Tier */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Tier:</span>
                <p className="text-2xl font-bold text-blue-600 capitalize">{tier}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Metadata:</span>
                <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(user?.publicMetadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Feature Access */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Access</h3>
            <div className="space-y-2">
              {Object.entries(flags).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="/analyze"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Analysis
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View Plans
            </a>
            <a
              href="/user-profile"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit Profile
            </a>
            {process.env.NODE_ENV === 'development' && (
              <a
                href="/api/dev/set-tier?tier=pro"
                className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
              >
                [DEV] Set Pro Tier
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}