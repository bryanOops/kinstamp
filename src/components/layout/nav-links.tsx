"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

/** Top-bar navigation; the active item gets a white underline, not just a color change. */
export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex h-full items-stretch gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center rounded-md px-3 text-sm font-medium transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none",
                  "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity after:duration-(--duration-fast)",
                  active ? "text-white after:opacity-100" : "text-white/65 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
