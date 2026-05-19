import IntegrationsIndexClient from "./IntegrationsIndexClient";

/* Canonical / OG URL fixed to match the actual route (/integration, not
   /integrations). Same canonical-mismatch bug as the industry index. */

export const metadata = {
  title: "Integrations — Nautilus",
  description:
    "Nautilus connects to your accounting, ERP, e-commerce, POS, and shipping platforms. Bidirectional sync, modern APIs, zero manual entry.",
  alternates: { canonical: "https://nautilusinventory.com/integration" },
  openGraph: {
    type: "website",
    title: "Integrations Nautilus supports",
    description:
      "Bidirectional sync with the accounting, ERP, e-commerce, and shipping platforms you already use.",
    url: "https://nautilusinventory.com/integration",
  },
};

export default function IntegrationsIndexPage() {
  return <IntegrationsIndexClient />;
}
