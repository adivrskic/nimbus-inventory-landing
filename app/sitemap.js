const SITE_URL = "https://nautilusinventory.com";

const INTEGRATION_SLUGS = [
  "quickbooks",
  "xero",
  "freshbooks",
  "sap-business-one",
  "netsuite",
  "sage",
  "shopify",
  "woocommerce",
  "amazon",
  "square",
  "bigcommerce",
  "lightspeed",
  "shipstation",
  "shippo",
  "easypost",
  "fedex",
  "ups",
  "dhl",
];

const INDUSTRY_SLUGS = [
  "flooring-building-materials",
  "manufacturing-assembly",
  "food-beverage",
  "automotive-parts",
  "pharmaceuticals-medical",
  "ecommerce-3pl",
  "electrical-plumbing",
  "agriculture-seed",
];

const BLOG_SLUGS = [
  "ai-voice-commands",
  "sub-200ms-barcode-recognition",
  "300k-problem-manual-operations",
  "spatial-intelligence-warehouse-map",
  "buildright-supply-case-study",
  "predictive-stock-depletion-math",
  "18-integrations-one-warehouse",
  "2026-warehouse-technology-trends",
];

const HELP_CATEGORY_SLUGS = [
  "getting-started",
  "scanning-inventory",
  "ai-features",
  "integrations",
  "account-billing",
];

const HELP_ARTICLE_SLUGS = [
  "creating-your-first-warehouse",
  "adding-products-and-skus",
  "setting-up-barcode-scanning",
  "inviting-team-members",
  "configuring-sections-bays-levels",
  "your-first-cycle-count",
  "supported-barcode-formats",
  "scan-actions-explained",
  "registering-new-products-via-scan",
  "relocating-inventory",
  "adjusting-quantities",
  "bulk-import-via-csv",
  "voice-commands-reference",
  "setting-up-spatial-mapping",
  "using-intelligent-search",
  "predictive-analytics-dashboard",
  "low-stock-alert-configuration",
  "ai-prioritized-cycle-counting",
  "connecting-quickbooks",
  "shopify-inventory-sync",
  "shipstation-setup-guide",
  "api-authentication",
  "webhook-configuration",
  "zapier-integration",
  "plan-comparison",
  "upgrading-your-plan",
  "managing-team-roles",
  "two-factor-authentication",
  "data-export-and-portability",
  "cancellation-and-refunds",
];

const LEGAL_SLUGS = ["privacy", "terms", "security"];

export default function sitemap() {
  const now = new Date().toISOString();

  const staticPages = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/trust`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/api-docs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/status`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.4,
    },
  ];

  const integrations = INTEGRATION_SLUGS.map((slug) => ({
    url: `${SITE_URL}/integration/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const industries = INDUSTRY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/industry/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogs = BLOG_SLUGS.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const helpArticles = HELP_ARTICLE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/help/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const legal = LEGAL_SLUGS.map((slug) => ({
    url: `${SITE_URL}/legal/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [
    ...staticPages,
    ...integrations,
    ...industries,
    ...blogs,
    ...helpArticles,
    ...legal,
  ];
}
