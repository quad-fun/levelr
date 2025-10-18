// src/components/common/AIDisclaimer.tsx

export function AIDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-600 ${className}`}>
      Analyses are generated using AI (Anthropic Claude) and are provided for informational purposes only.
      They are not engineering, legal, or financial advice. Always verify results before making project decisions.
    </p>
  );
}