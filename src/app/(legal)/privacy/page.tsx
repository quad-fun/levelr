// src/app/(legal)/privacy/page.tsx

import { LegalLayout } from '@/components/layout/LegalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Levelr',
  robots: { index: true, follow: true }
};

export default function PrivacyPolicy() {
  const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? 'hello@levelr.app';

  return (
    <LegalLayout title="Privacy Policy" lastUpdated="2024-12-18">
      <h2 id="introduction">Introduction</h2>
      <p>
        Levelr is provided by Dandolo Digital LLC, a Wyoming limited liability company
        operating from New York. We are committed to protecting your privacy and being
        transparent about how we handle your data.
      </p>

      <h2 id="data-collection">Data We Collect</h2>
      <p>We collect minimal data necessary to provide our service:</p>
      <ul>
        <li><strong>Account Information:</strong> Email address, name, and account identifiers</li>
        <li><strong>Billing Information:</strong> Subscription and payment metadata managed by Stripe</li>
        <li><strong>Analytics:</strong> Basic product usage analytics to improve our service</li>
        <li><strong>Documents:</strong> We do not permanently store user documents on our servers</li>
      </ul>

      <h2 id="processing-model">Our Processing Model</h2>
      <p>
        Levelr processes documents locally in your browser for maximum security. When AI analysis
        is required, document content may be transmitted securely to Anthropic for the specific
        request and is not retained by us. We immediately discard transient data and do not
        persist documents server-side.
      </p>

      <h2 id="third-parties">Third-Party Services</h2>
      <p>We work with trusted third-party providers:</p>
      <ul>
        <li><strong>Clerk:</strong> Authentication and user management</li>
        <li><strong>Stripe:</strong> Payment processing and billing</li>
        <li><strong>Anthropic:</strong> AI analysis services</li>
        <li><strong>Vercel:</strong> Application hosting and infrastructure</li>
      </ul>

      <h2 id="legal-basis">Legal Basis for Processing</h2>
      <p>We process your data based on:</p>
      <ul>
        <li><strong>Contract:</strong> Providing the Levelr service to you</li>
        <li><strong>Legitimate Interests:</strong> Improving service safety and performance</li>
        <li><strong>Consent:</strong> Where applicable and required by law</li>
      </ul>

      <h2 id="your-rights">Your Data Rights</h2>
      <p>
        You have rights to access, correct, and delete your personal data. To exercise these
        rights, contact us at <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
      </p>

      <h2 id="children">Children's Privacy</h2>
      <p>Levelr is not intended for use by individuals under 16 years of age.</p>

      <h2 id="international">International Transfers</h2>
      <p>
        Data transfers to third parties are handled through their respective compliance frameworks
        and appropriate safeguards.
      </p>

      <h2 id="changes">Policy Changes</h2>
      <p>
        We may update this policy from time to time. Changes will be posted here with an updated
        effective date.
      </p>

      <h2 id="contact">Contact Us</h2>
      <p>
        For privacy-related questions, contact Dandolo Digital LLC at{' '}
        <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
      </p>
    </LegalLayout>
  );
}