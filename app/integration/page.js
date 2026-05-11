import IntegrationsIndexClient from "./IntegrationsIndexClient";

export const metadata = {
  title: "Integrations — Nimbus",
  description:
    "Nimbus connects to your accounting, ERP, e-commerce, POS, and shipping platforms. Bidirectional sync, modern APIs, zero manual entry.",
  alternates: { canonical: "https://nimbuswms.com/integrations" },
  openGraph: {
    type: "website",
    title: "Integrations Nimbus supports",
    description:
      "Bidirectional sync with the accounting, ERP, e-commerce, and shipping platforms you already use.",
    url: "https://nimbuswms.com/integrations",
  },
};

export default function IntegrationsIndexPage() {
  return <IntegrationsIndexClient />;
}
