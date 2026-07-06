"use client";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import {
  ResourceShell,
  ResourceTOC,
  useResourceSectionAnimations,
} from "@/components/ResourceShell";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import { useDemo } from "@/lib/DemoContext";
import { track } from "@/lib/analytics";
import shellStyles from "@/components/ResourceShell/ResourceShell.module.css";
import pageStyles from "./HelpArticle.module.css";

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ── Feedback localStorage helpers ──
   - feedback:<resource> stores "yes" | "no" per-article so a returning
     visitor sees their previous vote instead of the buttons
   - Nautilus_session_id is a single anonymous-visitor UUID shared across
     all articles, used as soft dedup signal server-side */
const FEEDBACK_KEY = (resource) => `Nautilus_feedback:${resource}`;
const SESSION_KEY = "Nautilus_session_id";

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  /* Fallback for environments without crypto.randomUUID (very rare).
     Not cryptographically random but fine as a session marker. */
  return (
    Math.random().toString(36).slice(2) +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2)
  );
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/* `article` (the single matched article, full content blocks included)
   and `category` (trimmed: title + article slug/title list) are resolved
   server-side in app/help/[slug]/page.js so this client chunk never
   bundles the full HELP_CATEGORIES data module. */
export default function HelpArticleClient({ article, category }) {
  const contentRef = useRef(null);
  useResourceSectionAnimations(contentRef);

  /* ResourceShell still receives `onDemo` so any Nav-style or in-shell
     CTA can wire to the modal. The modal itself is mounted globally in
     app/layout.js; we just hand the context-provided opener through. */
  const { openDemo: openDemoCtx } = useDemo();
  const openDemo = useCallback(
    () => openDemoCtx(undefined, { source: "help_article" }),
    [openDemoCtx]
  );

  /* Feedback state machine:
       null      → show Yes/No buttons (no vote yet)
       "no-form" → showing reason textarea (clicked No but not submitted)
       "yes"     → vote submitted (and persisted)
       "no"      → vote submitted (and persisted) */
  const [feedback, setFeedback] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const post = article;

  /* On mount, restore any prior vote from localStorage so the buttons
     don't reappear on reload. Per-article (so voting on one doesn't
     suppress the buttons on another). */
  useEffect(() => {
    if (typeof window === "undefined" || !post) return;
    try {
      const stored = localStorage.getItem(FEEDBACK_KEY(`help/${post.slug}`));
      if (stored === "yes" || stored === "no") setFeedback(stored);
    } catch {
      /* ignore — localStorage may be disabled in private mode */
    }
  }, [post]);

  /* Sections derived from h2 blocks */
  const sections = useMemo(() => {
    if (!post) return [];
    return post.content
      .filter((b) => b.type === "h2")
      .map((b) => ({ id: slugify(b.text), label: b.text }));
  }, [post]);

  /* Related articles: same category, excluding current, first 4 */
  const related = useMemo(() => {
    if (!category || !post) return [];
    return category.articles.filter((a) => a.slug !== post.slug).slice(0, 4);
  }, [category, post]);

  /* ── Vote submission ──
     Single path: POST to /api/feedback with vote + optional reason. On
     success, persist to localStorage, fire help_feedback_vote analytics
     event, and transition to the final state. On failure, show inline
     error and let the user retry. */
  const submitVote = useCallback(
    async (vote, reasonText = "") => {
      if (!post || submitting) return;
      setSubmitting(true);
      setFeedbackError("");

      const resource = `help/${post.slug}`;
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resource,
            vote,
            reason: reasonText || undefined,
            sessionId: getOrCreateSessionId(),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFeedbackError(
            data.error || "Couldn't save that. Please try again."
          );
          setSubmitting(false);
          return;
        }

        /* Persist locally so the buttons stay hidden on reload */
        try {
          localStorage.setItem(FEEDBACK_KEY(resource), vote);
        } catch {
          /* ignore */
        }

        /* Fire analytics AFTER successful persist but BEFORE state
           change — guarantees we don't double-fire on a failed retry
           and that the event is recorded against the article the
           user actually voted on. */
        track("help_feedback_vote", {
          vote,
          article_slug: post.slug,
          had_reason: Boolean(reasonText),
        });

        setFeedback(vote);
        setReason("");
      } catch (err) {
        console.error(err);
        setFeedbackError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [post, submitting]
  );

  const handleYesClick = () => submitVote("yes", "");
  const handleNoClick = () => {
    /* Don't submit yet — show the reason form first. */
    setFeedbackError("");
    setFeedback("no-form");
  };
  const handleNoSubmit = () => submitVote("no", reason);
  const handleNeverMind = () => {
    setFeedback(null);
    setReason("");
    setFeedbackError("");
  };

  if (!post) {
    return (
      <ResourceShell
        eyebrow="Help Center"
        title="Article not found."
        subtitle="The article you're looking for may have moved or been renamed."
        onDemo={openDemo}
      >
        <div className={pageStyles.notFoundCta}>
          <TransitionLink href="/help" className={shellStyles.link}>
            ← Back to all articles
          </TransitionLink>
        </div>
      </ResourceShell>
    );
  }

  /* Group content blocks into sections (intro + one per h2) */
  const grouped = [];
  let current = { id: "overview", heading: null, blocks: [] };
  for (const block of post.content) {
    if (block.type === "h2") {
      if (current.blocks.length > 0 || current.heading) grouped.push(current);
      current = {
        id: slugify(block.text),
        heading: block.text,
        blocks: [],
      };
    } else {
      current.blocks.push(block);
    }
  }
  if (current.blocks.length > 0 || current.heading) grouped.push(current);

  const renderBlock = (b, i) => {
    if (b.type === "p")
      return (
        <p key={i} className={shellStyles.p}>
          {b.text}
        </p>
      );
    if (b.type === "h3")
      return (
        <h3 key={i} className={shellStyles.h3}>
          {b.text}
        </h3>
      );
    if (b.type === "ul")
      return (
        <ul key={i} className={shellStyles.ul}>
          {(b.items || []).map((item, j) => (
            <li key={j} className={shellStyles.li}>
              {item}
            </li>
          ))}
        </ul>
      );
    if (b.type === "code")
      return (
        <div key={i} className={shellStyles.codeBlock}>
          {b.label && (
            <div className={shellStyles.codeBar}>
              <span className={shellStyles.codeBarLabel}>{b.label}</span>
            </div>
          )}
          <pre className={shellStyles.codePre}>{b.text}</pre>
        </div>
      );
    return null;
  };

  const hasTOC = sections.length > 0;

  /* Single content block, used in both layouts (with TOC and without) */
  const content = (
    <main ref={contentRef} className={shellStyles.content}>
      {grouped.map((group) => (
        <section key={group.id} id={group.id} className={shellStyles.section}>
          {group.heading && <h2 className={shellStyles.h2}>{group.heading}</h2>}
          {group.blocks.map((b, i) => renderBlock(b, i))}
        </section>
      ))}

      {/* ── Was this helpful? ── */}
      <div className={pageStyles.feedback}>
        {feedback === null && (
          <>
            <div className={pageStyles.feedbackLabel}>
              Was this article helpful?
            </div>
            <div className={pageStyles.feedbackButtons}>
              <button
                type="button"
                onClick={handleYesClick}
                disabled={submitting}
                className={pageStyles.feedbackBtn}
              >
                {submitting ? "Sending…" : "Yes, it helped"}
              </button>
              <button
                type="button"
                onClick={handleNoClick}
                disabled={submitting}
                className={pageStyles.feedbackBtn}
              >
                Not really
              </button>
            </div>
            {feedbackError && (
              <div className={pageStyles.feedbackError} role="alert">
                {feedbackError}
              </div>
            )}
          </>
        )}

        {feedback === "no-form" && (
          <>
            <div className={pageStyles.feedbackLabel}>What was missing?</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional — tell us what would have helped."
              rows={3}
              maxLength={2000}
              disabled={submitting}
              className={pageStyles.feedbackReasonInput}
              aria-label="Optional feedback"
            />
            <div className={pageStyles.feedbackReasonActions}>
              <button
                type="button"
                onClick={handleNoSubmit}
                disabled={submitting}
                className={pageStyles.feedbackBtn}
              >
                {submitting ? "Sending…" : "Send feedback"}
              </button>
              <button
                type="button"
                onClick={handleNeverMind}
                disabled={submitting}
                className={pageStyles.feedbackCancel}
              >
                Never mind
              </button>
            </div>
            {feedbackError && (
              <div className={pageStyles.feedbackError} role="alert">
                {feedbackError}
              </div>
            )}
          </>
        )}

        {feedback === "yes" && (
          <div className={pageStyles.feedbackResult}>
            <span className={pageStyles.feedbackResultDot} />
            <span>Thanks for the feedback.</span>
          </div>
        )}

        {feedback === "no" && (
          <div className={pageStyles.feedbackResultRow}>
            <div className={pageStyles.feedbackResult}>
              <span className={pageStyles.feedbackResultDot} />
              <span>Got it — thanks for telling us.</span>
            </div>
            <TransitionLink
              href="/contact"
              onClick={() =>
                track("help_contact_click", { from_slug: post.slug })
              }
              className={pageStyles.feedbackContactLink}
            >
              Talk to support →
            </TransitionLink>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className={pageStyles.related}>
          <div className={pageStyles.relatedLabel}>
            Other articles in {category.title}
          </div>
          <div className={pageStyles.relatedList}>
            {related.map((r) => (
              <TransitionLink
                key={r.slug}
                href={`/help/${r.slug}`}
                onClick={() =>
                  track("help_related_click", {
                    from_slug: post.slug,
                    to_slug: r.slug,
                  })
                }
                className={pageStyles.relatedItem}
              >
                <span className={pageStyles.relatedItemTitle}>{r.title}</span>
                <span className={pageStyles.relatedItemArrow}>→</span>
              </TransitionLink>
            ))}
          </div>
        </div>
      )}
    </main>
  );

  return (
    <ResourceShell
      topStrip={{
        text: `Help · ${category.title}`,
        link: { href: "/help", text: "All articles →" },
      }}
      eyebrow={category.title}
      title={post.title}
      onDemo={openDemo}
    >
      {hasTOC ? (
        <div className={shellStyles.body}>
          <ResourceTOC sections={sections} label="In this article" />
          {content}
        </div>
      ) : (
        content
      )}
    </ResourceShell>
  );
}
