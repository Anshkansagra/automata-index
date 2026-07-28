"use client";

import { useState } from "react";

const TRUNCATE_LENGTH = 280;

export function AbstractText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > TRUNCATE_LENGTH;
  const shown = expanded || !isLong ? text : text.slice(0, TRUNCATE_LENGTH).trimEnd() + "…";

  return (
    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
      {shown}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-1 font-medium text-accent hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </p>
  );
}
