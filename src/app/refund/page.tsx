import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/SiteChrome";
import { BUSINESS } from "../legal-content";

export const metadata: Metadata = { title: "Refund & Cancellation Policy" };

export default function RefundPage() {
  return (
    <ContentPage title="Refund & Cancellation Policy" updated="2 August 2026">
      <p>
        This policy explains when you can cancel a Bolo plan and when a refund is
        available. It forms part of our Terms &amp; Conditions.
      </p>

      <h2>Cancelling a subscription</h2>
      <ul>
        <li>You can cancel a monthly plan at any time from your account settings, or by emailing {BUSINESS.email}.</li>
        <li>Cancellation stops the next renewal. You keep access for the remainder of the period you have already paid for.</li>
        <li>We do not charge a cancellation fee.</li>
      </ul>

      <h2>Refunds</h2>
      <p>We will issue a full refund in these cases:</p>
      <ul>
        <li><strong>Duplicate charge.</strong> You were billed more than once for the same purchase.</li>
        <li><strong>Failed delivery.</strong> You were charged but the paid feature was not made available to your account.</li>
        <li><strong>Technical failure on our side.</strong> A defect in the Service prevented you from exporting, and we could not resolve it within 7 days of you reporting it.</li>
        <li><strong>Accidental purchase.</strong> Requested within 24 hours, provided no watermark-free export has been made under that purchase.</li>
      </ul>

      <h2>When a refund is not available</h2>
      <ul>
        <li>Transcription minutes that have already been used. Each transcription incurs a real third-party cost the moment it runs.</li>
        <li>Watermark-free exports that have already been downloaded.</li>
        <li>Dissatisfaction with automated transcription accuracy. Accuracy varies with audio quality, accent and background noise — we recommend testing on the free tier first.</li>
        <li>Inability to export because your browser or device does not support WebCodecs. Browser requirements are stated on the Pricing page and in the FAQ before purchase.</li>
      </ul>

      <h2>How to request a refund</h2>
      <p>
        Email {BUSINESS.email} from the address registered to your account, with
        your payment reference and a short description of the issue. We respond
        within <strong>3 working days</strong>.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Approved refunds are returned to the original payment method through
        Razorpay. Funds typically reach your account within{" "}
        <strong>5–7 working days</strong>, depending on your bank or card issuer.
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
        <br />
        Support hours: {BUSINESS.supportHours}
      </p>
    </ContentPage>
  );
}
