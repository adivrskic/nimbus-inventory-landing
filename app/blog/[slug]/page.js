"use client";
import { useEffect, useRef, useState, useCallback, use } from "react";
import Link from "next/link";
import gsap from "gsap";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import { BLOG_POSTS } from "@/lib/blogData";

export default function BlogArticlePage({ params }) {
  const { slug } = use(params);
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);
  const post = BLOG_POSTS.find((p) => p.slug === slug);

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
      delay: 0.35,
    });
    if (contentRef.current)
      gsap.to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.45,
      });
  }, [slug]);

  if (!post) {
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
            href="/blog"
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              marginTop: 20,
              display: "inline-block",
            }}
          >
            Back to blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />
      <div
        ref={heroRef}
        style={{ padding: "160px 48px 40px", maxWidth: 720, margin: "0 auto" }}
      >
        <Link
          href="/blog"
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
          ← Back to blog
        </Link>
        <div
          data-meta=""
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 20,
            opacity: 0,
            transform: "translateY(12px)",
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
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 700,
            color: "var(--white)",
            letterSpacing: "-1px",
            lineHeight: 1.15,
            opacity: 0,
            transform: "translateY(20px)",
          }}
        >
          {post.title}
        </h1>
      </div>
      <div
        ref={contentRef}
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 48px 120px",
          opacity: 0,
          transform: "translateY(16px)",
        }}
      >
        {post.content.map((block, i) => {
          if (block.type === "h2")
            return (
              <h2
                key={i}
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--white)",
                  marginTop: 40,
                  marginBottom: 12,
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
                marginBottom: 18,
              }}
            >
              {block.text}
            </p>
          );
        })}
      </div>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
