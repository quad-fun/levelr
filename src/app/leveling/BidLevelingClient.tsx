"use client";

import BidLeveling from "@/components/analysis/BidLeveling";
import type { Flags } from "@/lib/flags";

interface BidLevelingClientProps {
  flags: Flags;
}

export default function BidLevelingClient({ flags }: BidLevelingClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bid Leveling</h1>
          <p className="text-gray-600">Compare and analyze multiple bids side by side</p>
        </div>
        <BidLeveling flags={flags} />
      </div>
    </div>
  );
}