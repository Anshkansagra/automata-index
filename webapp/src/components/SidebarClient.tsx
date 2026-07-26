"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

type Props = {
  isLoggedIn: boolean;
};

const LOGGED_IN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#browse", label: "Browse" },
  { href: "/saved", label: "Saved" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

const LOGGED_OUT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#browse", label: "Browse" },
];

export function SidebarClient({ isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = isLoggedIn ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-black/80">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          CORTEXA
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar itself: plain show/hide on mobile (no slide animation —
          deliberately simple so there's no ambiguity about whether it's
          working), always visible as a fixed column on desktop. */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 flex-col border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-black ${
          open ? "flex" : "hidden"
        }`}
      >
        <Link
          href="/"
          className="mb-6 hidden items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900 md:flex dark:text-zinc-50"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          CORTEXA
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href.split("#")[0]) && link.href !== "/#browse");
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {isLoggedIn ? (
            <SignOutButton />
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded-full bg-accent px-3 py-2 text-center text-sm font-medium text-white hover:bg-accent-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
