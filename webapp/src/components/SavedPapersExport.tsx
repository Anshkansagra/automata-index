"use client";

import { toBibtexAll, toCsv } from "@/lib/export";
import type { Paper } from "@/lib/types";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SavedPapersExport({ papers }: { papers: Paper[] }) {
  if (papers.length === 0) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <button
        type="button"
        onClick={() => download("cortexa-saved-papers.bib", toBibtexAll(papers), "application/x-bibtex")}
        className="font-medium text-accent hover:underline"
      >
        Export BibTeX
      </button>
      <button
        type="button"
        onClick={() => download("cortexa-saved-papers.csv", toCsv(papers), "text/csv")}
        className="font-medium text-accent hover:underline"
      >
        Export CSV
      </button>
    </div>
  );
}
