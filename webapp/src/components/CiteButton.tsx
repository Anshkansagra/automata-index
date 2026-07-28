"use client";

import { useState } from "react";
import { toBibtex } from "@/lib/citation";
import type { Paper } from "@/lib/types";

export function CiteButton({ paper }: { paper: Paper }) {
  const [copied, setCopied] = useState(false);

  async function copyBibtex() {
    await navigator.clipboard.writeText(toBibtex(paper));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copyBibtex}
      className="font-medium text-zinc-600 hover:underline dark:text-zinc-400"
    >
      {copied ? "Copied BibTeX" : "Cite"}
    </button>
  );
}
