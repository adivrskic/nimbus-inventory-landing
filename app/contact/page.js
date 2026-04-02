"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import DemoModal from "@/components/DemoModal/DemoModal";

gsap.registerPlugin(ScrollTrigger);

const CONTACTS = [
  {
    label: "Sales",
    email: "sales@nimbuswms.com",
    desc: "Get pricing, schedule a demo, or discuss how Nimbus fits your operation.",
  },
  {
    label: "Support",
    email: "support@nimbuswms.com",
    desc: "Technical help, bug reports, and account assistance. Response within 4 hours.",
  },
  {
    label: "Partnerships",
    email: "partners@nimbuswms.com",
    desc: "Integration partnerships, reseller programs, and strategic alliances.",
  },
  {
    label: "Press",
    email: "press@nimbuswms.com",
    desc: "Media inquiries, press kits, and interview requests.",
  },
];

const OFFICES = [
  {
    city: "San Francisco",
    address: "548 Market St, Suite 92100",
    region: "Headquarters",
  },
  { city: "London", address: "1 Finsbury Ave, EC2M 2PF", region: "EMEA" },
  { city: "Singapore", address: "80 Robinson Rd, #02-00", region: "APAC" },
];

const FIELDS = [
  { label: "Full name", placeholder: "Jane Smith", type: "text" },
  { label: "Work email", placeholder: "jane@company.com", type: "email" },
  { label: "Company", placeholder: "Company name", type: "text" },
  { label: "Subject", placeholder: "How can we help?", type: "text" },
];

export default function ContactPage() {
  const heroRef = useRef(null);
  const formRef = useRef(null);
  const cardRefs = useRef([]);
  const officeRefs = useRef([]);
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
        scrollTrigger: { trigger: card, start: "top 82%" },
      });
    });

    if (formRef.current) {
      gsap.to(formRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: formRef.current, start: "top 80%" },
      });
    }

    officeRefs.current.forEach((office) => {
      if (!office) return;
      gsap.to(office, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: office, start: "top 85%" },
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    color: "var(--white)",
    fontFamily: "var(--mono)",
    fontSize: 13,
    outline: "none",
    transition: "border-color 0.2s",
  };

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
          Get in touch
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
          Whether you need a demo, have a support question, or want to explore a
          partnership — we would love to hear from you.
        </p>
      </div>

      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 48px 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {CONTACTS.map((c, i) => (
          <div
            key={i}
            ref={(el) => (cardRefs.current[i] = el)}
            style={{
              padding: "32px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              opacity: 0,
              transform: "translateY(24px)",
              transition: "border-color 0.4s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(212,168,83,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
            }
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 16,
              }}
            >
              {c.label}
            </div>
            <a
              href={`mailto:${c.email}`}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 13,
                color: "var(--white)",
                textDecoration: "none",
                display: "block",
                marginBottom: 12,
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.target.style.color = "var(--white)")}
            >
              {c.email}
            </a>
            <p
              style={{
                fontFamily: "var(--display)",
                fontSize: 13,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {c.desc}
            </p>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 48px 100px" }}>
        <div
          ref={formRef}
          style={{
            padding: "48px 40px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            opacity: 0,
            transform: "translateY(24px)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--display)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--white)",
              marginBottom: 8,
            }}
          >
            Send us a message
          </div>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.3)",
              marginBottom: 36,
            }}
          >
            Fill in the details and our team will get back to you within 24
            hours.
          </p>
          {FIELDS.map((field, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 8,
                }}
              >
                {field.label}
              </label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontFamily: "var(--mono)",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 8,
              }}
            >
              Message
            </label>
            <textarea
              placeholder="Tell us more..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.08)")
              }
            />
          </div>
          <button
            style={{
              width: "100%",
              padding: 14,
              background: "var(--white)",
              color: "var(--black)",
              fontFamily: "var(--mono)",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 0.5,
              border: "none",
              cursor: "pointer",
              transition: "background 0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "var(--accent)")}
            onMouseLeave={(e) => (e.target.style.background = "var(--white)")}
          >
            Send message
          </button>
        </div>
      </div>

      <div
        style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px 100px" }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 32,
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
          Offices
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {OFFICES.map((o, i) => (
            <div
              key={i}
              ref={(el) => (officeRefs.current[i] = el)}
              style={{
                padding: "28px 32px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                opacity: 0,
                transform: "translateY(20px)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.2)",
                  marginBottom: 12,
                }}
              >
                {o.region}
              </div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--white)",
                  marginBottom: 6,
                }}
              >
                {o.city}
              </div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {o.address}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
