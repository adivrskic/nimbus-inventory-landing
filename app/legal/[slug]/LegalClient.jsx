"use client";
import LegalPage from "@/components/LegalPage/LegalPage";

/* Trivial passthrough. Note: the previous version passed `dark` to Nav
   via LegalPage; that's gone now — Nav auto-detects dark mode from
   pathname (any path starting with /legal/). */
export default function LegalClient({ slug }) {
  return <LegalPage slug={slug} />;
}
