import { describe, expect, it } from "vitest";
import { escapeHtml, renderStatusChangeEmail, type StatusChangeEmailInput } from "./status-change";

const copy = {
  heading: "Your case has a new status",
  caseLabel: "Case",
  receiptLabel: "Receipt number",
  descriptionLabel: "What USCIS says",
  cta: "Open in Kinstamp",
  footer: "You get this email because you track this case in Kinstamp.",
  manageNotifications: "Turn these emails off in Settings",
  notAffiliated: "Kinstamp is not affiliated with USCIS or the U.S. government.",
};

const input: StatusChangeEmailInput = {
  lang: "en",
  caseName: "Mom's petition",
  receiptNumber: "EAC9999103403",
  status: "Case Was Approved",
  description: "On September 5, 2023, we approved your Form I-130, Petition for Alien Relative.",
  url: "https://kinstamp.app/cases/abc-123",
  settingsUrl: "https://kinstamp.app/settings",
  copy,
};

describe("renderStatusChangeEmail", () => {
  it("escapes every interpolated value", () => {
    const { html } = renderStatusChangeEmail({
      ...input,
      caseName: `<script>alert("x")</script>`,
      status: "Approved & <b>done</b>",
      description: `Tom's "note" <img src=x>`,
      url: `https://kinstamp.app/cases/a"onmouseover="x`,
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>done</b>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain(`a"onmouseover`);
    expect(html).toContain("&#60;script&#62;");
    expect(html).toContain("Approved &#38; &#60;b&#62;done&#60;/b&#62;");
  });

  it("links to the case and shows the grouped receipt number in monospace", () => {
    const { html } = renderStatusChangeEmail(input);
    expect(html).toContain(`href="https://kinstamp.app/cases/abc-123"`);
    expect(html).toContain("EAC 999 910 3403");
    expect(html).toMatch(/font-family:'JetBrains Mono'[^>]*>EAC 999 910 3403</);
    expect(html).toContain("Mom&#39;s petition");
    expect(html).toContain(`href="https://kinstamp.app/settings"`);
    expect(html).toContain(`<html lang="en"`);
  });

  it("does not repeat the receipt number when the case has no nickname", () => {
    const { html, text } = renderStatusChangeEmail({ ...input, caseName: "EAC9999103403" });
    expect(html).not.toContain(">Case<");
    expect(html.match(/EAC 999 910 3403/g)).toHaveLength(1);
    expect(text).not.toContain("Case:");
  });

  it("omits the description block when USCIS gave none", () => {
    const { html, text } = renderStatusChangeEmail({ ...input, description: "" });
    expect(html).not.toContain(copy.descriptionLabel);
    expect(text).not.toContain(copy.descriptionLabel);
  });

  it("renders a plain-text alternative with the status, the links and the footer", () => {
    const { text } = renderStatusChangeEmail(input);
    expect(text).toContain("Case Was Approved");
    expect(text).toContain("Receipt number: EAC 999 910 3403");
    expect(text).toContain("Open in Kinstamp: https://kinstamp.app/cases/abc-123");
    expect(text).toContain("Turn these emails off in Settings: https://kinstamp.app/settings");
    expect(text).toContain(copy.notAffiliated);
    expect(text).not.toMatch(/<[a-z]/i);
  });
});

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe("&#60;a href=&#34;x&#34;&#62;&#38;&#39;&#60;/a&#62;");
  });
});
