// ──────────────────────────────────────────────────────────────────────────
// app/ask/page.jsx
// ──────────────────────────────────────────────────────────────────────────
// Full-page version of the chat. Same useChatStream hook, but rendered as a
// centered editorial column instead of a drawer. Direct-linkable, indexable,
// and a good landing surface for "nimbus wms pricing" / "nimbus vs X" queries
// where a chat is the natural first interaction.
//
// If you have signed-in users, pass userEmail/userName from your auth layer
// to the <AskClient /> below — for now it stays anonymous.
// ──────────────────────────────────────────────────────────────────────────

import AskClient from "./AskClient";

export const metadata = {
  title: "Ask Nimbus — get instant answers about Nimbus WMS",
  description:
    "Pricing, features, integrations, comparisons. Ask Nimbus anything — answers stream in, sources cited.",
  alternates: { canonical: "/ask" },
};

export default function AskPage() {
  return <AskClient />;
}
