export const LEGAL_PAGES = {
  privacy: {
    title: "Privacy Policy",
    updated: "September 13, 2026",
    sections: [
      {
        heading: "Information we collect",
        summary:
          "What you tell us when you sign up, plus what the platform records as you use it — scans, inventory moves, floor plans. Device info collected automatically for compatibility.",
        content:
          "Nautilus collects information you provide directly when creating an account, configuring your warehouse, or contacting support. This includes your name, email address, company name, warehouse address, and billing information. We also collect operational data generated through your use of the platform — scan logs, inventory movements, floor plan configurations, and analytics queries. Device information such as device type, operating system, and app version is collected automatically to ensure compatibility and performance.",
      },
      {
        heading: "How we use your information",
        summary:
          "To run the platform and make it better. AI features send the relevant records to an AI provider to produce results — your data isn't used to train AI models.",
        content:
          "We use collected information to operate and improve the Nautilus platform, including AI features such as demand forecasts, anomaly explanations, and plain-English search. To produce those results, the relevant records are sent to an AI provider under its API terms; we don't use your data to train AI models. We may use your contact information to send product updates, security notices, and support communications.",
      },
      {
        heading: "Data storage and security",
        summary:
          "Stored in a managed Postgres database, served over HTTPS, encrypted at rest, and isolated per organization. The Security page has the details.",
        content:
          "Your data is stored in a managed Postgres database hosted by Supabase and served over HTTPS. Data is encrypted at rest by our database provider, and each organization's data is isolated at the database level with row-level security. Inside your organization, roles and permissions control access, and accounts can use two-factor authentication. See our Security page for more detail.",
      },
      {
        heading: "Data sharing and third parties",
        summary:
          "We don't sell your data. We share it only with the providers that run the service. We disclose only when legally required.",
        content:
          "We do not sell your personal information or warehouse operational data to third parties. We share data only with service providers who assist in operating our platform — cloud infrastructure providers, AI providers that generate results for AI features, payment processors, and customer support tools. We may disclose information when required by law, court order, or governmental regulation.",
      },
      {
        heading: "Your rights and choices",
        summary:
          "Access, correct, or delete your data anytime. Export it as CSV whenever you want. EU and California residents have additional rights — email privacy@nautilusinventory.com.",
        content:
          "You may access, correct, or delete your personal information at any time through your account settings or by contacting support. You can export your warehouse data as CSV at any time. If you close your account, we will delete your data within 30 days, except where retention is required by law. You may opt out of non-essential communications at any time. California residents have additional rights under the CCPA, and EU residents have rights under GDPR — contact privacy@nautilusinventory.com for details.",
      },
      {
        heading: "Cookies and tracking",
        summary:
          "Essential cookies for login. Analytics cookies to improve the product — on this website only after you accept them in the cookie banner. No advertising cookies, no ad-network tracking.",
        content:
          "The Nautilus web application uses essential cookies for authentication and session management. We use analytics cookies to understand how users interact with the platform, which helps us prioritize feature development. On nautilusinventory.com, the single analytics cookie (Google Analytics) is set only after you choose “Accept analytics” in the cookie banner; your choice is stored for 12 months and can be changed at any time via “Cookie preferences” in the footer. We do not use advertising cookies or share browsing data with ad networks. You can disable non-essential cookies through your browser settings without affecting core functionality.",
      },
      {
        heading: "Data retention",
        summary:
          "Account data kept while you're a customer. Scan and inventory history retained 7 years for audit compliance. Everything deleted within 30 days of closure (unless law requires longer).",
        content:
          "Active account data is retained for the duration of your subscription. Scan logs and inventory movement history are retained for 7 years to support audit and compliance requirements. Analytics data is retained for 3 years. After account closure, all data is permanently deleted within 30 days unless a longer retention period is required by applicable law or regulation.",
      },
      {
        heading: "Changes to this policy",
        summary:
          "We may update this policy. Material changes get notified 30 days before they take effect.",
        content:
          "We may update this privacy policy to reflect changes in our practices or applicable law. We will notify you of material changes by email and through in-app notifications at least 30 days before they take effect. Your continued use of Nautilus after changes become effective constitutes acceptance of the updated policy.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "September 13, 2026",
    sections: [
      {
        heading: "Acceptance of terms",
        summary:
          "Using Nautilus means agreeing to these terms. Signing up on behalf of a company means confirming you have authority to do so.",
        content:
          'By accessing or using the Nautilus Warehouse Management System ("Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of a company or organization, you represent that you have authority to bind that entity to these terms. If you do not agree to these terms, do not use the Service.',
      },
      {
        heading: "Service description",
        summary:
          "Nautilus is a cloud-based WMS provided on a subscription basis. Features vary by plan. We may modify, suspend, or discontinue features with reasonable notice.",
        content:
          "Nautilus provides a cloud-based warehouse management platform that includes barcode scanning, inventory tracking, floor plan management, AI-powered analytics, route optimization, and related features. The Service is provided on a subscription basis. Features and functionality may vary by plan level. We reserve the right to modify, suspend, or discontinue any feature with reasonable notice.",
      },
      {
        heading: "Account responsibilities",
        summary:
          "Your account, your credentials, your responsibility. Tell us right away about unauthorized access. We can suspend accounts that violate these terms.",
        content:
          "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend accounts that violate these terms or pose a security risk.",
      },
      {
        heading: "Acceptable use",
        summary:
          "Use Nautilus for legal purposes only. No reverse engineering, no scraping outside the public API, no using Nautilus to build a competing product.",
        content:
          "You agree to use the Service only for lawful purposes and in accordance with these terms. You may not use the Service to store or process data that violates any applicable law or regulation. You may not attempt to reverse engineer, decompile, or disassemble any part of the Service. You may not use automated means to access the Service except through our published APIs. You may not use the Service to compete with Nautilus or build a competing product.",
      },
      {
        heading: "Data ownership",
        summary:
          "Your data stays yours. We have a limited license to process it solely to provide the service. Account ends: 30 days to export, then it's deleted.",
        content:
          "You retain all ownership rights to the data you input into the Service, including inventory records, scan logs, floor plans, and custom configurations. We do not claim ownership of your data. You grant us a limited license to process your data solely for the purpose of providing and improving the Service. Upon account termination, you may export your data for 30 days before it is permanently deleted.",
      },
      {
        heading: "Availability",
        summary:
          "We work to keep Nautilus available and announce planned maintenance in advance when we can. Standard plans don't include an uptime guarantee or service credits.",
        content:
          "We work to keep the Service available and to announce planned maintenance in advance when we can. Standard plans do not include an uptime commitment or service credits. Any availability commitment for an Enterprise customer will be set out in that customer's written agreement. Emergency maintenance for security issues may be performed without advance notice.",
      },
      {
        heading: "Limitation of liability",
        summary:
          "No liability for indirect damages. Total liability capped at what you paid us in the prior 12 months.",
        content:
          "To the maximum extent permitted by law, Nautilus shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities. Our total liability under these terms shall not exceed the amount you paid for the Service in the twelve months preceding the claim. These limitations apply regardless of the theory of liability.",
      },
      {
        heading: "Termination",
        summary:
          "Either party can end the subscription at the next billing cycle with 30 days notice. We can terminate immediately for ToS violations. Data ownership, liability, and dispute sections survive termination.",
        content:
          "Either party may terminate the subscription at the end of the current billing period with 30 days written notice. We may terminate or suspend your account immediately if you violate these terms or if required by law. Upon termination, your right to use the Service ceases immediately, but you retain the right to export your data for 30 days. Sections regarding data ownership, limitation of liability, and dispute resolution survive termination.",
      },
    ],
  },
  /* Only statements that can be checked against how Nautilus is actually
     built and hosted. This page previously claimed SOC 2 / HIPAA
     certification, pen tests, a 24/7 security team, RPO/RTO targets and SAML
     SSO — none of which exist. Keep it that way: add a claim here only once
     it's true. */
  security: {
    title: "Security",
    updated: "September 13, 2026",
    sections: [
      {
        heading: "Where your data lives",
        summary:
          "Data and sign-in run on Supabase (managed Postgres). The app is hosted on Netlify. Both providers maintain their own SOC 2 Type II reports.",
        content:
          "Your data is stored in a managed Postgres database on Supabase, which also handles sign-in. The web app is hosted on Netlify. Both providers maintain SOC 2 Type II reports for their own infrastructure. Nautilus itself doesn't currently hold a SOC 2, ISO 27001, or HIPAA certification.",
      },
      {
        heading: "Encryption",
        summary:
          "HTTPS for every connection, with HSTS. Data encrypted at rest by our database provider.",
        content:
          "Every connection to Nautilus uses HTTPS, and the app sends HSTS headers so browsers never fall back to plain HTTP. Data at rest is encrypted by our database provider.",
      },
      {
        heading: "Organization isolation",
        summary:
          "Every record belongs to an organization, and the database itself enforces that boundary with row-level security.",
        content:
          "Each record in Nautilus belongs to an organization. Row-level security policies in the database make sure people can only read and change data in organizations they're a member of — the rule is enforced by Postgres, not just by the app.",
      },
      {
        heading: "Sign-in and access",
        summary:
          "Passwords handled by Supabase Auth. Two-factor authentication available on every account. Roles and granular permissions.",
        content:
          "Sign-in is handled by Supabase Auth, so passwords are never stored in plain text. Any account can turn on two-factor authentication with an authenticator app. What each person can do is controlled by their role (owner, admin, or member) and granular permissions, and members can be removed at any time.",
      },
      {
        heading: "API keys",
        summary:
          "Shown once, stored only as SHA-256 hashes, and limited to the scopes you grant.",
        content:
          "API keys are displayed once when you create them and stored only as SHA-256 hashes. Each key belongs to one organization and is limited to the scopes you grant it, and API requests are rate limited.",
      },
      {
        heading: "Activity logging",
        summary:
          "Important changes are recorded in an audit log, with who made them and when.",
        content:
          "Nautilus records important changes in an audit log, including who made them and when, so you can trace what happened to your inventory.",
      },
      {
        heading: "AI features",
        summary:
          "Search, forecast summaries, and anomaly explanations are generated by an AI provider. Your data isn't used to train AI models.",
        content:
          "Plain-English search, forecast summaries, and anomaly explanations send the relevant records to an AI provider under its API terms to generate a result. We don't use your data to train AI models.",
      },
      {
        heading: "Security questions",
        summary:
          "Need a security questionnaire filled out, or found a vulnerability? Email hello@nautilusinventory.com.",
        content:
          "If your team needs a security questionnaire completed, or you've found a vulnerability, email hello@nautilusinventory.com with “Security” in the subject line and we'll respond directly.",
      },
    ],
  },
};
