"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function useGlowCards() {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const cards = container.querySelectorAll(".glow-card");
    if (!cards.length) return;

    const handleContainerMove = (e) => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
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
      container.removeEventListener("mousemove", handleContainerMove);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return ref;
}
