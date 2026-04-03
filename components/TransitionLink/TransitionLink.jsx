"use client";
import { usePageTransition } from "@/components/TransitionProvider/TransitionProvider";

export default function TransitionLink({
  href,
  children,
  className,
  style,
  onClick,
  ...props
}) {
  const navigateTo = usePageTransition();

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick(e);
    if (navigateTo) navigateTo(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </a>
  );
}
