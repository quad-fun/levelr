'use client';

import { useState } from 'react';
import { ExternalLink, Settings } from 'lucide-react';

export function ManageSubscription() {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/billing`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to access customer portal');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert(`Failed to access billing portal: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleManageSubscription}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          Loading...
        </div>
      ) : (
        <>
          <Settings className="w-4 h-4 mr-2" />
          Manage Subscription
          <ExternalLink className="w-3 h-3 ml-1" />
        </>
      )}
    </button>
  );
}