import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { getFlags, toClientFlags } from "@/lib/flags";
import { headers } from "next/headers";
import { GatedRoute } from "@/components/auth/GatedRoute";
import BidLevelingClient from "./BidLevelingClient";

export default async function LevelingPage() {
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
  const clientFlags = toClientFlags(flags);

  return (
    <GatedRoute requiredFlag="bidLeveling">
      <BidLevelingClient flags={clientFlags} />
    </GatedRoute>
  );
}