import StatusClient from "./StatusClient";

export const metadata = {
  title: "System Status",
  description:
    "Real-time health and uptime for Nautilus WMS services. Preview — live monitoring coming soon.",
  alternates: { canonical: "https://Nautiluswms.com/status" },
  // Don't index until live data is wired
  robots: { index: false, follow: true },
};

export default function StatusPage() {
  return <StatusClient />;
}
