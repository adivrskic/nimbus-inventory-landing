// ──────────────────────────────────────────────────────────────────────────
// components/Chat/ChatProvider.jsx
// ──────────────────────────────────────────────────────────────────────────
// Mount this once in app/layout.js. It renders the floating launcher and,
// when opened, the slide-in drawer.
//
//   <ChatProvider userEmail={session?.user?.email} userName={session?.user?.name} />
//
// Both props are optional — pass them from your auth layer when a user is
// signed into the app so the bot can capture leads without re-asking. For
// anonymous marketing visitors, omit them.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ChatLauncher from "./ChatLauncher";
import ChatDrawer from "./ChatDrawer";

export default function ChatProvider({ userEmail, userName }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // /ask is the full-page chat — no launcher needed there.
  // /help/* has its own inline doc search.
  const suppressed =
    pathname?.startsWith("/ask") || pathname?.startsWith("/help");

  if (suppressed) return null;

  return (
    <>
      <ChatLauncher
        onOpen={() => setOpen(true)}
        pathname={pathname}
        hidden={open}
      />
      {open && (
        <ChatDrawer
          onClose={() => setOpen(false)}
          pathname={pathname}
          userEmail={userEmail}
          userName={userName}
        />
      )}
    </>
  );
}
