"use client";

import { useUser } from "@clerk/nextjs";

export function AccessIndicator() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (!user) {
    return <div className="text-sm text-red-600">Not authenticated</div>;
  }

  const email = user.emailAddresses[0]?.emailAddress;
  const emailDomain = email?.split('@')[1]?.toLowerCase();

  // Check if user has full access
  const hasFullAccess = emailDomain === 'shorewoodgrp.com' || email === 'johnny@quadfund.io';

  // Check if user is admin (using GitHub username as Clerk user ID)
  const isAdmin = user.username === 'quad-fun' || email === 'johnny@quadfund.io';

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-green-700">Authenticated</span>
      </div>

      {hasFullAccess && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-blue-700">Full Access (@shorewoodgrp.com)</span>
        </div>
      )}

      {isAdmin && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span className="text-purple-700">Admin</span>
        </div>
      )}

      <div className="text-gray-600">
        {email}
      </div>
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