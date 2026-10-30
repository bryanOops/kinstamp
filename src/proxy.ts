import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";
import { supabaseEnv } from "@/lib/env";

// Optimistic check only: refreshes the Supabase session cookie and sends signed-out
// visitors away from private pages. Every page and Server Action still verifies
// the person itself (see src/server/auth.ts).
const privatePrefixes = ["/cases", "/attorney", "/insights", "/settings"];

// Kept in sync with PATHNAME_HEADER in src/server/auth.ts (that module is server-only).
const pathnameHeader = "x-kinstamp-pathname";

export async function proxy(request: NextRequest) {
  // Server Components cannot read the URL; `requireProfile` uses this to build its `next`.
  request.headers.set(pathnameHeader, request.nextUrl.pathname);
  let response = NextResponse.next({ request });

  const { serverUrl, anonKey } = supabaseEnv();
  const supabase = createServerClient(serverUrl, anonKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!signedIn && privatePrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("next", pathname);
    // A session cookie that no longer validates means the session ended, as opposed to
    // someone who was never signed in: only then does sign-in explain what happened.
    if (request.cookies.getAll().some((cookie) => cookie.name.startsWith(supabaseCookieOptions.name))) {
      url.searchParams.set("reason", "expired");
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip static assets and the cron endpoint, which authenticates with CRON_SECRET.
  matcher: ["/((?!_next/static|_next/image|api/cron|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
