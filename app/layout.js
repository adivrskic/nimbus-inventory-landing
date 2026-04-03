import { JetBrains_Mono } from "next/font/google";
import LenisProvider from "@/components/LenisProvider";
import TransitionProvider from "@/components/TransitionProvider/TransitionProvider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = "https://nimbuswms.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nimbus WMS — AI-Powered Warehouse Management",
    template: "%s | Nimbus WMS",
  },
  description:
    "AI-powered warehouse intelligence for modern operations teams. Scanning, spatial mapping, pick optimization, and predictive analytics in a single platform.",
  keywords: [
    "warehouse management system",
    "WMS",
    "inventory management",
    "pick optimization",
    "warehouse AI",
    "barcode scanning",
    "cycle counting",
    "spatial mapping",
    "3PL software",
    "warehouse automation",
  ],
  authors: [{ name: "Nimbus" }],
  creator: "Nimbus",
  publisher: "Nimbus",
  formatDetection: { email: false, telephone: false, address: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Nimbus WMS",
    title: "Nimbus WMS — AI-Powered Warehouse Management",
    description:
      "AI-powered warehouse intelligence for modern operations teams. Scanning, spatial mapping, pick optimization, and predictive analytics in a single platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nimbus WMS — AI-Powered Warehouse Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nimbus WMS — AI-Powered Warehouse Management",
    description:
      "AI-powered warehouse intelligence for modern operations teams.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <LenisProvider>
          <TransitionProvider>{children}</TransitionProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
