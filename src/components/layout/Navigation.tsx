// src/components/layout/Navigation.tsx

import { NavItem } from '@/components/common/NavItem';
import type { Flags } from '@/lib/flags';

interface NavigationProps {
  flags: Flags;
  currentPath?: string;
}

export function Navigation({ flags, currentPath }: NavigationProps) {
  const navItems = [
    {
      href: "/analyze",
      label: "Analysis",
      enabled: flags.bidAnalysis,
    },
    {
      href: "/leveling",
      label: "Bid Leveling",
      enabled: flags.bidLeveling,
    },
    {
      href: "/history",
      label: "History",
      enabled: flags.analysisHistory,
    },
    {
      href: "/rfp",
      label: "Generate RFP",
      enabled: flags.generateRfp,
    },
    {
      href: "/projects",
      label: "Projects",
      enabled: flags.projectManagement,
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              enabled={item.enabled}
              className={`whitespace-nowrap ${
                currentPath === item.href ? 'bg-gray-50' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}