"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import { BLOG_POSTS } from "@/lib/blogData";
gsap.registerPlugin(ScrollTrigger);

const TAGS = ["All", ...Array.from(new Set(BLOG_POSTS.map((p) => p.tag)))];

export default function BlogListClient() {
  const heroRef = useRef(null);
  const gridRef = useRef(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeTag, setActiveTag] = useState("All");
  const openDemo = useCallback(() => setDemoOpen(true), []);

  const filtered =
    activeTag === "All"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.tag === activeTag);

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
    gsap.to(hero.querySelector("[data-filters]"), {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      delay: 0.45,
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  // Animate posts when filter changes
  useEffect(() => {
    if (!gridRef.current) return;
    const posts = gridRef.current.querySelectorAll("[data-post]");
    gsap.fromTo(
      posts,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" }
    );
  }, [activeTag]);

  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />
      <div
        ref={heroRef}
        style={{ padding: "160px 48px 0", maxWidth: 900, margin: "0 auto" }}
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
          Blog
        </h1>
        <p
          style={{
            fontFamily: "var(--display)",
            fontSize: 17,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.4)",
            marginTop: 20,
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          Product updates, engineering deep dives, and warehouse intelligence
          insights.
        </p>

        <div
          data-filters=""
          style={{
            display: "flex",
            gap: 8,
            marginTop: 36,
            marginBottom: 48,
            opacity: 0,
            transform: "translateY(12px)",
            flexWrap: "wrap",
          }}
        >
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={{
                padding: "8px 18px",
                borderRadius: 100,
                border:
                  activeTag === tag
                    ? "1px solid rgba(212,168,83,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                background:
                  activeTag === tag ? "rgba(212,168,83,0.08)" : "transparent",
                color:
                  activeTag === tag
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.35)",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: 0.5,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={gridRef}
        style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px 120px" }}
      >
        {filtered.map((post) => (
          <TransitionLink
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              data-post=""
              style={{
                padding: "36px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.querySelector("h2").style.color =
                  "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.querySelector("h2").style.color =
                  "var(--white)")
              }
            >
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  marginBottom: 14,
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
                  {post.tag}
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                  }}
                >
                  {post.date}
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.15)",
                  }}
                >
                  {post.readTime} read
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "clamp(20px, 2.5vw, 28px)",
                  fontWeight: 600,
                  color: "var(--white)",
                  letterSpacing: "-0.3px",
                  marginBottom: 10,
                  transition: "color 0.3s",
                  lineHeight: 1.25,
                }}
              >
                {post.title}
              </h2>
              <p
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {post.desc}
              </p>
            </div>
          </TransitionLink>
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: "80px 0",
              textAlign: "center",
              fontFamily: "var(--display)",
              fontSize: 15,
              color: "rgba(255,255,255,0.2)",
            }}
          >
            No posts found for this filter.
          </div>
        )}
      </div>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
