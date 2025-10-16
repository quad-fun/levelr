import { auth } from "@clerk/nextjs/server";

// Admin user IDs - add your Clerk user ID here
const ADMIN_USER_IDS = new Set<string>([
  // Add your Clerk user ID after you sign up
]);

// Whitelisted email domains for full feature access
const WHITELISTED_DOMAINS = new Set<string>([
  "shorewoodgrp.com"
]);

// Whitelisted individual emails for full access
const WHITELISTED_EMAILS = new Set<string>([
  // Add specific emails here if needed
]);

export interface UserAccess {
  isAdmin: boolean;
  hasFullAccess: boolean;
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
}

export async function getUserAccess(): Promise<UserAccess> {
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
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Authentication required');
  }

  return userId;
}

export async function requireFullAccess() {
  const access = await getUserAccess();

  if (!access.isAuthenticated) {
    throw new Error('Authentication required');
  }

  if (!access.hasFullAccess) {
    throw new Error('Full access required. Contact admin@shorewoodgrp.com for access.');
  }

  return access;
}