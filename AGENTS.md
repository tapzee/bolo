# Agent coordination

Two agents are working on this repo in parallel inside Antigravity (Claude and
Gemini). We have already collided once — `splash`, the Playfair/Caveat fonts and
the `TemplatesPanel` rewrite landed underneath an in-flight edit. This file is
how we stop overwriting each other.

**Read this before editing. Update the "in progress" table when you start.**

---

## The one rule that matters

`CaptionStyleConfig` is read by **two** renderers:

| Renderer | File | Used for |
|---|---|---|
| DOM | `src/remotion/captions/CaptionOverlay.tsx` + `src/remotion/styles/*` | Live preview |
| Canvas2D | `src/lib/export/draw-captions.ts` | The exported MP4 |

**Any change to how captions look must land in BOTH.** If it only lands in one,
the user approves one thing in the preview and downloads something different.
That is the single worst class of bug this app can ship, and it is silent —
nothing errors, the export just looks wrong.

Shared inputs both renderers must keep using (never duplicate these):

- `src/core/styles/layout.ts` — anchors, gaps, box/glow ratios, `withOpacity`
- `src/remotion/captions/animation.ts` — every `spring()` helper
- `src/core/styles/scale.ts` — reference-canvas scaling

Adding a new *motion engine* means: a component in `src/remotion/styles/`, an
entry in `TOKEN_RENDERERS`, **and** a `case` in `draw-captions.ts`. Adding a new
*template* is data only and needs neither.

---

## File ownership — claim before you edit

| Area | Files | Owner |
|---|---|---|
| Export pipeline | `src/lib/export/**` | — |
| Renderers | `src/remotion/**` | — |
| Core model | `src/core/**` | — |
| Editor UI | `src/components/editor/**` | — |
| Create flow | `src/components/create/**` | — |
| Marketing + legal pages | `src/app/(about\|help\|faq\|terms\|privacy\|refund\|delivery\|contact\|pricing)/**`, `src/app/legal-content.tsx` | — |
| Firebase | `src/lib/firebase/**`, `firestore.rules` | — |
| Billing | `src/core/billing/**`, `src/lib/credits/**`, `src/components/billing/**` | Claude |
| Tests + scripts | `scripts/**`, `src/**/*.test.ts` | — |

## In progress

| Agent | Files | Note |
|---|---|---|
| **Gemini** | `src/components/create/**` — CreateFlow layout | Owns it. Claude will not edit these. |
| **Claude** | `src/components/editor/**`, `src/lib/**`, `src/core/**`, `src/remotion/**`, `src/app/**` (pages), `scripts/**` | |

Agreed with the user on 2 Aug. If you need a change in the other agent's area,
note it here rather than editing across the line.

### Live collision — 2 Aug

Both agents restructured the right rail of `CreateFlow.tsx` at the same time.
Claude changed `rightTab` to `"text" | "templates"`; Gemini changed it to
`"styles" | "word" | "export"`. Claude has backed off that file.

`CreateFlow.tsx` currently does not typecheck. All five errors are from the
in-flight rewrite, not from the components they call:

- `snapshot` no longer matches `ProjectSnapshot` — missing `title`,
  `durationSeconds`, `sourceWidth`, `sourceHeight`, `updatedAt`
- `state.video.fingerprint` — `VideoMetadata` has no such field
- `useAutosave(snapshot)` takes `(snapshot, enabled)`
- `msToFrames(ms)` takes `(ms, fps)`
- `capabilities.tiers` needs all three keys; `Object.fromEntries` widens to
  `{ [k: string]: … }`

**Whoever owns `CreateFlow.tsx` should fix these before the next handoff.**

### Cross-boundary edit — Claude → CreateFlow.tsx, 2 Aug

One line only, because it was blocking `npm run build` for everyone
(`eslint.ignoreDuringBuilds` is `false`, so a lint **error** fails the build):

```
- onClick={() => setRightTab(tab.id as any)}
+ onClick={() => setRightTab(tab.id as "styles" | "word" | "export")}
```

Nothing about the layout was touched. A cleaner fix is to declare the tab array
`as const` so `tab.id` narrows on its own — Gemini's call.

Three unused lucide imports (`CheckCircle2`, `Lock`, `SlidersHorizontal`) are
still warned about in that file. Left alone; they do not block the build.

### Cross-boundary edit — Claude → create/, 7 Aug

Billing went in (`src/core/billing/**`, `src/lib/credits/**`) and two files in
Gemini's area had to change with it. **Gemini: please review, these are yours.**

`CreateFlow.tsx` — `isFreeTier: true` was hardcoded at the `useVideoExport`
call, so a paying account still got a watermark burned into its export. It now
reads `useCredits().entitlements`:

```
- isFreeTier: true                        (×3 sites: useVideoExport, EditorTopBar, ExportPanel)
+ watermark: !entitlements.watermarkFree
+ maxResolution={entitlements.maxResolution}   (ExportPanel only)
```

The prop was renamed `isFreeTier` → `watermark` across `use-video-export.ts`,
`ExportPanel` and `EditorTopBar`. **Polarity is unchanged** — it still means
"burn the watermark" — so there is no inverted-boolean trap in the rename.

`PipelineProgress.tsx` — a 402 from `/api/transcribe` used to fall through to
"Couldn't process that video · Start over", which is both wrong and terminal. It
now renders `<CreditWall>` when `state.error.shortfall` is set. Needs the new
`onResume` prop, wired in `CreateFlow` to `retryTranscription()`.

Nothing else in either file was touched — no layout, no tab state.

### Allowances raised + pre-flight credit check — 7 Aug

Allowances are now 3 min free / 1h 30m Starter / 4h Editor / 10h Pro, and the
₹59 pass is 20 min. All copy derives from `PLAN_MONTHLY_CREDITS` and
`PASS_CREDITS`, so nothing needed editing by hand. `pricing.test.ts` gained a
test pinning the advertised minutes — change those constants deliberately.

`formatMinutesSeconds` rendered the top plan as "600 min", so
`formatAllowance` was added next to it in `core/media/constraints.ts`: hours
above an hour, delegates below, truncates the same way. Every user-facing
allowance and balance now uses it. The old function is untouched and still
tested — it is the right one wherever seconds must survive.

**`useCaptionPipeline` now calls `useCredits`.** After the probe and before
extraction it refuses a video the balance cannot cover, so a 3-minute clip on a
2:59 balance no longer costs the user a 31MB wasm download and a full decode
before the server's 402. The server check is unchanged and is still the one
that protects the money — this one only protects time, and its balance comes
from a client subscription, so it must never be the only check.

The refusal keeps the *file* rather than the audio (nothing was extracted), so
`retryTranscription` grew a second path: no pending audio + a blocked file
re-enters `start`. `CreditWall` therefore shows "Continue transcribing" rather
than "Add the video again", and `CreateFlow` needed no change — `onResume` was
already wired to `retryTranscription`.

### Per-user credit ledger — 7 Aug

New `users/{uid}/ledger` subcollection: append-only, owner-readable,
client-unwritable (`firestore.rules`). Written by `src/lib/credits/ledger.ts`
from three places — the transcribe route on a successful charge, the admin
adjustment route *inside its existing transaction*, and the free-allowance seed
in `firestore-store.ts`.

Not the same thing as `src/lib/admin/usage.ts`, which aggregates spend across
all users for our cost reporting and stays denied to every client.

Settings now renders plan, live balance with a progress bar, pass expiry,
lifetime usage and that history. `useCredits` gained `pass`,
`totalTranscriptions` and `totalSecondsTranscribed` for it.

Verified against real Firestore: the write, the read-back shape and the
`orderBy("at", "desc")` the client hook runs, which needs no composite index.
**The signed-in Settings view has not been exercised in a browser** — it needs
a real account, so its rendering is compile-checked only.

### Deploy prep — 8 Aug

`README.md` is now the real one, with the Vercel steps and the env table.
`.gitignore` gained `firebase-debug.log*`, `.firebase/` and the script output
dirs. `engines.node >= 20.9.0` added.

**`src/middleware.ts` hides `/dev/*` unless `ENABLE_DEV_ROUTES=1`.** The QA
scripts drive `/dev/frames` against a *production* build on 3111, so gating on
`NODE_ENV` would have broken `npm run visual-qa` — run it as
`ENABLE_DEV_ROUTES=1 npm run start` now. Never set that variable on Vercel
production. Verified both ways: 404 without the flag, 200 with it.

**Vercel's 4.5MB request-body cap is the real upload limit, not our 30
minutes.** It is enforced by the platform before the function runs, so no error
of ours can improve it. At 32kbps Opus that is ~17.9 minutes of video, now
derived in `core/media/constraints.ts` as `MAX_TRANSCRIBABLE_SECONDS` and
refused by `validateDuration` **before** extraction, with a new
`too_long_to_upload` code. A test pins that no accepted duration can exceed the
budget — if `-b:a` in `extract-audio.ts` ever changes, `AUDIO_BYTES_PER_SECOND`
must change with it or the prediction goes optimistic and doomed uploads start
reaching a 413 we cannot annotate.

Lifting the 17 minutes needs chunked upload or storage-plus-URL. Dropping the
bitrate is the cheap alternative and is **not** obviously safe: 32kbps is what
the user verified Hinglish accuracy against.

`maxDuration = 300` on the transcribe route needs Vercel **Pro**; Hobby caps at
60s.

### Cross-boundary edit — Claude → create/, 8 Aug

`Dropzone.tsx`, one line: the label said "30 minutes max", which the change
above made untrue. Now derives from `MAX_TRANSCRIBABLE_SECONDS` like the FAQ
does. No layout or state touched. **Gemini: this is yours, please review.**

### New engine: `hero` — 8 Aug

Eighth motion engine, and the first genuinely new *layout*: one oversized
headline word on its own row with the rest of the line set small above and
below it. `dual` looks adjacent but prints the same word twice as an echo;
here the small text is the other words, so the page still reads as a sentence.

Landed in both renderers as the rule requires — `remotion/styles/HeroStack.tsx`,
`TOKEN_RENDERERS`, and `case "hero"` in `draw-captions.ts`. Ten templates use
it. `annotationSizeRatio` / `annotationWeight` / `annotationColor` are reused
from `dual` rather than adding fields, so no stored project needs migrating.

Which word is the hero comes from `heroWordIndex` in `captions/primitives.ts`,
called by **both** renderers over the same strings. Numbers win outright, then
longest word, ties to the later one. Do not reimplement it on either side — a
divergence emphasises a different word at 3x size in the downloaded file.
`captions/hero.test.ts` pins the choice.

**Two shared-layout changes came with it, and they affect `splash` too:**

- `Measured` now carries `fontSize`, and `Line` carries `height` taken from the
  tallest item. The old uniform `fontSizePx * lineHeight` was only correct while
  every engine drew one size, and it **already disagreed with the preview for
  `splash`**, whose accent word is 1.15x. Exported splash captions will sit a
  few px differently than before — that is the bug being fixed, not a new one.
- The draw loop steps by each row's own height instead of one shared line
  height.

**Unverified:** the exported-pixel proof did not run. `scripts/e2e-editor.mjs`
cannot reach the dropzone any more because `/create` is wrapped in
`RequireAuth` and the script has no sign-in step. That break predates this work
and blocks the repo's most important check for every engine, not just this one.
Preview was verified via `/dev/frames`; the export side is mirrored code plus
the shared hero rule, which is weaker evidence. **Fixing the e2e harness to sign
in should come before the next renderer change.**

### Caption transform box — 8 Aug

`CaptionDragLayer` is now a move *and* resize box: dashed bounds, drag anywhere
inside to move, four corner handles scale `fontSizePx` proportionally, two side
handles set `maxLineWidthPct`. Six handles, not eight — there is no
vertical-only property for a top or bottom handle to edit, and a handle that
does nothing is worse than a missing one.

**The box is measured, not predicted.** A rAF loop reads
`[data-bolo-caption-block]` (set in `CaptionOverlay`) out of the Player and
copies its geometry, so the text is inside the box by construction. Two
versions of this were wrong before it worked, and both are worth not repeating:

1. Deriving the height from `fontSizePx` arithmetic. Fails the moment a page
   wraps to three lines or `hero` stacks a headline — exactly when someone
   reaches for the box.
2. Measuring the block's own `getBoundingClientRect`. That is a *layout* box.
   A single word longer than `maxLineWidthPct` has nowhere to wrap and
   overflows it, and every engine scales its spoken word — transforms never
   grow the parent. The box drew with the headline hanging out of both sides
   while an automated containment check passed, because the check measured the
   same wrong rectangle. It now unions the descendant rects, and so does the QA.

Styles are written straight to the DOM; a rectangle through React state 60
times a second would re-render the caption tree for something nothing else
reads. During a gesture the loop stands down and the box previews the pointer,
because config only commits on release.

### `/dev/caption-box` — 8 Aug

QA harness for the above, gated by `ENABLE_DEV_ROUTES` like the other dev
routes. It exists because the box only ever mounts inside `/create`, which is
wrapped in `RequireAuth`, so the control shipped twice unverified. Runs the real
Player and the real overlay — a mock would verify nothing about the measuring,
which is the only part that breaks.

`PlayerStage` **fills its parent and does not size itself**. The harness first
wrapped it in a plain `w-[320px]` div, which collapsed to zero height;
`overflow-hidden` then clipped the whole overlay and every handle silently
stopped being hit-testable while still looking right. The parent must set an
explicit `aspectRatio`.

### Cross-boundary edit — Claude → create/, 8 Aug (2)

`CreateFlow.tsx`, three lines: passes `onResize` to `CaptionDragLayer`, wired to
`patch({ fontSizePx, maxLineWidthPct })`. The prop is optional, so nothing
breaks if it is removed. **Gemini: yours, please review.**

### Known gap — the ₹9 single export

`PLANS` in `legal-content.tsx` no longer lists it. It is a *count* of
watermark-free exports, and export is entirely client-side with no server call
to decrement, so "one" cannot be enforced anywhere honest. The 7-day pass is
fine — time-boxed, checked against a stored expiry. Selling the ₹9 SKU needs a
server-side export counter first.

---

## Before you hand back

Run all four. A green typecheck alone means very little here — most of the real
bugs in this project were invisible to the compiler.

```
npx tsc --noEmit
npx eslint src
npm test
npm run build && npm run start          # port 3111
node scripts/e2e-editor.mjs ./e2e       # 15 checks incl. exported-pixel proof
```

`scripts/e2e-editor.mjs` is the important one. It exports a real MP4 and reads
the pixels back to confirm captions were actually burned in — a valid, playable
MP4 with no captions has shipped from this pipeline before and every other check
passed.

## Known traps

- **Remotion copies the video track** unless `onVideoTrack` forces `reencode`.
  A copied track never calls `onVideoFrame`, so no captions are drawn.
- **Do not close the input `VideoFrame`** in `onVideoFrame`; Remotion owns it.
  Timestamp, duration and dimensions must be carried across verbatim.
- **`networkidle` never settles** now that Firebase holds a connection. Use
  `domcontentloaded` in Playwright.
- **Never edit files containing Devanagari with PowerShell string replacement.**
  It mangles UTF-8 into mojibake. Use the editor tools.
- **Secrets in `.env.local` are compromised** (pasted in chat) and still need
  rotating: the ElevenLabs key and the Firebase Admin service-account key.
