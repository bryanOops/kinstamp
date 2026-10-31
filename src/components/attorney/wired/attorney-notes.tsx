"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useId, useOptimistic, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NOTE_MAX_LENGTH, parseNoteBody } from "@/lib/attorney/notes";
import { addAttorneyNote, deleteAttorneyNote, updateAttorneyNote, type NoteState } from "@/server/actions/attorney";

export type AttorneyNote = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  /** Shown before the server confirms it (optimistic add). */
  pending?: boolean;
};

type AttorneyNotesProps = {
  trackedCaseId: string;
  /** Newest first, as the server returns them. */
  notes: AttorneyNote[];
  now: Date;
};

/** Composer plus the list of the attorney's private notes. A new note appears at once and the server confirms it. */
export function AttorneyNotes({ trackedCaseId, notes, now }: AttorneyNotesProps) {
  const t = useTranslations("attorney.notes");
  const [optimisticNotes, addOptimisticNote] = useOptimistic(notes, (current, note: AttorneyNote) => [note, ...current]);

  return (
    <div className="flex flex-col gap-5">
      <NoteComposer trackedCaseId={trackedCaseId} onAdd={addOptimisticNote} />
      {optimisticNotes.length === 0 ? (
        <p className="text-md text-ink-muted">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {optimisticNotes.map((note) => (
            <NoteItem key={note.id} note={note} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Saves on the button or on Ctrl/⌘+Enter. Keeps the draft when saving fails. */
function NoteComposer({ trackedCaseId, onAdd }: { trackedCaseId: string; onAdd: (note: AttorneyNote) => void }) {
  const t = useTranslations("attorney.notes");
  const id = useId();
  const [draft, setDraft] = useState("");
  const [state, dispatch, pending] = useActionState<NoteState, FormData>(async (prev, formData) => {
    const parsed = parseNoteBody(formData.get("body"));
    if (!parsed.ok) return { error: parsed.error };
    const at = new Date().toISOString();
    onAdd({ id: `pending-${at}`, body: parsed.body, createdAt: at, updatedAt: at, pending: true });
    const next = await addAttorneyNote(trackedCaseId, prev, formData);
    if (next.ok) setDraft("");
    return next;
  }, {});
  const [, startTransition] = useTransition();

  return (
    <form onSubmit={(event) => submitWith(event, (data) => startTransition(() => dispatch(data)))} className="flex flex-col gap-2" noValidate>
      <Label htmlFor={id} className="sr-only">
        {t("label")}
      </Label>
      <Textarea
        id={id}
        name="body"
        rows={3}
        maxLength={NOTE_MAX_LENGTH}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={submitOnModEnter}
        placeholder={t("placeholder")}
        aria-describedby={`${id}-hint`}
        aria-invalid={state.error ? true : undefined}
      />
      <NoteError error={state.error} />
      <div className="flex items-center justify-between gap-3">
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {draft.length > NOTE_MAX_LENGTH - 200 ? t("remaining", { count: NOTE_MAX_LENGTH - draft.length }) : t("shortcut")}
        </p>
        <Button type="submit" size="sm" disabled={pending || draft.trim() === ""} aria-busy={pending || undefined}>
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

function NoteItem({ note, now }: { note: AttorneyNote; now: Date }) {
  const t = useTranslations("attorney.notes");
  const format = useFormatter();
  const [editing, setEditing] = useState(false);
  // Edits under a second after creation are the insert itself, not an edit.
  const edited = Date.parse(note.updatedAt) - Date.parse(note.createdAt) > 1000;

  return (
    <li className="py-4" aria-busy={note.pending || undefined}>
      {editing ? (
        <NoteEditor note={note} onDone={() => setEditing(false)} />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
          <p className="text-md break-words whitespace-pre-wrap text-ink">{note.body}</p>
          {!note.pending && (
            <div className="-mt-1.5 -mr-2 flex items-center sm:-mt-1">
              <Button variant="ghost" size="icon-sm" className="text-ink-muted hover:text-ink" onClick={() => setEditing(true)} aria-label={t("edit")}>
                <PencilIcon aria-hidden="true" />
              </Button>
              <DeleteNoteButton noteId={note.id} />
            </div>
          )}
          <p className="col-span-2 mt-1.5 text-sm text-ink-muted">
            {note.pending ? (
              t("saving")
            ) : (
              <time dateTime={note.createdAt} title={format.dateTime(new Date(note.createdAt), { dateStyle: "medium", timeStyle: "short" })}>
                {format.relativeTime(new Date(note.createdAt), now)}
                {edited && ` · ${t("edited")}`}
              </time>
            )}
          </p>
        </div>
      )}
    </li>
  );
}

/** Inline edit: Ctrl/⌘+Enter saves, Esc cancels. */
function NoteEditor({ note, onDone }: { note: AttorneyNote; onDone: () => void }) {
  const t = useTranslations("attorney.notes");
  const id = useId();
  const [state, dispatch, pending] = useActionState<NoteState, FormData>(async (prev, formData) => {
    const next = await updateAttorneyNote(note.id, prev, formData);
    if (next.ok) onDone();
    return next;
  }, {});
  const [, startTransition] = useTransition();

  return (
    <form onSubmit={(event) => submitWith(event, (data) => startTransition(() => dispatch(data)))} className="flex flex-col gap-2" noValidate>
      <Label htmlFor={id} className="sr-only">
        {t("editLabel")}
      </Label>
      <Textarea
        id={id}
        name="body"
        rows={3}
        maxLength={NOTE_MAX_LENGTH}
        defaultValue={note.body}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Escape") onDone();
          else submitOnModEnter(event);
        }}
        aria-invalid={state.error ? true : undefined}
      />
      <NoteError error={state.error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={pending} aria-busy={pending || undefined}>
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

function DeleteNoteButton({ noteId }: { noteId: string }) {
  const t = useTranslations("attorney.notes");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button variant="ghost" size="icon-sm" className="text-ink-muted hover:text-destructive" onClick={() => setOpen(true)} aria-label={t("delete")}>
        <Trash2Icon aria-hidden="true" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="rounded-2xl p-6 shadow-overlay sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-heading">{t("confirmDelete.title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-ink-muted">{t("confirmDelete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">{t("confirmDelete.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => deleteAttorneyNote(noteId))}>
              {pending ? t("confirmDelete.pending") : t("confirmDelete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NoteError({ error }: { error?: string }) {
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
