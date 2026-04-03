"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";

export default function ContactPage() {
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const hero = heroRef.current;
    if (!hero) return;
    gsap.to(hero.querySelector("h1"), {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.2,
    });
    gsap.to(hero.querySelector("[data-sub]"), {
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
  }, []);

  const inputBase = {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    color: "var(--white)",
    fontFamily: "var(--display)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.3s",
  };

  return (
    <div style={{ background: "var(--dark)", minHeight: "100vh" }}>
      <Nav onDemo={openDemo} />

      <div
        ref={heroRef}
        style={{
          padding: "160px 48px 20px",
          maxWidth: 640,
          margin: "0 auto",
          textAlign: "center",
        }}
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
          Let&apos;s talk
        </h1>
        <p
          data-sub=""
          style={{
            fontFamily: "var(--display)",
            fontSize: 17,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.35)",
            marginTop: 16,
            opacity: 0,
            transform: "translateY(14px)",
          }}
        >
          Questions about Nimbus? Need a demo? We&apos;d love to hear from you.
        </p>
      </div>

      <div
        ref={contentRef}
        style={{
          maxWidth: 560,
          margin: "48px auto 0",
          padding: "0 48px 120px",
          opacity: 0,
          transform: "translateY(20px)",
        }}
      >
        {/* Contact shortcuts */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Sales",
              email: "sales@nimbuswms.com",
              desc: "Pricing & demos",
            },
            {
              label: "Support",
              email: "support@nimbuswms.com",
              desc: "Help & bug reports",
            },
          ].map((c) => (
            <a
              key={c.label}
              href={`mailto:${c.email}`}
              style={{
                flex: "1 1 220px",
                padding: "20px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
                textDecoration: "none",
                transition: "border-color 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(212,168,83,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")
              }
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: 8,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--white)",
                  marginBottom: 4,
                }}
              >
                {c.email}
              </div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                {c.desc}
              </div>
            </a>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }}
          />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.15)",
            }}
          >
            or send a message
          </span>
          <div
            style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }}
          />
        </div>

        {/* Form */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: 6,
              }}
            >
              Name
            </label>
            <input
              type="text"
              placeholder="Jane Smith"
              style={inputBase}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(212,168,83,0.3)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.06)")
              }
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="jane@company.com"
              style={inputBase}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(212,168,83,0.3)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.06)")
              }
            />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: 6,
            }}
          >
            Subject
          </label>
          <input
            type="text"
            placeholder="How can we help?"
            style={inputBase}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(212,168,83,0.3)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.06)")
            }
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: 6,
            }}
          >
            Message
          </label>
          <textarea
            placeholder="Tell us about your warehouse..."
            rows={5}
            style={{ ...inputBase, resize: "vertical", minHeight: 120 }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(212,168,83,0.3)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.06)")
            }
          />
        </div>
        <button
          style={{
            width: "100%",
            padding: "14px 0",
            background: "var(--white)",
            color: "var(--black)",
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            transition: "background 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "var(--white)";
          }}
        >
          Send message
        </button>

        {/* Response time note */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 24,
            padding: "14px 18px",
            background: "rgba(212,168,83,0.03)",
            border: "1px solid rgba(212,168,83,0.06)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--display)",
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            We typically respond within 4 hours during business hours.
          </span>
        </div>
      </div>

      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
