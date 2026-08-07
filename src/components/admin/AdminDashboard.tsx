"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Coins,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/auth-context";
import { cn } from "@/lib/utils";

interface UsageRow {
  month: string;
  seconds: number;
  requests: number;
  creditsCharged: number;
  estimatedUsd: number;
}

interface Overview {
  ok: true;
  admin: { email: string };
  usage: UsageRow[];
  usdPerAudioHour: number;
  subscription: {
    tier?: string;
    status?: string;
    character_count?: number;
    character_limit?: number;
    next_character_count_reset_unix?: number;
  } | null;
  subscriptionError: string | null;
}

interface UserRow {
  uid: string;
  email: string | null;
  plan: string;
  creditsRemaining: number;
  totalSecondsTranscribed: number;
  totalTranscriptions: number;
}

const hhmm = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function AdminDashboard() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const token = await getIdToken();
      return fetch(url, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.body ? { "content-type": "application/json" } : {}),
        },
      });
    },
    [getIdToken],
  );

  const load = useCallback(async () => {
    setError(null);
    const [o, u] = await Promise.all([
      authedFetch("/api/admin/overview"),
      authedFetch("/api/admin/users"),
    ]);

    // The API returns 404 for non-admins rather than 403, so the route's
    // existence is not confirmed to someone probing for it.
    if (o.status === 404 || u.status === 404) {
      setDenied(true);
      return;
    }

    if (o.ok) setOverview((await o.json()) as Overview);
    if (u.ok) {
      const body = (await u.json()) as { users: UserRow[] };
      setUsers(body.users);
    }
  }, [authedFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (user === null) {
      setDenied(true);
      return;
    }
    void load();
  }, [authLoading, user, load]);

  const adjust = useCallback(
    async (uid: string, creditsDelta: number) => {
      setBusyUid(uid);
      setError(null);
      try {
        const reason = window.prompt(
          `Reason for ${creditsDelta > 0 ? "adding" : "removing"} ${Math.abs(creditsDelta)} credits?`,
          "",
        );
        // Cancelling the prompt cancels the change — an audited action should
        // never be recorded with a reason the admin did not agree to.
        if (reason === null) return;

        const response = await authedFetch("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({ uid, creditsDelta, reason }),
        });

        const body = (await response.json()) as {
          ok: boolean;
          message?: string;
          creditsRemaining?: number;
        };

        if (!body.ok) {
          setError(body.message ?? "Could not update that user.");
          return;
        }

        setUsers((prev) =>
          prev === null
            ? prev
            : prev.map((row) =>
                row.uid === uid
                  ? { ...row, creditsRemaining: body.creditsRemaining ?? 0 }
                  : row,
              ),
        );
      } finally {
        setBusyUid(null);
      }
    },
    [authedFetch],
  );

  if (authLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  }

  if (denied) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/40 p-10 text-center">
        <ShieldCheck className="mx-auto mb-3 size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Not available</p>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
          This area is restricted. If you should have access, make sure you are
          signed in with an admin email, that the address is verified, and that
          it is listed in <code>ADMIN_EMAILS</code> on the server.
        </p>
      </div>
    );
  }

  const latest = overview?.usage[0];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Signed in as {overview?.admin.email ?? user?.email}
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {error !== null ? (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {/* Our own ledger */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Transcription spend (our ledger)
        </h2>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "This month", value: latest ? hhmm(latest.seconds) : "—" },
            { label: "Requests", value: latest ? String(latest.requests) : "—" },
            {
              label: "Credits charged",
              value: latest ? String(latest.creditsCharged) : "—",
            },
            {
              label: "Estimated cost",
              value: latest ? `$${latest.estimatedUsd.toFixed(2)}` : "—",
            },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border bg-card/50 p-4">
              <p className="text-[11px] text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {overview !== null && overview.usage.length > 1 ? (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Month</th>
                  <th className="px-3 py-2 text-right font-medium">Audio</th>
                  <th className="px-3 py-2 text-right font-medium">Requests</th>
                  <th className="px-3 py-2 text-right font-medium">Credits</th>
                  <th className="px-3 py-2 text-right font-medium">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {overview.usage.map((row) => (
                  <tr key={row.month} className="border-t">
                    <td className="px-3 py-2 font-mono">{row.month}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {hhmm(row.seconds)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.requests}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.creditsCharged}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      ${row.estimatedUsd.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          Counted from audio seconds actually transcribed, at $
          {overview?.usdPerAudioHour.toFixed(2) ?? "0.40"}/hour. This is an
          estimate against list price — your invoice is the authority.
        </p>
      </section>

      {/* ElevenLabs account */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          ElevenLabs account
        </h2>

        {overview?.subscriptionError !== null &&
        overview?.subscriptionError !== undefined ? (
          <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
            {overview.subscriptionError}
          </p>
        ) : overview?.subscription ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-card/50 p-4">
                <p className="text-[11px] text-muted-foreground">Tier</p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {overview.subscription.tier ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border bg-card/50 p-4">
                <p className="text-[11px] text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {overview.subscription.status ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border bg-card/50 p-4">
                <p className="text-[11px] text-muted-foreground">
                  Character quota
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {(overview.subscription.character_count ?? 0).toLocaleString()}{" "}
                  /{" "}
                  {(overview.subscription.character_limit ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground/70">
              The character quota is a <strong>text-to-speech</strong> measure.
              Bolo only uses speech-to-text, so this number will not track your
              transcription spend — use the ledger above for that. It is shown
              because it is the authority on account status and hard limits.
            </p>
          </>
        ) : (
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        )}
      </section>

      {/* Users */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Users className="size-3" />
          Users {users !== null ? `(${users.length})` : ""}
        </h2>

        {users === null ? (
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        ) : users.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card/40 p-8 text-center text-xs text-muted-foreground">
            No user records yet. A user document is created the first time
            someone transcribes while signed in.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">User</th>
                  <th className="px-3 py-2 text-left font-medium">Plan</th>
                  <th className="px-3 py-2 text-right font-medium">Used</th>
                  <th className="px-3 py-2 text-right font-medium">Credits</th>
                  <th className="px-3 py-2 text-right font-medium">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.uid} className="border-t">
                    <td className="max-w-56 px-3 py-2">
                      <p className="truncate">{row.email ?? "—"}</p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground/60">
                        {row.uid}
                      </p>
                    </td>
                    <td className="px-3 py-2 capitalize">{row.plan}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {hhmm(row.totalSecondsTranscribed)}
                      <span className="ml-1 text-muted-foreground/60">
                        ({row.totalTranscriptions})
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-semibold tabular-nums",
                        row.creditsRemaining <= 0 && "text-destructive",
                      )}
                    >
                      {row.creditsRemaining}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {[-10, +10, +50].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            disabled={busyUid === row.uid}
                            onClick={() => void adjust(row.uid, delta)}
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                              "hover:bg-accent disabled:opacity-40",
                              delta < 0 && "text-destructive",
                            )}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </button>
                        ))}
                        {busyUid === row.uid ? (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground/70">
          <Coins className="mt-0.5 size-3 shrink-0" />
          Every credit change is written to an append-only audit log with your
          email, the before and after balance, and the reason you give.
        </p>
      </section>
    </div>
  );
}
