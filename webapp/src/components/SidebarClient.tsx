"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { deleteSearchHistory } from "@/lib/searchHistory";

type Props = {
  isLoggedIn: boolean;
  userId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
  recentSearches: string[];
  totalPapers: number;
  savedCount: number;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h12v18l-6-4-6 4V3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" />
    </svg>
  );
}

const LOGGED_IN_LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/#browse", label: "Browse", Icon: SearchIcon },
  { href: "/saved", label: "Saved", Icon: BookmarkIcon },
  { href: "/dashboard", label: "Dashboard", Icon: GridIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
  { href: "/feedback", label: "Feedback", Icon: MessageIcon },
];

const SHORTCUTS = [
  { keys: "/", description: "Jump to the search bar" },
  { keys: "?", description: "Show this shortcuts reference" },
];

const LOGGED_OUT_LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/#browse", label: "Browse", Icon: SearchIcon },
];

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

function MiniThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme((localStorage.getItem("theme") as Theme | null) ?? "system");
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
    applyTheme(next);
  }

  const options: { value: Theme; icon: string; label: string }[] = [
    { value: "light", icon: "☀️", label: "Light" },
    { value: "dark", icon: "🌙", label: "Dark" },
    { value: "system", icon: "🖥️", label: "System" },
  ];

  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.label}
          onClick={() => choose(opt.value)}
          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
            theme === opt.value
              ? "bg-accent text-white"
              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

export function SidebarClient({
  isLoggedIn,
  userId,
  name,
  email,
  avatarUrl,
  recentSearches,
  totalPapers,
  savedCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searches, setSearches] = useState(recentSearches);
  const [prevRecentSearches, setPrevRecentSearches] = useState(recentSearches);
  const router = useRouter();
  const pathname = usePathname();
  const links = isLoggedIn ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;

  // The server passes a fresh recentSearches array on every navigation, but
  // this component's local state persists across soft navigations (needed
  // for the optimistic delete below) — so re-sync during render rather than
  // in an effect when the prop actually changes. React's documented pattern
  // for "adjusting state when a prop changes."
  if (recentSearches !== prevRecentSearches) {
    setPrevRecentSearches(recentSearches);
    setSearches(recentSearches);
  }

  function searchFor(term: string) {
    setOpen(false);
    router.push(`/?q=${encodeURIComponent(term)}#browse`);
  }

  function removeSearch(term: string) {
    setSearches((prev) => prev.filter((t) => t !== term));
    if (!userId) return;
    const supabase = createClient();
    deleteSearchHistory(supabase, userId, term);
  }

  // "/" jumps to search and "?" opens the shortcuts reference, like most
  // professional apps — ignored while the user is already typing somewhere
  // so it doesn't hijack normal typing.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        router.push("/#browse");
        setTimeout(() => {
          document.querySelector<HTMLInputElement>('input[name="q"]')?.focus();
        }, 100);
        return;
      }

      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-black/80">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          CORTEXA
        </Link>
        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <Link href="/profile">
              <Avatar avatarUrl={avatarUrl} name={name || email} size={28} />
            </Link>
          )}
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
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar itself */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 flex-col overflow-y-auto border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-black ${
          open ? "flex" : "hidden"
        }`}
      >
        <Link
          href="/"
          className="hidden items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900 md:flex dark:text-zinc-50"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          CORTEXA
        </Link>
        <p className="mb-4 hidden pl-4 text-xs text-zinc-400 md:block dark:text-zinc-500">
          {totalPapers.toLocaleString()} papers indexed
        </p>

        {isLoggedIn && (
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="mb-4 flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:border-accent/40 dark:border-zinc-800"
          >
            <Avatar avatarUrl={avatarUrl} name={name || email} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {name || "Your account"}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
            </div>
          </Link>
        )}

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && link.href !== "/#browse" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <link.Icon />
                {link.label}
                {link.label === "Saved" && savedCount > 0 && (
                  <span
                    className={`ml-auto rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-accent-soft text-accent"
                    }`}
                  >
                    {savedCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {isLoggedIn && searches.length > 0 && (
          <div className="mt-5">
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              <ClockIcon /> Recent searches
            </p>
            <div className="flex flex-col gap-0.5">
              {searches.map((term) => (
                <div
                  key={term}
                  className="flex items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <button
                    onClick={() => searchFor(term)}
                    className="min-w-0 flex-1 truncate px-3 py-1.5 text-left text-sm text-zinc-600 dark:text-zinc-400"
                    title={term}
                  >
                    {term}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSearch(term)}
                    aria-label={`Remove "${term}" from recent searches`}
                    title="Remove"
                    className="mr-1.5 shrink-0 rounded p-1 text-zinc-300 hover:bg-zinc-200 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <MiniThemeToggle />

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            <Link href="/developers" onClick={() => setOpen(false)} className="hover:text-accent">
              API
            </Link>
            <span aria-hidden>·</span>
            <Link href="/methodology" onClick={() => setOpen(false)} className="hover:text-accent">
              Methodology
            </Link>
            <span aria-hidden>·</span>
            <Link href="/about" onClick={() => setOpen(false)} className="hover:text-accent">
              About
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" onClick={() => setOpen(false)} className="hover:text-accent">
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link href="/terms" onClick={() => setOpen(false)} className="hover:text-accent">
              Terms
            </Link>
          </div>

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

      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Keyboard shortcuts</h2>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <XIcon />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="flex items-center gap-3 text-sm">
                  <kbd className="rounded border border-zinc-300 bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {s.keys}
                  </kbd>
                  <span className="text-zinc-600 dark:text-zinc-400">{s.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
