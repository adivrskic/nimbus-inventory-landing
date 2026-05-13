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
        lines={["Compare Nimbus to the alternatives."]}
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

export default function SplitText({
  text,
  lines,
  tokens,
  accentWord,
  accentLines,
  classNames = {},
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

  return (
    <>
      {normalized.map((lineTokens, li) => (
        <span key={li} className={lineCls}>
          {lineInnerCls ? (
            <span className={lineInnerCls}>{renderWords(lineTokens)}</span>
          ) : (
            renderWords(lineTokens)
          )}
        </span>
      ))}
    </>
  );
}
