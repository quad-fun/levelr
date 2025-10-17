// src/components/common/NavItem.tsx

interface NavItemProps {
  href: string;
  label: string;
  enabled: boolean;
  className?: string;
}

export function NavItem({
  href,
  label,
  enabled,
  className = "",
}: NavItemProps) {
  return (
    <a
      href={enabled ? href : "/pricing"}
      className={`flex items-center justify-between rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors ${
        enabled ? "text-gray-900" : "text-gray-500"
      } ${className}`}
    >
      <span>{label}</span>
      {!enabled && (
        <span className="text-xs rounded px-2 py-0.5 bg-gray-200 text-gray-600">
          Locked
        </span>
      )}
    </a>
  );
}