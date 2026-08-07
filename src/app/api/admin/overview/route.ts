import { NextResponse } from "next/server";
import { notAdminResponse, requireAdmin } from "@/lib/firebase/admin-auth";
import { USD_PER_AUDIO_HOUR, readUsage } from "@/lib/admin/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ElevenLabsSubscription {
  tier?: string;
  status?: string;
  character_count?: number;
  character_limit?: number;
  next_character_count_reset_unix?: number;
  currency?: string;
}

/**
 * Admin overview: our own spend ledger plus the ElevenLabs account status.
 *
 * Two different numbers, deliberately shown side by side:
 *
 *  - **Our ledger** counts audio seconds transcribed, which is what this app
 *    actually bills for and what actually costs money.
 *  - **ElevenLabs' subscription** reports a *character* quota, which is a
 *    text-to-speech measure. It is the authority on account status and hard
 *    limits, but it does not answer "how much speech-to-text have we used".
 *
 * Conflating them would produce a confident, wrong cost figure, so the response
 * keeps them separate and the UI labels them as such.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin === null) return notAdminResponse();

  const usage = await readUsage(6);

  let subscription: ElevenLabsSubscription | null = null;
  let subscriptionError: string | null = null;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    subscriptionError = "ELEVENLABS_API_KEY is not set.";
  } else {
    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/user/subscription",
        { headers: { "xi-api-key": apiKey }, cache: "no-store" },
      );

      if (response.ok) {
        subscription = (await response.json()) as ElevenLabsSubscription;
      } else {
        // Never surface the upstream body — it can echo request details.
        subscriptionError =
          response.status === 401
            ? "ElevenLabs rejected the API key."
            : `ElevenLabs returned ${response.status}.`;
      }
    } catch {
      subscriptionError = "Could not reach ElevenLabs.";
    }
  }

  return NextResponse.json({
    ok: true,
    admin: { email: admin.email },
    usage,
    usdPerAudioHour: USD_PER_AUDIO_HOUR,
    subscription,
    subscriptionError,
  });
}
