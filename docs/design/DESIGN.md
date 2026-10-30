---
name: Kinstamp
description: Design system for Kinstamp. Source of truth for the implementation in src/ (tokens in src/app/globals.css).
---
# Kinstamp design system

Kinstamp — USCIS case tracking for families and their attorneys. The brand name joins *kin* (family) and *stamp* (the official USCIS stamp). The interface pairs a warm name with a sober, precise look: calm, trustworthy, document-like, never a government website and never playful.

The Stitch screens were a starting point. This document describes what is built in `src/` and is the reference for new screens. Tokens live in `src/app/globals.css`; primitives in `src/components/ui/` (shadcn/ui on Base UI, restyled) and `src/components/status/`; every component is visible with sample data at `/design` (development only).

## Principles

- **Black leads.** Primary buttons, the signed-in top bar, active states and headings use deep black `#0B0B0F` (hover `#1A1A22`). Everything else is light: canvas `#F6F6F8`, cards `#FFFFFF` with a 1px `#E6E6EA` border and an almost invisible offset shadow.
- **One accent, used sparingly.** "Stamp vermilion" `#E5532D` for marks: the logo dot, the current step of a timeline, the "Changed" chip, the "your case" marker on charts, the focus ring and the text caret. Vermilion text uses the darker `#C43A1B` (5.3:1 on white). Never large vermilion areas, never two vermilion elements competing on a screen.
- **Calm by default.** Generous spacing, short copy, fixed type scale. Loading is a thin black progress line or a skeleton, never a spinner in the middle of content.
- **Status is text plus color, never color alone.** A solid dot and the USCIS status title; the tone name is also announced to assistive tech.
- **Honest copy.** Product language from `GLOSSARY.md`. No invented data (no "faster than 72%", no jurisdictions), no legal-sounding jargon, and a "not legal advice" note wherever Kinstamp explains a status.

## Typography

One family carries the whole interface, Apple-style: **Inter 4 (variable)** loaded with `next/font` and its **optical-size axis (`opsz` 14–32)** enabled. The browser picks the text cut below ~20px and the display cut above it, so large titles get the tighter, crisper letterforms SF Pro Display gives on Apple platforms while small UI text keeps open apertures. Rendering is identical on macOS and Windows because the font is self-hosted. Features `cv11` and `ss03` are on for a single-storey `a` and rounder quotes.

Why Inter over the system font: `system-ui` renders as SF Pro on a Mac and Segoe UI on Windows, so reviewers would not see the same product. Inter is the closest widely available cousin of SF Pro, has true optical sizing, nine weights, tabular figures and full Latin coverage for Spanish.

Receipt numbers and other identifiers use **JetBrains Mono** (`font-mono`), grouped for reading: `EAC 999 910 3403`. Monospace is for data, never for decoration.

Fixed rem scale (ratio ≈ 1.2) with size-specific tracking:

| Utility | Size / line | Tracking | Weight | Use |
|---|---|---|---|---|
| `text-display` | 48 / 1.08 (56 on landing) | −0.028em | 600 | Landing hero |
| `text-title` | 28 / 34 | −0.02em | 600 | Page titles |
| `text-heading` | 20 / 26 | −0.012em | 600 | Section and dialog titles |
| `text-subheading` | 16 / 24 | −0.012em | 600 | Card titles |
| `text-md` (body) | 15 / 24 | −0.004em | 400 | Body and controls |
| `text-sm` | 14 / 20 | 0 | 400 | Secondary text |
| `text-caps` | 12 / 16 | +0.06em | 600, uppercase | Small section labels |

Numbers that align (dates, days, counts) use `tabular`.

## Color

Brand: ink `#0B0B0F`, ink-hover `#1A1A22`, ink-muted `#5C5C66` (6.6:1), ink-subtle `#767680` (placeholders, 4.6:1), ink-disabled `#A0A0A8` (disabled only), canvas `#F6F6F8`, canvas-deep `#EDEDF0`, surface `#FFFFFF`, line `#E6E6EA`, line-strong `#CFCFD6` (inputs), stamp `#E5532D`, stamp-ink `#C43A1B`, stamp-tint `#FDEEE9`.

Status tones, each ≥ 4.5:1 on white so the same shade works as a dot and as text:

| Tone | Categories | Color |
|---|---|---|
| In progress | received, biometrics, interview, evidence_received, transferred | blue `#2563EB` |
| Action needed | evidence_requested | amber `#B45309` |
| Approved | approved, card_produced, card_delivered | green `#15803D` |
| Denied | denied, withdrawn | red `#B42318` |
| Not checked yet | other / no category | gray `#6B6B75` |

Each tone has a `-tint` background (`#EAF1FE`, `#FDF3E6`, `#E8F6EE`, `#FBEBE9`, `#F0F0F3`) used only behind small chips with the tone's text color on top. No pastel pills with same-color text, no gradients, no glow, no glassmorphism, no indigo or purple anywhere.

## Shape, space, depth

- Radii: 8px controls (`rounded-lg`), 12px cards and dialogs (`rounded-xl` / `rounded-2xl` for overlays), full for chips and the language switch.
- 4px grid; cards pad 20px on mobile and 24px on desktop. Page content is 1120px wide, centered, with 16px margins on mobile and 24px from `sm`.
- Elevation is declared once: cards use border + `shadow-card` (1px offset, soft); hover and auth cards use `shadow-raised`; dialogs and menus use `shadow-overlay`. Never a zero-offset colored halo.
- Focus: 2px vermilion ring with 2px offset on every interactive element (white ring on the black top bar).

## Motion

≤ 300ms, `ease-out-expo` for entrances and `ease-standard` for state changes. One entrance per screen (`fade-up` on the page content), never per card. Hover and press feedback is immediate (`active:scale-[0.985]` on buttons). Everything is disabled under `prefers-reduced-motion`.

## Components

- **Buttons:** primary black 44px (`lg` 48px with 12px radius for the main call to action), secondary canvas with a 1px black border, outline, ghost, destructive (white with red border, fills red on hover), link, inverse (white on black). Icon on the left, 16px.
- **Inputs:** 44px, `line-strong` border, vermilion ring on focus, red border when `aria-invalid`. Labels are always visible; the error replaces the hint under the field and is announced with `role="alert"`.
- **StatusIndicator:** 8px dot + status title (12px dot at `lg`).
- **ReceiptNumber:** mono, grouped, optional copy button with "Copied" feedback.
- **Timeline:** date column (tabular) · dot column (vermilion for the current step, black for earlier ones, 1px line) · title with an origin label ("Reported by USCIS" / "Observed by Kinstamp"), optional description, "New" chip for the event just observed.
- **Banner:** white, 1px status rail on the left, icon in the tone color, title + description + optional action. Used for "USCIS is offline (Mon–Fri, 7am–8pm ET). Showing the last saved status from …".
- **EmptyState:** dashed border on the canvas, icon tile, heading, one sentence, one primary action.
- **PageHeader:** breadcrumbs → title → meta line (receipt, form) with actions on the right; stacks on mobile.
- **KeyDateChip:** countdown with urgency: past (gray), today (red), within 7 days (amber), later (neutral).
- **Cards:** one level only, never nested. Section labels in `text-caps`.
- **Top bar (signed in):** black, 56px, wordmark left, nav center (underline on the active item), language switch and account menu right. On mobile the nav moves to a second 44px row.
- **Language switch:** small segmented EN / ES control, present on every screen.
- **Logo:** "Kinstamp" in Inter 600 with tight tracking and the stamp mark (rounded square outline with a vermilion dot). No illustrations.

## Do not use

Gradients, glows, colored shadows, glassmorphism, illustrations and emoji, pastel pills, initials as avatars, light gray text on white, serif display type, colored left rails thicker than 1px, modals for tasks that do not need focus, animations longer than 300ms, and any data the product does not actually have.
