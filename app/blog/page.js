"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import { BLOG_POSTS } from "@/lib/blogData";
gsap.registerPlugin(ScrollTrigger);

export default function BlogPage() {
  const heroRef = useRef(null);
  const postRefs = useRef([]);
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
    postRefs.current.forEach((post) => {
      if (!post) return;
      gsap.to(post, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: post, start: "top 82%" },
      });
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);
  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />
      <div
        ref={heroRef}
        style={{ padding: "160px 48px 80px", maxWidth: 900, margin: "0 auto" }}
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
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px 120px" }}>
        {BLOG_POSTS.map((post, i) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              ref={(el) => (postRefs.current[i] = el)}
              style={{
                padding: "40px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                opacity: 0,
                transform: "translateY(20px)",
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
                  marginBottom: 16,
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
          </Link>
        ))}
      </div>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
