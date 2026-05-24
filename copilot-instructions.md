# Copilot instructions — Nautilus Marketing Site

These are the conventions for working in this repo (the public marketing site at `nautilusinventory.com`). Follow them when generating or editing code. The full picture is in [`README.md`](../README.md); this file is the rules-of-the-road version, tuned for AI pair-programming.

## What this repo is

The public, unauthenticated front door for **Nautilus WMS** — marketing, SEO, conversion, and an in-browser AI sales assistant (the **Nautilus Helper**). It's one surface of a multi-surface suite (Dashboard, mobile app, edge functions) that all share one design system. It is **not** the app; there is no user login here, only anonymous visitors.

- **Brand is `Nautilus`.** The repo and some identifiers use the old `nimbus` codename — leave those alone (they're greppable), but write `Nautilus` in all user-facing copy.
- **Stack:** Next.js 15 (App Router), React 19, **JavaScript/JSX** (no TypeScript — `@types/react` is for editor hints only), CSS Modules + global tokens, GSAP + Lenis + Three.js, Supabase (service-role only), Anthropic, Resend, GA4.

## Architecture rules

- **Server-first.** Default to Server Components. The pattern is a thin server `page.js` that owns `export const metadata` (and any JSON-LD), wrapping a `"use client"` child that does animation/interactivity. Don't make a whole page a client component just to add one interactive bit.
- **`Nav` and `<main>` render exactly once**, in `app/layout.js`. Never add another `<Nav>` or wrap content in another `<main>` inside a page or wrapper — it duplicates landmarks and breaks screen-reader navigation.
- **Index client wrappers are intentionally trivial** (`IntegrationsIndexClient.jsx`, `IndustriesIndexClient.jsx`). They render a reused section + `Footer` and nothing else. Do **not** add `export const metadata`, a self-import, a non-async page-style component, or a `Nav`/`main` to them. The server `page.js` owns metadata and canonical URLs.
- **One Supabase client:** `getSupabaseAdmin()` from `lib/supabase.js`. It uses the service-role key, bypasses RLS, and is **server-only**. Never import it into a `"use client"` file. There's no auth and no RLS — visitor isolation is the explicit `visitor_id` / `conversation_id` filter on each query. Never remove those filters.
- **Secrets stay server-side.** `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the Resend keys are not `NEXT_PUBLIC_` and must never reach the browser. The client calls `/api/*`; the server proxies.
- **API routes** that stream or send mail use `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`.

## Design system rules

- **Pull every value from the tokens.** Colors, fonts, spacing, radii all come from `app/globals.css` + `app/globals.ocean-theme.css` (the ocean theme is active and wins). Never hard-code a hex, introduce a new font, or add a non-zero border-radius. Suite-wide consistency is a hard requirement.
- **Palette:** gold accent `var(--accent)` (`#d4a853`), bright `var(--accent-bright)`, text `var(--white)`. Background is the transparent ocean gradient — don't paint opaque dark slabs over it (it punches a hole in the depth effect); use the ocean/twilight tokens if a section needs a fill.
- **Type:** `var(--mono)` (JetBrains Mono) is the body default and goes on labels, eyebrows, buttons, and numeric readouts; `var(--display)` (Satoshi) is for headlines and chat message bodies.
- **Sharp corners** (0 radius) almost everywhere.
- **Reuse the signatures:** `.glow-card`, `.bracket-hover`, `.field-shell`, and the shared `CornerButton` / `SplitText` primitives instead of rolling new ones.
- Styling is **CSS Modules** (`Component.module.css`) per component; shared utilities live in `globals.css`.

## The Nautilus Helper (chat)

- **Config lives in `lib/chat/claude-config.js`:** `CLAUDE_MODEL` (`claude-sonnet-4-6`), `MAX_TOKENS`, `MAX_HISTORY_MESSAGES`, the `SYSTEM_PROMPT` array (instructions + KB with `cache_control` on the KB block), and `TOOLS`. Don't scatter model config elsewhere.
- **Keep the knowledge base in sync.** `lib/chat/knowledge-base.js` hand-mirrors pricing (`PRICING_TEXT` ↔ `PricingClient.jsx`) and features (`FEATURES_TEXT` ↔ `AISection.jsx`/`Features.jsx`), and assembles the rest from the data modules. If you change pricing/features, update the KB in the same change or the bot will quote stale facts.
- **Never let the bot invent facts.** The persona forbids fabricated pricing, integrations, customer names, or features. Don't add prompt language or tools that would encourage it.
- **Tools** are defined in `claude-config.js` and implemented in `tool-handlers.js`. There are four: `get_calendly_link`, `draft_email`, `capture_lead`, `propose_cta`. Keep the definition and the handler in sync.
- **Canned answers** (`lib/chat/canned-answers.js`) intercept FAQ questions before Anthropic. New patterns must be tightly anchored (`^…$`) and tested against expected non-matches — a loose regex hijacks real questions.
- **Chat state is hoisted into `ChatProvider`** (mounted once in `layout.js`) so the transcript survives drawer close and navigation. Don't move `useChatStream` into the drawer. Open the chat from anywhere with `window.dispatchEvent(new Event("open-chat"))`.
- **SSE event vocabulary** (client must handle): `ready`, `text`, `tool_start`, `email_draft`, `calendly`, `cta`, `done`, `error`. 429s come back as plain JSON, not SSE.

## SEO rules

- **Every route exports its own `metadata`** (or `generateMetadata` for `[slug]` segments) with an **absolute** canonical URL. Keep canonicals absolute and consistent.
- **JSON-LD** uses the helpers in `components/SEO/JsonLd.jsx`. Site-level schemas (org, software, website) belong on the home page; per-page schemas (FAQPage, Article, BreadcrumbList) on their own routes.
- **The sitemap is hand-maintained at the top level** (`app/sitemap.js`). When you add, remove, or re-enable a top-level route in `Nav`/`Footer`, update the sitemap's static-pages array (and `LEGAL_SLUGS` for legal pages) in the same change. Data-driven detail routes are generated from the modules automatically.

## Content & data

- Integrations, industries, comparisons, blog posts, and help articles are **data-driven**. Add an entry to the relevant module (`integrationData.js`, `industryData.js`, `compareData.js`, `blogData.js`, `helpData.js`) and the detail page, index grid, knowledge base, and sitemap all pick it up.

## Forms & email

- All forms (`/contact`, `DemoModal`, API waitlist) go through `lib/email.js` (shared branded template + `form_submissions` persistence). Don't call Resend directly from a route — that's the historical bug that produced ugly plain-text emails.
- Validation rules live in `lib/validation.js` and run on **both** client and server. Routes also have an IP rate limit (`lib/rateLimit.js`) and a hidden-`website` honeypot (accept-and-drop). Keep these on any new lead surface.

## Analytics

- Fire events through `track()` in `lib/analytics.js`; use `trackLead()` (emits the GA4-recommended `generate_lead`) for conversions. GA is gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID` — code must no-op cleanly when it's absent.
- Pageviews are **manual** (`PageviewTracker`); don't re-enable `send_page_view` in the gtag config.

## Accessibility

- Preserve the skip link, the route announcer, single landmarks, and reduced-motion coordination (`AnimationContext` + `LenisProvider` + `TransitionProvider` + the CSS backstop). Any new animation must respect `prefers-reduced-motion` and the manual pause toggle (`body.animations-paused`).

## Don't

- Don't introduce TypeScript, a CSS framework, hard-coded colors, or new fonts/radii.
- Don't import the Supabase admin client, `ANTHROPIC_API_KEY`, or Resend keys into client code.
- Don't add a second `Nav`/`main`, or put page metadata into an index client wrapper.
- Don't change pricing/feature copy without updating the chat knowledge base.
- Don't add a top-level route without updating `Nav`/`Footer` and `app/sitemap.js`.
- Don't make the chat capable of inventing facts, and don't ship a loose canned-answer regex.

## Before you finish

There's no test suite — validate against `npm run dev`. Sanity-check: does it build, do canonicals/metadata exist on new pages, is the sitemap updated, is the KB still accurate, and does everything still read from the design tokens?
