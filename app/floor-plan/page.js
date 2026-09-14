import FloorPlanClient from "./FloorPlanClient";

export const metadata = {
  title: "Free Floor Plan Review",
  description:
    "Send Nautilus your warehouse floor plan and get notes back on pick paths, slotting, and layout — free.",
  alternates: { canonical: "https://nautilusinventory.com/floor-plan" },
};

export default function FloorPlanPage() {
  return <FloorPlanClient />;
}
