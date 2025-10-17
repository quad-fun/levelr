// src/app/projects/page.tsx

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags } from "@/lib/flags";
import { headers } from "next/headers";
import ProjectManager from '@/components/ecosystem/ProjectManager';

export default async function ProjectsPage() {
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

  // Gate on teams flag - if disabled, show coming soon page
  if (!flags.teams) {
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
                  href="/analyze"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Back to Analysis
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Coming Soon Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="mx-auto max-w-md">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Teams Coming Soon
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Project collaboration and team management features are coming soon. Upgrade to Team or Enterprise plan to get early access.
              </p>
              <div className="space-y-4">
                <a
                  href="/pricing"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View Pricing Plans
                </a>
                <div>
                  <a
                    href="/analyze"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Back to Analysis
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <ProjectManager />;
}