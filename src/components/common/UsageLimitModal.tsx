'use client';

import { useState } from 'react';
import { X, Lock, TrendingUp } from 'lucide-react';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier?: string;
  currentUsage?: number;
  limit?: number;
}

export function UsageLimitModal({
  isOpen,
  onClose,
  tier: _tier = 'starter',
  currentUsage = 3,
  limit = 3
}: UsageLimitModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    } transition-opacity duration-150`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 ${
        isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      } transition-all duration-150`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Usage Limit Reached
          </h3>

          <p className="text-gray-600 mb-6">
            Free plan includes <strong>3 analyses per month</strong>. You've used {currentUsage} of {limit} analyses this month.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-1">
                  Upgrade to Pro for Unlimited Access
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Unlimited monthly analyses</li>
                  <li>• All analysis types (Construction, Design, Trade)</li>
                  <li>• Advanced export features</li>
                  <li>• Inline variance explanations</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Maybe Later
            </button>
            <a
              href="/pricing"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-center"
            >
              View Plans
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}