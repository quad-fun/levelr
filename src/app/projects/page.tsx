// src/app/projects/page.tsx

// import { auth } from "@clerk/nextjs/server";
// import { getUserTier } from "@/lib/pricing";
// import { getFlags } from "@/lib/flags";
// import { headers } from "next/headers";
import { GatedRoute } from "@/components/auth/GatedRoute";
import ProjectManager from '@/components/ecosystem/ProjectManager';

export default async function ProjectsPage() {
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
    <GatedRoute requiredFlag="projectManagement">
      <ProjectManager />
    </GatedRoute>
  );
}