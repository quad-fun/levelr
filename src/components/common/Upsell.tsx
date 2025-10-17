// src/components/common/Upsell.tsx

import { Lock } from 'lucide-react';

interface UpsellProps {
  title: string;
  blurb?: string;
  ctaHref?: string;
  size?: "sm" | "md" | "lg";
}

export function Upsell({
  title,
  blurb,
  ctaHref = "/pricing",
  size = "md",
}: UpsellProps) {
  const pad = size === "lg" ? "p-8" : size === "sm" ? "p-3" : "p-5";

  return (
    <div className={`rounded-2xl border bg-white/60 ${pad}`}>
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 mt-1 opacity-70 text-gray-500" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {blurb && <p className="mt-1 text-sm text-gray-600">{blurb}</p>}
          <a
            href={ctaHref}
            className="inline-block mt-3 rounded-xl px-3 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade
          </a>
        </div>
      </div>
    </div>
  );
}