import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { getPapers, getPaperById, getPapersByAuthor, getRelatedPapers } from "@/lib/queries";
import type { Paper } from "@/lib/types";

export const dynamic = "force-dynamic";

const ABSTRACT_PREVIEW_LENGTH = 400;

const SOURCES = ["arxiv", "core", "semantic_scholar", "crossref", "openalex", "zenodo"] as const;

// Compact shape for list results — full abstracts on every row in a 10-20
// item search response would blow past what's useful in a tool call; the
// single-paper tool returns the untruncated abstract instead.
function toListItem(p: Paper) {
  return {
    id: p.id,
    title: p.title,
    authors: p.authors,
    abstract_preview:
      p.abstract && p.abstract.length > ABSTRACT_PREVIEW_LENGTH
        ? p.abstract.slice(0, ABSTRACT_PREVIEW_LENGTH).trimEnd() + "…"
        : p.abstract,
    published_date: p.published_date,
    source: p.source,
    doi: p.doi,
    citation_count: p.citation_count,
    pdf_url: p.pdf_url,
    landing_page_url: p.landing_page_url,
  };
}

function toFullPaper(p: Paper) {
  return {
    id: p.id,
    title: p.title,
    authors: p.authors,
    abstract: p.abstract,
    published_date: p.published_date,
    categories: p.categories,
    source: p.source,
    publisher: p.publisher,
    doi: p.doi,
    citation_count: p.citation_count,
    pdf_url: p.pdf_url,
    landing_page_url: p.landing_page_url,
    also_indexed_via: p.also_indexed_via,
  };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

function createServer(): McpServer {
  const server = new McpServer({ name: "cortexa-mcp-server", version: "1.0.0" });

  server.registerTool(
    "cortexa_search_papers",
    {
      title: "Search Cortexa Papers",
      description: `Search Cortexa's free, open-access index of robotics, machine learning, AI, and VLSI research papers by keyword or topic.

This searches paper titles and abstracts using relevance ranking (not exact phrase matching) across arXiv, CrossRef open-access publishers (MDPI, IEEE Access, etc.), OpenAlex, CORE, Semantic Scholar, and Zenodo. Every paper returned is free to read — every result has a link to a legally free PDF or landing page.

Returns a list of matching papers with truncated abstracts (~400 chars) — use cortexa_get_paper with a paper's id for the full abstract and details.`,
      inputSchema: {
        query: z.string().min(1).max(300).describe("Search keywords or topic, e.g. 'graph neural networks' or 'VLSI chip design'"),
        source: z.enum(SOURCES).optional().describe("Restrict results to one source (arxiv, core, semantic_scholar, crossref, openalex, zenodo). Omit to search all sources."),
        sort: z.enum(["recent", "cited"]).default("recent").describe("'recent' sorts by publish date, 'cited' sorts by citation count"),
        year_from: z.number().int().min(1900).max(2100).optional().describe("Only include papers published in or after this year"),
        year_to: z.number().int().min(1900).max(2100).optional().describe("Only include papers published in or before this year"),
        limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of results (1-50)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ query, source, sort, year_from, year_to, limit }) => {
      try {
        const papers = await getPapers({
          q: query,
          source,
          sort,
          yearFrom: year_from,
          yearTo: year_to,
          limit,
        });
        const output = { count: papers.length, results: papers.map(toListItem) };
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : "Search failed");
      }
    }
  );

  server.registerTool(
    "cortexa_get_paper",
    {
      title: "Get Cortexa Paper Details",
      description: `Fetch full details for a single paper by its Cortexa paper id, including the untruncated abstract, DOI, publisher, categories, and links to a free PDF.

Use cortexa_search_papers first to find a paper's id. Returns an error if no paper with that id exists.`,
      inputSchema: {
        paper_id: z.string().uuid().describe("The Cortexa paper id (uuid), obtained from cortexa_search_papers results"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ paper_id }) => {
      try {
        const paper = await getPaperById(paper_id);
        if (!paper) return errorResult(`No paper found with id '${paper_id}'.`);
        const output = toFullPaper(paper);
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : "Failed to load paper");
      }
    }
  );

  server.registerTool(
    "cortexa_get_papers_by_author",
    {
      title: "Get Papers By Author",
      description: `List papers by a specific author name, indexed on Cortexa. Matches the exact author name as listed on the paper (case-insensitive) — not a fuzzy search, so use the author's full name as it would appear on a paper.

Returns a list sorted by most recent publication date first.`,
      inputSchema: {
        author_name: z.string().min(1).max(200).describe("Full author name, e.g. 'Yann LeCun'"),
        limit: z.number().int().min(1).max(50).default(20).describe("Maximum number of results (1-50)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ author_name, limit }) => {
      try {
        const papers = await getPapersByAuthor(author_name, limit);
        const output = { count: papers.length, results: papers.map(toListItem) };
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : "Author lookup failed");
      }
    }
  );

  server.registerTool(
    "cortexa_get_related_papers",
    {
      title: "Get Related Papers",
      description: `Find papers related to a given paper, ranked by shared topic categories and text similarity to its title. Useful for exploring a research area starting from one known paper.

Use cortexa_search_papers or cortexa_get_paper first to find the starting paper's id.`,
      inputSchema: {
        paper_id: z.string().uuid().describe("The Cortexa paper id (uuid) to find related papers for"),
        limit: z.number().int().min(1).max(20).default(6).describe("Maximum number of related papers (1-20)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ paper_id, limit }) => {
      try {
        const paper = await getPaperById(paper_id);
        if (!paper) return errorResult(`No paper found with id '${paper_id}'.`);
        const related = await getRelatedPapers(paper, limit);
        const output = { count: related.length, results: related.map(toListItem) };
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : "Failed to load related papers");
      }
    }
  );

  return server;
}

export async function POST(request: Request): Promise<Response> {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
