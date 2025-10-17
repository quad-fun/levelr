'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SubscriptionStatusProps {
  tier: 'starter' | 'pro' | 'team' | 'enterprise';
  onUpgrade?: () => void;
}

export function SubscriptionStatus({ tier, onUpgrade }: SubscriptionStatusProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!onUpgrade) return;

    setIsLoading(true);
    try {
      await onUpgrade();
    } finally {
      setIsLoading(false);
    }
  };

  const getTierInfo = () => {
    switch (tier) {
      case 'starter':
        return {
          name: 'Starter',
          color: 'gray',
          icon: AlertCircle,
          description: '10 analyses per month',
          price: 'Free',
          features: ['Basic bid analysis', 'PDF exports', 'Email support']
        };
      case 'pro':
        return {
          name: 'Pro',
          color: 'blue',
          icon: CheckCircle,
          description: 'Unlimited analyses',
          price: '$299/month',
          features: ['All analysis types', 'Advanced exports', 'Priority support', 'Usage analytics']
        };
      default:
        return {
          name: 'Starter',
          color: 'gray',
          icon: AlertCircle,
          description: '10 analyses per month',
          price: 'Free',
          features: ['Basic bid analysis', 'PDF exports', 'Email support']
        };
    }
  };

  const tierInfo = getTierInfo();
  const IconComponent = tierInfo.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            tierInfo.color === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <IconComponent className={`w-5 h-5 ${
              tierInfo.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {tierInfo.name} Plan
            </h3>
            <p className="text-sm text-gray-600">{tierInfo.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{tierInfo.price}</div>
          {tier === 'pro' && (
            <div className="text-sm text-gray-500">Billed monthly</div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Features included:</h4>
        <ul className="space-y-1">
          {tierInfo.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {tier === 'starter' && onUpgrade && (
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Upgrading...
            </div>
          ) : (
            <>
              <CreditCard className="w-4 h-4 inline mr-2" />
              Upgrade to Pro
            </>
          )}
        </button>
      )}

      {tier === 'pro' && (
        <div className="flex items-center justify-center text-sm text-green-600 bg-green-50 py-2 rounded-lg">
          <CheckCircle className="w-4 h-4 mr-2" />
          Active subscription
        </div>
      )}
    </div>
  );
}