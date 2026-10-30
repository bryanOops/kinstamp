"use client";

import { ChevronDownIcon, LogOutIcon, SettingsIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/server/actions/auth";

type UserMenuProps = {
  fullName: string;
  email: string;
  role: "client" | "attorney";
};

export function UserMenu({ fullName, email, role }: UserMenuProps) {
  const t = useTranslations("userMenu");
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-11 max-w-56 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm sm:h-9 sm:px-2 font-medium text-white transition-colors duration-(--duration-fast) hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none aria-expanded:bg-white/10"
        aria-label={t("open", { name: fullName })}
      >
        <UserRoundIcon className="size-4 shrink-0 text-white/80" aria-hidden="true" />
        <span className="hidden truncate sm:inline">{fullName}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-white/60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-overlay">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-ink">{fullName}</p>
            <p className="truncate text-xs font-normal text-ink-muted">{email}</p>
            <p className="mt-1 text-xs font-medium text-ink-muted">{t(`role.${role}`)}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/settings" />}
          className="h-10 cursor-pointer rounded-lg px-2.5 text-md"
        >
          <SettingsIcon aria-hidden="true" />
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="h-10 cursor-pointer rounded-lg px-2.5 text-md"
          disabled={pending}
          onClick={() => startTransition(() => signOut())}
        >
          <LogOutIcon aria-hidden="true" />
          {pending ? t("signingOut") : t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
