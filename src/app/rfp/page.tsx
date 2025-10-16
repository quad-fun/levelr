// import { auth } from "@clerk/nextjs/server";
// import { getUserTier } from "@/lib/pricing";
// import { getFlags } from "@/lib/flags";
// import { headers } from "next/headers";
import { GatedRoute } from "@/components/auth/GatedRoute";

async function RFPPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Generate RFP</h1>
          <p className="text-gray-600">
            RFP generation functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function RFPPage() {
  // Future implementation:
  // const { userId } = await auth();
  // const headersList = await headers();
  // const request = new Request('http://localhost', { headers: headersList });
  // let tier;
  // if (userId) {
  //   tier = await getUserTier(userId);
  // }

  // Resolve flags (for future use)
  // const flags = await getFlags({ userId: userId || undefined, tier, request });

  return (
    <GatedRoute requiredFlag="generateRfp">
      <RFPPageContent />
    </GatedRoute>
  );
}