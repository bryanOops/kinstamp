import { groupReceiptNumber, normalizeReceiptNumber } from "@/lib/format/receipt";

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

export type RenderedEmail = { html: string; text: string };

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

// Design tokens (src/app/globals.css) as literal hex values: email clients have no CSS variables.
// Font names use single quotes because they end up inside double-quoted `style` attributes.
const ink = "#0b0b0f";
const inkMuted = "#5c5c66";
const canvas = "#f6f6f8";
const surface = "#ffffff";
const line = "#e6e6ea";
const stamp = "#e5532d";

const sans = `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const mono = `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;

const bodyText = `margin:0;font-family:${sans};font-size:15px;line-height:24px;letter-spacing:-0.004em;color:${ink};`;
const smallText = `margin:0;font-family:${sans};font-size:13px;line-height:20px;color:${inkMuted};`;
const capsText = `margin:0;font-family:${sans};font-size:12px;line-height:16px;letter-spacing:0.06em;font-weight:600;text-transform:uppercase;color:${inkMuted};`;

/** Dark mode and narrow screens, as progressive enhancement over the inline styles. */
const styles = `
  @media (prefers-color-scheme: dark) {
    .k-body { background: #0b0b0f !important; }
    .k-card { background: #15151a !important; border-color: #2a2a31 !important; }
    .k-ink { color: #f3f3f5 !important; }
    .k-muted { color: #a0a0a8 !important; }
    .k-line { border-color: #2a2a31 !important; }
    .k-mark { border-color: #f3f3f5 !important; }
    .k-btn { background: #ffffff !important; }
    .k-btn a { color: #0b0b0f !important; }
    .k-footer a { color: #a0a0a8 !important; }
  }
  @media only screen and (max-width: 600px) {
    .k-frame { padding: 24px 12px !important; }
    .k-card-pad { padding: 24px 20px !important; }
    .k-title { font-size: 24px !important; line-height: 30px !important; }
    .k-btn-table { width: 100% !important; }
    .k-btn, .k-btn a { display: block !important; text-align: center !important; }
  }
`;

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

  const html = `<!doctype html>
<html lang="${escapeHtml(input.lang)}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(input.status)}</title>
  <style>${styles}</style>
</head>
<body class="k-body" style="margin:0;padding:0;background:${canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${canvas}">${escapeHtml(preheader)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="k-body" style="background:${canvas}">
    <tr>
      <td align="center" class="k-frame" style="padding:40px 16px">
        <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto">
          <tr>
            <td style="padding:0 4px 20px">
              ${wordmark()}
            </td>
          </tr>
          <tr>
            <td class="k-card k-card-pad" style="background:${surface};border:1px solid ${line};border-radius:12px;padding:32px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 0 12px">
                    <p class="k-muted" style="${capsText}">${escapeHtml(copy.heading)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 24px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" style="width:22px;padding-top:12px">
                          <div style="width:10px;height:10px;border-radius:5px;background:${stamp};font-size:0;line-height:0">&nbsp;</div>
                        </td>
                        <td valign="top">
                          <h1 class="k-ink k-title" style="margin:0;font-family:${sans};font-size:28px;line-height:34px;letter-spacing:-0.02em;font-weight:600;color:${ink}">${escapeHtml(input.status)}</h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="k-line" style="border-top:1px solid ${line}">
                      ${metaRows}
                    </table>
                  </td>
                </tr>${descriptionBlock}
                <tr>
                  <td style="padding:28px 0 0">
                    ${button(input.url, copy.cta)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="k-footer" style="padding:24px 4px 0">
              <p class="k-muted" style="${smallText}">
                ${escapeHtml(copy.footer)}
                <a href="${escapeHtml(input.settingsUrl)}" style="color:${inkMuted};text-decoration:underline;text-underline-offset:2px">${escapeHtml(copy.manageNotifications)}</a>
              </p>
              <p class="k-muted" style="${smallText}margin-top:8px">${escapeHtml(copy.notAffiliated)}</p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = [
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
  ]
    .filter((lineOfText, index, all) => !(lineOfText === "" && all[index - 1] === ""))
    .join("\n");

  return { html, text };
}

function metaRow(label: string, valueHtml: string): string {
  return `
                      <tr>
                        <td class="k-muted k-line" valign="top" style="width:140px;padding:12px 16px 12px 0;border-bottom:1px solid ${line};font-family:${sans};font-size:13px;line-height:20px;color:${inkMuted}">${escapeHtml(label)}</td>
                        <td class="k-ink k-line" valign="top" style="padding:12px 0;border-bottom:1px solid ${line};font-family:${sans};font-size:14px;line-height:20px;color:${ink}">${valueHtml}</td>
                      </tr>`;
}

/** Text wordmark with the stamp mark drawn in CSS: no hosted image, survives dark mode. */
function wordmark(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:8px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="k-mark" align="center" valign="middle" style="width:14px;height:14px;border:2px solid ${ink};border-radius:5px;font-size:0;line-height:0">
                          <div style="width:6px;height:6px;border-radius:3px;background:${stamp};margin:0 auto;font-size:0;line-height:0">&nbsp;</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" class="k-ink" style="font-family:${sans};font-size:18px;line-height:20px;font-weight:600;letter-spacing:-0.03em;color:${ink}">Kinstamp</td>
                </tr>
              </table>`;
}

/** Bulletproof button: the cell carries the background, the link carries the padding. */
function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="k-btn-table">
                      <tr>
                        <td class="k-btn" style="background:${ink};border-radius:12px;mso-padding-alt:0">
                          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 24px;font-family:${sans};font-size:15px;line-height:20px;font-weight:600;letter-spacing:-0.004em;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(label)}</a>
                        </td>
                      </tr>
                    </table>`;
}
