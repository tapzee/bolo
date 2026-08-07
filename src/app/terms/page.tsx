import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/SiteChrome";
import { BUSINESS } from "../legal-content";

export const metadata: Metadata = { title: "Terms & Conditions" };

const UPDATED = "2 August 2026";

export default function TermsPage() {
  return (
    <ContentPage title="Terms & Conditions" updated={UPDATED}>
      <p>
        These Terms govern your use of Bolo (&ldquo;the Service&rdquo;), operated
        by <strong>{BUSINESS.legalName}</strong>. By using the Service you agree
        to these Terms. If you do not agree, please do not use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Bolo adds animated word-level captions to short-form video. Your video
        file is processed inside your own browser and is never uploaded to us.
        Only the extracted audio track is transmitted to our servers, and onward
        to our transcription provider, for the sole purpose of generating a
        transcript.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>You must be at least 18 years old, or have the consent of a parent or legal guardian.</li>
        <li>You are responsible for activity under your account and for keeping your credentials secure.</li>
        <li>You must give accurate information when creating an account.</li>
      </ul>

      <h2>3. Your content</h2>
      <p>
        You retain all rights to the video and audio you process with Bolo. You
        grant us only the limited, temporary right to process your extracted
        audio in order to produce a transcript for you. We do not use your
        content to train models, and we do not sell it.
      </p>
      <p>
        You confirm that you own or are licensed to use the content you upload,
        and that processing it does not infringe anyone&rsquo;s rights.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>process content that is unlawful, defamatory, obscene, or that infringes intellectual property or privacy rights;</li>
        <li>create material that harasses, deceives, or impersonates any person;</li>
        <li>attempt to reverse engineer, disrupt, overload, or gain unauthorised access to the Service;</li>
        <li>resell or redistribute the Service without our written permission.</li>
      </ul>

      <h2>5. Plans, credits and billing</h2>
      <ul>
        <li>Paid plans and one-time purchases are listed on our Pricing page and are billed in Indian Rupees (INR).</li>
        <li>Transcription is metered in credits. One credit covers 12 seconds of audio.</li>
        <li>Subscription plans renew automatically for the stated period until cancelled. You may cancel at any time; cancellation takes effect at the end of the current billing period.</li>
        <li>Payments are processed by Razorpay. We do not store your card or banking details.</li>
        <li>We may change prices with reasonable prior notice. Changes do not affect a billing period already paid for.</li>
      </ul>

      <h2>6. Refunds</h2>
      <p>
        Refunds are governed by our Refund &amp; Cancellation Policy, which forms
        part of these Terms.
      </p>

      <h2>7. Availability</h2>
      <p>
        We aim to keep the Service available but do not guarantee uninterrupted
        or error-free operation. Export requires a browser supporting WebCodecs
        (a recent Chrome or Edge on desktop); we cannot guarantee that every
        browser or device will be able to export.
      </p>

      <h2>8. Third-party services</h2>
      <p>
        We use third parties including a speech-to-text provider, Firebase for
        authentication and storage, and Razorpay for payments. Your use of the
        Service is also subject to their terms.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, our total liability for any claim
        arising out of the Service is limited to the amount you paid us in the
        three months preceding the claim. We are not liable for indirect or
        consequential loss, including lost profits, lost content or lost
        opportunity. Transcription is produced by an automated system and may
        contain errors; you are responsible for reviewing captions before
        publishing.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may suspend or terminate access if these Terms are breached. You may
        stop using the Service at any time.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Courts at
        {" "}{BUSINESS.address} shall have exclusive jurisdiction.
      </p>

      <h2>12. Contact</h2>
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
