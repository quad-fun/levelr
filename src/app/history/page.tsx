import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags } from "@/lib/flags";
import { headers } from "next/headers";
import { GatedRoute } from "@/components/auth/GatedRoute";
import AnalysisHistory from "@/components/analysis/AnalysisHistory";

export default async function HistoryPage() {
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

  return (
    <GatedRoute requiredFlag="analysisHistory">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnalysisHistory />
        </div>
      </div>
    </GatedRoute>
  );
}