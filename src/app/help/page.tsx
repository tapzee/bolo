import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/marketing/SiteChrome";
import { BUSINESS } from "../legal-content";

export const metadata: Metadata = {
  title: "Help",
  description: "How to use Bolo, keyboard shortcuts, and fixes for common problems.",
};

export default function HelpPage() {
  return (
    <ContentPage title="Help">
      <h2>Getting started</h2>
      <ul>
        <li>Open <Link href="/create" className="underline underline-offset-4">Create</Link> and drop in a video (MP4, MOV, WebM, MKV, M4V, AVI or 3GP).</li>
        <li>Pick the spoken language. Hindi handles Hinglish well; Auto-detect works if you are unsure.</li>
        <li>Three steps run: read video → extract audio → transcribe. The first run downloads a ~31MB audio engine once per session.</li>
        <li>Edit any word, pick a template, then Export.</li>
      </ul>

      <h2>Editing captions</h2>
      <ul>
        <li><strong>Fix a word</strong> — double-click it in the Captions list on the left, or click it and type in the Text field.</li>
        <li><strong>Fix timing</strong> — drag either edge of a word on the timeline. The waveform underneath shows where speech actually starts.</li>
        <li><strong>Move captions</strong> — drag the handle on the preview to place them anywhere on the frame, or set X/Y in the Text panel.</li>
        <li><strong>Split or join lines</strong> — use the scissors on a line, or “Start new line” / “Join previous” on a selected word.</li>
        <li><strong>Colour one word</strong> — select it and pick a swatch.</li>
        <li>Words the model was unsure about are tinted amber, so you know what to check.</li>
      </ul>

      <h2>Keyboard shortcuts</h2>
      <ul>
        <li><strong>Space</strong> — play / pause</li>
        <li><strong>← →</strong> — step one frame</li>
        <li><strong>Shift + ← →</strong> — jump one second</li>
        <li><strong>Ctrl/Cmd + Z</strong> — undo</li>
        <li><strong>Ctrl/Cmd + Shift + Z</strong> — redo</li>
      </ul>

      <h2>Common problems</h2>

      <p><strong>&ldquo;No speech detected&rdquo;</strong></p>
      <p>
        The audio track has no recognisable speech, or the video has no audio at
        all. Check that the clip actually contains speech and is not muted.
      </p>

      <p><strong>Export button says the browser is unsupported</strong></p>
      <p>
        Export needs WebCodecs — use a recent Chrome or Edge on desktop. Safari
        and most mobile browsers cannot export yet.
      </p>

      <p><strong>Export runs out of memory</strong></p>
      <p>
        Try a lower resolution, or a shorter clip. 4K needs significant memory
        and is desktop-only.
      </p>

      <p><strong>Processing fails on a large file</strong></p>
      <p>
        Browser-side audio extraction gets unreliable above roughly 600MB. Trim
        the clip or compress it before uploading.
      </p>

      <p><strong>Captions say &ldquo;Not saved&rdquo;</strong></p>
      <p>
        Cloud saving needs you to be signed in. Signed out, your work is kept in
        this browser only and will be lost if you clear browsing data.
      </p>

      <h2>Still stuck?</h2>
      <p>
        Email {BUSINESS.email} — include your browser, the video format, and what
        you were doing when it failed. See also the{" "}
        <Link href="/faq" className="underline underline-offset-4">FAQ</Link>.
      </p>
    </ContentPage>
  );
}
