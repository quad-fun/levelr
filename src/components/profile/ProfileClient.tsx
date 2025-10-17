'use client';

import { User, CreditCard, Shield, ArrowRight } from 'lucide-react';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { ManageSubscription } from '@/components/billing/ManageSubscription';

interface UserData {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: { emailAddress: string }[];
  createdAt?: Date | number;
}

interface ProfileClientProps {
  user: UserData | null;
  tier: 'starter' | 'pro' | 'team' | 'enterprise';
}

export function ProfileClient({ user, tier }: ProfileClientProps) {
  const isPro = tier === 'pro';
  const email = user?.emailAddresses?.[0]?.emailAddress;

  const getTierInfo = () => {
    switch (tier) {
      case 'starter':
        return {
          name: 'Starter',
          price: 'Free',
          description: '10 analyses per month',
          color: 'gray',
          features: ['Basic bid analysis', 'PDF exports', 'Email support']
        };
      case 'pro':
        return {
          name: 'Pro',
          price: '$299/month',
          description: 'Unlimited analyses',
          color: 'blue',
          features: ['All analysis types', 'Advanced exports', 'Priority support', 'Usage analytics']
        };
      default:
        return {
          name: 'Starter',
          price: 'Free',
          description: '10 analyses per month',
          color: 'gray',
          features: ['Basic bid analysis', 'PDF exports', 'Email support']
        };
    }
  };

  const tierInfo = getTierInfo();

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Member Since</label>
            <p className="text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">User ID</label>
            <p className="text-gray-900 font-mono text-sm">{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Subscription & Billing */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Subscription & Billing</h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isPro ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {tierInfo.name}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Details */}
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">{tierInfo.name} Plan</h3>
              <p className="text-2xl font-bold text-gray-900">{tierInfo.price}</p>
              <p className="text-sm text-gray-600">{tierInfo.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Features included:</h4>
              <ul className="space-y-1">
                {tierInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Shield className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div>
            {isPro ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center text-green-800 mb-2">
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="font-medium">Active Subscription</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Your Pro subscription is active. Manage billing, update payment methods, and view invoices.
                  </p>
                  <ManageSubscription />
                </div>

                <div className="text-xs text-gray-500">
                  <p>Need help? Contact support for assistance with your subscription.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Upgrade to Pro</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Unlock unlimited analyses, all discipline types, and advanced features.
                  </p>
                  <UpgradeButton />
                </div>

                <div className="text-xs text-gray-500">
                  <p>Pro features: Unlimited monthly analyses • Design & Trade analysis • Advanced exports • Priority support</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/analyze"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-900">Start Analysis</h3>
              <p className="text-sm text-gray-600 group-hover:text-blue-700">Analyze construction documents</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
          </a>

          <a
            href="/billing"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-900">Billing Details</h3>
              <p className="text-sm text-gray-600 group-hover:text-blue-700">View detailed billing info</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
          </a>

          {process.env.NODE_ENV === 'development' && (
            <a
              href="/dev"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 group-hover:text-orange-900">Dev Tools</h3>
                <p className="text-sm text-gray-600 group-hover:text-orange-700">Feature flags & testing</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}