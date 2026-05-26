"use client";
import { useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   SplitText
   ───────────────────────────────────────────────────────────────────────
   Renders text broken into per-line / per-word / per-character spans
   so animation (the per-letter rise + rotateX brand signature) can
   target individual characters.

   Replaces ~16 hand-rolled `renderHeadline` / `renderTitle` /
   `renderDescLine` helpers that did the same algorithm with slightly
   different class names. Callsites supply only what's different:
   the data and the CSS classes from their own module.

   ─── ACCESSIBILITY ──────────────────────────────────────────────────

   Per-letter spans break screen reader announcements — VoiceOver/NVDA
   read "L. E. T. apostrophe S. talk." instead of "Let's talk." This
   component handles that two ways:

   1) PREFERRED (new code) — pass `as` to have SplitText render the
      heading element itself with `aria-label={flatText}` and the
      per-letter spans marked `aria-hidden`:

        <SplitText
          as="h1"
          className={styles.heroTitle}
          text="See what Nautilus is worth to you."
          accentWord="you"
          classNames={{ ... }}
        />

   2) LEGACY (existing code, no migration needed) — when `as` is NOT
      provided, SplitText emits an sr-only flat-text span before the
      visible letters, and marks each line span `aria-hidden="true"`.
      The consumer's wrapping element (e.g. <h1>) gets its accessible
      name from the sr-only span. Screen reader hears the full phrase;
      sighted users see the animated letters as before.

      Existing call sites work correctly without changes.

   ─── INPUT MODES (pick one) ─────────────────────────────────────────

   1) text + accentWord — single line, optional one word italic/accent
      <SplitText
        text="Let's talk."
        accentWord="talk"
        classNames={{ line, letter, accent, space }}
      />

   2) lines + accentWord OR accentLines — multi-line
      <SplitText
        lines={["Built for", "every warehouse."]}
        accentLines={[1]}                 // whole line 1 accented
        classNames={{ line, letter, accent, space }}
      />
      <SplitText
        lines={["Compare Nautilus to the alternatives."]}
        accentWord="alternatives"        // matches by case-insensitive
        classNames={{ line, lineInner, letter, accent, space }}
      />

   3) tokens — full control, useful when each word has its own accent
      flag (Pricing, ProblemSolution, FinalCTA, Industries…)
      <SplitText
        tokens={[
          [{ t: "Built", a: false }, { t: "for", a: false }],
          [{ t: "every", a: true }, { t: "warehouse.", a: true }],
        ]}
        classNames={{ line, letter, accent, space }}
      />

   ─── CLASSNAMES (all optional) ──────────────────────────────────────

     line       wrapper around each rendered line
     lineInner  optional inner wrapper inside each line — used by Compare /
                Industry / Integration heroes to apply inline-block sizing
                without breaking the line block's `overflow: hidden`
     letter     applied to every character span (the GSAP target)
     accent     applied alongside `letter` on accented characters
     space      applied to inter-word space spans

   Word-level wrappers always carry the global `.word` class (defined in
   globals.css with `white-space: nowrap`) so words don't break mid-rise.

   ─── TOKENS NORMALIZATION ───────────────────────────────────────────

   `tokens` accepts the existing on-site shapes:
     - { t: "word", a: boolean }           — canonical
     - { t: " ", isSpace: true, a: ... }   — explicit space tokens are
                                             filtered; SplitText inserts
                                             spaces between word tokens
                                             automatically
   ═══════════════════════════════════════════════════════════════════════ */

/* Visually-hidden style. Inline so SplitText doesn't depend on a
   global utility class existing in any consumer's CSS. Matches the
   widely-used `.sr-only` recipe. */
const SR_ONLY_STYLE = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function SplitText({
  as: As,
  className,
  text,
  lines,
  tokens,
  accentWord,
  accentLines,
  classNames = {},
  ...rest
}) {
  const normalized = useMemo(() => {
    /* Helper: case-insensitive word match, ignoring trailing punctuation.
       Keeps the original behavior of every page's renderHeadline. */
    const matchesAccent = (word) =>
      !!accentWord &&
      word.replace(/[.,!?]/g, "").toLowerCase() === accentWord.toLowerCase();

    /* tokens mode — already canonical, but filter out any { isSpace }
       sentinels so callsites can pass their existing data unchanged. */
    if (tokens) {
      return tokens.map((line) =>
        line
          .filter((tok) => !tok.isSpace)
          .map((tok) => ({ t: tok.t, a: !!tok.a }))
      );
    }

    if (lines) {
      return lines.map((line, i) => {
        const fullLineAccent = accentLines?.includes(i);
        return line.split(" ").map((word) => ({
          t: word,
          a: fullLineAccent || matchesAccent(word),
        }));
      });
    }

    if (text) {
      return [
        text.split(" ").map((word) => ({ t: word, a: matchesAccent(word) })),
      ];
    }

    return [];
  }, [text, lines, tokens, accentWord, accentLines]);

  /* Flat accessible text — what a screen reader should announce
     instead of the per-letter spans. Joining tokens with spaces matches
     what a sighted reader sees. */
  const flatText = useMemo(
    () =>
      normalized.map((line) => line.map((tok) => tok.t).join(" ")).join(" "),
    [normalized]
  );

  const {
    line: lineCls = "",
    lineInner: lineInnerCls,
    letter: letterCls = "",
    accent: accentCls = "",
    space: spaceCls = "",
  } = classNames;

  const renderWords = (lineTokens) =>
    lineTokens.map((w, wi) => (
      <span key={wi}>
        <span className="word">
          {[...w.t].map((c, ci) => (
            <span
              key={`${wi}-${ci}`}
              className={`${letterCls} ${w.a ? accentCls : ""}`.trim()}
            >
              {c}
            </span>
          ))}
        </span>
        {wi < lineTokens.length - 1 && <span className={spaceCls} />}
      </span>
    ));

  /* Per-letter spans inherit aria-hidden from their parent line span,
     so we only need aria-hidden on the line level. The global `split-line`
     class (see globals.css) gives glyph descenders room past the line's
     overflow clip so g/y/p/j aren't shaved off — same global-helper pattern
     as `.word`. */
  const renderedLines = normalized.map((lineTokens, li) => (
    <span
      key={li}
      className={`split-line ${lineCls}`.trim()}
      aria-hidden="true"
    >
      {lineInnerCls ? (
        <span className={lineInnerCls}>{renderWords(lineTokens)}</span>
      ) : (
        renderWords(lineTokens)
      )}
    </span>
  ));

  /* Explicit-render path — recommended. SplitText owns the heading
     element. The flat text is exposed via aria-label so screen readers
     announce the actual text on H-key navigation, focus, etc. */
  if (As) {
    return (
      <As className={className} aria-label={flatText} {...rest}>
        {renderedLines}
      </As>
    );
  }

  /* Legacy path — existing call sites that wrap SplitText in their
     own <h1>/<h2>/etc. The visually-hidden flat-text span gives the
     wrapping element its accessible name; the visible animated letters
     are aria-hidden so they don't get announced character-by-character.
     No consumer migration needed for screen reader correctness. */
  return (
    <>
      <span style={SR_ONLY_STYLE}>{flatText}</span>
      {renderedLines}
    </>
  );
}
