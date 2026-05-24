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
//
// Opening from elsewhere on the page:
// The drawer's open/close state is owned here and is NOT exposed through
// context. Any component that wants to pop the chat (e.g. the home page's
// FinalCTACard) dispatches a window event instead:
//
//   window.dispatchEvent(new Event("open-chat"));
//
// The effect below listens for that event and calls handleOpen, so the
// analytics + focus-capture behavior is identical to clicking the floating
// launcher. Suppressed routes (/ask, /help) unmount this component, so the
// listener simply isn't present there.
//
// Accessibility:
// We capture document.activeElement when the drawer opens (typically the
// floating chat launcher button) and restore focus to it on close. This
// is the WCAG 2.4.3 (Focus Order) requirement for dialogs — keyboard
// users who tab away from the drawer should land back where they were,
// not at the top of the page. The capture happens in handleOpen and the
// restore happens after the drawer's setOpen(false) in handleClose,
// deferred one animation frame so React has time to unmount the drawer
// before we move focus.
//
// Analytics events fired here:
//   - chat_open   { source_page }
//   - chat_close  { surface: 'drawer', messages_count, had_response }
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import ChatLauncher from "./ChatLauncher";
import ChatDrawer from "./ChatDrawer";
import { useChatStream } from "./useChatStream";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "Nautilus_chat_conv_id";

export default function ChatProvider({ userEmail, userName }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /* Chat state is owned by the provider so it survives drawer close. */
  const chat = useChatStream({ userEmail, userName });
  const { hydrate, messages } = chat;

  /* Track the element that had focus when the drawer opened, so we
     can restore focus to it on close (WCAG 2.4.3). Typically the
     floating chat launcher button. */
  const previousFocusRef = useRef(null);

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

  /* Analytics + focus-management wrappers — fire open/close events,
     handle focus capture/restore, while delegating the actual state
     change. */
  const handleOpen = () => {
    if (typeof document !== "undefined") {
      previousFocusRef.current = document.activeElement;
    }
    track("chat_open", { source_page: pathname || "/" });
    setOpen(true);
  };

  const handleClose = () => {
    const hadResponse = messages.some(
      (m) => m.role === "assistant" && m.content && !m.error
    );
    track("chat_close", {
      surface: "drawer",
      messages_count: messages.length,
      had_response: hadResponse,
    });
    setOpen(false);

    /* Restore focus after the drawer unmounts. requestAnimationFrame
       defers one frame so React has time to remove the drawer's DOM
       nodes before we move focus — otherwise the focus call would
       target an element that's about to be removed. */
    const toRestore = previousFocusRef.current;
    previousFocusRef.current = null;
    if (toRestore && typeof toRestore.focus === "function") {
      requestAnimationFrame(() => toRestore.focus());
    }
  };

  /* Allow any component on the page to open the chat drawer by
     dispatching a window event:

       window.dispatchEvent(new Event("open-chat"))

     The drawer's open/close state is owned here, so this is the seam we
     expose rather than hoisting state into context. Routing through
     handleOpen keeps the analytics (chat_open) and focus-capture behavior
     identical to clicking the floating launcher. document.activeElement at
     dispatch time is whatever triggered it (e.g. the CTA button), so focus
     restores there on close. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpenChat = () => handleOpen();
    window.addEventListener("open-chat", onOpenChat);
    return () => window.removeEventListener("open-chat", onOpenChat);
    // handleOpen is recreated each render but only closes over refs and
    // stable setters, so an empty dep array is safe here and avoids
    // rebinding the listener on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* /ask is the full-page chat — no launcher needed there.
     /help/* has its own inline doc search. */
  const suppressed =
    pathname?.startsWith("/ask") || pathname?.startsWith("/help");

  if (suppressed) return null;

  return (
    <>
      <ChatLauncher onOpen={handleOpen} pathname={pathname} hidden={open} />
      {open && (
        <ChatDrawer onClose={handleClose} pathname={pathname} chat={chat} />
      )}
    </>
  );
}
