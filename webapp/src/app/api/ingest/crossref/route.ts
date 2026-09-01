import { NextRequest, NextResponse } from "next/server";
import { ingestCrossref } from "@/lib/ingest/crossref";
import { isAuthorizedIngestRequest } from "@/lib/ingest/auth";
import { notifyCronFailure } from "@/lib/ingest/notifyFailure";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestCrossref({ pages: 2, rowsPerPage: 100 });
    return NextResponse.json(result);
  } catch (err) {
    await notifyCronFailure("crossref", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
