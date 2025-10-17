// src/components/common/FeatureGate.tsx

import { Lock } from 'lucide-react';

interface FeatureGateProps {
  enabled: boolean;
  children: React.ReactNode;
  title: string;
  blurb?: string;
  placeholder?: "card" | "inline";
  ctaHref?: string;
}

export function FeatureGate({
  enabled,
  children,
  title,
  blurb,
  placeholder = "card",
  ctaHref = "/pricing",
}: FeatureGateProps) {
  if (enabled) return <>{children}</>;

  if (placeholder === "inline") {
    return (
      <span className="inline-flex items-center gap-2 text-gray-600">
        <Lock className="w-4 h-4" />
        Locked —{" "}
        <a className="underline hover:text-blue-600" href={ctaHref}>
          Upgrade
        </a>
      </span>
    );
  }

  // Show content with overlay instead of hiding it completely
  return (
    <div className="relative">
      {/* Show the actual content */}
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <div className="text-center p-6 max-w-md">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          {blurb && <p className="text-gray-600 mb-4">{blurb}</p>}
          <a
            href={ctaHref}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    </div>
  );
}