import { parseNoticeText } from "@/lib/uscis/notice-text";

type NoticeTextProps = {
  text: string;
  className?: string;
  lang?: string;
};

/** A USCIS description with its uscis.gov links clickable and any other markup removed. */
export function NoticeText({ text, className, lang }: NoticeTextProps) {
  return (
    <p lang={lang} className={className}>
      {parseNoticeText(text).map((segment, index) =>
        segment.type === "link" ? (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            {segment.label}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </p>
  );
}
