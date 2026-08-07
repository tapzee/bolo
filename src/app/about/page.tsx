import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/SiteChrome";
import { BUSINESS } from "../legal-content";

export const metadata: Metadata = {
  title: "About",
  description: "Why Bolo exists: captions built properly for Hindi and Hinglish.",
};

export default function AboutPage() {
  return (
    <ContentPage title="About Bolo">
      <p>
        Bolo adds animated, word-level captions to short-form video — built
        specifically for how Indian creators actually speak.
      </p>

      <h2>Why we built it</h2>
      <p>
        Most caption tools are designed for English. Point them at Hinglish — a
        Hindi sentence with English words dropped into the middle of it — and two
        things break. The transcription mangles the code-mixing, and the fonts
        render Devanagari as empty boxes, because the display typefaces that look
        good in reels carry no Devanagari glyphs at all.
      </p>
      <p>
        Bolo handles both. Every caption font falls through to Noto Sans
        Devanagari for Hindi characters, so a line reading{" "}
        <strong>&ldquo;income कैसे double करें&rdquo;</strong> renders correctly —
        each half in the right typeface, on the same line.
      </p>

      <h2>Your video stays yours</h2>
      <p>
        This is the part we care most about. Your video file never leaves your
        browser. Bolo extracts only the audio track on your own device and sends
        that — a few hundred kilobytes — for transcription. Rendering and export
        run on your device too.
      </p>
      <p>
        It is not just a privacy stance. It is why the service can be this cheap:
        we never pay to store or process gigabytes of anyone&rsquo;s video.
      </p>

      <h2>Built to be readable</h2>
      <p>
        Every caption style carries a black outline sized as a proportion of the
        font, not a fixed pixel value — because a 3px outline that looks right at
        40px type disappears at 92px, and captions become unreadable the moment
        the footage behind them is bright. We tested against the worst realistic
        case rather than a convenient one.
      </p>

      <h2>Contact</h2>
      <p>
        {BUSINESS.legalName}
        <br />
        {BUSINESS.address}
        <br />
        Email: {BUSINESS.email}
      </p>
    </ContentPage>
  );
}
