import StatusClient from "./StatusClient";

export const metadata = {
  title: "System Status",
  description:
    "Real-time health and uptime status for all Nimbus WMS services, integrations, and infrastructure.",
  alternates: { canonical: "https://nimbuswms.com/status" },
};

export default function ApiStatusPage() {
  return <StatusClient />;
}
