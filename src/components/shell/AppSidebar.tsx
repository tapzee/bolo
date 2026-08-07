"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderClock,
  HelpCircle,
  Home,
  LayoutTemplate,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { formatAllowance } from "@/core";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCredits } from "@/lib/credits/use-credits";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/create", label: "Create", icon: Wand2 },
  { href: "/projects", label: "My projects", icon: FolderClock },
  { href: "/styles", label: "Templates", icon: LayoutTemplate },
  { href: "/pricing", label: "Pricing", icon: Sparkles },
] as const;

const SECONDARY = [
  { href: "/help", label: "Help", icon: HelpCircle },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Emails that see the Admin link.
 *
 * This is presentation only — it hides a menu item, nothing more. Access is
 * enforced server-side in `/api/admin/*` against the `ADMIN_EMAILS` env var,
 * which never reaches the browser. Anyone can navigate to /admin directly and
 * they will simply be refused.
 */
const ADMIN_UI_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_UI_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter((email) => email.length > 0);

/**
 * Persistent app navigation.
 *
 * Collapsible rather than hidden on desktop: the editor needs horizontal room,
 * and a creator working through a long transcript should be able to reclaim
 * ~200px without losing their place. Collapsed state is intentionally not
 * persisted — it is a per-session working preference, not a setting.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, configured } = useAuth();
  const credits = useCredits();
  const [collapsed, setCollapsed] = useState(false);

  const item = (
    href: string,
    label: string,
    Icon: typeof Home,
    active: boolean,
  ) => (
    <Link
      key={href}
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-brand-soft font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active && "text-brand")} />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </Link>
  );

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-card/40 md:flex",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2.5 border-b px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand">
            <span className="block size-2.5 rounded-[3px] bg-brand-foreground" />
            <span className="absolute -bottom-0.5 left-1.5 size-2 rotate-45 rounded-[2px] bg-brand" />
          </span>
          {collapsed ? null : (
            <span className="text-[15px] font-semibold tracking-tight">
              bolo
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV.map(({ href, label, icon }) =>
          item(href, label, icon, pathname === href),
        )}

        <div className="my-2 h-px bg-border" />

        {SECONDARY.map(({ href, label, icon }) =>
          item(href, label, icon, pathname === href),
        )}

        {user !== null &&
        ADMIN_UI_EMAILS.includes((user.email ?? "").toLowerCase())
          ? item("/admin", "Admin", ShieldCheck, pathname === "/admin")
          : null}
      </nav>

      {collapsed ? null : (
        <div className="space-y-3 p-3">
          {/* Real balance, streamed from Firestore. It used to be a hardcoded
              full bar, which told the user nothing and would have been actively
              misleading once credits started being spent. */}
          <div className="rounded-xl border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                {credits.plan}
              </span>
              {credits.plan === "free" ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  FREE
                </span>
              ) : null}
            </div>

            {user === null ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Sign in to see your credits.
              </p>
            ) : credits.loading ? (
              <div className="h-6 animate-pulse rounded bg-muted" />
            ) : credits.error !== null ? (
              <p className="text-[11px] leading-relaxed text-destructive">
                {credits.error}
              </p>
            ) : (
              <>
                <p className="mb-1.5 text-[11px] text-muted-foreground">
                  Transcription
                  <span className="float-right font-medium text-foreground tabular-nums">
                    {formatAllowance(credits.secondsRemaining)} left
                  </span>
                </p>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      credits.creditsRemaining === 0
                        ? "bg-destructive"
                        : "bg-brand",
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        credits.monthlyCredits === 0
                          ? 0
                          : (credits.creditsRemaining /
                              credits.monthlyCredits) *
                              100,
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground/60 tabular-nums">
                  {credits.creditsRemaining} of {credits.monthlyCredits} credits
                </p>
              </>
            )}

            <Link
              href="/pricing"
              className="mt-3 block rounded-lg bg-brand py-1.5 text-center text-xs font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              Upgrade
            </Link>
          </div>

          {/* Signed-out users need a way in. This is where it was missing:
              sign-in lived in the old header, which the sidebar layout replaced,
              so for a while there was no entry point anywhere in the app. */}
          {!configured ? null : user !== null ? (
            <div className="flex items-center gap-2 rounded-lg px-1">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                {(user.displayName ?? user.email ?? "U")
                  .charAt(0)
                  .toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {user.displayName ?? "Signed in"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                aria-label="Sign out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/signin"
              className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
            >
              <LogIn className="size-3.5" />
              Sign in
            </Link>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex h-10 items-center justify-center border-t text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </button>
    </aside>
  );
}
