import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags, type Flags } from "@/lib/flags";
import { headers } from "next/headers";

interface GatedRouteProps {
  requiredFlag: keyof Flags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function GatedRoute({
  requiredFlag,
  children,
  fallback
}: GatedRouteProps) {
  const { userId } = await auth();
  const headersList = headers();
  const request = new Request('http://localhost', { headers: headersList });

  // Get user tier if authenticated
  let tier;
  if (userId) {
    tier = await getUserTier(userId);
  }

  // Resolve flags
  const flags = await getFlags({ userId, tier, request });

  // Check if feature is enabled
  if (!flags[requiredFlag]) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a2 2 0 00-2-2H7a2 2 0 00-2 2v2m0 0V7a2 2 0 012-2h5a2 2 0 012 2v2m0 0v2" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Feature Not Available
            </h2>
            <p className="text-gray-600 mb-6">
              {!userId
                ? "This feature requires authentication. Please sign in to continue."
                : `This feature is not available on your current plan. Contact admin@shorewoodgrp.com for access.`
              }
            </p>
            {!userId ? (
              <div className="space-y-3">
                <a
                  href="/sign-in"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
                >
                  Sign In
                </a>
                <a
                  href="/sign-up"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-block"
                >
                  Sign Up
                </a>
              </div>
            ) : (
              <a
                href="/pricing"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
              >
                Upgrade Plan
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}