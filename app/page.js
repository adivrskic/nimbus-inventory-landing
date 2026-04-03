import HomeClient from "./HomeClient";
import JsonLd, { orgSchema, softwareSchema } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Nimbus WMS — AI-Powered Warehouse Management",
  description:
    "AI-powered warehouse intelligence for modern operations teams. Scanning, spatial mapping, pick optimization, and predictive analytics in a single platform.",
  alternates: { canonical: "https://nimbuswms.com" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={orgSchema()} />
      <JsonLd data={softwareSchema()} />
      <HomeClient />
    </>
  );
}
