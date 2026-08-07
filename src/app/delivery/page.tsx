import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/SiteChrome";
import { BUSINESS } from "../legal-content";

export const metadata: Metadata = { title: "Delivery Policy" };

/**
 * Payment gateways require a shipping/delivery policy even for purely digital
 * products. Stating plainly that nothing physical ships — and that access is
 * granted instantly — is what satisfies that check.
 */
export default function DeliveryPage() {
  return (
    <ContentPage title="Delivery Policy" updated="2 August 2026">
      <p>
        Bolo is a digital service. <strong>No physical goods are shipped.</strong>
      </p>

      <h2>How delivery works</h2>
      <ul>
        <li>Access to a paid plan or one-time purchase is granted to your account <strong>immediately</strong> after payment is confirmed by Razorpay — typically within a few seconds.</li>
        <li>Exported video files are generated on your own device and downloaded directly by your browser. Nothing is shipped or emailed.</li>
        <li>Subscription access remains active for the full billing period.</li>
      </ul>

      <h2>If access is not granted</h2>
      <p>
        Payment confirmation can occasionally be delayed by your bank or by the
        payment gateway. If your plan has not activated within{" "}
        <strong>30 minutes</strong> of a successful payment, email{" "}
        {BUSINESS.email} with your payment reference and we will resolve it. If
        we cannot, you are entitled to a full refund under our Refund &amp;
        Cancellation Policy.
      </p>

      <h2>Delivery charges</h2>
      <p>There are no delivery or shipping charges. Prices shown are final.</p>

      <h2>Service area</h2>
      <p>
        Bolo is available worldwide over the internet. Prices are charged in
        Indian Rupees (INR).
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
