import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Sidebar } from "@/components/Sidebar";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const TITLE = "Cortexa — Free Robotics, ML & AI Research";
const DESCRIPTION =
  "A free, open-access index of robotics, machine learning, deep learning, and AI research from arXiv, MDPI, IEEE Access, CrossRef open-access publishers, and more.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "robotics research papers",
    "machine learning papers",
    "deep learning research",
    "free research papers",
    "open access AI papers",
    "autonomous vehicles research",
    "neural networks papers",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Cortexa",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
  verification: {
    google: "R7D6aRmCEyBPQyFioeXC9WKkonEuWBullA1tspRrERE",
  },
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('theme');
                var isDark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', isDark);
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          // Tells Google this is the canonical "Cortexa" web entity, and
          // (via SearchAction) makes it eligible for a sitelinks search box
          // directly in Google's results for branded searches.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Cortexa",
              alternateName: "Cortexa Research Index",
              url: SITE_URL,
              description: DESCRIPTION,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Sidebar />
        <div className="flex-1 md:pl-64">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
