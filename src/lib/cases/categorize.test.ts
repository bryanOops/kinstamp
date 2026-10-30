import { describe, expect, it } from "vitest";
import { categorizeStatus } from "./categorize";

describe("categorizeStatus", () => {
  it.each([
    // Current status titles
    ["Case Was Received", "received"],
    ["Case Was Received and A Receipt Notice Was Sent", "received"],
    ["Fingerprint Fee Was Received", "biometrics"],
    ["Biometrics Appointment Was Scheduled", "biometrics"],
    ["Interview Was Scheduled", "interview"],
    ["Request for Evidence Was Sent", "evidence_requested"],
    ["Response To USCIS' Request For Evidence Was Received", "evidence_received"],
    ["Case Was Approved", "approved"],
    ["New Card Is Being Produced", "card_produced"],
    ["Card Was Mailed To Me", "card_delivered"],
    ["Card Was Delivered To Me By The Post Office", "card_delivered"],
    ["Case Was Transferred To Another Office", "transferred"],
    ["Case Was Denied", "denied"],
    ["Case Was Rejected Because It Was Improperly Filed", "denied"],
    ["Withdrawal Acknowledgement Notice Was Sent", "withdrawn"],
    ["Case Is Being Actively Reviewed By USCIS", "other"],
    // Sentences from USCIS's own history
    ["We received your Form I-130, Petition for Alien Relative.", "received"],
    ["We approved your Form I-130, Petition for Alien Relative.", "approved"],
    ["We sent you a request for additional evidence.", "evidence_requested"],
  ])("%s → %s", (text, category) => {
    expect(categorizeStatus(text)).toBe(category);
  });

  it("is not fooled by letter case or extra spaces", () => {
    expect(categorizeStatus("  case   WAS approved ")).toBe("approved");
  });
});
