import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it("takes the first letter of the first and last words of a name", () => {
    expect(initialsOf("Maria Lopez", "maria@example.com")).toBe("ML");
    expect(initialsOf("Ana Torres, Esq.", "ana@example.com")).toBe("AE");
  });

  it("uses one letter for a single-word name", () => {
    expect(initialsOf("  carlos ", "c@example.com")).toBe("C");
  });

  it("falls back to the email when the name is blank", () => {
    expect(initialsOf("", "demo-client@kinstamp.com")).toBe("D");
    expect(initialsOf("   ", "x@example.com")).toBe("X");
  });

  it("keeps accented letters uppercase", () => {
    expect(initialsOf("Ángel Núñez", "a@example.com")).toBe("ÁN");
  });
});
