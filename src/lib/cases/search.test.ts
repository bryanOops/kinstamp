import { describe, expect, it } from "vitest";
import { matchesCaseQuery, type CaseSearchable } from "./search";

const momsGreenCard: CaseSearchable = {
  nickname: "Mom's green card",
  receiptNumber: "EAC9999103403",
  statusEn: "Case Was Received",
  statusEs: "El caso fue recibido",
  formType: "I-485",
};

const joseWorkPermit: CaseSearchable = {
  nickname: "José — permiso de trabajo",
  receiptNumber: "IOE0912345678",
  statusEn: "Request for Additional Evidence Was Sent",
  statusEs: "Se envió una solicitud de evidencia adicional",
  formType: "I-765",
};

const unnamed: CaseSearchable = { nickname: null, receiptNumber: "LIN2312345678", statusEn: null, statusEs: null, formType: null };

describe("matchesCaseQuery", () => {
  it("matches everything when the query is empty or blank", () => {
    expect(matchesCaseQuery("", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("   ", unnamed)).toBe(true);
  });

  it("matches the nickname regardless of case", () => {
    expect(matchesCaseQuery("mom", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("GREEN", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("dad", momsGreenCard)).toBe(false);
  });

  it("ignores accents in both the query and the case", () => {
    expect(matchesCaseQuery("jose", joseWorkPermit)).toBe(true);
    expect(matchesCaseQuery("José", joseWorkPermit)).toBe(true);
    expect(matchesCaseQuery("envio", joseWorkPermit)).toBe(true);
  });

  it("matches the receipt number ignoring spaces, dashes and case", () => {
    expect(matchesCaseQuery("eac 999 910 3403", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("EAC-999-910-3403", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("9103403", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("eac", joseWorkPermit)).toBe(false);
  });

  it("matches the status in either language", () => {
    expect(matchesCaseQuery("received", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("recibido", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("evidence", joseWorkPermit)).toBe(true);
    expect(matchesCaseQuery("evidencia", joseWorkPermit)).toBe(true);
    expect(matchesCaseQuery("approved", momsGreenCard)).toBe(false);
  });

  it("matches the form type", () => {
    expect(matchesCaseQuery("i-485", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("I-765", momsGreenCard)).toBe(false);
  });

  it("requires every word to match somewhere (AND), each word on its own field", () => {
    expect(matchesCaseQuery("mom received", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("received mom", momsGreenCard)).toBe(true);
    expect(matchesCaseQuery("mom evidence", momsGreenCard)).toBe(false);
    expect(matchesCaseQuery("jose i-765", joseWorkPermit)).toBe(true);
  });

  it("copes with cases that have no nickname, status or form", () => {
    expect(matchesCaseQuery("lin", unnamed)).toBe(true);
    expect(matchesCaseQuery("mom", unnamed)).toBe(false);
  });
});
