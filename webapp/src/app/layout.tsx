import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://automata-index.vercel.app";
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
    google: "wk4E_IG6O2yhpjgyuLcYCC6HqlI4_MIAr0K-25l5pfw",
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
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
