import { NextRequest, NextResponse } from "next/server";
import { ingestOpenAlex } from "@/lib/ingest/openalex";
import { isAuthorizedIngestRequest } from "@/lib/ingest/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestOpenAlex({ pages: 2, perPage: 100 });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
