"use client";

import { useRef, useState } from "react";
import type { AssistantMessage } from "@/components/assistant/assistant-panel";

/** i18n keys under `assistant.errors`. */
export type AssistantErrorKey = "signedOut" | "invalidRequest" | "notFound" | "dailyLimitReached" | "assistantUnavailable" | "network";

const errorByStatus: Record<number, AssistantErrorKey> = {
  401: "signedOut",
  400: "invalidRequest",
  404: "notFound",
  429: "dailyLimitReached",
  503: "assistantUnavailable",
};

const MAX_MESSAGES = 20;

/**
 * Conversation with `POST /api/assistant` for one tracked case, kept only in memory.
 * The reply streams as plain text and is appended chunk by chunk; `stop()` aborts it.
 */
export function useAssistantChat(trackedCaseId: string) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<AssistantErrorKey | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  async function send(question: string) {
    const content = question.trim();
    if (!content || streaming) return;

    // Keep the request within the endpoint's limit by dropping the oldest turns.
    const history = [...messages, { id: `u-${Date.now()}`, role: "user" as const, content }].slice(-(MAX_MESSAGES - 1));
    const replyId = `a-${Date.now()}`;
    setError(null);
    setMessages([...history, { id: replyId, role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackedCaseId, messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        const key = (body?.error as AssistantErrorKey | undefined) ?? errorByStatus[response.status] ?? "network";
        setError(key);
        setMessages(history);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const snapshot = text;
        setMessages((current) => current.map((m) => (m.id === replyId ? { ...m, content: snapshot } : m)));
      }
      text += decoder.decode();
      if (!text.trim()) {
        setError("network");
        setMessages(history);
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        // Keep whatever arrived before the person pressed Stop.
        setMessages((current) => current.filter((m) => m.id !== replyId || m.content.trim().length > 0));
      } else {
        setError("network");
        setMessages(history);
      }
    } finally {
      controllerRef.current = null;
      setStreaming(false);
    }
  }

  function stop() {
    controllerRef.current?.abort();
  }

  return { messages, streaming, error, send, stop };
}
