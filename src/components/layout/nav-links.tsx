"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** `tour` is the `data-tour` anchor of the guided tour, when a step points at this item. */
export type NavItem = { href: string; label: string; tour?: string };

/** Top-bar navigation; the active item gets a white underline, not just a color change. */
export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav aria-label={t("mainLabel")} className={className}>
      <ul className="flex h-full items-stretch gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-tour={item.tour}
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
