import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags, toClientFlags } from "@/lib/flags";
import { headers } from "next/headers";
import { GatedRoute } from "@/components/auth/GatedRoute";
import AnalyzePageClient from "./AnalyzePageClient";

export default async function AnalyzePage() {
  const { userId } = await auth();
  const headersList = await headers();
  const request = new Request('http://localhost', { headers: headersList });

  // Get user tier if authenticated
  let tier;
  if (userId) {
    tier = await getUserTier(userId);
  }

  // Resolve flags
  const flags = await getFlags({ userId: userId || undefined, tier, request });
  const clientFlags = toClientFlags(flags);

  return (
    <GatedRoute requiredFlag="bidAnalysis">
      <AnalyzePageClient flags={clientFlags} />
    </GatedRoute>
  );
}