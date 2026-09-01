import { NextRequest, NextResponse } from "next/server";
import { ingestSemanticScholar } from "@/lib/ingest/semanticScholar";
import { isAuthorizedIngestRequest } from "@/lib/ingest/auth";
import { notifyCronFailure } from "@/lib/ingest/notifyFailure";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestSemanticScholar({ pages: 2 });
    return NextResponse.json(result);
  } catch (err) {
    await notifyCronFailure("semantic-scholar", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
