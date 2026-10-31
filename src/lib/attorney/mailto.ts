/** A `mailto:` link with a subject. `URLSearchParams` would write spaces as `+`, which mail clients show literally. */
export function mailtoHref(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
