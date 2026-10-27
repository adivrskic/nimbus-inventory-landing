import CalculatorClient from "./CalculatorClient";
import { OG_IMAGE } from "@/lib/site";

export const metadata = {
  title: "ROI Calculator",
  description:
    "Estimate what Nautilus is worth to your warehouse. Drag the numbers in the sentence — your savings update in real time. No signup, no email.",
  alternates: { canonical: "https://nautilusinventory.com/calculator" },
  openGraph: {
    type: "website",
    siteName: "Nautilus Inventory",
      images: [OG_IMAGE],
    title: "Nautilus ROI Calculator",
    description:
      "Estimate your annual savings in 10 seconds. Editable inline calculator.",
    url: "https://nautilusinventory.com/calculator",
  },
};

export default function CalculatorPage() {
  return <CalculatorClient />;
}
