"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import { useAnimationPaused } from "@/lib/AnimationContext";
import { useDemo } from "@/lib/DemoContext";
import gsap from "gsap";
import Logo from "@/components/shared/Logo";
import styles from "./Nav.module.css";

/* Each industry now carries a short descriptor so the mega menu can use
   the same rich-item treatment (title + desc) as the More menu. Keep
   descriptions ≤ 4-5 words — they're meant to identify, not explain. */
const INDUSTRY_ITEMS = [
  {
    title: "Flooring & Building Materials",
    desc: "Hardwood, tile, adhesives",
    slug: "flooring-building-materials",
  },
  {
    title: "Manufacturing & Assembly",
    desc: "Parts, kits, sub-assemblies",
    slug: "manufacturing-assembly",
  },
  {
    title: "Food & Beverage",
    desc: "Lot tracking & FEFO",
    slug: "food-beverage",
  },
  {
    title: "Automotive & Parts",
    desc: "Catalogs and dealer ops",
    slug: "automotive-parts",
  },
  {
    title: "Pharmaceuticals & Medical",
    desc: "Compliance-first inventory",
    slug: "pharmaceuticals-medical",
  },
  {
    title: "E-commerce & 3PL",
    desc: "Multi-tenant & white-label",
    slug: "ecommerce-3pl",
  },
  {
    title: "Electrical & Plumbing Supply",
    desc: "Fittings, fixtures, kits",
    slug: "electrical-plumbing",
  },
  {
    title: "Agriculture & Seed",
    desc: "Seasonal & bulk inventory",
    slug: "agriculture-seed",
  },
];

/* Same treatment for integrations — each item carries a short descriptor
   for the rich-item rendering. 2-3 words each, identifying what the
   service is for at a glance. */
const INTEGRATION_CATEGORIES = [
  {
    label: "Accounting & ERP",
    items: [
      { title: "QuickBooks", desc: "Cloud accounting", slug: "quickbooks" },
      { title: "Xero", desc: "Online accounting", slug: "xero" },
      { title: "FreshBooks", desc: "Invoicing & books", slug: "freshbooks" },
      { title: "SAP Business One", desc: "SMB ERP", slug: "sap-business-one" },
      { title: "NetSuite", desc: "Cloud ERP suite", slug: "netsuite" },
      { title: "Sage", desc: "Accounting & finance", slug: "sage" },
    ],
  },
  {
    label: "E-commerce & POS",
    items: [
      { title: "Shopify", desc: "Online stores", slug: "shopify" },
      { title: "WooCommerce", desc: "WordPress commerce", slug: "woocommerce" },
      { title: "Amazon", desc: "Marketplace sync", slug: "amazon" },
      { title: "Square", desc: "POS & payments", slug: "square" },
      { title: "BigCommerce", desc: "Enterprise ecom", slug: "bigcommerce" },
      { title: "Lightspeed", desc: "Retail POS", slug: "lightspeed" },
    ],
  },
  {
    label: "Shipping & Logistics",
    items: [
      {
        title: "ShipStation",
        desc: "Multi-carrier labels",
        slug: "shipstation",
      },
      { title: "Shippo", desc: "Shipping API", slug: "shippo" },
      { title: "EasyPost", desc: "Carrier abstraction", slug: "easypost" },
      { title: "FedEx", desc: "Direct carrier sync", slug: "fedex" },
      { title: "UPS", desc: "Direct carrier sync", slug: "ups" },
      { title: "DHL", desc: "International shipping", slug: "dhl" },
    ],
  },
];

/* Mega "More" menu — surfaces every page that isn't already in the
   primary nav. Each item has a short description so users understand
   what they'll find before clicking. */
const MORE_GROUPS = [
  {
    label: "Plans & Tools",
    items: [
      { title: "Pricing", desc: "Plans for every team size", href: "/pricing" },
      {
        title: "ROI Calculator",
        desc: "Estimate your annual savings",
        href: "/calculator",
      },
      { title: "Compare", desc: "Nimbus vs alternatives", href: "/compare" },
    ],
  },
  {
    label: "Resources",
    items: [
      { title: "Blog", desc: "Operations insights & updates", href: "/blog" },
      { title: "Help Center", desc: "Guides and FAQs", href: "/help" },
      // { title: "API Docs", desc: "Developer reference", href: "/api-docs" },
    ],
  },
  {
    label: "Company",
    items: [
      // { title: "Trust", desc: "Security and SOC 2 details", href: "/trust" },
      { title: "Contact", desc: "Talk to our team", href: "/contact" },
      // { title: "Status", desc: "Live system health", href: "/status" },
    ],
  },
  {
    label: "Legal",
    items: [
      {
        title: "Privacy",
        desc: "How we handle your data",
        href: "/legal/privacy",
      },
      { title: "Terms", desc: "Service agreement", href: "/legal/terms" },
      {
        title: "Security",
        desc: "Security practices",
        href: "/legal/security",
      },
    ],
  },
];

/* ── Mobile Menu with GSAP ── */
/* Surface every secondary page in the mobile "Resources" section —
   mirrors the desktop More mega menu since mobile can't fan out the same way. */
const EXTRA_LINKS = [
  { text: "Pricing", href: "/pricing" },
  { text: "ROI Calculator", href: "/calculator" },
  { text: "Compare", href: "/compare" },
  { text: "Blog", href: "/blog" },
  { text: "Help Center", href: "/help" },
  // { text: "API Docs", href: "/api-docs" },
  // { text: "Trust", href: "/trust" },
  { text: "Contact", href: "/contact" },
  // { text: "Status", href: "/status" },
];

function MobileMenu({ open, links, onClose, onDemo }) {
  const menuRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    const items = el.querySelectorAll("[data-mobile-item]");
    const divider = el.querySelector("[data-divider]");
    const extras = el.querySelectorAll("[data-extra]");
    const cta = el.querySelector("[data-cta]");
    const footer = el.querySelector("[data-footer]");

    if (tlRef.current) tlRef.current.kill();

    if (open) {
      el.style.display = "flex";
      document.body.style.overflow = "hidden";
      const tl = gsap.timeline();
      tl.fromTo(
        el,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      tl.fromTo(
        items,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: "power3.out" },
        0.15
      );
      tl.fromTo(
        divider,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.4, ease: "power3.out" },
        0.35
      );
      tl.fromTo(
        extras,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease: "power3.out" },
        0.4
      );
      tl.fromTo(
        cta,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" },
        0.55
      );
      if (footer)
        tl.fromTo(footer, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.6);
      tlRef.current = tl;
    } else {
      document.body.style.overflow = "";
      const tl = gsap.timeline({
        onComplete: () => {
          el.style.display = "none";
        },
      });
      tl.to(el, { opacity: 0, duration: 0.25, ease: "power2.in" });
      tlRef.current = tl;
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      ref={menuRef}
      className={styles.mobileMenu}
      style={{ display: "none" }}
    >
      <div className={styles.mobileInner}>
        <div className={styles.mobileSection}>
          <div className={styles.mobileSectionLabel}>Navigate</div>
          {links.map((l, i) => (
            <TransitionLink
              key={l.text}
              href={l.href}
              data-mobile-item=""
              className={styles.mobileLink}
              onClick={onClose}
            >
              <span className={styles.mobileLinkNum}>0{i + 1}</span>
              <span className={styles.mobileLinkText}>{l.text}</span>
              <svg
                className={styles.mobileLinkArrow}
                width="14"
                height="10"
                viewBox="0 0 14 10"
                fill="none"
              >
                <path
                  d="M1 5H12M9 1L13 5L9 9"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </TransitionLink>
          ))}
        </div>

        <div data-divider="" className={styles.mobileDivider} />

        <div className={styles.mobileSection}>
          <div className={styles.mobileSectionLabel}>Resources</div>
          {EXTRA_LINKS.map((l) => (
            <TransitionLink
              key={l.text}
              href={l.href}
              data-extra=""
              className={styles.mobileExtraLink}
              onClick={onClose}
            >
              {l.text}
            </TransitionLink>
          ))}
        </div>

        <button data-cta="" className={styles.mobileCta} onClick={onDemo}>
          Request a Demo
        </button>

        <div data-footer="" className={styles.mobileFooter}>
          <a
            href="mailto:sales@nimbuswms.com"
            className={styles.mobileFooterLink}
          >
            sales@nimbuswms.com
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Nav({ onDemo, dark }) {
  const [scrolled, setScrolled] = useState(false);
  const { paused, togglePaused } = useAnimationPaused();
  /* Pull openDemo from the DemoContext. Nav is mounted in app/layout.js
     without any props, so without this the Request-a-Demo button would
     silently no-op (onDemo would be undefined, ?.() would swallow the
     click). The `onDemo` prop is still honored when provided — legacy
     call sites that pass it (e.g. IntegrationsIndexClient) keep working. */
  const { openDemo } = useDemo();
  const fireDemo = onDemo || openDemo;
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef(null);
  const megaRef = useRef(null);
  const scrimRef = useRef(null);
  const prevMenu = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleEnter = (menu) => {
    clearTimeout(closeTimer.current);
    setOpenMenu(menu);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 250);
  };
  const cancelClose = () => {
    clearTimeout(closeTimer.current);
  };

  // GSAP open/close
  useEffect(() => {
    const wrap = megaRef.current;
    const scrim = scrimRef.current;
    if (!wrap || !scrim) return;

    if (openMenu) {
      // Find the active panel to measure its height
      const activePanel = wrap.querySelector(`.${styles.megaPanelActive}`);
      const targetH = activePanel ? activePanel.scrollHeight : 0;

      gsap.killTweensOf([wrap, scrim]);
      gsap.to(wrap, {
        height: targetH,
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
      });
      gsap.to(scrim, {
        opacity: 1,
        duration: 0.35,
        ease: "power2.out",
        onStart: () => {
          scrim.style.pointerEvents = "auto";
        },
      });

      // If switching menus (not fresh open), crossfade panels
      if (prevMenu.current && prevMenu.current !== openMenu) {
        const oldPanel = wrap.querySelector(
          `[data-menu="${prevMenu.current}"]`
        );
        const newPanel = wrap.querySelector(`[data-menu="${openMenu}"]`);
        if (oldPanel) gsap.to(oldPanel, { opacity: 0, y: -4, duration: 0.15 });
        if (newPanel)
          gsap.fromTo(
            newPanel,
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.3, delay: 0.1, ease: "power3.out" }
          );
      } else {
        /* Fresh open — animate items in. Targets every rich item across
           all three mega panels with the same selector. */
        const items = wrap.querySelectorAll(
          `.${styles.megaPanelActive} .${styles.megaRichItem}`
        );
        gsap.fromTo(
          items,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.02,
            ease: "power3.out",
            delay: 0.1,
          }
        );
        const left = wrap.querySelector(
          `.${styles.megaPanelActive} .${styles.megaLeft}`
        );
        if (left)
          gsap.fromTo(
            left,
            { opacity: 0, x: -10 },
            {
              opacity: 1,
              x: 0,
              duration: 0.35,
              ease: "power3.out",
              delay: 0.05,
            }
          );
      }
      prevMenu.current = openMenu;
    } else {
      // Close
      gsap.killTweensOf([wrap, scrim]);
      gsap.to(wrap, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
      gsap.to(scrim, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          scrim.style.pointerEvents = "none";
        },
      });
      prevMenu.current = null;
    }
  }, [openMenu]);

  const megaActive = openMenu !== null;

  const links = [
    { text: "AI Engine", href: "/#ai-engine" },
    { text: "Features", href: "/#features" },
    { text: "Integrations", href: "/#integrations", mega: "integrations" },
    { text: "Industries", href: "/#industries", mega: "industries" },
    { text: "More", href: "/pricing", mega: "more" },
  ];

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`${styles.nav} ${
          scrolled || megaActive ? styles.scrolled : ""
        } ${dark ? styles.dark : ""}`}
        onMouseEnter={cancelClose}
        onMouseLeave={handleLeave}
      >
        <TransitionLink href="/" className={styles.logo}>
          <Logo size={27} />
          <div>
            <span className={styles.logoText}>Nimbus</span>
            <span className={styles.logoSub}>Inventory Management Systems</span>
          </div>
        </TransitionLink>

        <div className={`${styles.links} hide-mobile`}>
          {links.map((l) =>
            l.mega ? (
              <div
                key={l.text}
                className={styles.linkWrap}
                onMouseEnter={() => handleEnter(l.mega)}
              >
                <TransitionLink
                  href={l.href}
                  className={`bracket-hover bracket-hover--sm ${
                    openMenu === l.mega ? styles.linkActive : ""
                  }`}
                >
                  {l.text}
                  <svg
                    className={`${styles.chevron} ${
                      openMenu === l.mega ? styles.chevronOpen : ""
                    }`}
                    width="8"
                    height="5"
                    viewBox="0 0 8 5"
                    fill="none"
                  >
                    <path
                      d="M1 1L4 4L7 1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </TransitionLink>
              </div>
            ) : (
              <TransitionLink
                key={l.text}
                href={l.href}
                className="bracket-hover bracket-hover--sm"
              >
                {l.text}
              </TransitionLink>
            )
          )}
        </div>

        <div className={styles.rightGroup}>
          <button
            className={`bracket-hover ${styles.stopBtn} hide-mobile`}
            onClick={togglePaused}
            title={paused ? "Resume animations" : "Pause animations"}
          >
            {paused ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 1L12 7L3 13V1Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect
                  x="1"
                  y="1"
                  width="4"
                  height="12"
                  rx="1"
                  fill="currentColor"
                />
                <rect
                  x="9"
                  y="1"
                  width="4"
                  height="12"
                  rx="1"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
          <button
            className={`bracket-hover ${styles.cta} hide-mobile`}
            onClick={fireDemo}
          >
            Request a Demo
          </button>

          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`${styles.hamburgerLine} ${
                mobileOpen ? styles.hamburgerOpen1 : ""
              }`}
            />
            <span
              className={`${styles.hamburgerLine} ${
                mobileOpen ? styles.hamburgerOpen2 : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <MobileMenu
        open={mobileOpen}
        links={links.filter((l) => l.mega !== "more")}
        onClose={() => setMobileOpen(false)}
        onDemo={() => {
          setMobileOpen(false);
          fireDemo();
        }}
      />

      {/* Full-width mega panel */}
      <div
        ref={megaRef}
        className={styles.megaWrap}
        onMouseEnter={cancelClose}
        onMouseLeave={handleLeave}
      >
        {/* Integrations — 3 category columns with rich items */}
        <div
          data-menu="integrations"
          className={`${styles.megaPanel} ${
            openMenu === "integrations" ? styles.megaPanelActive : ""
          }`}
        >
          <div className={styles.megaContent}>
            <div className={styles.megaLeft}>
              <div className={styles.megaTag}>Integrations</div>
              <p className={styles.megaDesc}>
                Nimbus connects to your existing tools. No rip-and-replace.
              </p>
              <TransitionLink
                href="/integration"
                className={styles.megaViewAll}
                onClick={() => setOpenMenu(null)}
              >
                View all integrations
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  style={{ marginLeft: 6 }}
                >
                  <path
                    d="M1 4H11M8 1L11 4L8 7"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TransitionLink>
            </div>
            <div className={styles.megaCols}>
              {INTEGRATION_CATEGORIES.map((cat) => (
                <div key={cat.label} className={styles.megaMoreCol}>
                  <div className={styles.megaColLabel}>{cat.label}</div>
                  {cat.items.map((item) => (
                    <TransitionLink
                      key={item.slug}
                      href={`/integration/${item.slug}`}
                      className={styles.megaRichItem}
                      onClick={() => setOpenMenu(null)}
                    >
                      <span className={styles.megaRichTitle}>{item.title}</span>
                      <span className={styles.megaRichDesc}>{item.desc}</span>
                    </TransitionLink>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industries — 4-col rich grid, no category labels */}
        <div
          data-menu="industries"
          className={`${styles.megaPanel} ${
            openMenu === "industries" ? styles.megaPanelActive : ""
          }`}
        >
          <div className={styles.megaContent}>
            <div className={styles.megaLeft}>
              <div className={styles.megaTag}>Industries</div>
              <p className={styles.megaDesc}>
                Purpose-built warehouse intelligence for your vertical.
              </p>
              <TransitionLink
                href="/industry"
                className={styles.megaViewAll}
                onClick={() => setOpenMenu(null)}
              >
                View all industries
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  style={{ marginLeft: 6 }}
                >
                  <path
                    d="M1 4H11M8 1L11 4L8 7"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TransitionLink>
            </div>
            <div className={styles.megaIndustriesGrid}>
              {INDUSTRY_ITEMS.map((ind) => (
                <TransitionLink
                  key={ind.slug}
                  href={`/industry/${ind.slug}`}
                  className={styles.megaRichItem}
                  onClick={() => setOpenMenu(null)}
                >
                  <span className={styles.megaRichTitle}>{ind.title}</span>
                  <span className={styles.megaRichDesc}>{ind.desc}</span>
                </TransitionLink>
              ))}
            </div>
          </div>
        </div>

        {/* More — surfaces all secondary site pages */}
        <div
          data-menu="more"
          className={`${styles.megaPanel} ${
            openMenu === "more" ? styles.megaPanelActive : ""
          }`}
        >
          <div className={styles.megaContent}>
            <div className={styles.megaLeft}>
              <div className={styles.megaTag}>Explore</div>
              <p className={styles.megaDesc}>
                Plans, resources, company information, and legal documents.
              </p>
              <TransitionLink
                href="/calculator"
                className={styles.megaFeatured}
                onClick={() => setOpenMenu(null)}
              >
                <div className={styles.megaFeaturedTag}>Tool</div>
                <div className={styles.megaFeaturedTitle}>ROI Calculator</div>
                <div className={styles.megaFeaturedDesc}>
                  See your annual savings in 30 seconds.
                </div>
                <svg
                  className={styles.megaFeaturedArrow}
                  width="14"
                  height="10"
                  viewBox="0 0 14 10"
                  fill="none"
                >
                  <path
                    d="M1 5H12M9 1L13 5L9 9"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TransitionLink>
            </div>
            <div className={styles.megaMoreGrid}>
              {MORE_GROUPS.map((group) => (
                <div key={group.label} className={styles.megaMoreCol}>
                  <div className={styles.megaColLabel}>{group.label}</div>
                  {group.items.map((item) => (
                    <TransitionLink
                      key={item.href}
                      href={item.href}
                      className={styles.megaRichItem}
                      onClick={() => setOpenMenu(null)}
                    >
                      <span className={styles.megaRichTitle}>{item.title}</span>
                      <span className={styles.megaRichDesc}>{item.desc}</span>
                    </TransitionLink>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        ref={scrimRef}
        className={styles.scrim}
        onClick={() => setOpenMenu(null)}
      />
    </>
  );
}
