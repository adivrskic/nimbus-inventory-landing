import StatusClient from "./StatusClient";

export const metadata = {
  title: "System Status",
  description:
    "Real-time health and uptime for Nimbus WMS services. Preview — live monitoring coming soon.",
  alternates: { canonical: "https://nimbuswms.com/status" },
  // Don't index until live data is wired
  robots: { index: false, follow: true },
};

export default function StatusPage() {
  return <StatusClient />;
}
