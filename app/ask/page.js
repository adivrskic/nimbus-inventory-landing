// ──────────────────────────────────────────────────────────────────────────
// app/ask/page.jsx
// ──────────────────────────────────────────────────────────────────────────
// Full-page version of the chat. Same useChatStream hook, but rendered as a
// centered editorial column instead of a drawer. Direct-linkable, indexable,
// and a good landing surface for "Nautilus wms pricing" / "Nautilus vs X"
// queries where a chat is the natural first interaction.
//
// Canonical is now absolute (matches every other page in the project).
// Previously it was a relative "/ask" which technically resolves correctly
// via metadataBase in app/layout.js but was the only inconsistent one.
// ──────────────────────────────────────────────────────────────────────────

import AskClient from "./AskClient";

export const metadata = {
  title: "Ask Nautilus — get instant answers about Nautilus WMS",
  description:
    "Pricing, features, integrations, comparisons. Ask Nautilus anything — answers stream in, sources cited.",
  alternates: { canonical: "https://nautilusinventory.com/ask" },
};

export default function AskPage() {
  return <AskClient />;
}
