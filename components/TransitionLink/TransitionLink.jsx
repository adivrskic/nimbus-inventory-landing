"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { usePageTransition } from "@/components/TransitionProvider/TransitionProvider";

/* Internal = same-origin App Router path. Protocol-relative ("//cdn…"),
   absolute ("https://…"), mailto:, tel: and bare "#hash" links are left to
   the browser. */
const isInternal = (href) =>
  typeof href === "string" && href.startsWith("/") && !href.startsWith("//");

export default function TransitionLink({
  href,
  children,
  className,
  style,
  onClick,
  target,
  ...props
}) {
  const navigateTo = usePageTransition();
  const router = useRouter();
  const prefetched = useRef(null);

  /* Warm the route on hover / focus / touch so the fade-out of the
     transition overlaps the fetch instead of preceding it. Guarded so each
     href is prefetched once per link instance. */
  const prefetch = () => {
    if (!isInternal(href) || prefetched.current === href) return;
    prefetched.current = href;
    const path = href.split("#")[0] || "/";
    try {
      router.prefetch(path);
    } catch {
      /* prefetch is best-effort (unsupported in some test renderers) */
    }
  };

  const handleClick = (e) => {
    if (onClick) onClick(e);

    /* Only intercept a plain left click. Modifier clicks (new tab / window),
       middle clicks, anything a handler already cancelled, target="_blank",
       external and hash-only hrefs all keep the browser's native behaviour. */
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      target === "_blank" ||
      !isInternal(href) ||
      !navigateTo
    ) {
      return;
    }

    e.preventDefault();
    navigateTo(href);
  };

  return (
    <a
      href={href}
      target={target}
      onClick={handleClick}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </a>
  );
}
