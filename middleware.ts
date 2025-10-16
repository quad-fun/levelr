import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/analyze(.*)',
  '/projects(.*)',
  '/api/claude(.*)',
  '/api/leveling(.*)',
  '/api/variance(.*)',
  '/api/rfp(.*)'
]);

// Conditionally export the middleware
export default isAuthEnabled
  ? clerkMiddleware(async (auth, req) => {
      // Protect specific routes when auth is enabled
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : function middleware() {
      // No protection when auth is disabled (MVP mode)
      return;
    };

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};