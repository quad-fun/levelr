import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes that require authentication when auth is enabled
const isProtectedRoute = createRouteMatcher([
  '/analyze(.*)',
  '/projects(.*)',
  '/api/claude(.*)',
  '/api/leveling(.*)',
  '/api/variance(.*)',
  '/api/rfp(.*)'
]);

// Always export clerkMiddleware to satisfy Clerk's detection
export default clerkMiddleware(async (auth, req) => {
  const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

  // Only protect routes when auth is enabled
  if (isAuthEnabled && isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};