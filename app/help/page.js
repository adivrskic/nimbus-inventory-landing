"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import { HELP_CATEGORIES } from "@/lib/helpData";
gsap.registerPlugin(ScrollTrigger);

export default function HelpPage() {
  const heroRef = useRef(null);
  const cardRefs = useRef([]);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);
  useEffect(() => {
    window.scrollTo(0, 0);
    const hero = heroRef.current;
    gsap.to(hero.querySelector("h1"), {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.2,
    });
    gsap.to(hero.querySelector("p"), {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      delay: 0.35,
    });
    cardRefs.current.forEach((card) => {
      if (!card) return;
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 80%" },
      });
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);
  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />
      <div
        ref={heroRef}
        style={{ padding: "160px 48px 80px", maxWidth: 1400, margin: "0 auto" }}
      >
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 700,
            color: "var(--white)",
            letterSpacing: "-1.5px",
            opacity: 0,
            transform: "translateY(20px)",
          }}
        >
          Help Center
        </h1>
        <p
          style={{
            fontFamily: "var(--display)",
            fontSize: 17,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.4)",
            maxWidth: 560,
            marginTop: 20,
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          Everything you need to get the most out of Nimbus. Guides, tutorials,
          and reference documentation for every feature.
        </p>
      </div>
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 48px 120px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
        {HELP_CATEGORIES.map((cat, ci) => (
          <div
            key={ci}
            ref={(el) => (cardRefs.current[ci] = el)}
            style={{
              padding: "36px 32px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              opacity: 0,
              transform: "translateY(24px)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 20,
              }}
            >
              {cat.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cat.articles.map((a, ai) => (
                <Link
                  key={a.slug}
                  href={`/help/${a.slug}`}
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      ai < cat.articles.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    fontFamily: "var(--display)",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.35)",
                    textDecoration: "none",
                    transition: "color 0.3s",
                    display: "block",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
                  onMouseLeave={(e) =>
                    (e.target.style.color = "rgba(255,255,255,0.35)")
                  }
                >
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
