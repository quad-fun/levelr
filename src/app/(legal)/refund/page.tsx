// src/app/(legal)/refund/page.tsx

import { LegalLayout } from '@/components/layout/LegalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Levelr',
  robots: { index: true, follow: true }
};

export default function RefundPolicy() {
  const billingEmail = process.env.NEXT_PUBLIC_BILLING_EMAIL ?? 'hello@levelr.app';

  return (
    <LegalLayout title="Refund & Cancellation Policy" lastUpdated="2024-12-18">
      <h2 id="subscriptions">Subscription Management</h2>
      <p>
        Subscriptions renew automatically unless canceled. Your access continues until
        the end of your current paid period after cancellation.
      </p>

      <h2 id="cancellation">How to Cancel</h2>
      <p>
        You can cancel your subscription at any time through your{' '}
        <a href="/billing">Billing Portal</a>. Cancellation takes effect at the end
        of your current billing period.
      </p>

      <h2 id="refunds">Refund Policy</h2>
      <p>
        We do not offer prorated refunds for partial billing periods. Refunds are
        only provided in the following circumstances:
      </p>
      <ul>
        <li>Duplicate charges due to processing errors</li>
        <li>Fraudulent use of your payment method</li>
        <li>Where required by applicable law</li>
      </ul>
      <p>All refund requests are handled on a case-by-case basis.</p>

      <h2 id="payment-methods">Payment Methods</h2>
      <p>
        Payment methods are managed securely by Stripe. You can update your payment
        information through your Billing Portal at any time.
      </p>

      <h2 id="billing-issues">Billing Questions</h2>
      <p>
        For billing questions or refund requests, contact us at{' '}
        <a href={`mailto:${billingEmail}`}>{billingEmail}</a>. Please include your
        account email and details about your request.
      </p>

      <h2 id="changes">Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. Changes will be posted here
        with an updated effective date.
      </p>
    </LegalLayout>
  );
}