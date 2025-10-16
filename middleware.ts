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
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};