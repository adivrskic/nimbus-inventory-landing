import TrustClient from "./TrustClient";

export const metadata = {
  title: "Trust & Security",
  description:
    "How Nautilus protects your warehouse data. SOC 2 Type II, GDPR, HIPAA compliance, AES-256 encryption, SSO/SAML, and 24/7 monitoring. Built for serious operations.",
  alternates: { canonical: "https://nautilusinventory.com/trust" },
  openGraph: {
    type: "website",
    title: "Trust & Security — Nautilus WMS",
    description:
      "SOC 2 Type II, GDPR, HIPAA. AES-256 encryption, SSO, dedicated monitoring. How Nautilus protects your data.",
    url: "https://nautilusinventory.com/trust",
  },
};

export default function TrustPage() {
  return <TrustClient />;
}
