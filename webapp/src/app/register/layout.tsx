import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up — Cortexa",
  description:
    "Create a free Cortexa account to save papers, save searches, and get email digests of new open-access research.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
