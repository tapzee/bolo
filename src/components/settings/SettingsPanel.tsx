"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Clock,
  Gift,
  Loader2,
  LogOut,
  Mic,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  LEDGER_KIND_LABEL,
  PLAN_MONTHLY_CREDITS,
  PLAN_PRICE_PAISE,
  formatBytes,
  formatAllowance,
  formatPaise,
  secondsForCredits,
  type LedgerEntry,
} from "@/core";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCredits } from "@/lib/credits/use-credits";
import { useLedger } from "@/lib/credits/use-ledger";
import { storeForUser } from "@/lib/firebase/project-store";
import {
  cacheUsageBytes,
  clearVideoCache,
  listCachedVideoIds,
  storageEstimate,
} from "@/lib/storage/video-cache";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="divide-y rounded-xl border bg-card/40 px-4">{children}</div>
    </section>
  );
}

const PLAN_LABEL: Readonly<Record<string, string>> = {
  free: "Free",
  starter: "Starter",
  editor: "Editor",
  pro: "Pro",
};

const formatDate = (millis: number): string =>
  new Date(millis).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const daysUntil = (millis: number): number =>
  Math.max(0, Math.ceil((millis - Date.now()) / (24 * 60 * 60 * 1000)));

const ENTRY_ICON = {
  spend: Mic,
  purchase: Sparkles,
  adjustment: Gift,
  signup: Gift,
} as const;

/**
 * One line of credit history.
 *
 * Movements are shown in minutes rather than credits, and signed. A user has no
 * model of what a credit is worth — "−1 min 36 sec" is immediately checkable
 * against the video they just captioned, where "−8 credits" is not.
 */
function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const Icon = ENTRY_ICON[entry.kind];
  const added = entry.credits > 0;
  const magnitude = formatAllowance(
    secondsForCredits(Math.abs(entry.credits)),
  );

  return (
    <div className="flex items-center gap-3 py-3">
      <span
        className={
          added
            ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
            : "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        <Icon className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">
          {entry.note ?? LEDGER_KIND_LABEL[entry.kind]}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {LEDGER_KIND_LABEL[entry.kind]} · {formatDate(entry.at)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={
            added
              ? "text-xs font-semibold tabular-nums text-success"
              : "text-xs font-semibold tabular-nums"
          }
        >
          {added ? "+" : "−"}
          {magnitude}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {entry.amountPaise > 0
            ? formatPaise(entry.amountPaise)
            : entry.balanceAfter !== null
              ? `${formatAllowance(secondsForCredits(entry.balanceAfter))} left`
              : ""}
        </p>
      </div>
    </div>
  );
}

/**
 * Plan, balance and history — the three questions a paying user opens Settings
 * to answer, in the order they ask them.
 *
 * Everything here is display only, and read from the same live subscription the
 * credit wall uses. None of it is a control: the balance is owned by the server
 * and a client that could assert its own would be able to mint transcription.
 */
function BillingSections() {
  const credits = useCredits();
  const ledger = useLedger();
  const { user } = useAuth();

  if (user === null) {
    return (
      <Section title="Plan">
        <Row
          label="Free"
          hint={`${formatAllowance(
            secondsForCredits(PLAN_MONTHLY_CREDITS.free),
          )} of transcription a month. Sign in to see your balance, purchases and usage history.`}
        >
          <Link
            href="/pricing"
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90"
          >
            See plans
          </Link>
        </Row>
      </Section>
    );
  }

  const allowanceSeconds = secondsForCredits(credits.monthlyCredits);
  // Capped at 100%: rollover means a balance can legitimately exceed a single
  // month's allowance, and a bar rendered past its track looks like a bug.
  const usedPct =
    allowanceSeconds === 0
      ? 0
      : Math.min(100, (credits.secondsRemaining / allowanceSeconds) * 100);
  const low = credits.secondsRemaining < 60;
  const passActive =
    credits.pass !== null && credits.pass.expiresAt > Date.now();

  return (
    <>
      <Section title="Plan">
        <Row
          label={PLAN_LABEL[credits.plan] ?? credits.plan}
          hint={
            credits.plan === "free"
              ? "Exports carry a small watermark. Any paid plan removes it."
              : `${formatPaise(PLAN_PRICE_PAISE[credits.plan])} per month · no watermark`
          }
        >
          <Link
            href="/pricing"
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90"
          >
            {credits.plan === "pro" ? "See plans" : "Upgrade"}
          </Link>
        </Row>

        <Row
          label="Transcription left"
          hint={
            credits.error !== null
              ? credits.error
              : low
                ? "Almost out. A video longer than this will be refused before it starts processing."
                : `Out of ${formatAllowance(allowanceSeconds)} a month. Unused time rolls over.`
          }
        >
          <div className="w-40 text-right">
            <p
              className={
                low
                  ? "text-sm font-semibold tabular-nums text-destructive"
                  : "text-sm font-semibold tabular-nums"
              }
            >
              {credits.loading
                ? "—"
                : formatAllowance(credits.secondsRemaining)}
            </p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={low ? "h-full bg-destructive" : "h-full bg-brand"}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        </Row>

        {passActive && credits.pass !== null ? (
          <Row
            label="7-day pass"
            hint="Watermark-free exports and every caption template. Ends on its own — there is nothing to cancel."
          >
            <div className="flex items-center gap-1.5 text-right text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span className="tabular-nums">
                {daysUntil(credits.pass.expiresAt)} days left
              </span>
            </div>
          </Row>
        ) : null}

        <Row
          label="Videos transcribed"
          hint="Everything this account has run through transcription."
        >
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {credits.totalTranscriptions}
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {formatAllowance(credits.totalSecondsTranscribed)} total
            </p>
          </div>
        </Row>
      </Section>

      <Section title="Purchases &amp; usage">
        {ledger.loading ? (
          <Row label="Loading…">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </Row>
        ) : ledger.error !== null ? (
          <Row label="Couldn't load your history" hint={ledger.error}>
            <span className="text-xs text-muted-foreground">—</span>
          </Row>
        ) : ledger.entries.length === 0 ? (
          <Row
            label="Nothing yet"
            hint="Every purchase and every transcription will be listed here, with what it cost and what was left afterwards."
          >
            <span className="text-xs text-muted-foreground">—</span>
          </Row>
        ) : (
          <div className="divide-y">
            {ledger.entries.map((entry) => (
              <LedgerRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

export function SettingsPanel() {
  const { user, loading, configured, logout } = useAuth();

  const [videoCount, setVideoCount] = useState<number | null>(null);
  const [cacheBytes, setCacheBytes] = useState(0);
  const [quota, setQuota] = useState<{ usedBytes: number; quotaBytes: number } | null>(
    null,
  );
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const refresh = useCallback(async () => {
    const [ids, bytes, estimate, projects] = await Promise.all([
      listCachedVideoIds(),
      cacheUsageBytes(),
      storageEstimate(),
      storeForUser(user?.uid ?? null).list(),
    ]);
    setVideoCount(ids.length);
    setCacheBytes(bytes);
    setQuota(estimate);
    setProjectCount(projects.length);
  }, [user?.uid]);

  useEffect(() => {
    if (loading) return;
    void refresh();
  }, [loading, refresh]);

  const clearCache = useCallback(async () => {
    const confirmed = window.confirm(
      "Remove all cached videos from this browser?\n\nYour captions, styles and saved projects are NOT affected — only the video files. You will be asked to drop a clip back in when reopening a project.",
    );
    if (!confirmed) return;

    setClearing(true);
    try {
      await clearVideoCache();
      await refresh();
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } finally {
      setClearing(false);
    }
  }, [refresh]);

  const quotaPct =
    quota !== null && quota.quotaBytes > 0
      ? (quota.usedBytes / quota.quotaBytes) * 100
      : null;

  return (
    <div className="space-y-8">
      <Section title="Account">
        {!configured ? (
          <Row
            label="Sign-in unavailable"
            hint="Firebase is not configured on this deployment. Everything still works — projects are kept in this browser only."
          >
            <span className="text-xs text-muted-foreground">—</span>
          </Row>
        ) : loading ? (
          <Row label="Loading…">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </Row>
        ) : user === null ? (
          <Row
            label="Not signed in"
            hint="Your work is saved in this browser only. Sign in to keep projects safe from a cleared cache."
          >
            <Link
              href="/signin"
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90"
            >
              Sign in
            </Link>
          </Row>
        ) : (
          <>
            <Row label="Signed in as" hint={user.email ?? undefined}>
              <span className="flex size-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                {(user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
              </span>
            </Row>
            <Row
              label="Sign out"
              hint="Projects saved to your account stay safe and reappear when you sign back in."
            >
              <Button variant="outline" size="sm" onClick={() => void logout()}>
                <LogOut className="size-3.5" />
                Sign out
              </Button>
            </Row>
          </>
        )}
      </Section>

      <BillingSections />

      <Section title="Storage on this device">
        <Row
          label="Cached videos"
          hint="Videos are kept in this browser so you can reopen a project without dropping the file in again. They are never uploaded."
        >
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {videoCount === null ? "—" : videoCount}
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {formatBytes(cacheBytes)}
            </p>
          </div>
        </Row>

        <Row
          label="Saved projects"
          hint={
            user === null
              ? "Stored in this browser. Sign in to sync them to your account."
              : "Synced to your account. Captions and styles only — never media."
          }
        >
          <p className="text-sm font-semibold tabular-nums">
            {projectCount === null ? "—" : projectCount}
          </p>
        </Row>

        {quota !== null && quotaPct !== null ? (
          <Row
            label="Browser storage"
            hint="When this fills up, browsers silently evict cached videos. Captions are never affected."
          >
            <div className="w-40 text-right">
              <p className="text-[11px] tabular-nums text-muted-foreground">
                {formatBytes(quota.usedBytes)} / {formatBytes(quota.quotaBytes)}
              </p>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    quotaPct > 85 ? "h-full bg-destructive" : "h-full bg-brand"
                  }
                  style={{ width: `${Math.min(100, quotaPct)}%` }}
                />
              </div>
            </div>
          </Row>
        ) : null}

        <Row
          label="Clear cached videos"
          hint="Frees disk space. Captions, styles and projects are kept — you will just be asked for the clip again when reopening one."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={clearing || videoCount === 0}
            onClick={() => void clearCache()}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {clearing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : cleared ? (
              <Check className="size-3.5" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            {cleared ? "Cleared" : "Clear"}
          </Button>
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme" hint="Follows your choice on this device.">
          <ThemeToggle />
        </Row>
      </Section>

      <Section title="Privacy">
        <Row
          label="Your video never leaves this browser"
          hint="Only the extracted audio — a few hundred kilobytes — is sent for transcription. Rendering and export run entirely on your device."
        >
          <ShieldCheck className="size-4 text-success" />
        </Row>
        <Row label="Read the full policy">
          <Link
            href="/privacy"
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Privacy
          </Link>
        </Row>
      </Section>

      <p className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-3 shrink-0" />
        Clearing your browser data will remove cached videos and, if you are not
        signed in, your saved projects too. Sign in to keep captions safe.
      </p>
    </div>
  );
}
