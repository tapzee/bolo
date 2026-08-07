import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { PLAN_MONTHLY_CREDITS, PLAN_ORDER, type Plan } from "@/core";
import { adminDb } from "@/lib/firebase/admin";
import { notAdminResponse, requireAdmin } from "@/lib/firebase/admin-auth";
import { recordLedgerEntryIn } from "@/lib/credits/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS: readonly Plan[] = PLAN_ORDER;

export interface AdminUserRow {
  uid: string;
  email: string | null;
  plan: string;
  creditsRemaining: number;
  totalSecondsTranscribed: number;
  totalTranscriptions: number;
}

/** Lists users with their balances. */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin === null) return notAdminResponse();

  const db = adminDb();
  if (db === null) {
    return NextResponse.json(
      { ok: false, message: "Firebase Admin is not configured." },
      { status: 500 },
    );
  }

  const snap = await db.collection("users").limit(200).get();

  const users: AdminUserRow[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: typeof data.email === "string" ? data.email : null,
      plan: typeof data.plan === "string" ? data.plan : "free",
      creditsRemaining:
        typeof data.creditsRemaining === "number" ? data.creditsRemaining : 0,
      totalSecondsTranscribed:
        typeof data.totalSecondsTranscribed === "number"
          ? data.totalSecondsTranscribed
          : 0,
      totalTranscriptions:
        typeof data.totalTranscriptions === "number"
          ? data.totalTranscriptions
          : 0,
    };
  });

  users.sort((a, b) => b.totalSecondsTranscribed - a.totalSecondsTranscribed);

  return NextResponse.json({ ok: true, users });
}

/**
 * Adjusts a user's credits or plan.
 *
 * Every change is written to an append-only audit log alongside the balance,
 * in the same transaction. A credit system an admin can change with no record
 * of who changed it or why is not something you can reconcile against revenue
 * later, and it makes an insider mistake indistinguishable from abuse.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (admin === null) return notAdminResponse();

  const db = adminDb();
  if (db === null) {
    return NextResponse.json(
      { ok: false, message: "Firebase Admin is not configured." },
      { status: 500 },
    );
  }

  let body: {
    uid?: unknown;
    creditsDelta?: unknown;
    setCredits?: unknown;
    plan?: unknown;
    reason?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const uid = typeof body.uid === "string" ? body.uid.trim() : "";
  if (uid.length === 0) {
    return NextResponse.json(
      { ok: false, message: "A user id is required." },
      { status: 400 },
    );
  }

  const plan =
    typeof body.plan === "string" && PLANS.includes(body.plan as Plan)
      ? (body.plan as Plan)
      : null;

  const delta =
    typeof body.creditsDelta === "number" && Number.isFinite(body.creditsDelta)
      ? Math.trunc(body.creditsDelta)
      : null;

  const absolute =
    typeof body.setCredits === "number" && Number.isFinite(body.setCredits)
      ? Math.max(0, Math.trunc(body.setCredits))
      : null;

  if (delta === null && absolute === null && plan === null) {
    return NextResponse.json(
      { ok: false, message: "Nothing to change." },
      { status: 400 },
    );
  }

  // Bounded so a mistyped figure cannot hand out a fortune in one click.
  if (delta !== null && Math.abs(delta) > 10_000) {
    return NextResponse.json(
      { ok: false, message: "Adjustment is too large (max 10,000)." },
      { status: 400 },
    );
  }

  const userRef = db.collection("users").doc(uid);
  const auditRef = db.collection("admin").doc("audit").collection("entries").doc();

  try {
    const newBalance = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const current = snap.exists
        ? typeof snap.data()?.creditsRemaining === "number"
          ? (snap.data()?.creditsRemaining as number)
          : 0
        : PLAN_MONTHLY_CREDITS.free;

      // Absolute set wins over a delta when both are sent, and the result is
      // floored at zero — a negative balance has no meaning here.
      const next =
        absolute !== null ? absolute : Math.max(0, current + (delta ?? 0));

      tx.set(
        userRef,
        {
          creditsRemaining: next,
          ...(plan === null ? {} : { plan }),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const reason =
        typeof body.reason === "string" ? body.reason.slice(0, 300) : null;

      tx.set(auditRef, {
        at: FieldValue.serverTimestamp(),
        byUid: admin.uid,
        byEmail: admin.email,
        targetUid: uid,
        before: current,
        after: next,
        planSet: plan,
        reason,
      });

      // The user's own copy, in the same transaction as the balance it
      // describes. The audit entry above answers "who changed this and why" for
      // us; this one answers "where did my credits go" for them, and they are
      // not interchangeable — the audit log is unreadable by any client.
      if (next !== current) {
        recordLedgerEntryIn(tx, db, {
          uid,
          kind: "adjustment",
          credits: next - current,
          balanceAfter: next,
          note: reason ?? "Adjusted by support",
        });
      }

      return next;
    });

    console.info("[admin] credits adjusted", {
      by: admin.email,
      target: uid,
      newBalance,
    });

    return NextResponse.json({ ok: true, uid, creditsRemaining: newBalance });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not update that user." },
      { status: 500 },
    );
  }
}
