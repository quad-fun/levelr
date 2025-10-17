// src/components/common/FeatureGate.tsx

import { Upsell } from "./Upsell";
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

  return <Upsell title={title} blurb={blurb} ctaHref={ctaHref} />;
}