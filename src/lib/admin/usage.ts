import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Our own transcription usage ledger.
 *
 * WHY NOT JUST READ ELEVENLABS: their `/v1/user/subscription` endpoint reports
 * the *character* quota, which is a text-to-speech measure. This app only uses
 * speech-to-text and bills by audio seconds, so that number does not answer
 * "how much have we spent this month". Recording our own usage is the only way
 * to get a figure that matches what we actually charge for.
 *
 * The admin panel shows both: this ledger for real spend, and the ElevenLabs
 * subscription for account status and hard limits.
 *
 * Writes are best-effort. A failure here must never fail a transcription the
 * user has already paid for.
 */

const monthKey = (date = new Date()): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

export interface UsageRecord {
  month: string;
  seconds: number;
  requests: number;
  creditsCharged: number;
  estimatedUsd: number;
  updatedAt: number;
}

/** Rough Scribe list price. Kept alongside the figure it produces. */
export const USD_PER_AUDIO_HOUR = 0.4;

export const recordTranscription = async (input: {
  seconds: number;
  creditsCharged: number;
  languageCode: string;
  uid: string | null;
}): Promise<void> => {
  const db = adminDb();
  if (db === null) return;

  const month = monthKey();
  const usd = (input.seconds / 3600) * USD_PER_AUDIO_HOUR;

  try {
    await db
      .collection("admin")
      .doc("usage")
      .collection("months")
      .doc(month)
      .set(
        {
          month,
          seconds: FieldValue.increment(Math.round(input.seconds)),
          requests: FieldValue.increment(1),
          creditsCharged: FieldValue.increment(input.creditsCharged),
          estimatedUsd: FieldValue.increment(Number(usd.toFixed(6))),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    // Per-user rollup, so the panel can show who is consuming the quota.
    if (input.uid !== null) {
      await db
        .collection("users")
        .doc(input.uid)
        .set(
          {
            totalSecondsTranscribed: FieldValue.increment(
              Math.round(input.seconds),
            ),
            totalTranscriptions: FieldValue.increment(1),
            lastTranscribedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    }
  } catch {
    // Telemetry must never break the product.
  }
};

export const readUsage = async (months = 6): Promise<UsageRecord[]> => {
  const db = adminDb();
  if (db === null) return [];

  try {
    const snap = await db
      .collection("admin")
      .doc("usage")
      .collection("months")
      .orderBy("month", "desc")
      .limit(months)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        month: String(data.month ?? doc.id),
        seconds: Number(data.seconds ?? 0),
        requests: Number(data.requests ?? 0),
        creditsCharged: Number(data.creditsCharged ?? 0),
        estimatedUsd: Number(data.estimatedUsd ?? 0),
        updatedAt: Date.now(),
      };
    });
  } catch {
    return [];
  }
};
