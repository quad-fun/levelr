import { auth } from "@clerk/nextjs/server";

// Admin user IDs - add your Clerk user ID here
const ADMIN_USER_IDS = new Set<string>([
  "quad-fun" // Johnny - quadfund.io admin
]);

// Whitelisted email domains for full feature access
const WHITELISTED_DOMAINS = new Set<string>([
  "shorewoodgrp.com"
]);

// Whitelisted individual emails for full access
const WHITELISTED_EMAILS = new Set<string>([
  "johnny@quadfund.io" // Admin email
]);

export interface UserAccess {
  isAdmin: boolean;
  hasFullAccess: boolean;
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
}

export async function getUserAccess(): Promise<UserAccess> {
  const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

  if (!isAuthEnabled) {
    // When auth is disabled, return full access (MVP mode)
    return {
      isAdmin: true,
      hasFullAccess: true,
      isAuthenticated: false,
      userId: 'mvp-user',
      email: 'mvp@levelr.app'
    };
  }

  try {
    const { userId, sessionClaims } = await auth();

    if (!userId || !sessionClaims) {
      return {
        isAdmin: false,
        hasFullAccess: false,
        isAuthenticated: false
      };
    }

    const email = sessionClaims.email as string;
    const emailDomain = email?.split('@')[1]?.toLowerCase();

    const isAdmin = ADMIN_USER_IDS.has(userId);
    const hasFullAccess = isAdmin ||
                         WHITELISTED_EMAILS.has(email?.toLowerCase() || '') ||
                         WHITELISTED_DOMAINS.has(emailDomain || '');

    return {
      isAdmin,
      hasFullAccess,
      isAuthenticated: true,
      userId,
      email
    };
  } catch (error) {
    console.warn('Auth check failed:', error);
    return {
      isAdmin: false,
      hasFullAccess: false,
      isAuthenticated: false
    };
  }
}

export async function requireAuth() {
  const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

  if (!isAuthEnabled) {
    return 'mvp-user'; // MVP mode - always allow
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Authentication required');
    }

    return userId;
  } catch {
    throw new Error('Authentication required');
  }
}

export async function requireFullAccess() {
  const access = await getUserAccess();

  if (!access.hasFullAccess) {
    throw new Error('Full access required. Contact admin@shorewoodgrp.com for access.');
  }

  return access;
}