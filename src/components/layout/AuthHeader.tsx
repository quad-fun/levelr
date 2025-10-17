"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/nextjs";
import { AccessIndicator } from "@/components/auth/AccessControl";

export function AuthHeader() {
  const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

  if (!isAuthEnabled) return null;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Levelr
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <SignedIn>
              <AccessIndicator />
            </SignedIn>
            <a
              href="/docs"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              How To Guide
            </a>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
                userProfileMode="modal"
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Profile & Billing"
                    labelIcon={<span>👤</span>}
                    href="/profile"
                  />
                  <UserButton.Action label="manageAccount" />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}