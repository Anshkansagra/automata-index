"use client";

import { useEffect, useState } from "react";

export function PdfPreview({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-medium text-zinc-600 hover:underline dark:text-zinc-400"
      >
        Preview
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 p-3 dark:border-zinc-800">
              <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
              <div className="flex shrink-0 items-center gap-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close preview"
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Some publishers block embedding via X-Frame-Options/CSP — "Open
                in new tab" above is the fallback when a PDF refuses to render
                here. */}
            <iframe src={url} title={title} className="flex-1 bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
      )}
    </>
  );
}
