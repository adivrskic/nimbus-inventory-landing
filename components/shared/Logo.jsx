import { useId } from "react";

/* Decorative: every placement (nav, footer, demo modal) sets the mark
   beside the "Nautilus" wordmark, so the SVG is aria-hidden.
   The mask id is per instance: all three copies can render at once, and a
   shared id makes every copy depend on whichever mask comes first in the
   document. */
export default function Logo({ size = 22 }) {
  const maskId = `nautilus-n-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId}>
          <rect width="32" height="32" fill="white" />
          <text
            x="16"
            y="27.5"
            textAnchor="middle"
            fontFamily="'Arial Black','Helvetica Neue',Arial,sans-serif"
            fontWeight="900"
            fontSize="32"
            fill="black"
          >
            N
          </text>
        </mask>
      </defs>
      <rect width="32" height="32" fill="white" mask={`url(#${maskId})`} />
    </svg>
  );
}
