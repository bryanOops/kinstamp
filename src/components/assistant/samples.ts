import type { AssistantMessage } from "./assistant-panel";

export const sampleConversation: AssistantMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "What does 'Request for evidence' mean and what should I do?",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "A Request for Evidence (RFE) means USCIS needs more documents before deciding on your Form I-765. Your case received this on Oct 2, 2026, and your key date says the response is due Nov 18, 2026.\n\nWhat usually helps: read the notice carefully, gather exactly what it lists, and send everything in one package before the deadline. Your attorney (ana@lawfirm.com) can see this case and may want to review it first.",
  },
];

export const sampleSuggestions = ["How long do RFE responses usually take?", "What comes after I send the evidence?", "Is my case slower than usual?"];
