import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags, toClientFlags } from "@/lib/flags";
import { headers } from "next/headers";
import { GatedRoute } from "@/components/auth/GatedRoute";
import AnalyzePageClient from "./AnalyzePageClient";

export default async function AnalyzePage() {
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
  const clientFlags = toClientFlags(flags);

  return (
    <GatedRoute requiredFlag="bidAnalysis">
      <AnalyzePageClient flags={clientFlags} />
    </GatedRoute>
  );
}