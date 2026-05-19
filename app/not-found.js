// ──────────────────────────────────────────────────────────────────────────
// app/not-found.js
// ──────────────────────────────────────────────────────────────────────────
// Global 404 handler for the App Router. This is the file Next.js renders
// when:
//   - A user hits a URL that doesn't match any route segment
//   - A route segment calls notFound() (e.g. from generateMetadata when a
//     slug doesn't exist)
//
// Previously the project only had app/not-found/page.js, which is a regular
// route file that serves the literal /not-found URL — it does NOT act as
// the framework 404 handler. Unmatched URLs were hitting Next's built-in
// 404 page instead of NotFoundClient. This file closes that gap.
//
// NotFoundClient is kept in app/not-found/NotFoundClient.jsx (the folder
// stays as a co-location for the client component). After deploying this
// file, delete app/not-found/page.js so /not-found is no longer a public
// URL that could be confused with the real 404 surface.
// ──────────────────────────────────────────────────────────────────────────

import NotFoundClient from "./not-found/NotFoundClient";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundClient />;
}
