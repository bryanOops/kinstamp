import { groupReceiptNumber } from "@/lib/format/receipt";
import {
  bodyText,
  buttonRow,
  escapeHtml,
  headingRow,
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
 * Email to an attorney when a client shares a case: an invitation to create an attorney
 * account, or a heads-up for someone who already has one. Copy arrives translated.
 */
export type ShareEmailInput = {
  lang: string;
  heading: string;
  title: string;
  /** Paragraphs under the title. */
  body: string[];
  /** Label / value lines; `receipt: true` groups the value as a receipt number. */
  details: { label: string; value: string; receipt?: boolean }[];
  cta: string;
  url: string;
  /** Why the person gets this email. */
  footer: string;
  notAffiliated: string;
};

export function renderShareEmail(input: ShareEmailInput): RenderedEmail {
  const details = input.details.map((detail) => ({
    label: detail.label,
    value: detail.receipt ? groupReceiptNumber(detail.value) : detail.value,
    receipt: detail.receipt,
  }));

  const paragraphs = input.body
    .map(
      (paragraph, index) => `
                <tr>
                  <td style="padding:${index === 0 ? 0 : 12}px 0 0">
                    <p class="k-ink" style="${bodyText}">${escapeHtml(paragraph)}</p>
                  </td>
                </tr>`,
    )
    .join("");

  const detailRows = details
    .map((detail) =>
      metaRow(
        detail.label,
        detail.receipt
          ? `<span style="font-family:${mono};font-size:14px;letter-spacing:0.02em">${escapeHtml(detail.value)}</span>`
          : `<span style="font-weight:500">${escapeHtml(detail.value)}</span>`,
      ),
    )
    .join("");

  const detailsBlock = detailRows
    ? `
                <tr>
                  <td style="padding:24px 0 0">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="k-line" style="border-top:1px solid ${line}">
                      ${detailRows}
                    </table>
                  </td>
                </tr>`
    : "";

  const html = renderEmailFrame({
    lang: input.lang,
    title: input.title,
    preheader: input.body[0] ?? input.title,
    cardRows: `${headingRow(input.heading)}${titleRow(input.title)}${paragraphs}${detailsBlock}${buttonRow(input.url, input.cta)}`,
    footer: `
              <p class="k-muted" style="${smallText}">${escapeHtml(input.footer)}</p>
              <p class="k-muted" style="${smallText}margin-top:8px">${escapeHtml(input.notAffiliated)}</p>`,
  });

  const text = joinTextLines([
    "Kinstamp",
    "",
    input.heading.toUpperCase(),
    input.title,
    "",
    ...input.body.flatMap((paragraph) => [paragraph, ""]),
    ...details.map((detail) => `${detail.label}: ${detail.value}`),
    "",
    `${input.cta}: ${input.url}`,
    "",
    input.footer,
    input.notAffiliated,
  ]);

  return { html, text };
}
