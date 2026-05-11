import TrustClient from "./TrustClient";

export const metadata = {
  title: "Trust & Security",
  description:
    "How Nimbus protects your warehouse data. SOC 2 Type II, GDPR, HIPAA compliance, AES-256 encryption, SSO/SAML, and 24/7 monitoring. Built for serious operations.",
  alternates: { canonical: "https://nimbuswms.com/trust" },
  openGraph: {
    type: "website",
    title: "Trust & Security — Nimbus WMS",
    description:
      "SOC 2 Type II, GDPR, HIPAA. AES-256 encryption, SSO, dedicated monitoring. How Nimbus protects your data.",
    url: "https://nimbuswms.com/trust",
  },
};

export default function TrustPage() {
  return <TrustClient />;
}
