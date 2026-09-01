import { describe, expect, it } from "vitest";
import { formatCitation, isCitationStyle } from "@/lib/citation";
import type { Paper } from "@/lib/types";

function makePaper(overrides: Partial<Paper> = {}): Paper {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    source: "arxiv",
    source_id: "2401.00001",
    doi: "10.48550/arXiv.2401.00001",
    title: "A Study of Robot Path Planning",
    authors: ["Jane Doe", "John Smith"],
    abstract: "An abstract.",
    published_date: "2024-03-15",
    categories: ["cs.RO"],
    publisher: "arXiv",
    pdf_url: "https://arxiv.org/pdf/2401.00001",
    landing_page_url: "https://arxiv.org/abs/2401.00001",
    is_open_access: true,
    tldr: null,
    created_at: "2024-03-16T00:00:00Z",
    citation_count: 5,
    also_indexed_via: [],
    ...overrides,
  };
}

describe("isCitationStyle", () => {
  it("accepts every known style", () => {
    for (const style of ["bibtex", "apa", "mla", "chicago", "ieee", "vancouver"]) {
      expect(isCitationStyle(style)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isCitationStyle("harvard")).toBe(false);
    expect(isCitationStyle(undefined)).toBe(false);
    expect(isCitationStyle(42)).toBe(false);
  });
});

describe("formatCitation — MLA", () => {
  it("keeps the first author's given name (regression: was dropping it)", () => {
    const result = formatCitation(makePaper(), "mla");
    expect(result).toContain("Doe, Jane");
  });

  it("uses 'and' for exactly two authors", () => {
    const result = formatCitation(makePaper(), "mla");
    expect(result).toContain("and John Smith");
  });

  it("uses 'et al' for more than two authors", () => {
    const result = formatCitation(
      makePaper({ authors: ["Jane Doe", "John Smith", "Alex Lee"] }),
      "mla"
    );
    expect(result).toContain("et al");
    expect(result).not.toContain("and John Smith");
  });
});

describe("formatCitation — Chicago", () => {
  it("does not double up periods after 'et al' (regression)", () => {
    const result = formatCitation(
      makePaper({
        authors: Array.from({ length: 9 }, (_, i) => `Author ${i}`),
      }),
      "chicago"
    );
    expect(result).not.toContain("et al..");
    expect(result).toContain("et al.");
  });
});

describe("formatCitation — general", () => {
  it("formats bibtex with authors joined by 'and', unmodified", () => {
    const result = formatCitation(makePaper(), "bibtex");
    expect(result).toContain("@article{");
    expect(result).toContain("author = {Jane Doe and John Smith}");
  });

  it("uses the DOI link when present, landing page otherwise", () => {
    const withDoi = formatCitation(makePaper(), "apa");
    expect(withDoi).toContain("https://doi.org/10.48550/arXiv.2401.00001");

    const withoutDoi = formatCitation(makePaper({ doi: null }), "apa");
    expect(withoutDoi).toContain("https://arxiv.org/abs/2401.00001");
  });

  it("shows 'n.d.' when there's no published date", () => {
    const result = formatCitation(makePaper({ published_date: null }), "apa");
    expect(result).toContain("(n.d.)");
  });
});
