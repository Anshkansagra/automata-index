import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ipAddress } from "@vercel/functions";
import { rateLimiter } from "@/lib/rateLimit";
import { SESSION_USER_HEADER } from "@/lib/auth/sessionUser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function proxy(request: NextRequest) {
  // Site-wide abuse guard. Fails open (lets the request through) if Upstash
  // itself is unreachable — a rate-limiter outage shouldn't take the whole
  // site down.
  try {
    const ip = ipAddress(request) ?? "unknown";
    const { success } = await rateLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests — please slow down and try again shortly." },
        { status: 429 }
      );
    }
  } catch {
    // fail open
  }

  // Never trust a client-supplied copy of the session-user header — always
  // strip it before we (maybe) set our own validated version below.
  request.headers.delete(SESSION_USER_HEADER);

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  // Refreshes the auth token if expired — required for SSR sessions to stay
  // alive. This also validates the session, so forwarding the result via a
  // header lets Server Components (and the Sidebar, rendered on every page)
  // skip calling getUser() again themselves — each call is a network
  // round-trip to Supabase's Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    request.headers.set(
      SESSION_USER_HEADER,
      JSON.stringify({
        id: user.id,
        email: user.email ?? null,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        identities: (user.identities ?? []).map((i) => ({ provider: i.provider })),
      })
    );
  }

  const response = NextResponse.next({ request });
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
