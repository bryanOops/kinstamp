import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { caseAssistantTools } from "@/server/assistant/tools";
import { getCurrentProfile } from "@/server/auth";
import { getTrackedCaseDetail } from "@/server/cases/queries";

// The case assistant (docs/spec.md, E7): a tool-use loop over read-only tools for one
// tracked case, streamed to the browser as plain text. Conversations are not stored.

export const maxDuration = 60;

const MESSAGES_PER_DAY = 20;

const requestSchema = z.object({
  trackedCaseId: z.uuid(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20)
    .refine((messages) => messages.at(-1)?.role === "user", "The last message must come from the person."),
});

const SYSTEM_PROMPT = `You are the case assistant inside Kinstamp, an app where families track their USCIS immigration cases and share them with their attorney.

You help the person understand one case: what its current status means, what usually happens next, how long cases like it take, and which key dates matter.

How to answer:
- Base every fact about the case on your tools. Call them before answering; do not rely on memory for this case's data.
- If a tool returns no data for something, say plainly that Kinstamp does not have it. Never estimate dates, outcomes or approval chances.
- You may explain what a USCIS status generally means and the usual next step, in plain language.
- Reply in the same language the person writes in (English or Spanish). Keep it short: a few sentences or a brief list. Use dates as written in the data.
- You are not a lawyer. When the question needs legal judgment (what to file, whether to respond a certain way, eligibility), say so briefly and suggest asking their attorney.
- End every answer with one short line noting this is general information, not legal advice.`;

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return new Response("Sign in first.", { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "assistantUnavailable" }, { status: 503 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalidRequest" }, { status: 400 });
  const { trackedCaseId, messages } = parsed.data;

  // RLS: only the owner or a shared attorney gets the case back.
  if (!(await getTrackedCaseDetail(trackedCaseId))) return Response.json({ error: "notFound" }, { status: 404 });

  const admin = createAdminClient();
  const { count } = await admin
    .from("assistant_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  if ((count ?? 0) >= MESSAGES_PER_DAY) return Response.json({ error: "dailyLimitReached" }, { status: 429 });
  await admin.from("assistant_usage").insert({ user_id: profile.id });

  const client = new Anthropic();
  const runner = client.beta.messages.toolRunner({
    model: "claude-opus-5-5",
    max_tokens: 8000,
    // Short conversational answers over a few lookups: low effort keeps latency and cost down.
    output_config: { effort: "low" },
    // If a safety classifier declines, retry on the fallback model the API picks.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    cache_control: { type: "ephemeral" },
    system: SYSTEM_PROMPT,
    tools: caseAssistantTools(trackedCaseId),
    messages,
    max_iterations: 6,
    stream: true,
  });

  const notices =
    profile.locale === "es"
      ? { refused: "No puedo ayudarte con eso. Consúltalo con tu abogado.", failed: "El asistente no está disponible en este momento. Inténtalo más tarde." }
      : { refused: "I can't help with that one. Please ask your attorney.", failed: "The assistant is unavailable right now. Please try again later." };
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const messageStream of runner) {
          for await (const event of messageStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const message = await messageStream.finalMessage();
          if (message.stop_reason === "refusal") {
            controller.enqueue(encoder.encode(`\n\n${notices.refused}`));
            break;
          }
        }
      } catch (error) {
        console.error("[assistant]", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
        controller.enqueue(encoder.encode(`\n\n${notices.failed}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
