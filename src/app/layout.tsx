import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const displaySerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodySans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE = "https://is-this-ai-slop.davidcjw.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Is This AI Generated? — The website slop detector",
  description:
    "Paste any URL and get a 0–100 forensic score of how cookie-cutter and AI-generated a website looks. We fingerprint the default agent house style.",
  applicationName: "Slop Lab",
  authors: [{ name: "David", url: "https://github.com/davidcjw" }],
  creator: "David",
  category: "technology",
  keywords: [
    "AI generated website",
    "AI slop detector",
    "is this AI generated",
    "AI website checker",
    "v0",
    "Lovable",
    "vibe coding",
    "website analyzer",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: "Is This AI Generated? — The website slop detector",
    description:
      "Paste a URL, get a forensic 0–100 verdict on how AI-generated a site looks.",
    url: SITE,
    siteName: "Is This AI Generated?",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Is This AI Generated?",
    description:
      "Paste a URL, get a forensic 0–100 verdict on how AI-generated a site looks.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3ede1",
  colorScheme: "light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Is This AI Generated? — Slop Lab",
  url: SITE,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web)",
  description:
    "Paste any URL and get a 0–100 forensic score of how cookie-cutter and AI-generated a website looks.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "David", url: "https://github.com/davidcjw" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${displaySerif.variable} ${bodySans.variable} ${mono.variable} min-h-full antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
