import { describe, expect, it } from "vitest";
import { renderShareEmail, type ShareEmailInput } from "./share";

const invitation: ShareEmailInput = {
  lang: "en",
  heading: "A case was shared with you",
  title: "Maria Lopez shared “Mom's petition”",
  body: [
    "Maria Lopez uses Kinstamp to follow a USCIS case and wants you to see it.",
    "Create your attorney account with this email address to open it.",
  ],
  details: [
    { label: "Shared by", value: "Maria Lopez" },
    { label: "Receipt number", value: "EAC9999103403", receipt: true },
  ],
  cta: "Create your attorney account",
  url: "https://kinstamp.com/sign-up?invite=6f1c0a3e-1111-4222-8333-444455556666",
  footer: "You get this email because a Kinstamp user shared a case with this address.",
  notAffiliated: "Kinstamp is not affiliated with USCIS or the U.S. government.",
};

describe("renderShareEmail", () => {
  it("links the button to the given URL", () => {
    const { html } = renderShareEmail(invitation);
    expect(html).toContain('href="https://kinstamp.com/sign-up?invite=6f1c0a3e-1111-4222-8333-444455556666"');
    expect(html).toContain("Create your attorney account");
  });

  it("shows every paragraph and the receipt number grouped in monospace", () => {
    const { html } = renderShareEmail(invitation);
    expect(html).toContain("wants you to see it.");
    expect(html).toContain("Create your attorney account with this email address");
    expect(html).toContain("EAC 999 910 3403");
  });

  it("escapes every interpolated value", () => {
    const { html } = renderShareEmail({ ...invitation, title: `<script>alert("x")</script>`, details: [{ label: "Shared by", value: "<b>Ana</b>" }] });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Ana</b>");
    expect(html).toContain("&#60;b&#62;Ana&#60;/b&#62;");
  });

  it("renders a plain-text alternative with the title, the paragraphs and the link", () => {
    const { text } = renderShareEmail(invitation);
    expect(text).toContain("Maria Lopez shared “Mom's petition”");
    expect(text).toContain("wants you to see it.");
    expect(text).toContain("Receipt number: EAC 999 910 3403");
    expect(text).toContain("Create your attorney account: https://kinstamp.com/sign-up?invite=");
    expect(text).not.toMatch(/\n\n\n/);
  });
});
