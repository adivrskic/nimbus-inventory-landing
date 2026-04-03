"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";
import useGlowCards from "@/lib/useGlowCards";
gsap.registerPlugin(ScrollTrigger);

const CONTACTS = [
  {
    label: "Sales",
    email: "sales@nimbuswms.com",
    desc: "Pricing, demos, and custom deployments.",
  },
  {
    label: "Support",
    email: "support@nimbuswms.com",
    desc: "Technical help. Response within 4 hours.",
  },
  {
    label: "Partnerships",
    email: "partners@nimbuswms.com",
    desc: "Integrations, reseller programs, alliances.",
  },
  {
    label: "Press",
    email: "press@nimbuswms.com",
    desc: "Media inquiries and press kits.",
  },
];

const OFFICES = [
  {
    city: "San Francisco",
    address: "548 Market St, Suite 92100",
    region: "HQ",
  },
  { city: "London", address: "1 Finsbury Ave, EC2M 2PF", region: "EMEA" },
  { city: "Singapore", address: "80 Robinson Rd, #02-00", region: "APAC" },
];

const FIELDS = [
  { label: "Name", placeholder: "Jane Smith", type: "text", half: true },
  {
    label: "Email",
    placeholder: "jane@company.com",
    type: "email",
    half: true,
  },
  { label: "Company", placeholder: "Company name", type: "text", half: true },
  {
    label: "Subject",
    placeholder: "How can we help?",
    type: "text",
    half: true,
  },
];

export default function ContactPage() {
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = useCallback(() => setDemoOpen(true), []);
  const glowRef = useGlowCards();

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
        duration: 0.7,
        ease: "power3.out",
        delay: 0.45,
      });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
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

      {/* Hero */}
      <div
        ref={heroRef}
        style={{
          padding: "160px 48px 20px",
          maxWidth: 900,
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
            maxWidth: 460,
            margin: "20px auto 0",
            opacity: 0,
            transform: "translateY(14px)",
          }}
        >
          Whether it&apos;s a demo, a question, or an idea — we&apos;d love to
          hear from you.
        </p>
      </div>

      {/* Main content: 2-col layout */}
      <div
        ref={contentRef}
        style={{
          maxWidth: 1100,
          margin: "60px auto 0",
          padding: "0 48px 100px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          opacity: 0,
          transform: "translateY(20px)",
        }}
      >
        {/* Left: Form */}
        <div
          style={{
            padding: "40px 36px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 24,
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 28,
            }}
          >
            Send a message
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {FIELDS.map((f, i) => (
              <div key={i}>
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
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  style={inputBase}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(212,168,83,0.3)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.06)")
                  }
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
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
              rows={4}
              style={{ ...inputBase, resize: "vertical", minHeight: 100 }}
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
              marginTop: 24,
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
              e.target.style.color = "var(--black)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "var(--white)";
              e.target.style.color = "var(--black)";
            }}
          >
            Send message
          </button>
        </div>

        {/* Right: Contact info + offices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Contact cards */}
          <div
            ref={glowRef}
            className="glow-cards"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {CONTACTS.map((c, i) => (
              <div key={i} className="glow-card" style={{ borderRadius: 16 }}>
                <div className="glow-card-border" />
                <div
                  className="glow-card-content"
                  style={{ padding: "20px 18px", borderRadius: "inherit" }}
                >
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "var(--accent)",
                      marginBottom: 10,
                    }}
                  >
                    {c.label}
                  </div>
                  <a
                    href={`mailto:${c.email}`}
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--white)",
                      textDecoration: "none",
                      display: "block",
                      marginBottom: 8,
                      transition: "color 0.3s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.color = "var(--accent)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.color = "var(--white)")
                    }
                  >
                    {c.email}
                  </a>
                  <p
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.25)",
                    }}
                  >
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Offices */}
          <div
            style={{
              padding: "28px 24px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 20,
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
              Offices
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {OFFICES.map((o, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    paddingBottom: i < OFFICES.length - 1 ? 16 : 0,
                    borderBottom:
                      i < OFFICES.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--display)",
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--white)",
                      }}
                    >
                      {o.city}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--display)",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.2)",
                        marginTop: 2,
                      }}
                    >
                      {o.address}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      letterSpacing: 1,
                      color: "rgba(255,255,255,0.12)",
                      textTransform: "uppercase",
                    }}
                  >
                    {o.region}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Response time */}
          <div
            style={{
              padding: "20px 24px",
              background: "rgba(212,168,83,0.03)",
              border: "1px solid rgba(212,168,83,0.08)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--white)",
                }}
              >
                Typical response within 4 hours
              </div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.25)",
                  marginTop: 2,
                }}
              >
                Enterprise plans include dedicated support channels.
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
