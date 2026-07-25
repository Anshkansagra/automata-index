import { NextRequest, NextResponse } from "next/server";
import { ingestArxiv } from "@/lib/ingest/arxiv";
import { isAuthorizedIngestRequest } from "@/lib/ingest/auth";

export const dynamic = "force-dynamic";
// Vercel Hobby plan caps serverless functions at 60s — keep default batch
// sizes (see ingestArxiv's defaults) small enough to fit inside that window.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestArxiv({ pages: 1, pageSize: 200 });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
