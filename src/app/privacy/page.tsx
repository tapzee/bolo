import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/SiteChrome";
import { BUSINESS } from "../legal-content";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy" updated="2 August 2026">
      <p>
        This policy explains what {BUSINESS.legalName} (&ldquo;we&rdquo;)
        collects when you use Bolo, why, and what control you have over it.
      </p>

      <h2>The short version</h2>
      <p>
        <strong>Your video never leaves your browser.</strong> Bolo extracts the
        audio track on your own device and sends only that for transcription.
        Rendering and export also run entirely on your device. We never receive,
        store, or have any way to view your video file.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Extracted audio.</strong> A compressed, speech-only audio track
          (typically a few hundred kilobytes) is sent to our server and forwarded
          to our transcription provider. It is used solely to generate your
          transcript and is not retained after processing.
        </li>
        <li>
          <strong>Account information.</strong> If you sign in, we store your
          email address and, for Google sign-in, your display name — through
          Firebase Authentication.
        </li>
        <li>
          <strong>Project data.</strong> If you are signed in, your caption text,
          timings and style settings are saved to your account. We never store
          video or audio files.
        </li>
        <li>
          <strong>Billing information.</strong> Payments are handled by Razorpay.
          We receive confirmation of payment and your plan status. We never see
          or store your card, UPI or bank details.
        </li>
        <li>
          <strong>Technical data.</strong> Standard server logs including IP
          address, used for rate limiting and abuse prevention.
        </li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your personal data.</li>
        <li>We do not use your content to train machine-learning models.</li>
        <li>We do not upload or retain your video files.</li>
      </ul>

      <h2>Who we share with</h2>
      <p>We share the minimum necessary with these processors:</p>
      <ul>
        <li><strong>ElevenLabs</strong> — receives extracted audio to produce a transcript.</li>
        <li><strong>Google Firebase</strong> — authentication and project storage.</li>
        <li><strong>Razorpay</strong> — payment processing.</li>
      </ul>

      <h2>Retention</h2>
      <p>
        Extracted audio is not retained after a transcript is produced. Project
        data is kept until you delete it or close your account. Logs are retained
        for a limited period for security purposes.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request access to, correction of, or deletion of your personal
        data by writing to {BUSINESS.email}. You may delete individual projects
        from within the app at any time. Signed-out use stores work only in your
        own browser, which you can clear yourself.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        We use browser local storage to keep your theme preference, saved style
        presets, and — when you are signed out — your in-progress project. We use
        cookies only as required for authentication.
      </p>

      <h2>Children</h2>
      <p>
        The Service is not directed at children under 18 and we do not knowingly
        collect their data.
      </p>

      <h2>Changes</h2>
      <p>
        We will update this page if this policy changes, and revise the date
        above.
      </p>

      <h2>Contact</h2>
      <p>
        {BUSINESS.legalName}
        <br />
        {BUSINESS.address}
        <br />
        Email: {BUSINESS.email}
        <br />
        Phone: {BUSINESS.phone}
      </p>
    </ContentPage>
  );
}
