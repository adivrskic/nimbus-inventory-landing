export const LEGAL_PAGES = {
  privacy: {
    title: "Privacy Policy",
    updated: "March 15, 2026",
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
          "To run the platform and make it better. Your scan data trains AI models scoped to your warehouse only — never shared with other customers.",
        content:
          "We use collected information to operate and improve the Nautilus platform, including powering AI features like predictive analytics, route optimization, and anomaly detection. Your scan and inventory data trains models specific to your warehouse — these models are isolated to your account and never shared with other customers. We use aggregated, anonymized data to improve our algorithms and benchmark performance. We may use your contact information to send product updates, security notices, and support communications.",
      },
      {
        heading: "Data storage and security",
        summary:
          "Encrypted in transit (TLS 1.3) and at rest (AES-256). Stored in SOC 2 Type II data centers in the US. MFA required for internal access. Annual third-party pen tests.",
        content:
          "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Data is stored in SOC 2 Type II certified data centers located in the United States. We maintain strict access controls, requiring multi-factor authentication for all internal systems. Database backups are encrypted and retained for 90 days. We conduct annual third-party penetration testing and maintain a vulnerability disclosure program.",
      },
      {
        heading: "Data sharing and third parties",
        summary:
          "We don't sell your data. We share it only with infrastructure providers under data processing agreements. We disclose only when legally required.",
        content:
          "We do not sell your personal information or warehouse operational data to third parties. We share data only with service providers who assist in operating our platform — cloud infrastructure providers, payment processors, and customer support tools. All third-party providers are bound by data processing agreements that restrict their use of your data. We may disclose information when required by law, court order, or governmental regulation.",
      },
      {
        heading: "Your rights and choices",
        summary:
          "Access, correct, or delete your data anytime. Export in CSV or JSON whenever you want. EU and California residents have additional rights — email privacy@Nautiluswms.com.",
        content:
          "You may access, correct, or delete your personal information at any time through your account settings or by contacting support. You can export all your warehouse data in standard formats (CSV, JSON) at any time. If you close your account, we will delete your data within 30 days, except where retention is required by law. You may opt out of non-essential communications at any time. California residents have additional rights under the CCPA, and EU residents have rights under GDPR — contact privacy@Nautiluswms.com for details.",
      },
      {
        heading: "Cookies and tracking",
        summary:
          "Essential cookies for login. Analytics cookies to improve the product. No advertising cookies, no ad-network tracking.",
        content:
          "The Nautilus web application uses essential cookies for authentication and session management. We use analytics cookies to understand how users interact with the platform, which helps us prioritize feature development. We do not use advertising cookies or share browsing data with ad networks. You can disable non-essential cookies through your browser settings without affecting core functionality.",
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
    updated: "March 15, 2026",
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
        heading: "Service level agreement",
        summary:
          "99.9% monthly uptime. Scheduled maintenance excluded from uptime math. SLA breach gets service credits per your subscription. Emergency security maintenance may happen without notice.",
        content:
          "Nautilus commits to 99.9% uptime for the core platform, measured monthly. Scheduled maintenance windows are excluded from uptime calculations and will be communicated at least 48 hours in advance. In the event of an SLA breach, affected customers are eligible for service credits as outlined in your subscription agreement. Emergency maintenance for security issues may be performed without advance notice.",
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
  security: {
    title: "Security",
    updated: "March 15, 2026",
    sections: [
      {
        heading: "Security architecture",
        summary:
          "Zero-trust. Every request authenticated regardless of where it came from. Internal services talk to each other over mutual TLS. Defense in depth at network, app, and data levels.",
        content:
          "Nautilus is built on a zero-trust security architecture. Every request is authenticated and authorized regardless of network location. Our infrastructure runs on isolated virtual private clouds with no public-facing databases. All internal service communication is encrypted and authenticated using mutual TLS. We employ defense-in-depth with multiple layers of security controls at the network, application, and data levels.",
      },
      {
        heading: "Encryption",
        summary:
          "TLS 1.3 in transit, AES-256 at rest. Keys rotated every 90 days. Backups encrypted separately. Credentials hashed with bcrypt (cost factor 12 minimum).",
        content:
          "All data in transit is encrypted using TLS 1.3 with forward secrecy. Data at rest is encrypted using AES-256. Encryption keys are managed through a dedicated key management service with automatic key rotation every 90 days. Database backups are encrypted with separate keys. API tokens and credentials are hashed using bcrypt with a minimum cost factor of 12.",
      },
      {
        heading: "Authentication and access",
        summary:
          "MFA supported for everyone, required for admins. SAML 2.0 SSO with major identity providers. Role-based access control. Sessions expire after 24h inactivity.",
        content:
          "Nautilus supports multi-factor authentication (MFA) for all user accounts and requires it for administrator accounts. We support SAML 2.0 SSO integration with major identity providers. Role-based access control (RBAC) allows granular permission management. Session tokens expire after 24 hours of inactivity. All authentication events are logged and monitored for anomalous patterns.",
      },
      {
        heading: "Infrastructure security",
        summary:
          "SOC 2 Type II certified data centers with biometric access and 24/7 surveillance. Network segmentation isolates customer environments. WAFs guard against OWASP Top 10. DDoS protection at the network edge.",
        content:
          "Our infrastructure is hosted in SOC 2 Type II certified data centers with physical security controls including biometric access, 24/7 surveillance, and environmental monitoring. We use container orchestration with automatic scaling and self-healing capabilities. Network segmentation isolates customer environments. Web application firewalls protect against OWASP Top 10 vulnerabilities. DDoS protection is provided at the network edge.",
      },
      {
        heading: "Monitoring and incident response",
        summary:
          "24/7 monitoring with 15-minute alert response. Quarterly tabletop exercises. Customers notified within 72 hours of any incident affecting their data.",
        content:
          "We maintain 24/7 security monitoring with automated alerting for suspicious activity. Our security operations team investigates alerts within 15 minutes. We maintain a documented incident response plan that is tested quarterly through tabletop exercises. In the event of a security incident affecting customer data, we will notify affected customers within 72 hours as required by applicable regulations.",
      },
      {
        heading: "Compliance and certifications",
        summary:
          "SOC 2 Type II, audited annually. GDPR, CCPA, HIPAA compliant where applicable. NIST CSF and CIS Controls aligned. Audit reports available to enterprise customers under NDA.",
        content:
          "Nautilus maintains SOC 2 Type II certification, audited annually by an independent third party. We are compliant with GDPR, CCPA, and HIPAA where applicable. Our security practices align with the NIST Cybersecurity Framework and CIS Controls. We conduct annual third-party penetration tests and quarterly internal vulnerability assessments. Audit reports are available to enterprise customers under NDA.",
      },
      {
        heading: "Vulnerability management",
        summary:
          "Responsible disclosure program for researchers. Critical patches within 24 hours, high severity within 72. Automated security scanning in CI/CD. Continuous dependency monitoring.",
        content:
          "We maintain a responsible disclosure program for security researchers. Critical vulnerabilities are patched within 24 hours, high severity within 72 hours. All code changes go through automated security scanning in our CI/CD pipeline. Dependencies are monitored continuously for known vulnerabilities using automated tools. We perform regular code reviews with a focus on security-sensitive components.",
      },
      {
        heading: "Business continuity",
        summary:
          "Multi-AZ replication with automatic failover. Recovery point objective (RPO) 1 hour, recovery time objective (RTO) 4 hours. Daily encrypted backups retained 90 days. DR plan tested bi-annually.",
        content:
          "Data is replicated across multiple availability zones with automatic failover. Recovery point objective (RPO) is 1 hour and recovery time objective (RTO) is 4 hours. We maintain encrypted daily backups retained for 90 days. Our disaster recovery plan is tested bi-annually with full failover exercises. Business continuity documentation is reviewed and updated quarterly.",
      },
    ],
  },
  status: {
    title: "System Status",
    updated: "April 1, 2026",
    sections: [
      {
        heading: "Current status",
        summary:
          "All systems operational. No ongoing incidents or scheduled maintenance.",
        content:
          "All Nautilus systems are operational. The core platform, API, mobile applications, barcode scanning infrastructure, and real-time sync services are running normally. There are no ongoing incidents or scheduled maintenance windows at this time.",
      },
      {
        heading: "Platform uptime",
        summary:
          "99.95% over the past 12 months. SLA commitment is 99.9% monthly. Scheduled maintenance excluded from uptime math.",
        content:
          "Nautilus maintains a 99.95% uptime record over the past 12 months. Our SLA commitment is 99.9% monthly uptime for all production services. Uptime is measured across the core application, API endpoints, real-time sync layer, and barcode scanning infrastructure. Scheduled maintenance windows are excluded from uptime calculations.",
      },
      {
        heading: "Service components",
        summary:
          "Several independently monitored services: web app, API, mobile backend, sync engine, scanning infrastructure, AI engine, and reporting pipeline.",
        content:
          "The Nautilus platform consists of several independently monitored services: the web application and dashboard, the REST API and webhook delivery system, the mobile application backend (iOS and Android), the real-time inventory sync engine, the barcode scanning and label printing infrastructure, the AI analytics and route optimization engine, and the data export and reporting pipeline. Each component is monitored with sub-minute granularity.",
      },
      {
        heading: "Incident history",
        summary:
          "Three recent incidents: API latency (Mar 12), planned database upgrade (Feb 8), Android sync delay (Jan 15). All resolved.",
        content:
          "March 12, 2026 — Elevated API latency for 22 minutes due to a database connection pool exhaustion during peak hours. Root cause identified and pool limits increased. No data loss. February 8, 2026 — Scheduled maintenance window (45 minutes) for database version upgrade. All customers notified 72 hours in advance. January 15, 2026 — Mobile app sync delay of approximately 3 minutes affecting Android devices. Resolved with a backend configuration change.",
      },
      {
        heading: "Monitoring and alerts",
        summary:
          "Synthetic checks every 30 seconds from global locations. On-call engineers alerted within 60 seconds of anomalies. Subscribe via status@Nautiluswms.com.",
        content:
          "Nautilus uses multi-layer monitoring including synthetic checks every 30 seconds from global locations, real-time error rate tracking, latency percentile monitoring (p50, p95, p99), and infrastructure health metrics. Our on-call engineering team is alerted within 60 seconds of any anomaly detection. Customers can subscribe to status updates via email at status@Nautiluswms.com.",
      },
      {
        heading: "Scheduled maintenance",
        summary:
          "Maintenance windows scheduled during off-peak hours (Sun 2-4 AM EST) with 48-hour notice. Emergency security patches may apply outside windows. Most maintenance is zero-downtime.",
        content:
          "Maintenance windows are scheduled during off-peak hours (Sundays 2:00–4:00 AM EST) and communicated at least 48 hours in advance via email and in-app notification. Emergency security patches may be applied outside of scheduled windows with immediate notification. Most maintenance is performed with zero downtime using rolling deployments.",
      },
    ],
  },
};
