"use client";

import { LockIcon, NotebookTextIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useId, useOptimistic, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import type { AttorneyNote } from "@/components/attorney/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAutoGrowTextarea } from "@/hooks/use-auto-grow-textarea";
import { NOTE_MAX_LENGTH, parseNoteBody } from "@/lib/attorney/notes";
import { NOTES_PREVIEW, splitNote } from "@/lib/attorney/notes-view";
import { addAttorneyNote, type NoteState } from "@/server/actions/attorney";
import { NotesView } from "./notes-view";

type AttorneyNotesProps = {
  trackedCaseId: string;
  /** Case nickname or receipt, shown under the title of the notes view. */
  caseLabel: string;
  /** Newest first, as the server returns them. */
  notes: AttorneyNote[];
  now: Date;
};

/**
 * "My notes" on the attorney case detail: the privacy line, a one-line composer that grows while
 * typing, the three most recent notes as compact rows and "See all notes" for the rest. The card
 * never grows past three rows: a new note folds in at the top while the fourth row folds away.
 */
export function AttorneyNotes({ trackedCaseId, caseLabel, notes, now }: AttorneyNotesProps) {
  const t = useTranslations("attorney.notes");
  const [optimisticNotes, addOptimisticNote] = useOptimistic(notes, (current, note: AttorneyNote) => [note, ...current]);
  const [view, setView] = useState<{ open: boolean; noteId: string | null }>({ open: false, noteId: null });

  const count = optimisticNotes.length;
  // While a note is being saved the fourth row stays mounted so it can animate out.
  const inserting = optimisticNotes.some((note) => note.pending);
  const visible = optimisticNotes.slice(0, NOTES_PREVIEW + (inserting ? 1 : 0));
  const openView = (noteId: string | null) => setView({ open: true, noteId });

  return (
    <Card data-tour="attorney-notes">
      <CardHeader>
        <CardTitle className="flex items-baseline gap-2">
          {t("title")}
          {count > 0 && (
            <span className="text-sm font-normal text-ink-muted tabular">
              <span aria-hidden="true">{count}</span>
              <span className="sr-only">{t("count", { count })}</span>
            </span>
          )}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <LockIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {t("privacy")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <NoteComposer trackedCaseId={trackedCaseId} onAdd={addOptimisticNote} />
        {count === 0 ? (
          <p className="text-sm text-ink-muted">{t("empty")}</p>
        ) : (
          <ul className="-mx-(--card-spacing) border-t border-line">
            {visible.map((note, index) => (
              <NotePreviewRow key={note.id} note={note} now={now} leaving={index >= NOTES_PREVIEW} onOpen={() => openView(note.id)} />
            ))}
          </ul>
        )}
      </CardContent>

      {count > NOTES_PREVIEW && (
        <CardFooter className="p-0">
          <Button variant="ghost" className="h-12 w-full rounded-t-none rounded-b-xl text-ink-muted hover:text-ink" onClick={() => openView(null)}>
            <NotebookTextIcon aria-hidden="true" />
            {t("seeAll", { count })}
          </Button>
        </CardFooter>
      )}

      <NotesView
        trackedCaseId={trackedCaseId}
        caseLabel={caseLabel}
        notes={optimisticNotes}
        now={now}
        open={view.open}
        initialNoteId={view.noteId}
        onOpenChange={(open) => setView((current) => ({ ...current, open }))}
      />
    </Card>
  );
}

/**
 * One line that grows to four while typing. Enter adds a line; Ctrl/⌘+Enter or "Save" saves. The
 * draft clears at once and comes back if saving fails.
 */
function NoteComposer({ trackedCaseId, onAdd }: { trackedCaseId: string; onAdd: (note: AttorneyNote) => void }) {
  const t = useTranslations("attorney.notes");
  const id = useId();
  const [draft, setDraft] = useState("");
  const ref = useAutoGrowTextarea(draft, 4);
  const [state, dispatch, pending] = useActionState<NoteState, FormData>(async (prev, formData) => {
    const parsed = parseNoteBody(formData.get("body"));
    if (!parsed.ok) return { error: parsed.error };
    const at = new Date().toISOString();
    // The id is minted here so the optimistic row and the saved note are one and the same.
    const noteId = crypto.randomUUID();
    formData.set("id", noteId);
    onAdd({ id: noteId, body: parsed.body, createdAt: at, updatedAt: at, pending: true });
    setDraft("");
    const next = await addAttorneyNote(trackedCaseId, prev, formData);
    if (!next.ok) setDraft(parsed.body);
    return next;
  }, {});
  const [, startTransition] = useTransition();
  const hasText = draft.trim() !== "";

  return (
    <form onSubmit={(event) => submitWith(event, (data) => startTransition(() => dispatch(data)))} className="flex flex-col gap-2" noValidate>
      <Label htmlFor={id} className="sr-only">
        {t("label")}
      </Label>
      <Textarea
        ref={ref}
        id={id}
        name="body"
        rows={1}
        maxLength={NOTE_MAX_LENGTH}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={submitOnModEnter}
        placeholder={t("placeholder")}
        aria-describedby={hasText ? `${id}-hint` : undefined}
        aria-invalid={state.error ? true : undefined}
        className="min-h-11 resize-none py-[9px] leading-6"
      />
      <NoteError error={state.error} />
      {(hasText || pending) && (
        <div className="note-reveal flex items-center justify-between gap-3">
          <p id={`${id}-hint`} className="text-xs text-ink-muted">
            {draft.length > NOTE_MAX_LENGTH - 200 ? t("remaining", { count: NOTE_MAX_LENGTH - draft.length }) : t("shortcut")}
          </p>
          <Button type="submit" size="sm" disabled={pending || !hasText} aria-busy={pending || undefined}>
            {pending ? t("saving") : t("save")}
          </Button>
        </div>
      )}
    </form>
  );
}

type NotePreviewRowProps = {
  note: AttorneyNote;
  now: Date;
  /** The row pushed past the preview by a new note: it folds away while the new one folds in. */
  leaving: boolean;
  onOpen: () => void;
};

/** Title (first line), then the relative time and the rest of the note on one muted line. Opens the note. */
function NotePreviewRow({ note, now, leaving, onOpen }: NotePreviewRowProps) {
  const t = useTranslations("attorney.notes");
  const format = useFormatter();
  const { title, preview } = splitNote(note.body);

  return (
    <li className="note-row border-b border-line last:border-b-0" data-inserted={note.pending || undefined} data-leaving={leaving || undefined} aria-hidden={leaving || undefined}>
      <button
        type="button"
        onClick={onOpen}
        disabled={note.pending || leaving}
        tabIndex={leaving ? -1 : undefined}
        className="grid w-full grid-cols-1 gap-y-0.5 px-(--card-spacing) py-3 text-left outline-none transition-colors duration-(--duration-fast) ease-(--ease-standard) hover:bg-canvas focus-visible:bg-canvas focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span className="truncate text-md font-semibold text-ink">{title || t("view.untitled")}</span>
        <span className="flex min-w-0 items-center gap-x-1.5 text-sm text-ink-muted">
          {note.pending ? (
            <span className="shrink-0">{t("saving")}</span>
          ) : (
            <time dateTime={note.createdAt} className="shrink-0 tabular" title={format.dateTime(new Date(note.createdAt), { dateStyle: "medium", timeStyle: "short" })}>
              {format.relativeTime(new Date(note.createdAt), now)}
            </time>
          )}
          <span aria-hidden="true">·</span>
          <span className="truncate">{preview || t("noAdditionalText")}</span>
        </span>
      </button>
    </li>
  );
}

export function NoteError({ error }: { error?: string | null }) {
  const t = useTranslations("attorney.notes.errors");
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {t.has(error) ? t(error) : t("somethingWentWrong")}
    </p>
  );
}

/**
 * Submits through the action without `<form action>`: React resets a form after a form action,
 * which would wipe the text the attorney typed when saving fails.
 */
function submitWith(event: FormEvent<HTMLFormElement>, run: (data: FormData) => void) {
  event.preventDefault();
  run(new FormData(event.currentTarget));
}

function submitOnModEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
}
