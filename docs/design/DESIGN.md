---
name: Kinstamp
description: Design system for Kinstamp. Source of truth for Stitch and for the implementation in src/.
---
# Kinstamp design system

Kinstamp — USCIS case tracking for families and their attorneys. The brand name joins *kin* (family) and *stamp* (the official USCIS stamp). The interface balances a warm name with a sober, document-like look.

Design system for "Kinstamp", a web app where immigrant families track their USCIS immigration cases and share them with their attorney. It must feel calm, trustworthy and precise, like a well-made legal document, never like a government website and never playful.

Principles:
- Black leads. Primary buttons, the top navigation bar, active states and key headings use deep black #0B0B0F (hover #1A1A22). The rest of the screen is light: app background #F6F6F8, cards #FFFFFF with 1px border #E6E6EA and an almost invisible gray shadow.
- One accent, used sparingly: "stamp vermilion" #E5532D, inspired by an official passport stamp. Use it only for: the current step in a case timeline, the focus ring of inputs, a "status changed" highlight, and one small detail of the logo. Never large vermilion areas, never more than one vermilion element competing per screen.
- Calm by default. Generous spacing, clear hierarchy, short copy. Loading states use a thin black progress line, not spinners.
- Status is always text plus color, never color alone.

Typography:
- Headings: "Instrument Serif", regular, slightly tight letter spacing, large and short. It gives an editorial, official-document feel.
- UI and body: "Inter". Dates and receipt numbers in tabular figures. Receipt numbers in "JetBrains Mono" with letter spacing, e.g. EAC 999 910 3403 grouped for readability.

Color for case status (dot + dark gray label, never pastel pills):
- Received / In process: blue #2F6FED
- Request for evidence / Action needed: amber #D98E04
- Approved / Card produced / Delivered: green #1E9E5A
- Denied / Rejected: red #B42318
- Unknown / Not available: gray #8A8A94
A status indicator is a solid 8px dot plus text in #5C5C66 on white with border #E6E6EA. Example: "● Case Was Approved".

Shape and space:
- 8px radius everywhere, 12px only on the main call-to-action button.
- 8px spacing grid. 24px page margins on desktop, 16px on mobile.
- Max content width 1120px, centered.

Components:
- Primary button: black, 44px tall, white Inter 600 text, icon on the left.
- Secondary button: background #F6F6F8, 1.5px border #0B0B0F, black text.
- Destructive button (revoke, remove): white background, 1.5px border #B42318, text and icon #B42318; on press fills #B42318 with white text.
- Inputs: 44px tall, 1px border #E6E6EA, focus ring 2px vermilion.
- Timeline: vertical line in #E6E6EA, completed steps as black dots, the current step as a vermilion dot, each step with date (tabular), status title and one-line description. Steps reported by USCIS and steps detected by the app are labeled subtly ("from USCIS" / "detected by Kinstamp").
- Banners: white with a 3px left border in the status color and an icon; e.g. "USCIS sandbox is offline (Mon–Fri, 7am–8pm ET). Showing the last saved status from Oct 30, 2:14 PM."
- Language switch EN / ES as a small segmented control in the top bar.

Do not use: gradients, glows, colored shadows, glassmorphism, cartoon illustrations, emoji, pastel pills with same-color text, initials as avatars on cards, light gray text on white, animations longer than 300ms.

Desktop first at 1440px wide, fully responsive down to 390px mobile.

Logo: the word "Kinstamp" in Instrument Serif, black, with a small vermilion stamp mark (a rounded square outline with a dot) before it. No illustrations.

Fallback if Instrument Serif is unavailable: Newsreader for headings.
