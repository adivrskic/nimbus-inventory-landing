import IntegrationsIndexClient from "./IntegrationsIndexClient";
import { OG_IMAGE } from "@/lib/site";

export const metadata = {
  title: "Integrations",
  description:
    "Nautilus connects to your accounting, ERP, e-commerce, POS, and shipping platforms. Bidirectional sync, modern APIs, zero manual entry.",
  /* The route is /integration (singular) — the canonical and og:url must
     match it, or Google treats the page as a duplicate of a 404. */
  alternates: { canonical: "https://nautilusinventory.com/integration" },
  openGraph: {
    type: "website",
    siteName: "Nautilus Inventory",
      images: [OG_IMAGE],
    title: "Integrations Nautilus supports",
    description:
      "Bidirectional sync with the accounting, ERP, e-commerce, and shipping platforms you already use.",
    url: "https://nautilusinventory.com/integration",
  },
};

export default function IntegrationsIndexPage() {
  return <IntegrationsIndexClient />;
}
