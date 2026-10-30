// A fixed cookie name, so the browser (which reaches Supabase on localhost) and
// the server (which may reach it through another host inside Docker) share the session.
export const supabaseCookieOptions = { name: "sb-kinstamp-auth-token" } as const;
