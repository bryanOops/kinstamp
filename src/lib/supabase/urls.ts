/**
 * URL the server uses to reach Supabase. Inside Docker, `localhost` is the container
 * itself, so `SUPABASE_INTERNAL_URL` points to the host; elsewhere it is the public URL.
 */
export function supabaseServerUrl(): string {
  return process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
}
