// src/app/(legal)/terms/page.tsx

import { LegalLayout } from '@/components/layout/LegalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Levelr',
  robots: { index: true, follow: true }
};

export default function TermsOfService() {
  const legalEmail = process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? 'hello@levelr.app';

  return (
    <LegalLayout title="Terms of Service" lastUpdated="2024-12-18">
      <h2 id="parties">Agreement</h2>
      <p>
        These terms govern your use of Levelr, provided by Dandolo Digital LLC, a Wyoming
        limited liability company.
      </p>

      <h2 id="license">License to Use</h2>
      <p>
        We grant you a limited, revocable license to use Levelr for legitimate business
        purposes in accordance with these terms.
      </p>

      <h2 id="ai-disclaimer">AI Analysis Disclaimer</h2>
      <p>
        <strong>Important:</strong> All analysis results are generated using AI and are provided
        for informational purposes only. They are not engineering, legal, or financial advice.
        You must verify all results before making project decisions.
      </p>

      <h2 id="ownership">Ownership and Data</h2>
      <p>
        You retain ownership of your uploaded materials and analysis results. We do not store
        documents on our servers. Your data is processed locally in your browser for maximum security.
      </p>

      <h2 id="payments">Payments and Billing</h2>
      <p>Subscription terms:</p>
      <ul>
        <li>Subscriptions are processed through Stripe and auto-renew monthly</li>
        <li>Cancel anytime via your Billing Portal</li>
        <li>You are responsible for applicable taxes</li>
        <li>Price changes take effect at your next billing cycle</li>
      </ul>

      <h2 id="liability">Limitation of Liability</h2>
      <p>
        Our total liability to you is limited to the greater of USD $100 or fees you paid
        in the prior 12 months. We are not liable for indirect, special, or consequential
        damages.
      </p>

      <h2 id="warranty">Warranty Disclaimer</h2>
      <p>
        Levelr is provided "as is" and "as available" without warranties of any kind.
      </p>

      <h2 id="suspension">Suspension and Termination</h2>
      <p>
        We may suspend or terminate access for abuse, security concerns, or violation of
        these terms.
      </p>

      <h2 id="governing-law">Governing Law</h2>
      <p>
        These terms are governed by New York law. Any disputes will be resolved in the
        courts of New York County, New York.
      </p>

      <h2 id="export-controls">Export Controls</h2>
      <p>
        You agree to comply with all applicable export control laws and not use Levelr
        for prohibited purposes.
      </p>

      <h2 id="changes">Changes to Terms</h2>
      <p>
        We may update these terms. Continued use after changes constitutes acceptance
        of the updated terms.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        For legal questions, contact us at{' '}
        <a href={`mailto:${legalEmail}`}>{legalEmail}</a>.
      </p>
    </LegalLayout>
  );
}