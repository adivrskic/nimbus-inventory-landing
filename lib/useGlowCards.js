"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function useGlowCards() {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const cards = container.querySelectorAll(".glow-card");
    if (!cards.length) return;

    /* One rAF per frame, and all the rect READS happen before any style
       WRITE — interleaving them forced a synchronous layout per card on
       every mousemove (N layouts per event on the 18-card grids). */
    let rafId = 0;
    let lastX = 0;
    let lastY = 0;
    const paint = () => {
      rafId = 0;
      const rects = Array.from(cards, (card) => card.getBoundingClientRect());
      cards.forEach((card, i) => {
        card.style.setProperty("--mouse-x", `${lastX - rects[i].left}px`);
        card.style.setProperty("--mouse-y", `${lastY - rects[i].top}px`);
      });
    };
    const handleContainerMove = (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(paint);
    };
    container.addEventListener("mousemove", handleContainerMove);

    const cleanups = [];
    cards.forEach((card) => {
      gsap.set(card, { transformPerspective: 800 });

      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotationY: cx * 5,
          rotationX: cy * -5,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const onLeave = () => {
        gsap.to(card, {
          rotationX: 0,
          rotationY: 0,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("mousemove", handleContainerMove);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return ref;
}
