import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

// Conditionally export the middleware
export default isAuthEnabled
  ? clerkMiddleware()
  : function middleware(request: NextRequest) {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};