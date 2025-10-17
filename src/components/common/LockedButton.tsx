// src/components/common/LockedButton.tsx

import { Lock } from 'lucide-react';

interface LockedButtonProps {
  children?: React.ReactNode;
  href?: string;
  className?: string;
  title?: string;
}

export function LockedButton({
  children = "Upgrade to use",
  href = "/pricing",
  className = "",
  title = "Upgrade to unlock this feature",
}: LockedButtonProps) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 border bg-gray-50 text-gray-600 cursor-not-allowed text-sm font-medium ${className}`}
      title={title}
    >
      {children}
      <Lock className="w-4 h-4" />
    </a>
  );
}