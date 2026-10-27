import { SITE_URL } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /* Only real non-page paths. /trust, /status and /api-docs used to
           be listed here but those routes no longer exist (they 404), and
           disallowing a 404 just adds noise to Search Console. */
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
