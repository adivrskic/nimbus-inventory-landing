export const LEGAL_PAGES = {
  privacy: {
    title: "Privacy Policy",
    updated: "March 15, 2026",
    sections: [
      {
        heading: "Information we collect",
        content:
          "Nimbus collects information you provide directly when creating an account, configuring your warehouse, or contacting support. This includes your name, email address, company name, warehouse address, and billing information. We also collect operational data generated through your use of the platform — scan logs, inventory movements, floor plan configurations, and analytics queries. Device information such as device type, operating system, and app version is collected automatically to ensure compatibility and performance.",
      },
      {
        heading: "How we use your information",
        content:
          "We use collected information to operate and improve the Nimbus platform, including powering AI features like predictive analytics, route optimization, and anomaly detection. Your scan and inventory data trains models specific to your warehouse — these models are isolated to your account and never shared with other customers. We use aggregated, anonymized data to improve our algorithms and benchmark performance. We may use your contact information to send product updates, security notices, and support communications.",
      },
      {
        heading: "Data storage and security",
        content:
          "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Data is stored in SOC 2 Type II certified data centers located in the United States. We maintain strict access controls, requiring multi-factor authentication for all internal systems. Database backups are encrypted and retained for 90 days. We conduct annual third-party penetration testing and maintain a vulnerability disclosure program.",
      },
      {
        heading: "Data sharing and third parties",
        content:
          "We do not sell your personal information or warehouse operational data to third parties. We share data only with service providers who assist in operating our platform — cloud infrastructure providers, payment processors, and customer support tools. All third-party providers are bound by data processing agreements that restrict their use of your data. We may disclose information when required by law, court order, or governmental regulation.",
      },
      {
        heading: "Your rights and choices",
        content:
          "You may access, correct, or delete your personal information at any time through your account settings or by contacting support. You can export all your warehouse data in standard formats (CSV, JSON) at any time. If you close your account, we will delete your data within 30 days, except where retention is required by law. You may opt out of non-essential communications at any time. California residents have additional rights under the CCPA, and EU residents have rights under GDPR — contact privacy@nimbuswms.com for details.",
      },
      {
        heading: "Cookies and tracking",
        content:
          "The Nimbus web application uses essential cookies for authentication and session management. We use analytics cookies to understand how users interact with the platform, which helps us prioritize feature development. We do not use advertising cookies or share browsing data with ad networks. You can disable non-essential cookies through your browser settings without affecting core functionality.",
      },
      {
        heading: "Data retention",
        content:
          "Active account data is retained for the duration of your subscription. Scan logs and inventory movement history are retained for 7 years to support audit and compliance requirements. Analytics data is retained for 3 years. After account closure, all data is permanently deleted within 30 days unless a longer retention period is required by applicable law or regulation.",
      },
      {
        heading: "Changes to this policy",
        content:
          "We may update this privacy policy to reflect changes in our practices or applicable law. We will notify you of material changes by email and through in-app notifications at least 30 days before they take effect. Your continued use of Nimbus after changes become effective constitutes acceptance of the updated policy.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "March 15, 2026",
    sections: [
      {
        heading: "Acceptance of terms",
        content:
          'By accessing or using the Nimbus Warehouse Management System ("Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of a company or organization, you represent that you have authority to bind that entity to these terms. If you do not agree to these terms, do not use the Service.',
      },
      {
        heading: "Service description",
        content:
          "Nimbus provides a cloud-based warehouse management platform that includes barcode scanning, inventory tracking, floor plan management, AI-powered analytics, route optimization, and related features. The Service is provided on a subscription basis. Features and functionality may vary by plan level. We reserve the right to modify, suspend, or discontinue any feature with reasonable notice.",
      },
      {
        heading: "Account responsibilities",
        content:
          "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend accounts that violate these terms or pose a security risk.",
      },
      {
        heading: "Acceptable use",
        content:
          "You agree to use the Service only for lawful purposes and in accordance with these terms. You may not use the Service to store or process data that violates any applicable law or regulation. You may not attempt to reverse engineer, decompile, or disassemble any part of the Service. You may not use automated means to access the Service except through our published APIs. You may not use the Service to compete with Nimbus or build a competing product.",
      },
      {
        heading: "Data ownership",
        content:
          "You retain all ownership rights to the data you input into the Service, including inventory records, scan logs, floor plans, and custom configurations. We do not claim ownership of your data. You grant us a limited license to process your data solely for the purpose of providing and improving the Service. Upon account termination, you may export your data for 30 days before it is permanently deleted.",
      },
      {
        heading: "Service level agreement",
        content:
          "Nimbus commits to 99.9% uptime for the core platform, measured monthly. Scheduled maintenance windows are excluded from uptime calculations and will be communicated at least 48 hours in advance. In the event of an SLA breach, affected customers are eligible for service credits as outlined in your subscription agreement. Emergency maintenance for security issues may be performed without advance notice.",
      },
      {
        heading: "Limitation of liability",
        content:
          "To the maximum extent permitted by law, Nimbus shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities. Our total liability under these terms shall not exceed the amount you paid for the Service in the twelve months preceding the claim. These limitations apply regardless of the theory of liability.",
      },
      {
        heading: "Termination",
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
        content:
          "Nimbus is built on a zero-trust security architecture. Every request is authenticated and authorized regardless of network location. Our infrastructure runs on isolated virtual private clouds with no public-facing databases. All internal service communication is encrypted and authenticated using mutual TLS. We employ defense-in-depth with multiple layers of security controls at the network, application, and data levels.",
      },
      {
        heading: "Encryption",
        content:
          "All data in transit is encrypted using TLS 1.3 with forward secrecy. Data at rest is encrypted using AES-256. Encryption keys are managed through a dedicated key management service with automatic key rotation every 90 days. Database backups are encrypted with separate keys. API tokens and credentials are hashed using bcrypt with a minimum cost factor of 12.",
      },
      {
        heading: "Authentication and access",
        content:
          "Nimbus supports multi-factor authentication (MFA) for all user accounts and requires it for administrator accounts. We support SAML 2.0 SSO integration with major identity providers. Role-based access control (RBAC) allows granular permission management. Session tokens expire after 24 hours of inactivity. All authentication events are logged and monitored for anomalous patterns.",
      },
      {
        heading: "Infrastructure security",
        content:
          "Our infrastructure is hosted in SOC 2 Type II certified data centers with physical security controls including biometric access, 24/7 surveillance, and environmental monitoring. We use container orchestration with automatic scaling and self-healing capabilities. Network segmentation isolates customer environments. Web application firewalls protect against OWASP Top 10 vulnerabilities. DDoS protection is provided at the network edge.",
      },
      {
        heading: "Monitoring and incident response",
        content:
          "We maintain 24/7 security monitoring with automated alerting for suspicious activity. Our security operations team investigates alerts within 15 minutes. We maintain a documented incident response plan that is tested quarterly through tabletop exercises. In the event of a security incident affecting customer data, we will notify affected customers within 72 hours as required by applicable regulations.",
      },
      {
        heading: "Compliance and certifications",
        content:
          "Nimbus maintains SOC 2 Type II certification, audited annually by an independent third party. We are compliant with GDPR, CCPA, and HIPAA where applicable. Our security practices align with the NIST Cybersecurity Framework and CIS Controls. We conduct annual third-party penetration tests and quarterly internal vulnerability assessments. Audit reports are available to enterprise customers under NDA.",
      },
      {
        heading: "Vulnerability management",
        content:
          "We maintain a responsible disclosure program for security researchers. Critical vulnerabilities are patched within 24 hours, high severity within 72 hours. All code changes go through automated security scanning in our CI/CD pipeline. Dependencies are monitored continuously for known vulnerabilities using automated tools. We perform regular code reviews with a focus on security-sensitive components.",
      },
      {
        heading: "Business continuity",
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
        content:
          "All Nimbus systems are operational. The core platform, API, mobile applications, barcode scanning infrastructure, and real-time sync services are running normally. There are no ongoing incidents or scheduled maintenance windows at this time.",
      },
      {
        heading: "Platform uptime",
        content:
          "Nimbus maintains a 99.95% uptime record over the past 12 months. Our SLA commitment is 99.9% monthly uptime for all production services. Uptime is measured across the core application, API endpoints, real-time sync layer, and barcode scanning infrastructure. Scheduled maintenance windows are excluded from uptime calculations.",
      },
      {
        heading: "Service components",
        content:
          "The Nimbus platform consists of several independently monitored services: the web application and dashboard, the REST API and webhook delivery system, the mobile application backend (iOS and Android), the real-time inventory sync engine, the barcode scanning and label printing infrastructure, the AI analytics and route optimization engine, and the data export and reporting pipeline. Each component is monitored with sub-minute granularity.",
      },
      {
        heading: "Incident history",
        content:
          "March 12, 2026 — Elevated API latency for 22 minutes due to a database connection pool exhaustion during peak hours. Root cause identified and pool limits increased. No data loss. February 8, 2026 — Scheduled maintenance window (45 minutes) for database version upgrade. All customers notified 72 hours in advance. January 15, 2026 — Mobile app sync delay of approximately 3 minutes affecting Android devices. Resolved with a backend configuration change.",
      },
      {
        heading: "Monitoring and alerts",
        content:
          "Nimbus uses multi-layer monitoring including synthetic checks every 30 seconds from global locations, real-time error rate tracking, latency percentile monitoring (p50, p95, p99), and infrastructure health metrics. Our on-call engineering team is alerted within 60 seconds of any anomaly detection. Customers can subscribe to status updates via email at status@nimbuswms.com.",
      },
      {
        heading: "Scheduled maintenance",
        content:
          "Maintenance windows are scheduled during off-peak hours (Sundays 2:00–4:00 AM EST) and communicated at least 48 hours in advance via email and in-app notification. Emergency security patches may be applied outside of scheduled windows with immediate notification. Most maintenance is performed with zero downtime using rolling deployments.",
      },
    ],
  },
};
