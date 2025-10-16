"use client";

import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">User Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
          <div className="p-6">
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0",
                  navbar: "hidden",
                  pageScrollBox: "px-0"
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}