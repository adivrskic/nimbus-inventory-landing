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
//
// State hoisting — IMPORTANT:
// Chat state lives here, not in ChatDrawer. The drawer is conditionally
// rendered (`{open && <ChatDrawer />}`) so it unmounts when closed; if the
// useChatStream hook lived inside the drawer, every close would wipe the
// transcript. By calling useChatStream in this always-mounted provider
// and passing it down to the drawer, the transcript survives:
//   - opening / closing the drawer
//   - mid-stream close-then-reopen (the in-flight fetch keeps writing into
//     the messages array even while the drawer isn't visible)
//   - navigating between pages (layout.js keeps this provider mounted)
//
// What does NOT survive: closing the tab. For that, the `hydrate` effect
// below fetches /api/chat/history on mount whenever localStorage has a
// conversation_id, restoring the transcript from Supabase.
//
// "New chat" is the only thing that clears state: ChatDrawer's Header
// calls chat.reset() which clears messages, conversation_id, localStorage,
// and starts fresh.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import ChatLauncher from "./ChatLauncher";
import ChatDrawer from "./ChatDrawer";
import { useChatStream } from "./useChatStream";

const STORAGE_KEY = "Nautilus_chat_conv_id";

export default function ChatProvider({ userEmail, userName }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /* Chat state is owned by the provider so it survives drawer close. */
  const chat = useChatStream({ userEmail, userName });
  const { hydrate } = chat;

  /* Rehydrate from server on first mount.

     Runs at most once per tab session. If localStorage has a stored
     conversation_id from a previous tab, fetch its messages from the
     server (scoped to the visitor cookie so users can't read each
     other's chats). Populating from server rather than localStorage
     means we get an authoritative transcript including responses that
     finished after the previous tab closed. */
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    fetch(`/api/chat/history?conversation_id=${encodeURIComponent(stored)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.messages?.length) hydrate(data.messages);
      })
      .catch((err) => {
        /* Non-fatal — user starts with empty transcript and can keep
           chatting; server still has the conversation if they want to
           ask Claude to pick up where it left off. */
        console.error("[chat] history fetch failed:", err);
      });
  }, [hydrate]);

  /* /ask is the full-page chat — no launcher needed there.
     /help/* has its own inline doc search. */
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
          chat={chat}
        />
      )}
    </>
  );
}
