'use client';

import { useState } from 'react';
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';
import type { User } from '@clerk/nextjs/server';

interface DashboardClientProps {
  user: User | null;
  tier: 'starter' | 'pro' | 'team' | 'enterprise';
  flags: Record<string, boolean>;
}

export function DashboardClient({ user, tier, flags }: DashboardClientProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard?cancelled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <>
      {/* User Info Grid */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 mb-8">
        {/* Account Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">User ID:</span>
              <p className="text-gray-900 font-mono text-sm">{user?.id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Member Since:</span>
              <p className="text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Access */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Access</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(flags).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="mb-8">
        <SubscriptionStatus
          tier={tier}
          onUpgrade={tier === 'starter' ? handleUpgrade : undefined}
        />
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <a
            href="/analyze"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Analysis
          </a>
          <a
            href="/billing"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Billing & Subscription
          </a>
          {process.env.NODE_ENV === 'development' && (
            <a
              href="/dev"
              className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              Dev Tools
            </a>
          )}
        </div>
      </div>
    </>
  );
}