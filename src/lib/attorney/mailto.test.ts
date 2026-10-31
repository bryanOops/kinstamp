import { describe, expect, it } from "vitest";
import { mailtoHref } from "./mailto";

describe("mailtoHref", () => {
  it("addresses the email with the subject", () => {
    expect(mailtoHref("maria@example.com", "About Mom")).toBe("mailto:maria@example.com?subject=About%20Mom");
  });

  it("encodes characters that would break the query string", () => {
    expect(mailtoHref("maria@example.com", "About Mom & Dad? #1")).toBe("mailto:maria@example.com?subject=About%20Mom%20%26%20Dad%3F%20%231");
  });

  it("keeps accented subjects readable by mail clients (UTF-8 percent-encoding)", () => {
    expect(mailtoHref("jose@example.com", "Sobre Mamá")).toBe("mailto:jose@example.com?subject=Sobre%20Mam%C3%A1");
  });
});
