"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function AccessIndicator() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const email = user.emailAddresses[0]?.emailAddress;
  const isAdmin = email === 'johnny@quadfund.io';

  return (
    <div className="flex items-center space-x-3 text-sm">
      {isAdmin && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span className="text-purple-700 font-medium">Admin</span>
        </div>
      )}

      <Link
        href="/profile"
        className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
      >
        Profile
      </Link>
    </div>
  );
}

interface AccessGuardProps {
  children: React.ReactNode;
  requireFullAccess?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export function AccessGuard({
  children,
  requireFullAccess = false,
  requireAdmin = false,
  fallback
}: AccessGuardProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!user) {
    return fallback || <div className="p-4 text-center text-red-600">Authentication required</div>;
  }

  const email = user.emailAddresses[0]?.emailAddress;
  const emailDomain = email?.split('@')[1]?.toLowerCase();

  const hasFullAccess = emailDomain === 'shorewoodgrp.com' || email === 'johnny@quadfund.io';
  const isAdmin = user?.username === 'quad-fun' || email === 'johnny@quadfund.io';

  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="p-4 text-center">
        <div className="text-red-600 font-medium">Admin access required</div>
        <div className="text-sm text-gray-600 mt-1">
          Contact admin@shorewoodgrp.com for access
        </div>
      </div>
    );
  }

  if (requireFullAccess && !hasFullAccess && !isAdmin) {
    return fallback || (
      <div className="p-4 text-center">
        <div className="text-yellow-600 font-medium">Full access required</div>
        <div className="text-sm text-gray-600 mt-1">
          @shorewoodgrp.com email required or contact admin for access
        </div>
      </div>
    );
  }

  return <>{children}</>;
}