import { describe, expect, it } from "vitest";
import documentedSuccess from "./__fixtures__/documented-success.json";
import { parseCaseStatusResponse } from "./parse-response";

describe("parseCaseStatusResponse", () => {
  it("reads the documented success response", () => {
    const result = parseCaseStatusResponse(documentedSuccess);

    expect(result).toEqual({
      ok: true,
      snapshot: {
        receiptNumber: "EAC9999103403",
        formType: "I-130",
        submittedAt: "2023-09-05T18:28:46.000Z",
        uscisModifiedAt: "2023-09-05T18:28:46.000Z",
        status: { en: "Case Was Approved", es: "Caso Fue Aprobado" },
        description: {
          en: "On September 5, 2023, we approved your Form I-130, Petition for Alien Relative, Receipt Number EAC9999103403. We sent you an approval notice. Please follow the instructions in the notice.",
          es: "El 05 de Septiembre de 2023, aprobamos su Formulario I-130, Petición de Familiar Extranjero, Número de Recibo EAC9999103403. Le enviamos un aviso de aprobación. Por favor, siga las instrucciones en el aviso.",
        },
        history: [
          {
            date: "2023-09-05",
            en: "We approved your Form I-130, Petition for Alien Relative.",
            es: "Aprobamos su Formulario I-130, Petición de Familiar Extranjero.",
          },
        ],
      },
    });
  });

  it("reads IOE receipt numbers, which come without dates", () => {
    const { submittedDate, modifiedDate, ...rest } = documentedSuccess.case_status;
    void submittedDate;
    void modifiedDate;
    const result = parseCaseStatusResponse({ ...documentedSuccess, case_status: { ...rest, receiptNumber: "IOE0123456789" } });

    expect(result.ok && result.snapshot.submittedAt).toBeNull();
    expect(result.ok && result.snapshot.uscisModifiedAt).toBeNull();
    expect(result.ok && result.snapshot.receiptNumber).toBe("IOE0123456789");
  });

  it("treats a missing history as empty", () => {
    const { hist_case_status, ...rest } = documentedSuccess.case_status;
    void hist_case_status;
    const result = parseCaseStatusResponse({ case_status: rest });

    expect(result.ok && result.snapshot.history).toEqual([]);
  });

  it("reads winter dates in Eastern Standard Time (UTC-5)", () => {
    const result = parseCaseStatusResponse({
      case_status: { ...documentedSuccess.case_status, submittedDate: "01-12-2023 09:00:00" },
    });

    expect(result.ok && result.snapshot.submittedAt).toBe("2023-01-12T14:00:00.000Z");
  });

  it.each([
    ["an error body", { message: "Not found" }],
    ["a case without a status title", { case_status: { receiptNumber: "EAC9999103403" } }],
    ["not JSON object", "<html>Service unavailable</html>"],
  ])("rejects %s as an unexpected response", (_label, body) => {
    expect(parseCaseStatusResponse(body)).toEqual({ ok: false, error: "unexpected_response" });
  });
});
