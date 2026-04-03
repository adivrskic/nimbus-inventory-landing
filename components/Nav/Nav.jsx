"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import gsap from "gsap";
import Logo from "@/components/shared/Logo";
import styles from "./Nav.module.css";

const INDUSTRY_ITEMS = [
  {
    title: "Flooring & Building Materials",
    slug: "flooring-building-materials",
  },
  { title: "Manufacturing & Assembly", slug: "manufacturing-assembly" },
  { title: "Food & Beverage", slug: "food-beverage" },
  { title: "Automotive & Parts", slug: "automotive-parts" },
  { title: "Pharmaceuticals & Medical", slug: "pharmaceuticals-medical" },
  { title: "E-commerce & 3PL", slug: "ecommerce-3pl" },
  { title: "Electrical & Plumbing Supply", slug: "electrical-plumbing" },
  { title: "Agriculture & Seed", slug: "agriculture-seed" },
];

const INTEGRATION_CATEGORIES = [
  {
    label: "Accounting & ERP",
    items: [
      { title: "QuickBooks", slug: "quickbooks" },
      { title: "Xero", slug: "xero" },
      { title: "FreshBooks", slug: "freshbooks" },
      { title: "SAP Business One", slug: "sap-business-one" },
      { title: "NetSuite", slug: "netsuite" },
      { title: "Sage", slug: "sage" },
    ],
  },
  {
    label: "E-commerce & POS",
    items: [
      { title: "Shopify", slug: "shopify" },
      { title: "WooCommerce", slug: "woocommerce" },
      { title: "Amazon", slug: "amazon" },
      { title: "Square", slug: "square" },
      { title: "BigCommerce", slug: "bigcommerce" },
      { title: "Lightspeed", slug: "lightspeed" },
    ],
  },
  {
    label: "Shipping & Logistics",
    items: [
      { title: "ShipStation", slug: "shipstation" },
      { title: "Shippo", slug: "shippo" },
      { title: "EasyPost", slug: "easypost" },
      { title: "FedEx", slug: "fedex" },
      { title: "UPS", slug: "ups" },
      { title: "DHL", slug: "dhl" },
    ],
  },
];

export default function Nav({ onDemo, dark }) {
  const [scrolled, setScrolled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const closeTimer = useRef(null);
  const megaRef = useRef(null);
  const scrimRef = useRef(null);
  const prevMenu = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleAnimations = useCallback(() => {
    if (paused) {
      gsap.globalTimeline.resume();
      setPaused(false);
    } else {
      gsap.globalTimeline.pause();
      setPaused(true);
    }
  }, [paused]);

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
        // Fresh open — animate items in
        const items = wrap.querySelectorAll(
          `.${styles.megaPanelActive} .${styles.megaItem}`
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
  ];

  return (
    <>
      <nav
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
            <span className={styles.logoSub}>Inventory Management</span>
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
            className={`bracket-hover ${styles.stopBtn}`}
            onClick={toggleAnimations}
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
            className={`bracket-hover ${styles.cta}`}
            onClick={() => onDemo?.()}
          >
            Request a Demo
          </button>
        </div>
      </nav>

      {/* Full-width mega panel */}
      <div
        ref={megaRef}
        className={styles.megaWrap}
        onMouseEnter={cancelClose}
        onMouseLeave={handleLeave}
      >
        {/* Integrations */}
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
                href="/#integrations"
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
                <div key={cat.label} className={styles.megaCol}>
                  <div className={styles.megaColLabel}>{cat.label}</div>
                  {cat.items.map((item) => (
                    <TransitionLink
                      key={item.slug}
                      href={`/integration/${item.slug}`}
                      className={styles.megaItem}
                      onClick={() => setOpenMenu(null)}
                    >
                      {item.title}
                    </TransitionLink>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Industries */}
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
                href="/#industries"
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
            <div className={styles.megaGrid}>
              {INDUSTRY_ITEMS.map((ind) => (
                <TransitionLink
                  key={ind.slug}
                  href={`/industry/${ind.slug}`}
                  className={styles.megaItem}
                  onClick={() => setOpenMenu(null)}
                >
                  {ind.title}
                </TransitionLink>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrim */}
      <div
        ref={scrimRef}
        className={styles.scrim}
        onClick={() => setOpenMenu(null)}
      />
    </>
  );
}
