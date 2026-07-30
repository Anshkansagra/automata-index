"use client";

import { useState } from "react";
import { formatCitation, CITATION_STYLE_LABELS, type CitationStyle } from "@/lib/citation";
import type { Paper } from "@/lib/types";

const STYLES = Object.keys(CITATION_STYLE_LABELS) as CitationStyle[];

export function CiteButton({
  paper,
  defaultStyle = "bibtex",
}: {
  paper: Paper;
  defaultStyle?: CitationStyle;
}) {
  const [style, setStyle] = useState<CitationStyle>(defaultStyle);
  const [copied, setCopied] = useState(false);

  async function copyCitation() {
    await navigator.clipboard.writeText(formatCitation(paper, style));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={copyCitation}
        className="font-medium text-zinc-600 hover:underline dark:text-zinc-400"
      >
        {copied ? `Copied ${CITATION_STYLE_LABELS[style]}` : "Cite"}
      </button>
      <select
        value={style}
        onChange={(e) => setStyle(e.target.value as CitationStyle)}
        aria-label="Citation style"
        className="rounded border-none bg-transparent text-xs text-zinc-400 outline-none dark:text-zinc-500"
      >
        {STYLES.map((s) => (
          <option key={s} value={s}>
            {CITATION_STYLE_LABELS[s]}
          </option>
        ))}
      </select>
    </span>
  );
}
