<div align="center">

# Nautilus — Marketing Site

**The public front door for the Nautilus warehouse platform.**
Home, pricing, ROI calculator, comparisons, industries, integrations, blog, help — plus an in-browser AI sales assistant that answers prospects in real time. This is where everyone lands before they ever sign in; the desk-bound app lives on the Dashboard, mobile pickers on the React Native app.

`Next.js 15` · `React 19` · `JavaScript` · `Supabase` · `Anthropic` · `GSAP` · `Three.js`

_Internal engineering doc — Nautilus team only._

</div>

---

## Table of contents

- [What this is](#what-this-is)
- [Where it sits in the suite](#where-it-sits-in-the-suite)
- [Stack](#stack)
- [Page tour](#page-tour)
- [The Nautilus Helper (AI assistant)](#the-nautilus-helper-ai-assistant)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Architecture](#architecture)
- [SEO](#seo)
- [Design system](#design-system)
- [Analytics](#analytics)
- [Accessibility](#accessibility)
- [Forms & email](#forms--email)
- [Project layout](#project-layout)
- [Common tasks](#common-tasks)
- [Deploying](#deploying)
- [Status snapshot](#status-snapshot)
- [Engineering notes](#engineering-notes)

---

## What this is

The Nautilus marketing site is the public, unauthenticated web property at the apex domain (`nautilusinventory.com`). It's the top of the funnel: it explains the product, prices it, lets prospects model their own ROI, compares Nautilus to competitors, and hands warm leads to sales. It is a server-first Next.js App Router application, written in JavaScript (JSX), styled with CSS Modules over a shared design-token system, and animated with GSAP, Lenis, and Three.js.

Its defining feature is the **Nautilus Helper** — an in-browser AI assistant powered by Claude that answers prospect questions with the entire site's content as its knowledge base, drafts emails, books calls, and captures leads. Most of the interesting engineering in this repo lives there (see [The Nautilus Helper](#the-nautilus-helper-ai-assistant)).

This README is for the Nautilus engineering team. It assumes access to the shared Supabase project, an Anthropic API key, a Resend account, and the sibling repos.

> **Naming note.** The product and brand is **Nautilus**. Some internal identifiers still carry the original `nimbus` codename — the repo (`nimbus-inventory-landing`), and assorted comments and asset slugs. The npm package name is `Nautilus-landing`. Treat **Nautilus** as canonical in all new user-facing copy; leave the `nimbus` identifiers alone so they stay greppable across the suite.

---

## Where it sits in the suite

Nautilus is a multi-surface product. This repo is the public entry point.

| Surface                          | Repo / location              | Purpose                                           |
| -------------------------------- | ---------------------------- | ------------------------------------------------- |
| **Marketing site** _(this repo)_ | apex domain (`<apex>`)       | Public marketing, SEO, AI sales assistant         |
| **Dashboard**                    | `app.<apex>`                 | Desk-bound operator + admin console               |
| **Mobile app**                   | React Native (separate repo) | On-the-floor barcode picking + adjustments        |
| **Edge functions**               | `nimbus-edge-functions`      | AI narration and background jobs (Dashboard-side) |

All surfaces share one **design system** — the same gold-on-deep-ocean tokens, Satoshi + JetBrains Mono type, sharp corners, and glow-cards. Consistency across surfaces is a hard requirement; pull from the tokens rather than inventing values. Note that this repo and the Dashboard use **separate Supabase projects** (this one is service-role-only with no auth/RLS — see [Architecture](#architecture)) and the marketing site is the **primary Netlify site**; the Dashboard is a second site that shares this repo's build conventions.

---

## Stack

- **Framework** — Next.js 15 (App Router, React 19, server-first). `next dev --turbopack` in development.
- **Language** — JavaScript / JSX. `@types/react` is present as a dev-dep for editor IntelliSense only; there is no TypeScript build step.
- **AI** — Anthropic SDK (`@anthropic-ai/sdk`) for the Nautilus Helper. Model `claude-sonnet-4-6`; `draft_email` uses Haiku; prompt caching on the knowledge-base block.
- **Data** — Supabase (`@supabase/supabase-js`), service-role admin client only. Stores chat conversations/messages/leads/events, form submissions, and visitor rate-limit rows.
- **Email** — Resend, via a shared branded HTML template in `lib/email.js`.
- **Styling** — CSS Modules + `app/globals.css` (base tokens) + `app/globals.ocean-theme.css` (active theme).
- **Motion** — GSAP (+ ScrollTrigger) for animation; Lenis for smooth scroll.
- **3D** — `three` (raw WebGL renderer, no react-three-fiber here) for the warehouse showcase and footer particle field.
- **Analytics** — GA4 via `gtag.js` with Consent Mode v2; manual SPA pageviews.
- **Hosting** — Netlify.

---

## Page tour

Routes are App Router segments under `app/`. Index pages with detail children are data-driven from modules in `lib/` and `components/*/`.

### Home (`/`)

A long scroll-animated page composed in `app/HomeClient.jsx`: `Hero` → `AISection` → `Features` → `ProblemSolution` → `WarehouseShowcase` (Three.js) → `Integrations` → `Industries` → `FinalCTA` → `FinalCTACard` → `Footer`. (`Testimonials` is built but currently commented out.) The final card's primary action opens the AI chat by dispatching the `open-chat` window event. Three site-level JSON-LD schemas are emitted from the server component in `app/page.js`.

### Conversion surfaces

- **Pricing** (`/pricing`) — Two tiers (Pro, per-warehouse; Enterprise, contact-sales), a monthly/annual toggle, a feature matrix, and FAQs. Prices live in `TIERS`/`PRICING` in `PricingClient.jsx`.
- **ROI calculator** (`/calculator`) — Sliders (warehouse size, pickers, accuracy, wage) drive a live savings model with animated count-ups. Fires `calculator_engaged` / `calculator_compute` analytics events.
- **Compare** (`/compare`, `/compare/[slug]`) — Index grid plus per-competitor comparison pages, data in `app/compare/[slug]/compareData.js` (`COMPETITORS`).

### Content & SEO surfaces

- **Industries** (`/industry`, `/industry/[slug]`) — Data in `components/IndustryPage/industryData.js` (`INDUSTRIES`).
- **Integrations** (`/integration`, `/integration/[slug]`) — Data in `components/IntegrationPage/integrationData.js` (`INTEGRATIONS`); pages feature a Nautilus × Partner connection mark.
- **Blog** (`/blog`, `/blog/[slug]`) — Posts in `lib/blogData.js` (`BLOG_POSTS`).
- **Help center** (`/help`, `/help/[slug]`) — Categories/articles in `lib/helpData.js` (`HELP_CATEGORIES`).
- **Legal** (`/legal/[slug]`) — `privacy`, `terms`, `security` (`LEGAL_SLUGS`).

### Interaction surfaces

- **Ask** (`/ask`) — A full-page, direct-linkable, indexable version of the Nautilus Helper. A natural landing surface for "nautilus wms pricing" / "nautilus vs X" queries.
- **Contact** (`/contact`) — Contact form → Resend + Supabase persistence.

> Some routes are intentionally **disabled** (commented out in `Nav`/`Footer` and omitted from the sitemap): `/trust`, `/status`, and `/api-docs`. If you re-enable any, add it back to `Nav`, `Footer`, and `app/sitemap.js` together.

---

## The Nautilus Helper (AI assistant)

The chat is the centerpiece of the repo. It runs in two surfaces — a slide-in **drawer** (floating launcher, available site-wide) and the full-page **`/ask`** route — both backed by the same hook and the same streaming endpoint.

### Request flow

`components/Chat/useChatStream.js` POSTs to **`app/api/chat/route.js`**, which streams Server-Sent Events back. The route, in order:

1. **Origin check** (production only) against an allowlist (`ALLOWED_HOSTS` + `*.netlify.app` + localhost).
2. **Visitor resolution** via an httpOnly, sameSite cookie (`lib/chat/visitor.js`), so transcripts are scoped to a visitor without a full auth system.
3. **Rate limiting** (`lib/chat/rate-limit.js`) — three layers: a 500ms minimum interval (in-memory), an hourly ceiling (40), and daily ceilings (200 messages / ~1M tokens). Fails **open** on DB error.
4. **Conversation + message persistence** to Supabase (`chat_conversations`, `chat_messages`).
5. **Canned-answer intercept** (`lib/chat/canned-answers.js`) — FAQ-style questions (pricing, "ai features", "vs fishbowl", and the literal starter buttons) are matched by exact key or tightly-anchored regex, then streamed back char-by-char so they're indistinguishable from a real AI response. Skips the Anthropic call entirely.
6. **The agentic loop** (max 5 iterations) — `anthropic.messages.stream(...)` with the system prompt, tools, and trimmed history. Text deltas stream out as `text` events; tool calls are executed and fed back in.

### Configuration (`lib/chat/claude-config.js`)

- `CLAUDE_MODEL = "claude-sonnet-4-6"` (Haiku for lower latency, Opus for the hardest sales chats).
- `MAX_TOKENS = 4096`, `MAX_HISTORY_MESSAGES = 60`.
- `SYSTEM_PROMPT` is an **array**: a short stable instructions block, then the full knowledge base with `cache_control: { type: "ephemeral" }`. The cache breakpoint covers tools + instructions + KB, so steady traffic pays ~10% input cost on cache hits.
- The **Nautilus Helper persona**: direct, concrete, real numbers, short paragraphs, no marketing filler, no bullets/headers (it's a chat), most answers 2–4 sentences. Never invents pricing/integrations/features.

### Knowledge base (`lib/chat/knowledge-base.js`)

Assembled once at module load into a single string from `BLOG_POSTS`, `HELP_CATEGORIES`, `INTEGRATIONS`, `INDUSTRIES`, and `COMPETITORS`, plus **hand-written `PRICING_TEXT` and `FEATURES_TEXT`** sections.

> **Sync invariant.** `PRICING_TEXT` mirrors the pricing page (`PricingClient.jsx`), and `FEATURES_TEXT` mirrors `AISection.jsx` / `Features.jsx`. When you change pricing or feature copy, update the KB too — otherwise the bot quotes stale facts.

### Tools (`lib/chat/tool-handlers.js`)

| Tool                | Does                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------- |
| `get_calendly_link` | Returns a Calendly URL tagged with topic-specific `utm_content`.                      |
| `draft_email`       | A quick Haiku call returning `{ subject, body }`; rendered as an editable block.      |
| `capture_lead`      | Inserts into `chat_leads` and (for sales intents) fires the Resend notification.      |
| `propose_cta`       | Passthrough; the client renders a contextual CTA card. Used sparingly per the prompt. |

### Client state (`components/Chat/`)

`ChatProvider` is mounted **once** in `app/layout.js` and owns the `useChatStream` state, so the transcript survives the drawer closing, mid-stream close/reopen, and page navigation. After a tab reload, it rehydrates from `app/api/chat/history/route.js` (scoped by the visitor cookie). The drawer is suppressed on `/ask` and `/help`. Any component can open it with `window.dispatchEvent(new Event("open-chat"))`.

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Add the Satoshi font

The display font is self-hosted via `next/font/local` and expects a file at **`app/fonts/Satoshi-Variable.woff2`** (variable, 300–900 axis). Download it once:

```bash
curl -L -o app/fonts/Satoshi-Variable.woff2 \
  https://cdn.jsdelivr.net/gh/nicholasgillespie/fonts@main/satoshi/Satoshi-Variable.woff2
```

JetBrains Mono is pulled automatically through `next/font/google`; nothing to download.

### 3. Configure env

Copy the example file and fill in the values from the [environment variables](#environment-variables) table:

```bash
cp .env.local.example .env.local
```

The site runs without most of them — missing keys degrade gracefully (no GA, no chat, forms error cleanly) rather than crashing. The chat needs `ANTHROPIC_API_KEY` + the Supabase pair; forms need the Resend trio.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

### Scripts

| Script          | Does                             |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server (Turbopack) |
| `npm run build` | Production build                 |
| `npm run start` | Serve the production build       |
| `npm run lint`  | Lint with Next's ESLint config   |

---

## Environment variables

| Var                             | Used by                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`             | Nautilus Helper — chat route + `draft_email` (**server only**) |
| `SUPABASE_URL`                  | Service-role admin client                                      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service-role admin client (**server only**)                    |
| `RESEND_API_KEY`                | Transactional email                                            |
| `RESEND_FROM_EMAIL`             | `from` address on outbound lead/contact email                  |
| `LEAD_TO_EMAIL`                 | Sales inbox that receives lead notifications                   |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 (`G-XXXXXXXXXX`). Absent = no tracking script loads.       |
| `NEXT_PUBLIC_CALENDLY_URL`      | Base Calendly URL for `get_calendly_link` / CTA cards          |
| `NEXT_PUBLIC_SITE_URL`          | Canonical/site URL fallback in the KB and schemas              |
| `IP_HASH_SALT`                  | Salt for the daily-rotating IP hash (spam detection)           |

> Notes: Supabase here is **server-only and not `NEXT_PUBLIC_`** — unlike the Dashboard, the browser never talks to Supabase directly. The service-role key bypasses RLS, so it must never reach the client. `ANTHROPIC_API_KEY` is server-only too; the browser hits `/api/chat`, which proxies to Anthropic.

---

## Architecture

### Server-first App Router

Pages default to Server Components. The common shape is a thin server `page.js` that owns `export const metadata` (and JSON-LD), wrapping a `"use client"` component that does the animation and interactivity. Index routes (e.g. `/integration`) follow a strict split:

> **Wrapper invariant.** `IntegrationsIndexClient.jsx` / `IndustriesIndexClient.jsx` are trivial `"use client"` wrappers. The server-side `metadata` and canonical URL live in the sibling `page.js` — never paste page-level `metadata`, a self-import, or a non-async page component into a client wrapper. They also must **not** render their own `<Nav>` or `<main>`; both are provided once by `app/layout.js`, and duplicating them breaks landmarks and screen-reader navigation.

### The Supabase admin client

There is exactly one Supabase client: `lib/supabase.js#getSupabaseAdmin()`, a module-cached service-role client. It is **server-only** — never import it from a `"use client"` file. Because this is a marketing site with anonymous visitors, there is no user auth, no RLS, and no row-level isolation beyond the explicit `visitor_id` / `conversation_id` filters in each query. Those filters are the only thing scoping a visitor to their own chat transcript; don't drop them.

### Data tables

`chat_conversations`, `chat_messages`, `chat_leads`, `chat_events`, `form_submissions`, and a visitor table backing rate limits. Two RPCs are used: `check_visitor_rate` (hourly/daily/token counts) and `increment_cta_count`.

### Providers (in `app/layout.js`, outermost → innermost)

`AnimationProvider` (reduced-motion + pause state) → `LenisProvider` (smooth scroll) → `TransitionProvider` (page-fade + custom `navigateTo`) → `DemoHost` (lazy-loaded `DemoModal` + `openDemo` context) → `Nav`, `<main id="main-content">`, `ChatProvider`. Analytics, `SkipLink`, and `RouteAnnouncer` sit outside the providers.

### Streaming

The chat is the only streaming surface: SSE from `app/api/chat/route.js` (`runtime = "nodejs"`, `dynamic = "force-dynamic"`). Event types: `ready`, `text`, `tool_start`, `email_draft`, `calendly`, `cta`, `done`, `error`. 429s come back as plain JSON (not SSE) so the client can branch on status before opening the stream.

---

## SEO

- **Root metadata** (`app/layout.js`) — `metadataBase`, a title template (`%s | Nautilus WMS`), keyword set, Open Graph + Twitter (`summary_large_image`, `/og-image.png`), full `robots` directives, and a canonical URL. `viewport.themeColor` is `#04091c`.
- **Per-page metadata** — every route exports its own `metadata` (or `generateMetadata` for dynamic segments) with an **absolute** canonical URL. Keep canonicals absolute and consistent across all pages.
- **Structured data** (`components/SEO/JsonLd.jsx`) — `orgSchema`, `softwareSchema` (carries `aggregateRating`), and `websiteSchema` (with a `SearchAction` pointing at `/ask`) are emitted on the home page. Per-page schemas (FAQPage, Article, BreadcrumbList) live on their own routes.
- **Sitemap** (`app/sitemap.js`) — generated dynamically: static pages plus one entry per integration, industry, comparison, blog post, help article, and legal page, each with a tuned priority/change-frequency.

> **Sitemap invariant.** The static-pages array and `LEGAL_SLUGS` must track what's actually in `Nav`/`Footer` and the legal data module. When you add, remove, or re-enable a top-level route, update `app/sitemap.js` in the same change.

---

## Design system

Tokens are defined in `app/globals.css` and themed by `app/globals.ocean-theme.css`, which is the **active theme** (imported after the base in `layout.js`, so its values win). It's the shared source of truth across the marketing site, Dashboard, and mobile app — pull from it rather than inventing values.

- **Ocean theme** — the page background is a scroll-attached gradient descending from twilight navy (`--ocean-surface #0a2240`) at the top to near-black abyss (`--ocean-abyss #00020a`) at the bottom, so scrolling reads as _descending through deeper water_. `--bg`/`--dark` are transparent so the gradient shows through every section. A fixed caustic shimmer sits at the top.
- **Light theme** — a shallow-water variant triggered by `[data-theme="light"]`.
- **Color** — single gold accent (`--accent #d4a853`, bright `#e7c074`); text `--white #f0f6fc`. The accent is rationed; reds/ambers (`--danger`/`--warning`) likewise.
- **Type** — Satoshi (display) + JetBrains Mono. Mono is the body default and is used for every label, eyebrow, button, and numeric readout; Satoshi is for headlines and message bodies.
- **Sharp corners** — 0px radius nearly everywhere.
- **Signature affordances** — `glow-card` (a 1px gold border that lights up with a mouse-following radial gradient on container hover), `bracket-hover` (gold corner brackets on hover), `field-shell` inputs with a gold focus ring, an accent-wipe-on-scroll on CTA cards, and a global SVG grain overlay.

---

## Analytics

GA4, loaded by `components/Analytics/GoogleAnalytics.jsx` and gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID` (no env var → no script, no events, in dev/preview).

- **Consent Mode v2** — defaults to `analytics_storage: granted`, all `ad_*: denied` (the site runs no ads). For EU/UK launch, flip analytics to `denied` here and grant it from a cookie banner via `setConsent()` in `lib/analytics.js`.
- **Manual pageviews** — `send_page_view: false` in the config call; `PageviewTracker.jsx` fires one `page_view` per route change (App Router doesn't auto-fire on client nav). It's wrapped in `Suspense` because it reads `useSearchParams`.
- **Events** — fire through `track()` in `lib/analytics.js`. Notable: `generate_lead` (the GA4-recommended name, via `trackLead`), `lead_form_error`, the `chat_*` funnel events (`chat_cta_shown`, `chat_cta_click`, `chat_reset`), and `calculator_engaged` / `calculator_compute`.

---

## Accessibility

- **Skip link** (`SkipLink`) — first element in the tab order on every page; jumps to `#main-content` (WCAG 2.4.1).
- **Route announcer** (`RouteAnnouncer`) — announces client-side navigations via `aria-live` and moves focus to `#main-content` (WCAG 2.4.3).
- **Single landmarks** — `Nav` and `<main>` are rendered once in `layout.js`; don't duplicate them in pages or wrappers.
- **Reduced motion** — coordinated across `AnimationContext` (auto-pauses, adds `body.animations-paused`), `LenisProvider` (skips smooth-scroll init), `TransitionProvider` (skips page fades), and a CSS backstop in `globals.css` so motion-sensitive users get a calm experience even if JS fails. There's also a manual animation pause toggle in the nav.
- **Chat focus management** — the drawer captures the launcher's focus on open and restores it on close.

---

## Forms & email

Three lead surfaces — the **contact** form (`/contact`), the **demo modal** (`DemoModal`, opened via `openDemo`), and the **API waitlist** — all funnel through `lib/email.js`, which renders one shared branded HTML template and persists every submission to `form_submissions` (a durable record even if Resend errors). Each API route (`app/api/contact`, `app/api/demo`) does IP rate limiting (`lib/rateLimit.js`), a hidden-`website` honeypot (accept-and-drop), and server-side validation that mirrors the client rules in `lib/validation.js`. The chat's `capture_lead` tool reuses `sendDemoRequestEmail` so chat leads look identical to form leads in the sales inbox.

---

## Project layout

```
app/
├── layout.js                 # Root shell: fonts, metadata, providers, Nav, ChatProvider, analytics
├── globals.css               # Base design tokens + utility classes (.glow-card, .bracket-hover, …)
├── globals.ocean-theme.css   # Active theme — ocean gradient + light-mode variant
├── page.js / HomeClient.jsx  # Home (server metadata + JSON-LD / client section composition)
├── sitemap.js                # Dynamic sitemap from the data modules
├── robots.js                 # robots directives
├── fonts/                    # Satoshi-Variable.woff2 (self-hosted; must be added)
├── pricing/                  # Tiers, matrix, FAQ
├── calculator/               # ROI calculator
├── compare/ + compare/[slug] # Competitor comparisons (+ compareData.js)
├── industry/ + [slug]/       # Industry pages
├── integration/ + [slug]/    # Integration pages
├── blog/ + [slug]/           # Blog
├── help/ + [slug]/           # Help center
├── legal/[slug]/             # Privacy, terms, security
├── ask/                      # Full-page Nautilus Helper
├── contact/                  # Contact form
└── api/
    ├── chat/route.js         # Streaming SSE chat endpoint
    ├── chat/history/route.js # Transcript rehydration (visitor-scoped)
    ├── contact/route.js      # Contact form handler
    └── demo/route.js         # Demo modal handler

components/
├── Nav/ Footer/              # Site chrome (rendered once via layout)
├── Hero/ AISection/ Features/ ProblemSolution/ WarehouseShowcase/ Integrations/ Industries/ FinalCTA/ FinalCTACard/
│                             # Home sections (WarehouseShowcase is the Three.js scene)
├── Chat/                     # ChatProvider, ChatDrawer, useChatStream
├── SEO/JsonLd.jsx            # Structured-data helpers
├── Analytics/                # GoogleAnalytics, PageviewTracker
├── IntegrationPage/ IndustryPage/  # Detail-page renderers + their data modules
├── SkipLink/ RouteAnnouncer/ HashScroller/ TransitionLink/ TransitionProvider/ LenisProvider/
└── shared/                   # Logo, CornerButton, SplitText, …

lib/
├── supabase.js               # getSupabaseAdmin() — server-only service-role client
├── email.js                  # Branded template + send/persist for all forms
├── validation.js             # Shared client+server form validators
├── rateLimit.js              # IP rate limiting for form routes
├── analytics.js              # track(), trackLead(), setConsent(), …
├── AnimationContext.js       # Reduced-motion + pause state
├── DemoContext.js            # DemoHost + openDemo (lazy DemoModal)
├── blogData.js / helpData.js # Content data modules
└── chat/
    ├── claude-config.js      # Model, tokens, system prompt array, TOOLS, history shaping
    ├── knowledge-base.js      # Assembled KB string (keep in sync with pricing/features)
    ├── tool-handlers.js      # get_calendly_link, draft_email, capture_lead, propose_cta
    ├── canned-answers.js     # FAQ intercept
    ├── rate-limit.js         # 3-layer chat rate limiting
    └── visitor.js            # httpOnly visitor cookie + IP hashing
```

---

## Common tasks

### Add a new page

1. Create `app/<route>/page.js` as a Server Component that exports `metadata` (absolute canonical) and renders a `"use client"` child for interactivity.
2. Compose with the shared primitives (`CornerButton`, `SplitText`, `glow-card`, `bracket-hover`) and pull all color/spacing/type from the tokens.
3. Add the route to `Nav` and/or `Footer`, and to `app/sitemap.js`.
4. If it has pricing or feature claims a prospect might ask the bot about, mirror them into the knowledge base.

### Add an integration / industry / comparison / blog / help article

These are data-driven. Add an entry to the relevant module (`integrationData.js`, `industryData.js`, `compareData.js`, `blogData.js`, `helpData.js`). The detail page, the index grid, **and** the AI knowledge base + sitemap all read from it, so one edit propagates everywhere.

### Change pricing or feature copy

Edit `PricingClient.jsx` (or the feature components), then update the matching `PRICING_TEXT` / `FEATURES_TEXT` in `lib/chat/knowledge-base.js` so the bot stays accurate.

### Tune or swap the chat model

Edit `CLAUDE_MODEL` in `lib/chat/claude-config.js` (Haiku for speed, Opus for hard sales chats). Adjust `MAX_TOKENS` / `MAX_HISTORY_MESSAGES` there too.

### Add a canned answer

Follow the recipe at the top of `lib/chat/canned-answers.js`: add the prose, an `EXACT` key, and (optionally) a tightly-anchored regex. Test the regex against expected non-matches first — a loose pattern hijacks real questions the AI should answer.

---

## Deploying

Netlify, with the standard Next.js plugin.

- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Plugin:** `@netlify/plugin-nextjs`
- **Env:** set the production values from the [environment variables](#environment-variables) table — especially the server-only secrets (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`).
- Add the production domain(s) to `ALLOWED_HOSTS` in `app/api/chat/route.js` so the chat's origin check passes (`*.netlify.app` preview deploys already pass).
- Make sure `app/fonts/Satoshi-Variable.woff2` is committed, or the build ships without the display font.

---

## Status snapshot

**Live:** Home (all sections except commented-out Testimonials), Pricing, ROI calculator, Compare, Industries, Integrations, Blog, Help, Legal, Contact, the `/ask` page, and the site-wide Nautilus Helper drawer with canned answers, rate limiting, lead capture, email drafting, and Calendly CTAs.

**Stubbed / partial:**

- **Disabled routes** — `/trust`, `/status`, and `/api-docs` are commented out of `Nav`/`Footer` and excluded from the sitemap (the API waitlist email helper exists for when `/api-docs` returns).
- **Testimonials** — built but commented out of the home page.
- **Consent banner** — Consent Mode defaults to analytics-granted; there's no cookie banner yet (needed before EU/UK launch).
- **Tests** — no automated test suite; validate against the dev server manually.

---

## Engineering notes

- Stay server-first: server `page.js` for metadata + data, `"use client"` children for interactivity.
- Pull every color, font, and spacing value from the design tokens — never hard-code a hex or introduce a new font/radius. Suite-wide consistency is a hard requirement.
- The Supabase admin client is **server-only**; the `ANTHROPIC_API_KEY` and Resend keys are too. Nothing secret crosses the `"use client"` boundary.
- See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for the full convention set (it also steers AI pair-programming).

### Known sharp edges worth knowing before you touch them

- **The knowledge base goes stale silently.** `lib/chat/knowledge-base.js` hand-mirrors pricing and features. Change the pricing page without updating it and the bot quotes the old price with total confidence. Same for the data modules feeding it.
- **The sitemap is hand-maintained at the top level.** Adding a top-level route to `Nav` without adding it to `app/sitemap.js` ships an unindexed page. Re-enabling `/trust` etc. means touching both.
- **Index client wrappers are deliberately dumb.** Don't move `metadata` into them, don't let them render `Nav`/`<main>`, don't self-import. The header comments spell out exactly what belongs where — read them before editing.
- **Rate limiting fails open.** If the Supabase RPC errors, chat requests are allowed through rather than blocked. Fine for v1; revisit if you see abuse exploiting a DB outage.
- **Visitor isolation is just a `where` clause.** With no RLS, every chat/history query is scoped only by the explicit `visitor_id` filter. Drop it and you leak transcripts across visitors.
- **No test suite.** Validate changes against the dev server manually.
