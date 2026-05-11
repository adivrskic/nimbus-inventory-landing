import ApiDocsClient from "./ApiDocsClient";

export const metadata = {
  title: "API Reference",
  description:
    "REST API, webhooks, and SDKs for Nimbus WMS. Pull inventory, record scans, react to real-time events. v1 launches Q3 2026.",
  alternates: { canonical: "https://nimbuswms.com/api-docs" },
  openGraph: {
    type: "website",
    title: "API Reference — Nimbus WMS",
    description:
      "REST API, webhooks, and SDKs for warehouse operations. v1 launches Q3 2026.",
    url: "https://nimbuswms.com/api-docs",
  },
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
