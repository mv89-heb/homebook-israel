"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "🏠", label: "בית" },
  { href: "/professionals", icon: "🔧", label: "בעלי מקצוע" },
  { href: "/profile", icon: "👤", label: "פרופיל" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-neutral-200 bg-white/95 backdrop-blur-sm lg:hidden"
      aria-label="ניווט ראשי"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
              isActive ? "text-brand-700" : "text-neutral-500"
            }`}
          >
            <span className="text-lg" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
