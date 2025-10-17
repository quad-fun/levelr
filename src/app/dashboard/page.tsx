import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags } from "@/lib/flags";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

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

        <DashboardClient user={user} tier={tier} flags={flags} />
      </main>
    </div>
  );
}