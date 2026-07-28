function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h12v18l-6-4-6 4V3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FEATURES = [
  { Icon: SearchIcon, label: "Full-Text Search", sub: "22,000+ papers, instantly" },
  { Icon: ShieldIcon, label: "100% Open Access", sub: "No paywalls, ever" },
  { Icon: BookmarkIcon, label: "Save & Organize", sub: "Bookmark papers you need" },
  { Icon: MailIcon, label: "Smart Digests", sub: "Emailed when new matches appear" },
];

export function AuthFeatureGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FEATURES.map(({ Icon, label, sub }) => (
        <div
          key={label}
          className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-sm"
        >
          <div className="text-accent">
            <Icon />
          </div>
          <p className="mt-2 text-sm font-medium text-white">{label}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>
        </div>
      ))}
    </div>
  );
}

export function AuthChecklist() {
  const items = [
    "Free forever, no credit card",
    "Search 22,000+ open-access papers",
    "Save papers and get email digests",
  ];
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {item}
        </li>
      ))}
    </ul>
  );
}
