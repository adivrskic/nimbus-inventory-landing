"use client";
import { useState, useCallback } from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import { BLOG_POSTS } from "@/lib/blogData";

export default function BlogClient({ slug }) {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);
  const heroRef = useRef(null);
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
    gsap.to(heroRef.current.querySelector("[data-body]"), {
      opacity: 1,
      y: 0,
      duration: 0.5,
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
              color: "var(--white)",
              fontFamily: "var(--display)",
              fontSize: 28,
            }}
          >
            Post not found
          </h1>
          <TransitionLink
            href="/blog"
            style={{
              color: "var(--accent)",
              fontFamily: "var(--mono)",
              fontSize: 12,
            }}
          >
            ← Back to blog
          </TransitionLink>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />
      <article
        ref={heroRef}
        style={{ padding: "160px 48px 120px", maxWidth: 720, margin: "0 auto" }}
      >
        <TransitionLink
          href="/blog"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.2)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 40,
          }}
        >
          ← Blog
        </TransitionLink>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 20,
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
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 700,
            color: "var(--white)",
            letterSpacing: "-1px",
            lineHeight: 1.2,
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          {post.title}
        </h1>
        <div
          data-meta=""
          style={{ marginTop: 16, opacity: 0, transform: "translateY(12px)" }}
        >
          <p
            style={{
              fontFamily: "var(--display)",
              fontSize: 17,
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {post.desc}
          </p>
        </div>
        <div
          data-body=""
          style={{ marginTop: 48, opacity: 0, transform: "translateY(16px)" }}
        >
          {post.content &&
            post.content.map((block, i) => (
              <div key={i} style={{ marginBottom: 32 }}>
                {block.heading && (
                  <h2
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: 20,
                      fontWeight: 600,
                      color: "var(--white)",
                      marginBottom: 12,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {block.heading}
                  </h2>
                )}
                <p
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 15,
                    lineHeight: 1.9,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {block.text}
                </p>
              </div>
            ))}
        </div>
      </article>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
