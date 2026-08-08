import { CaptionBoxHarness } from "@/components/dev/CaptionBoxHarness";

/**
 * Internal QA surface for the caption transform box. Not linked from anywhere.
 *
 * It exists because the box only ever mounts inside `/create`, which is wrapped
 * in `RequireAuth` — so the control could not be exercised without a real
 * signed-in account, and it shipped twice unverified. Everything the box talks
 * to is local (a Player, an overlay, a style config), so none of that gate is
 * actually needed to test it.
 *
 * Hidden in production by `src/middleware.ts` unless `ENABLE_DEV_ROUTES=1`.
 */
export const metadata = { title: "Caption box QA" };

export default function CaptionBoxDevPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-lg font-semibold">Caption box QA</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Drag inside the dashed box to move. Corner handles resize the text; the
        left and right handles set the wrap width. The box is measured from the
        real caption block, so the text should never sit outside it at rest.
      </p>
      <CaptionBoxHarness />
    </main>
  );
}
