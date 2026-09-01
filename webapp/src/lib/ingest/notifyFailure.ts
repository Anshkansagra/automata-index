import "server-only";
import { sendEmail } from "@/lib/email";

const OWNER_EMAIL = "anshkansagra2004@gmail.com";

// Best-effort — a notification failure (e.g. Resend down) must never mask
// the original cron error or crash the route. Previously a broken
// ingestion source (an upstream API changing shape, going down, etc.) would
// fail silently: the route returned a 500, but nothing surfaced that to
// anyone unless someone happened to check Vercel's logs.
export async function notifyCronFailure(source: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  try {
    await sendEmail({
      to: OWNER_EMAIL,
      subject: `Cortexa: ${source} ingestion failed`,
      html: `<p><strong>${source}</strong> failed with:</p><pre>${message}</pre>`,
    });
  } catch {
    // Nothing more to do — don't let a notification failure compound the
    // original error.
  }
}
