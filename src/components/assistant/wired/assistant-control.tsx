"use client";

import { useTranslations } from "next-intl";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { useAssistantChat } from "@/hooks/use-assistant-chat";

const suggestionKeys = ["status", "next", "duration", "dates"] as const;

/** "Ask about this case" wired to `POST /api/assistant`; the conversation lives only in this component. */
export function AssistantControl({ trackedCaseId, caseLabel }: { trackedCaseId: string; caseLabel: string }) {
  const t = useTranslations("assistant.suggestions");
  const chat = useAssistantChat(trackedCaseId);

  return (
    <AssistantPanel
      caseLabel={caseLabel}
      messages={chat.messages}
      suggestions={suggestionKeys.map((key) => t(key))}
      streaming={chat.streaming}
      error={chat.error}
      onSend={chat.send}
      onStop={chat.stop}
    />
  );
}
