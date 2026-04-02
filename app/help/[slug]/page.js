"use client";
import { useEffect, useRef, useState, useCallback, use } from "react";
import Link from "next/link";
import gsap from "gsap";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import { HELP_CATEGORIES } from "@/lib/helpData";

// Flatten all articles with their category
const ALL_ARTICLES = HELP_CATEGORIES.flatMap((cat) =>
  cat.articles.map((a) => ({
    ...a,
    category: cat.title,
    categorySlug: cat.slug,
  }))
);

export default function HelpArticlePage({ params }) {
  const { slug } = use(params);
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);
  const article = ALL_ARTICLES.find((a) => a.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!heroRef.current) return;
    gsap.to(heroRef.current.querySelector("h1"), {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.2,
    });
    gsap.to(heroRef.current.querySelector("[data-meta]"), {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      delay: 0.3,
    });
    if (contentRef.current)
      gsap.to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.4,
      });
  }, [slug]);

  if (!article) {
    return (
      <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
        <Nav onDemo={openDemo} />
        <div style={{ padding: "200px 48px", textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: 28,
              color: "var(--white)",
            }}
          >
            Article not found
          </h1>
          <Link
            href="/help"
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              marginTop: 20,
              display: "inline-block",
            }}
          >
            Back to help center
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Find related articles in same category
  const related = ALL_ARTICLES.filter(
    (a) => a.categorySlug === article.categorySlug && a.slug !== slug
  ).slice(0, 4);

  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />
      <div
        ref={heroRef}
        style={{ padding: "160px 48px 40px", maxWidth: 720, margin: "0 auto" }}
      >
        <Link
          href="/help"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.3)",
            textDecoration: "none",
            display: "block",
            marginBottom: 24,
          }}
        >
          ← Back to help center
        </Link>
        <div
          data-meta=""
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 20,
            opacity: 0,
            transform: "translateY(10px)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            {article.category}
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(24px, 3.5vw, 38px)",
            fontWeight: 700,
            color: "var(--white)",
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
            opacity: 0,
            transform: "translateY(20px)",
          }}
        >
          {article.title}
        </h1>
      </div>
      <div
        ref={contentRef}
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 48px 80px",
          opacity: 0,
          transform: "translateY(16px)",
        }}
      >
        {article.content.map((block, i) => {
          if (block.type === "h2")
            return (
              <h2
                key={i}
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--white)",
                  marginTop: 36,
                  marginBottom: 10,
                }}
              >
                {block.text}
              </h2>
            );
          return (
            <p
              key={i}
              style={{
                fontFamily: "var(--display)",
                fontSize: 15,
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 16,
              }}
            >
              {block.text}
            </p>
          );
        })}

        {/* Related articles */}
        {related.length > 0 && (
          <div
            style={{
              marginTop: 60,
              paddingTop: 40,
              borderTop: "1px solid rgba(255,255,255,0.04)",
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
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
              Related articles
            </div>
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/help/${r.slug}`}
                style={{
                  display: "block",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  fontFamily: "var(--display)",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.35)",
                  textDecoration: "none",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(255,255,255,0.35)")
                }
              >
                {r.title}
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
