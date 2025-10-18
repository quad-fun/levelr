// src/components/layout/SiteFooter.tsx

import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Dandolo Digital LLC. All rights reserved.
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-gray-900">
              Terms
            </Link>
            <Link href="/refund" className="text-gray-600 hover:text-gray-900">
              Refund
            </Link>
            <Link href="/cookies" className="text-gray-600 hover:text-gray-900">
              Cookies
            </Link>
            <a href="mailto:hello@levelr.app" className="text-gray-600 hover:text-gray-900">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}