import ApiDocsClient from "./ApiDocsClient";

export const metadata = {
  title: "API Reference",
  description:
    "REST API, webhooks, and SDKs for Nautilus WMS. Pull inventory, record scans, react to real-time events. v1 launches Q3 2026.",
  alternates: { canonical: "https://nautilusinventory.com/api-docs" },
  openGraph: {
    type: "website",
    title: "API Reference — Nautilus WMS",
    description:
      "REST API, webhooks, and SDKs for warehouse operations. v1 launches Q3 2026.",
    url: "https://nautilusinventory.com/api-docs",
  },
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
