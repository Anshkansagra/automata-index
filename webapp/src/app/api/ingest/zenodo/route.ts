import { NextRequest, NextResponse } from "next/server";
import { ingestZenodo } from "@/lib/ingest/zenodo";
import { isAuthorizedIngestRequest } from "@/lib/ingest/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await ingestZenodo({ pages: 4, pageSize: 25 });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
