# Bolo

AI captions for Hindi and Hinglish reels. Upload a video, get word-level
captions, style them, and export a burned-in MP4 — 9:16, 1:1 or 16:9,
auto-detected from the source.

**Your video never leaves the browser.** ffmpeg.wasm extracts the audio track on
the device and only that (a few hundred KB) is sent for transcription.
Rendering and export run entirely on the client through WebCodecs.

## Running locally

```bash
npm install
cp .env.local.example .env.local   # then fill it in — see below
npm run dev                        # http://localhost:3000
```

`predev` and `prebuild` copy the ffmpeg.wasm core into `public/ffmpeg/`. That
directory is a build artefact and is gitignored; it is reproduced from
`node_modules` on every build, including on Vercel.

## Environment

Every variable is documented in [`.env.local.example`](.env.local.example).
The rule that matters: **anything prefixed `NEXT_PUBLIC_` is inlined into the
browser bundle** and is readable by anyone who loads the page. Secrets must
never carry that prefix.

| Variable | Required | Notes |
|---|---|---|
| `ELEVENLABS_API_KEY` | Yes | Server-only. Transcription does not work without it. |
| `NEXT_PUBLIC_FIREBASE_*` (6) | Yes | Public by design; access is controlled by `firestore.rules`. |
| `FIREBASE_ADMIN_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | Yes | Secret. Verifies auth tokens and owns the credit ledger. |
| `ADMIN_EMAILS` | No | Comma-separated allowlist for `/admin`. Empty means no admins. |
| `NEXT_PUBLIC_ADMIN_UI_EMAILS` | No | Presentation only — decides who *sees* the Admin link. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Not yet | Checkout is not built. Plans display and can be granted by an admin, but not bought. |
| `ENABLE_DEV_ROUTES` | No | Set to `1` to expose `/dev/*`. **Never set on production.** |

`FIREBASE_ADMIN_PRIVATE_KEY` contains literal `\n` escapes and must stay
quoted. The app converts them back at startup.

## Deploying to Vercel

1. Push to GitHub, then import the repo at [vercel.com/new](https://vercel.com/new).
   Framework preset, build command and output directory are all detected — no
   `vercel.json` is needed.
2. Add every required variable above under **Settings → Environment Variables**,
   for Production *and* Preview.
3. Deploy, then apply the security rules — they are not part of the Vercel
   build:

   ```bash
   firebase deploy --only firestore:rules
   ```

   Without this the credit ledger and project documents are unprotected.
   `firestore.rules` is the real access control; the public Firebase config in
   the browser protects nothing.
4. Add your deployed domain to **Firebase Console → Authentication → Settings →
   Authorized domains**, or sign-in fails with `auth/unauthorized-domain`.

### Two platform limits to know about

**Request body: 4.5MB.** Enforced by Vercel before the function runs, so no
error of ours can improve it. Extracted audio is 32kbps Opus, which puts the
ceiling at roughly 17 minutes of video — `MAX_TRANSCRIBABLE_SECONDS` in
`src/core/media/constraints.ts` derives that, and the upload is refused before
extraction rather than failing at the end. Lifting it means chunking the audio
or uploading it to storage and passing a URL.

**Function duration: `maxDuration = 300`** in `src/app/api/transcribe/route.ts`.
Hobby caps at 60s. Long transcriptions will time out unless the project is on
Pro; lower the value to `60` if it stays on Hobby.

## Checks

```bash
npx tsc --noEmit
npx eslint src
npm test
npm run build && npm run start                       # port 3111
ENABLE_DEV_ROUTES=1 npm run start                    # needed for visual-qa
node scripts/e2e-editor.mjs ./e2e                    # exports a real MP4
```

`scripts/e2e-editor.mjs` is the one that matters: it exports an MP4 and reads
the pixels back to confirm captions were actually burned in. A valid, playable
MP4 with no captions has shipped from this pipeline before, and every other
check passed.

## Layout

| Path | What lives there |
|---|---|
| `src/core/` | All business logic. Pure — may never import react, next, remotion or firebase, so the same rules can back a PWA or an Android shell. |
| `src/remotion/` | DOM caption renderer, used for the live preview. |
| `src/lib/export/` | Canvas2D caption renderer, used for the exported MP4. |
| `src/components/` | UI. |
| `src/app/` | Routes, including `/api/transcribe` and `/admin`. |

Caption appearance is drawn by **two** renderers — the DOM one for preview and
the Canvas2D one for export. Any change to how captions look must land in both,
or the user approves one thing and downloads another. See
[`AGENTS.md`](AGENTS.md) for the full rule and the known traps.
