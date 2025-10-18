// src/app/(legal)/cookies/page.tsx

import { LegalLayout } from '@/components/layout/LegalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Notice — Levelr',
  robots: { index: true, follow: true }
};

export default function CookieNotice() {
  return (
    <LegalLayout title="Cookie Notice" lastUpdated="2024-12-18">
      <h2 id="what-are-cookies">What Are Cookies</h2>
      <p>
        Cookies are small text files stored on your device when you visit our website.
        They help us provide and improve our service.
      </p>

      <h2 id="cookies-we-use">Cookies We Use</h2>
      <p>We use the following types of cookies:</p>
      <ul>
        <li>
          <strong>Essential Cookies:</strong> Required for authentication, session management,
          and basic website functionality
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Help us understand how you use Levelr to
          improve our service
        </li>
      </ul>
      <p>We do not use advertising or tracking cookies.</p>

      <h2 id="managing-cookies">Managing Cookies</h2>
      <p>
        You can control cookies through your browser settings. Note that disabling
        essential cookies may affect website functionality.
      </p>
      <p>Browser cookie settings:</p>
      <ul>
        <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
        <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
        <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
        <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
      </ul>

      <h2 id="more-information">More Information</h2>
      <p>
        For more details about how we handle your data, please see our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        If you have questions about our use of cookies, contact us at{' '}
        <a href="mailto:hello@levelr.app">hello@levelr.app</a>.
      </p>
    </LegalLayout>
  );
}