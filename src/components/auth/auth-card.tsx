import type { ReactNode } from "react";

type AuthCardProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/** Centered card for sign-up, sign-in and confirmation screens. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-[460px] fade-up">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-raised sm:p-8">
        <div className="mb-7">
          <h1 className="text-title text-ink">{title}</h1>
          {description && <p className="mt-2 text-md text-ink-muted">{description}</p>}
        </div>
        {children}
      </div>
      {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
    </div>
  );
}
