import { describe, expect, it } from "vitest";
import { noticePlainText, parseNoticeText } from "./notice-text";

// USCIS descriptions arrive with raw HTML anchors inside the text (seen in the sandbox recordings).
const mailed =
  'If you do not receive your card by September 20, 2023, please go to <a href="https://egov.uscis.gov/e-request/" target="_blank">www.uscis.gov/e-request</a> to request that we resend the card to you.';

describe("parseNoticeText", () => {
  it("turns USCIS anchors into link segments and keeps the surrounding text", () => {
    expect(parseNoticeText(mailed)).toEqual([
      {
        type: "text",
        value: "If you do not receive your card by September 20, 2023, please go to ",
      },
      {
        type: "link",
        href: "https://egov.uscis.gov/e-request/",
        label: "www.uscis.gov/e-request",
      },
      { type: "text", value: " to request that we resend the card to you." },
    ]);
  });

  it("keeps the label as plain text when the link does not point to uscis.gov", () => {
    expect(parseNoticeText('Go to <a href="https://evil.example.com/">www.uscis.gov</a> now.')).toEqual([
      { type: "text", value: "Go to www.uscis.gov now." },
    ]);
  });

  it("drops any other tag but keeps its text", () => {
    expect(parseNoticeText("We <b>approved</b> your case.<br>Keep the notice.")).toEqual([
      { type: "text", value: "We approved your case.Keep the notice." },
    ]);
  });

  it("decodes the entities USCIS uses", () => {
    expect(parseNoticeText("Form I-130 &amp; I-485 &quot;received&quot;")).toEqual([
      { type: "text", value: 'Form I-130 & I-485 "received"' },
    ]);
  });

  it("returns the text untouched when there is no markup", () => {
    expect(parseNoticeText("On September 5, 2023, we approved your Form I-130.")).toEqual([
      {
        type: "text",
        value: "On September 5, 2023, we approved your Form I-130.",
      },
    ]);
  });
});

describe("noticePlainText", () => {
  it("renders links as their label for emails and the assistant", () => {
    expect(noticePlainText(mailed)).toBe(
      "If you do not receive your card by September 20, 2023, please go to www.uscis.gov/e-request to request that we resend the card to you.",
    );
  });
});
