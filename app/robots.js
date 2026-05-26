import { SITE_URL } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /* /trust, /status, /api-docs are built but not live yet — they
           ship placeholder content and are unlinked from Nav/Footer/
           sitemap. Disallow so crawlers don't discover + index the
           placeholders via a stray/external link. Re-enable (remove from
           this list) when those pages are real. Pair with a noindex in
           each page's metadata for belt-and-suspenders. */
        disallow: ["/api/", "/_next/", "/trust", "/status", "/api-docs"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
