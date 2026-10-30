"use client";

import { BriefcaseIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AssistantPanel, type AssistantMessage } from "@/components/assistant/assistant-panel";
import { sampleConversation, sampleSuggestions } from "@/components/assistant/samples";
import { sampleSharedCases } from "@/components/attorney/samples";
import { SharedCasesTable } from "@/components/attorney/shared-cases-table";
import { Logo, StampMark } from "@/components/brand/logo";
import { AddCaseDialog } from "@/components/cases/add-case-dialog";
import { CaseDetailView } from "@/components/cases/case-detail-view";
import { CaseList } from "@/components/cases/case-list";
import { KeyDatesCard, AddKeyDateButton } from "@/components/cases/key-dates-card";
import { RefreshButton } from "@/components/cases/refresh-button";
import { sampleApprovedCase, sampleCaseDetail, sampleNow, sampleOfflineCase, sampleTrackedCases } from "@/components/cases/samples";
import { ShareDialog } from "@/components/cases/share-dialog";
import type { RefreshState } from "@/components/cases/types";
import { sampleInsights, sampleOwnCases } from "@/components/insights/samples";
import { InsightsView } from "@/components/insights/insights-view";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { PageHeader } from "@/components/layout/page-header";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { DangerSection, NotificationsSection, PrivacySection } from "@/components/settings/settings-sections";
import { Banner } from "@/components/status/banner";
import { EmptyState } from "@/components/status/empty-state";
import { KeyDateChip } from "@/components/status/key-date-chip";
import { ReceiptNumber } from "@/components/status/receipt-number";
import { StatusIndicator } from "@/components/status/status-indicator";
import { Timeline } from "@/components/status/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const refreshStates: RefreshState[] = [
  { kind: "idle" },
  { kind: "pending" },
  { kind: "recent", checkedAt: "2026-10-30T17:59:40Z" },
  { kind: "unchanged", since: "2026-10-02T15:30:00Z" },
  { kind: "changed", newEventId: "ev_4" },
  { kind: "error", code: "unavailable", lastSavedAt: "2026-10-30T14:14:00Z" },
];

const sections = [
  "foundations",
  "status",
  "banners",
  "empty",
  "cases",
  "add-case",
  "case-detail",
  "offline",
  "refresh",
  "share",
  "attorney",
  "insights",
  "settings",
  "assistant",
] as const;

/** Every presentational component rendered with sample data. English labels only: this is a dev tool. */
export function DesignGallery() {
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(sampleConversation);
  const [consent, setConsent] = useState<string | null>("2026-10-14T10:00:00Z");
  const [notify, setNotify] = useState(true);
  const now = sampleNow;

  return (
    <div className="flex flex-col gap-16">
      <PageHeader
        title="Design gallery"
        description="Dev-only. Every presentational component with sample data, so the data layer can be wired without guessing."
        actions={<LanguageSwitch />}
      />

      <nav aria-label="Sections" className="-mt-8 flex flex-wrap gap-2 text-sm">
        {sections.map((s) => (
          <a key={s} href={`#${s}`} className="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-muted hover:text-ink">
            {s}
          </a>
        ))}
      </nav>

      <Section id="foundations" title="Foundations">
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Logo">
            <div className="flex flex-wrap items-center gap-8">
              <Logo size="sm" />
              <Logo />
              <Logo size="lg" />
              <span className="rounded-lg bg-ink px-4 py-3">
                <Logo tone="onDark" />
              </span>
              <StampMark className="size-8 text-ink" />
            </div>
          </Card>
          <Card title="Type scale">
            <p className="text-display">Display 48</p>
            <p className="text-title">Title 28</p>
            <p className="text-heading">Heading 20</p>
            <p className="text-subheading">Subheading 16</p>
            <p className="text-md">Body 15 — Kinstamp keeps the full history of every case.</p>
            <p className="text-sm text-ink-muted">Small 14 muted</p>
            <p className="text-caps text-ink-muted">Caps label</p>
            <p className="font-mono text-sm tabular">EAC 999 910 3403</p>
          </Card>
          <Card title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Revoke</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
              <Button size="xs">Extra small</Button>
              <Button size="lg">Large</Button>
            </div>
          </Card>
          <Card title="Fields">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-input">Email</Label>
                <Input id="g-input" placeholder="you@example.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-invalid">Receipt number</Label>
                <Input id="g-invalid" defaultValue="EAC99" aria-invalid className="font-mono" />
                <p className="text-sm text-destructive">That doesn&apos;t look like a receipt number.</p>
              </div>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </Card>
          <Card title="Colors">
            <ul className="grid grid-cols-3 gap-3 text-xs sm:grid-cols-5">
              {[
                ["ink", "bg-ink"],
                ["canvas", "bg-canvas border"],
                ["line", "bg-line"],
                ["stamp", "bg-stamp"],
                ["stamp-ink", "bg-stamp-ink"],
                ["progress", "bg-status-progress"],
                ["action", "bg-status-action"],
                ["approved", "bg-status-approved"],
                ["denied", "bg-status-denied"],
                ["unknown", "bg-status-unknown"],
              ].map(([name, cls]) => (
                <li key={name} className="flex flex-col gap-1.5">
                  <span className={`block h-10 rounded-md ${cls}`} />
                  <span className="text-ink-muted">{name}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section id="status" title="Status, receipts, key dates">
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="StatusIndicator">
            <div className="flex flex-col gap-3">
              <StatusIndicator label="Case Was Received" category="received" />
              <StatusIndicator label="Request for Additional Evidence Was Sent" category="evidence_requested" />
              <StatusIndicator label="Case Was Approved" category="approved" />
              <StatusIndicator label="Case Was Denied" category="denied" />
              <StatusIndicator label="Waiting for the first check" category={null} />
              <StatusIndicator label="Card Was Delivered" category="card_delivered" size="lg" />
            </div>
          </Card>
          <Card title="ReceiptNumber">
            <div className="flex flex-col gap-3">
              <ReceiptNumber value="EAC9999103403" />
              <ReceiptNumber value="LIN9999106498" copyable />
              <ReceiptNumber value="src 9999 102 777" size="sm" copyable />
            </div>
          </Card>
          <Card title="KeyDateChip">
            <div className="flex flex-wrap gap-2">
              <KeyDateChip kind="due_date" date="2026-10-27" now={now} title="RFE response" />
              <KeyDateChip kind="appointment" date="2026-10-30" now={now} />
              <KeyDateChip kind="due_date" date="2026-11-03" now={now} title="RFE response due" />
              <KeyDateChip kind="appointment" date="2026-12-04" now={now} title="Biometrics" />
            </div>
          </Card>
          <Card title="Timeline">
            <Timeline events={sampleCaseDetail.events} highlightedEventId="ev_4" />
          </Card>
        </div>
      </Section>

      <Section id="banners" title="Banners">
        <div className="flex flex-col gap-3">
          <Banner
            variant="warning"
            title="USCIS is offline (Mon–Fri, 7am–8pm ET)."
            description="Showing the last saved status from Oct 30, 2:14 PM."
          />
          <Banner variant="info" title="We'll check this case automatically when USCIS is back." />
          <Banner
            variant="error"
            title="USCIS could not be reached."
            description="Showing the last saved status."
            action={
              <Button variant="outline" size="sm">
                Try again
              </Button>
            }
          />
        </div>
      </Section>

      <Section id="empty" title="Empty states">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState icon={BriefcaseIcon} title="No cases shared with you yet" description="Ask your clients to share a case using your email: ana@lawfirm.com" />
          <EmptyState size="inline" title="No matches" description="Try another name or receipt number." className="rounded-xl border border-line bg-surface" />
        </div>
      </Section>

      <Section id="cases" title="Client dashboard: case list">
        <CaseList cases={sampleTrackedCases} now={now} addCaseAction={<Button onClick={() => setAddOpen(true)}>Add a case</Button>} />
        <div className="mt-6">
          <CaseList cases={[]} now={now} addCaseAction={<Button onClick={() => setAddOpen(true)}>Add a case</Button>} />
        </div>
      </Section>

      <Section id="add-case" title="Add a case dialog">
        <AddCaseDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          trigger={<Button onClick={() => setAddOpen(true)}>Open “Add a case”</Button>}
          state={{ error: "notFound", values: { receiptNumber: "EAC9999103402" } }}
        />
        <p className="mt-3 text-sm text-ink-muted">Shown with a server error state (“not found”) and inline format validation on blur.</p>
      </Section>

      <Section id="case-detail" title="Case detail (client view)">
        <CaseDetailView
          detail={sampleCaseDetail}
          now={now}
          viewer="client"
          refresh={<RefreshButton state={{ kind: "changed", newEventId: "ev_4" }} now={now} />}
          shareTrigger={
            <Button variant="secondary" onClick={() => setShareOpen(true)}>
              Share with attorney
            </Button>
          }
          assistantTrigger={
            <Button variant="outline" onClick={() => setAssistantOpen(true)}>
              Ask about this case
            </Button>
          }
          addKeyDate={<AddKeyDateButton />}
          icsHref={(k) => `/api/key-dates/${k.id}.ics`}
          onDeleteKeyDate={() => undefined}
          onRevokeShare={() => undefined}
          highlightedEventId="ev_4"
        />
        <div className="mt-10">
          <CaseDetailView detail={sampleApprovedCase} now={now} viewer="attorney" refresh={<RefreshButton state={{ kind: "idle" }} now={now} />} addKeyDate={<AddKeyDateButton />} />
        </div>
      </Section>

      <Section id="offline" title="Case detail: USCIS offline">
        <CaseDetailView detail={sampleOfflineCase} now={now} viewer="client" refresh={<RefreshButton state={{ kind: "error", code: "unavailable", lastSavedAt: "2026-10-30T14:14:00Z" }} now={now} />} />
      </Section>

      <Section id="refresh" title="Refresh button states">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {refreshStates.map((state) => (
            <Card key={state.kind} title={state.kind}>
              <RefreshButton state={state} now={now} />
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <KeyDatesCard keyDates={[]} now={now} addAction={<AddKeyDateButton />} />
        </div>
      </Section>

      <Section id="share" title="Share with your attorney">
        <ShareDialog
          shares={sampleCaseDetail.shares}
          open={shareOpen}
          onOpenChange={setShareOpen}
          trigger={<Button variant="secondary" onClick={() => setShareOpen(true)}>Open share dialog</Button>}
          onRevoke={() => undefined}
          state={{ error: "ownEmail", values: { attorneyEmail: "me@example.com" } }}
        />
      </Section>

      <Section id="attorney" title="Attorney dashboard">
        <SharedCasesTable rows={sampleSharedCases} now={now} attorneyEmail="ana@lawfirm.com" />
        <div className="mt-6">
          <SharedCasesTable rows={[]} now={now} attorneyEmail="ana@lawfirm.com" />
        </div>
      </Section>

      <Section id="insights" title="Insights">
        <InsightsView insights={sampleInsights} ownCases={sampleOwnCases} now={now} />
      </Section>

      <Section id="settings" title="Settings sections">
        <div className="flex flex-col gap-10">
          <PrivacySection consentGrantedAt={consent} onConsentChange={(granted) => setConsent(granted ? now.toISOString() : null)} onDownloadData={() => undefined} />
          <NotificationsSection notifyOnChange={notify} onChange={setNotify} />
          <DangerSection deleteTrigger={<DeleteAccountDialog email="elena@example.com" />} />
        </div>
      </Section>

      <Section id="assistant" title="Ask about this case">
        <AssistantPanel
          caseLabel="Work permit"
          messages={messages}
          suggestions={sampleSuggestions}
          remaining={17}
          open={assistantOpen}
          onOpenChange={setAssistantOpen}
          trigger={<Button variant="outline" onClick={() => setAssistantOpen(true)}>Open assistant panel</Button>}
          onSend={(q) => setMessages((m) => [...m, { id: `u${m.length}`, role: "user", content: q }])}
        />
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-heading mb-5 border-b border-line pb-3 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <p className="text-caps mb-4 text-ink-muted">{title}</p>
      {children}
    </div>
  );
}
