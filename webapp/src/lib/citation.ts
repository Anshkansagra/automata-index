import type { Paper } from "@/lib/types";

export type CitationStyle = "bibtex" | "apa" | "mla" | "chicago" | "ieee" | "vancouver";

export const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  bibtex: "BibTeX",
  apa: "APA",
  mla: "MLA",
  chicago: "Chicago",
  ieee: "IEEE",
  vancouver: "Vancouver",
};

function bibtexKey(paper: Paper): string {
  const lastName = paper.authors[0]?.split(" ").pop()?.replace(/[^a-zA-Z]/g, "") || "anon";
  const year = paper.published_date?.slice(0, 4) || "nd";
  const firstTitleWord = paper.title.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9]/g, "") || "paper";
  return `${lastName}${year}${firstTitleWord}`;
}

function escapeBibtex(value: string): string {
  return value.replace(/[{}]/g, "");
}

export function toBibtex(paper: Paper): string {
  const year = paper.published_date?.slice(0, 4) || "n.d.";
  const lines = [
    `@article{${bibtexKey(paper)},`,
    `  title = {${escapeBibtex(paper.title)}},`,
    `  author = {${escapeBibtex(paper.authors.join(" and "))}},`,
    `  year = {${year}},`,
  ];
  if (paper.publisher) lines.push(`  journal = {${escapeBibtex(paper.publisher)}},`);
  if (paper.doi) lines.push(`  doi = {${paper.doi}},`);
  lines.push(`  url = {${paper.landing_page_url}}`);
  lines.push(`}`);
  return lines.join("\n");
}

// Best-effort split — the underlying data is just a display name string, not
// structured {first, last}, so this is a reasonable approximation (last word
// as surname) rather than a guarantee for every name format.
function splitName(fullName: string): { last: string; given: string; initials: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { last: "", given: "", initials: "" };
  const last = parts[parts.length - 1];
  const givenParts = parts.slice(0, -1);
  const given = givenParts.join(" ");
  const initials = givenParts.map((p) => p[0]?.toUpperCase() + ".").join(" ");
  return { last, given, initials };
}

const MAX_LISTED_AUTHORS = 8;

function citationUrl(paper: Paper): string {
  return paper.doi ? `https://doi.org/${paper.doi}` : paper.landing_page_url;
}

function citationYear(paper: Paper): string {
  return paper.published_date?.slice(0, 4) || "n.d.";
}

function toApa(paper: Paper): string {
  const names = paper.authors.slice(0, MAX_LISTED_AUTHORS).map((a) => {
    const { last, initials } = splitName(a);
    return initials ? `${last}, ${initials}` : last;
  });
  const suffix = paper.authors.length > MAX_LISTED_AUTHORS ? ", et al." : "";
  const authorList =
    names.length > 1 ? `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}` : names[0] || "";

  const parts = [
    `${authorList}${suffix} (${citationYear(paper)}).`,
    `${paper.title}.`,
  ];
  if (paper.publisher) parts.push(`${paper.publisher}.`);
  parts.push(citationUrl(paper));
  return parts.join(" ");
}

function toMla(paper: Paper): string {
  const [first, ...rest] = paper.authors;
  let authorList = "";
  if (first) {
    const { last, given } = splitName(first);
    authorList = given ? `${last}, ${given}` : last;
    if (rest.length === 1) authorList += `, and ${rest[0]}`;
    else if (rest.length > 1) authorList += ", et al";
  }

  const parts = [`${authorList}. "${paper.title}."`];
  if (paper.publisher) parts.push(`${paper.publisher},`);
  parts.push(`${citationYear(paper)},`);
  parts.push(`${citationUrl(paper)}.`);
  return parts.join(" ");
}

function toChicago(paper: Paper): string {
  const names = paper.authors.slice(0, MAX_LISTED_AUTHORS);
  const suffix = paper.authors.length > MAX_LISTED_AUTHORS ? ", et al" : "";
  const authorList = names.length > 1 ? `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}` : names[0] || "";

  const parts = [`${authorList}${suffix}.`, `${citationYear(paper)}.`, `"${paper.title}."`];
  if (paper.publisher) parts.push(`${paper.publisher}.`);
  parts.push(`${citationUrl(paper)}.`);
  return parts.join(" ");
}

function toIeee(paper: Paper): string {
  const names = paper.authors.slice(0, MAX_LISTED_AUTHORS).map((a) => {
    const { last, initials } = splitName(a);
    return initials ? `${initials} ${last}` : last;
  });
  const suffix = paper.authors.length > MAX_LISTED_AUTHORS ? " et al." : "";
  const authorList =
    names.length > 1 ? `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}` : names[0] || "";

  const parts = [`${authorList}${suffix},`, `"${paper.title},"`];
  if (paper.publisher) parts.push(`${paper.publisher},`);
  parts.push(`${citationYear(paper)}.`);
  parts.push(`[Online]. Available: ${citationUrl(paper)}`);
  return parts.join(" ");
}

function toVancouver(paper: Paper): string {
  const names = paper.authors.slice(0, MAX_LISTED_AUTHORS).map((a) => {
    const { last, initials } = splitName(a);
    return `${last} ${initials.replace(/\.\s*/g, "")}`;
  });
  const suffix = paper.authors.length > MAX_LISTED_AUTHORS ? ", et al" : "";

  const parts = [`${names.join(", ")}${suffix}.`, `${paper.title}.`];
  if (paper.publisher) parts.push(`${paper.publisher}.`);
  parts.push(`${citationYear(paper)}.`);
  parts.push(`Available from: ${citationUrl(paper)}`);
  return parts.join(" ");
}

export function isCitationStyle(value: unknown): value is CitationStyle {
  return typeof value === "string" && value in CITATION_STYLE_LABELS;
}

export function formatCitation(paper: Paper, style: CitationStyle): string {
  switch (style) {
    case "apa":
      return toApa(paper);
    case "mla":
      return toMla(paper);
    case "chicago":
      return toChicago(paper);
    case "ieee":
      return toIeee(paper);
    case "vancouver":
      return toVancouver(paper);
    case "bibtex":
    default:
      return toBibtex(paper);
  }
}
