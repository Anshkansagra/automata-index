// Some publisher metadata (CrossRef `link`, OpenAlex `pdf_url`) points to a
// TDM/API endpoint that returns raw XML metadata rather than an actual PDF
// (observed with Elsevier records in both sources). Reject anything that
// looks like an API call rather than a real document link.
export function isLikelyRealPdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.startsWith("api.")) return false;
    if (parsed.pathname.includes("/content/article/")) return false;
    if (parsed.searchParams.has("httpAccept")) return false;
    return true;
  } catch {
    return false;
  }
}
