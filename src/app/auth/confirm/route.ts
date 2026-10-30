import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { homePathFor } from "@/server/auth";

const otpTypeSchema = z.enum(["email", "signup", "recovery", "invite", "magiclink", "email_change"]);

// Target of the confirmation email: verifies the token, starts the session
// and sends the person to their home page.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = otpTypeSchema.safeParse(searchParams.get("type")).data ?? null;
  const code = searchParams.get("code");

  const supabase = await createClient();
  const { error } =
    tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: new Error("Missing confirmation token") };

  if (error) return NextResponse.redirect(new URL("/sign-in?error=confirmation", origin));

  const { data: claims } = await supabase.auth.getClaims();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims?.claims.sub ?? "")
    .single();
  const home = homePathFor(profile?.role === "attorney" ? "attorney" : "client");
  return NextResponse.redirect(new URL(`${home}?welcome=1`, origin));
}
