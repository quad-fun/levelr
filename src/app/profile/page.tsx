import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/pricing";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const currentTier = await getUserTier(userId);

  // Extract only the data we need to avoid serialization issues
  const userData = {
    id: user?.id,
    firstName: user?.firstName,
    lastName: user?.lastName,
    emailAddresses: user?.emailAddresses?.map(email => ({
      emailAddress: email.emailAddress
    })),
    createdAt: user?.createdAt
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your account, subscription, and billing
          </p>
        </div>

        <ProfileClient user={userData} tier={currentTier} />
      </main>
    </div>
  );
}