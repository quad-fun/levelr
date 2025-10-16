import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

  // Handle dev flag overrides
  const url = new URL(req.url);
  const flagsParam = url.searchParams.get('flags');

  if (flagsParam) {
    try {
      // Validate that it's valid JSON
      JSON.parse(flagsParam);
      const base64Flags = btoa(flagsParam);

      // Create response with headers and cookies
      const response = NextResponse.next();
      response.headers.set('x-ff', base64Flags);
      response.cookies.set('ff', base64Flags, {
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Remove flags param from URL to avoid exposing it
      url.searchParams.delete('flags');
      if (url.searchParams.toString() !== new URL(req.url).searchParams.toString()) {
        return NextResponse.redirect(url);
      }

      return response;
    } catch (error) {
      console.warn('Invalid flags parameter:', error);
    }
  }

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