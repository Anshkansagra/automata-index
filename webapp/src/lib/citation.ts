import type { Paper } from "@/lib/types";

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
