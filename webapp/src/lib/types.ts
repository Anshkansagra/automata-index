export type Paper = {
  id: string;
  source: "arxiv" | "core" | "semantic_scholar" | "crossref" | "openalex";
  source_id: string;
  doi: string | null;
  title: string;
  authors: string[];
  abstract: string | null;
  published_date: string | null;
  categories: string[];
  publisher: string | null;
  pdf_url: string | null;
  landing_page_url: string;
  is_open_access: boolean;
  tldr: string | null;
  created_at: string;
  citation_count: number | null;
};
