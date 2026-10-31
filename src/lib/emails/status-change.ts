import { groupReceiptNumber, normalizeReceiptNumber } from "@/lib/format/receipt";
import {
  bodyText,
  buttonRow,
  capsText,
  escapeHtml,
  headingRow,
  inkMuted,
  joinTextLines,
  line,
  metaRow,
  mono,
  renderEmailFrame,
  smallText,
  titleRow,
  type RenderedEmail,
} from "./layout";

/**
 * Status change notification, rendered as HTML plus a plain-text alternative.
 *
 * Pure and React-free so it can be unit-tested. All copy arrives already translated
 * (`messages/*.json` → `emails.statusChange`); this module only lays it out following
 * the Kinstamp design system (docs/design/DESIGN.md) under email-client constraints:
 * tables, inline styles, system font stack, no images.
 */

export type StatusChangeEmailCopy = {
  /** Small caps label above the status title, e.g. "Your case has a new status". */
  heading: string;
  caseLabel: string;
  receiptLabel: string;
  /** Label above the USCIS description, e.g. "What USCIS says". */
  descriptionLabel: string;
  cta: string;
  /** Why the person gets this email. */
  footer: string;
  /** Link text pointing to Settings, e.g. "Turn these emails off in Settings". */
  manageNotifications: string;
  notAffiliated: string;
};

export type StatusChangeEmailInput = {
  /** "en" | "es"; only used for the document `lang` attribute. */
  lang: string;
  /** The client's nickname for the tracked case, or the receipt number when there is none. */
  caseName: string;
  receiptNumber: string;
  /** Current USCIS status title, e.g. "Case Was Approved". */
  status: string;
  /** USCIS description for the status; may be empty. */
  description: string;
  /** Link to the tracked case in Kinstamp. */
  url: string;
  /** Link to Settings, where notifications can be turned off. */
  settingsUrl: string;
  copy: StatusChangeEmailCopy;
};

export { escapeHtml, type RenderedEmail };

export function renderStatusChangeEmail(input: StatusChangeEmailInput): RenderedEmail {
  const { copy } = input;
  const receipt = input.receiptNumber ? groupReceiptNumber(input.receiptNumber) : "";
  // When the case has no nickname, `caseName` is the receipt number: show it once.
  const showCaseRow =
    input.caseName.length > 0 && normalizeReceiptNumber(input.caseName) !== normalizeReceiptNumber(input.receiptNumber);
  const preheader = `${input.status} — ${input.caseName}`;

  const metaRows = [
    showCaseRow ? metaRow(copy.caseLabel, `<span style="font-weight:500">${escapeHtml(input.caseName)}</span>`) : "",
    receipt
      ? metaRow(
          copy.receiptLabel,
          `<span style="font-family:${mono};font-size:14px;letter-spacing:0.02em">${escapeHtml(receipt)}</span>`,
        )
      : "",
  ].join("");

  const descriptionBlock = input.description
    ? `
                <tr>
                  <td style="padding:24px 0 0">
                    <p class="k-muted" style="${capsText}">${escapeHtml(copy.descriptionLabel)}</p>
                    <p class="k-ink" style="${bodyText}margin-top:8px">${escapeHtml(input.description)}</p>
                  </td>
                </tr>`
    : "";

  const html = renderEmailFrame({
    lang: input.lang,
    title: input.status,
    preheader,
    cardRows: `${headingRow(copy.heading)}${titleRow(input.status)}
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="k-line" style="border-top:1px solid ${line}">
                      ${metaRows}
                    </table>
                  </td>
                </tr>${descriptionBlock}${buttonRow(input.url, copy.cta)}`,
    footer: `
              <p class="k-muted" style="${smallText}">
                ${escapeHtml(copy.footer)}
                <a href="${escapeHtml(input.settingsUrl)}" style="color:${inkMuted};text-decoration:underline;text-underline-offset:2px">${escapeHtml(copy.manageNotifications)}</a>
              </p>
              <p class="k-muted" style="${smallText}margin-top:8px">${escapeHtml(copy.notAffiliated)}</p>`,
  });

  const text = joinTextLines([
    "Kinstamp",
    "",
    copy.heading.toUpperCase(),
    input.status,
    "",
    showCaseRow ? `${copy.caseLabel}: ${input.caseName}` : "",
    receipt ? `${copy.receiptLabel}: ${receipt}` : "",
    "",
    ...(input.description ? [copy.descriptionLabel, input.description, ""] : []),
    `${copy.cta}: ${input.url}`,
    "",
    copy.footer,
    `${copy.manageNotifications}: ${input.settingsUrl}`,
    copy.notAffiliated,
  ]);

  return { html, text };
}
