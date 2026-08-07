import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContentPage } from "@/components/marketing/SiteChrome";
import { BUSINESS } from "../legal-content";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <ContentPage title="Contact Us">
      <p>
        We answer every message. For refunds or billing, write from the email
        address registered to your account and include your payment reference.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card/50 p-4">
          <Mail className="mb-2 size-4 text-brand" />
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-medium">{BUSINESS.email}</p>
        </div>
        <div className="rounded-xl border bg-card/50 p-4">
          <Phone className="mb-2 size-4 text-brand" />
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="text-sm font-medium">{BUSINESS.phone}</p>
        </div>
        <div className="rounded-xl border bg-card/50 p-4">
          <MapPin className="mb-2 size-4 text-brand" />
          <p className="text-xs text-muted-foreground">Registered address</p>
          <p className="text-sm font-medium">{BUSINESS.address}</p>
        </div>
        <div className="rounded-xl border bg-card/50 p-4">
          <Clock className="mb-2 size-4 text-brand" />
          <p className="text-xs text-muted-foreground">Support hours</p>
          <p className="text-sm font-medium">{BUSINESS.supportHours}</p>
        </div>
      </div>

      <h2>Business details</h2>
      <p>
        Legal entity: {BUSINESS.legalName}
        <br />
        Trading as: {BUSINESS.tradeName}
        <br />
        GSTIN: {BUSINESS.gstin}
      </p>

      <h2>Response times</h2>
      <ul>
        <li>General questions — within 2 working days</li>
        <li>Billing and refunds — within 3 working days</li>
      </ul>
    </ContentPage>
  );
}
