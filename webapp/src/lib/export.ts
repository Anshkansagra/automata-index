import type { Paper } from "@/lib/types";
import { toBibtex } from "@/lib/citation";

export function toBibtexAll(papers: Paper[]): string {
  return papers.map(toBibtex).join("\n\n");
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(papers: Paper[]): string {
  const header = ["Title", "Authors", "Year", "Source", "Publisher", "DOI", "PDF URL", "Landing page URL"];
  const rows = papers.map((p) =>
    [
      p.title,
      p.authors.join("; "),
      p.published_date?.slice(0, 4) ?? "",
      p.source,
      p.publisher ?? "",
      p.doi ?? "",
      p.pdf_url ?? "",
      p.landing_page_url,
    ]
      .map(escapeCsv)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}
