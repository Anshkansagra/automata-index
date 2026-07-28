import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in — Cortexa",
  description:
    "Log in to Cortexa to access your saved papers, saved searches, and email digests.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
