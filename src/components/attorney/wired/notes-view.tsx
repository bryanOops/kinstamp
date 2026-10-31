"use client";

import { ChevronLeftIcon, NotebookTextIcon, PlusIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useId, useOptimistic, useRef, useState, useTransition, type KeyboardEvent, type RefObject } from "react";
import type { AttorneyNote } from "@/components/attorney/types";
import { EmptyState } from "@/components/status/empty-state";
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
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import { NOTE_MAX_LENGTH, parseNoteBody } from "@/lib/attorney/notes";
import { groupNotesByRecency, matchesNoteQuery, splitNote } from "@/lib/attorney/notes-view";
import { cn } from "@/lib/utils";
import { addAttorneyNote, deleteAttorneyNote, updateAttorneyNote } from "@/server/actions/attorney";
import { NoteError } from "./attorney-notes";

type NotesViewProps = {
  trackedCaseId: string;
  caseLabel: string;
  /** Newest first. */
  notes: AttorneyNote[];
  now: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Note to show first. `null` opens on the list on phones and on the newest note from `sm`. */
  initialNoteId: string | null;
};

type NoteChange = { type: "add"; note: AttorneyNote } | { type: "edit"; id: string; body: string; updatedAt: string } | { type: "delete"; id: string };

function applyNoteChange(current: AttorneyNote[], change: NoteChange): AttorneyNote[] {
  switch (change.type) {
    case "add":
      return [change.note, ...current];
    case "edit":
      return current.map((note) => (note.id === change.id ? { ...note, body: change.body, updatedAt: change.updatedAt } : note));
    case "delete":
      return current.filter((note) => note.id !== change.id);
  }
}

/**
 * Every note of the case, iPhone Notes style: a searchable list grouped by recency beside the
 * selected note in a plain editor that saves on blur and Ctrl/⌘+Enter. One centered dialog with two
 * panes from `sm`; a full-height sheet on phones where the list and the note are two pages.
 * State lives in the body and resets on each open.
 */
export function NotesView({ open, onOpenChange, ...body }: NotesViewProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={popupRef}
        showCloseButton={false}
        initialFocus={() => popupRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? true}
        className={cn(
          "flex h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 pb-0",
          "sm:h-[min(680px,calc(100dvh-4rem))] sm:max-w-[880px]",
        )}
      >
        <NotesViewBody {...body} />
      </DialogContent>
    </Dialog>
  );
}

type NotesViewBodyProps = Omit<NotesViewProps, "open" | "onOpenChange">;

function NotesViewBody({ trackedCaseId, caseLabel, notes, now, initialNoteId }: NotesViewBodyProps) {
  const t = useTranslations("attorney.notes");
  const isDesktop = useMediaQuery("(min-width: 40rem)");
  const [optimistic, apply] = useOptimistic(notes, applyNoteChange);
  const [, startTransition] = useTransition();
  const searchId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const pendingFocus = useRef<"list" | "editor" | null>(null);

  /** An unsaved new note, shown at the top of the list while it is being written. */
  const [draft, setDraft] = useState<AttorneyNote | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(() => initialNoteId ?? (isDesktop ? (notes[0]?.id ?? null) : null));
  const [focusedId, setFocusedId] = useState<string | null>(selectedId);
  /** The text of the selected note as it is being edited. */
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(() => {
    const note = notes.find((n) => n.id === selectedId);
    return note ? { id: note.id, body: note.body } : null;
  });
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [direction, setDirection] = useState<"forward" | "backward" | null>(null);

  // The draft keeps its id once saved, so it is dropped here the moment the optimistic row carries it.
  const all = draft && !optimistic.some((note) => note.id === draft.id) ? [draft, ...optimistic] : optimistic;
  const bodyOf = (note: AttorneyNote) => (editing?.id === note.id ? editing.body : note.body);
  const filtered = all.filter((note) => matchesNoteQuery(bodyOf(note), query));
  const groups = groupNotesByRecency(filtered, now);
  const flat = groups.flatMap((group) => group.notes);
  const selected = all.find((note) => note.id === selectedId) ?? null;
  const isDraft = (note: AttorneyNote | null) => note !== null && draft?.id === note.id;
  const tabStopId = flat.some((note) => note.id === focusedId) ? focusedId : (flat[0]?.id ?? null);

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target === "editor") editorRef.current?.focus();
    else listRef.current?.querySelector<HTMLElement>(`[data-note-id="${focusedId}"]`)?.focus();
  }, [focusedId, selectedId]);

  /** Saves the selected note if its text changed. An empty new note is left alone and dropped on leaving it. */
  function commit() {
    if (!editing || !selected || editing.id !== selected.id) return;
    const body = editing.body;
    const draftNote = isDraft(selected);
    if (!draftNote && body === selected.body) return;
    const parsed = parseNoteBody(body);
    if (!parsed.ok) {
      if (!(draftNote && parsed.error === "noteRequired")) setError(parsed.error);
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("body", body);
    const at = new Date().toISOString();
    // Outside the transition so the draft row leaves in the same paint the optimistic row arrives.
    if (draftNote) setDraft(null);
    startTransition(async () => {
      setSaveState("saving");
      if (draftNote) {
        formData.set("id", selected.id);
        apply({ type: "add", note: { ...selected, body: parsed.body, createdAt: at, updatedAt: at, pending: true } });
        const result = await addAttorneyNote(trackedCaseId, {}, formData);
        if (!result.ok) {
          setDraft(selected);
          setError(result.error ?? "somethingWentWrong");
          setSaveState("idle");
          return;
        }
      } else {
        apply({ type: "edit", id: selected.id, body: parsed.body, updatedAt: at });
        const result = await updateAttorneyNote(selected.id, {}, formData);
        if (!result.ok) {
          setError(result.error ?? "somethingWentWrong");
          setSaveState("idle");
          return;
        }
      }
      setSaveState("saved");
    });
  }

  /** Moves to another note (or back to the list with `null`), saving the current one first. */
  function select(id: string | null) {
    commit();
    if (draft && selectedId === draft.id && editing?.body.trim() === "") setDraft(null);
    if (id === selectedId) return;
    setDirection(id ? "forward" : "backward");
    setSelectedId(id);
    setFocusedId(id ?? focusedId);
    setError(null);
    setSaveState("idle");
    const note = id ? all.find((n) => n.id === id) : null;
    setEditing(note ? { id: note.id, body: note.body } : null);
  }

  function newNote() {
    commit();
    const at = new Date().toISOString();
    const id = crypto.randomUUID();
    setDraft({ id, body: "", createdAt: at, updatedAt: at });
    setQuery("");
    setDirection("forward");
    setSelectedId(id);
    setFocusedId(id);
    setEditing({ id, body: "" });
    setError(null);
    setSaveState("idle");
    pendingFocus.current = "editor";
  }

  function remove(id: string) {
    const index = flat.findIndex((note) => note.id === id);
    const next = flat[index + 1] ?? flat[index - 1] ?? null;
    const nextId = isDesktop ? (next?.id ?? null) : null;
    startTransition(async () => {
      apply({ type: "delete", id });
      setDirection(nextId ? "forward" : "backward");
      setSelectedId(nextId);
      setFocusedId(nextId);
      setEditing(next && nextId ? { id: next.id, body: next.body } : null);
      setError(null);
      setSaveState("idle");
      await deleteAttorneyNote(id);
    });
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const index = flat.findIndex((note) => note.id === (focusedId ?? selectedId));
    const moveTo = (position: number) => {
      const note = flat[Math.max(0, Math.min(flat.length - 1, position))];
      if (!note) return;
      event.preventDefault();
      pendingFocus.current = "list";
      setFocusedId(note.id);
      // From `sm` the editor follows the arrows; on phones Enter opens the note.
      if (isDesktop) select(note.id);
    };
    if (event.key === "ArrowDown") moveTo(index + 1);
    else if (event.key === "ArrowUp") moveTo(index - 1);
    else if (event.key === "Home") moveTo(0);
    else if (event.key === "End") moveTo(flat.length - 1);
    else if (event.key === "Enter" && focusedId) {
      event.preventDefault();
      select(focusedId);
      pendingFocus.current = isDesktop ? "editor" : null;
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <DialogHeader className="min-w-0 gap-0">
          <DialogTitle className="pr-0">{t("title")}</DialogTitle>
          <DialogDescription className="truncate">{caseLabel}</DialogDescription>
        </DialogHeader>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="sm" aria-label={t("view.new")} className="max-sm:w-11 max-sm:px-0" onClick={newNote}>
            <PlusIcon aria-hidden="true" />
            <span className="max-sm:sr-only">{t("view.new")}</span>
          </Button>
          <DialogClose render={<Button variant="ghost" size="icon-sm" className="text-ink-muted" aria-label={t("view.close")} />} onClick={commit}>
            <XIcon aria-hidden="true" />
          </DialogClose>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 sm:grid sm:grid-cols-[300px_minmax(0,1fr)]">
        {/* List pane: search, then the notes grouped by recency. Hidden on phones while a note is open. */}
        <section
          aria-label={t("view.list")}
          data-direction={direction ?? undefined}
          className={cn("notes-pane flex min-h-0 flex-1 flex-col sm:border-r sm:border-line sm:bg-canvas/60", selectedId && "max-sm:hidden")}
        >
          <div className="relative px-4 pt-4 pb-2 sm:px-3">
            <Label htmlFor={searchId} className="sr-only">
              {t("view.search")}
            </Label>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-7 mt-1 size-4 -translate-y-1/2 text-ink-muted sm:left-6" aria-hidden="true" />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && query) {
                  event.stopPropagation();
                  setQuery("");
                } else if (event.key === "ArrowDown" && flat.length > 0) {
                  event.preventDefault();
                  pendingFocus.current = "list";
                  setFocusedId(tabStopId);
                }
              }}
              placeholder={t("view.searchPlaceholder")}
              data-autofocus={selectedId ? undefined : true}
              className="h-11 pl-9 sm:h-9 [&::-webkit-search-cancel-button]:hidden"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-[max(--spacing(4),var(--safe-bottom))] sm:px-3 sm:pb-3">
            {all.length === 0 ? (
              <EmptyState
                size="inline"
                icon={NotebookTextIcon}
                title={t("view.empty.title")}
                description={t("view.empty.description")}
                action={
                  <Button variant="outline" size="sm" onClick={newNote}>
                    <PlusIcon aria-hidden="true" />
                    {t("view.new")}
                  </Button>
                }
              />
            ) : flat.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <p className="text-sm text-ink-muted">{t("view.noMatches", { query })}</p>
                <Button variant="ghost" size="xs" onClick={() => setQuery("")}>
                  {t("view.clearSearch")}
                </Button>
              </div>
            ) : (
              <ul ref={listRef} role="listbox" aria-label={t("view.list")} className="flex flex-col gap-1" onKeyDown={onListKeyDown}>
                {groups.map((group) => (
                  <li key={group.key} role="presentation" className="pt-3 first:pt-1">
                    <p id={`${searchId}-${group.key}`} className="px-2 pb-1.5 text-caps text-ink-muted">
                      {t(`view.groups.${group.key}`)}
                    </p>
                    <ul role="group" aria-labelledby={`${searchId}-${group.key}`} className="flex flex-col gap-0.5">
                      {group.notes.map((note) => (
                        <NoteListItem
                          key={note.id}
                          note={note}
                          body={bodyOf(note)}
                          now={now}
                          selected={note.id === selectedId}
                          tabStop={note.id === tabStopId}
                          onFocus={() => setFocusedId(note.id)}
                          onOpen={() => {
                            select(note.id);
                            if (isDesktop) pendingFocus.current = "editor";
                          }}
                        />
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Note pane: the selected note in a plain editor. Hidden on phones while the list is open. */}
        <section data-direction={direction ?? undefined} className={cn("notes-pane flex min-h-0 flex-1 flex-col", !selectedId && "max-sm:hidden")}>
          {selected && editing?.id === selected.id ? (
            <NoteEditor
              key={selected.id}
              ref={editorRef}
              note={selected}
              body={editing.body}
              isDraft={isDraft(selected)}
              now={now}
              autoFocus={isDesktop}
              error={error}
              saveState={saveState}
              onChange={(body) => {
                setEditing({ id: selected.id, body });
                setSaveState("idle");
                if (error) setError(null);
              }}
              onCommit={commit}
              onBack={() => select(null)}
              onDelete={() => remove(selected.id)}
              onDiscard={() => {
                setDraft(null);
                const first = optimistic[0];
                setSelectedId(isDesktop && first ? first.id : null);
                setEditing(isDesktop && first ? { id: first.id, body: first.body } : null);
                setDirection("backward");
              }}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center max-sm:hidden">
              <NotebookTextIcon className="size-6 text-ink-disabled" aria-hidden="true" />
              <p className="max-w-[32ch] text-sm text-ink-muted">{t("view.select")}</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

type NoteListItemProps = {
  note: AttorneyNote;
  /** The note's text, including unsaved edits. */
  body: string;
  now: Date;
  selected: boolean;
  /** The one option in the roving tab order. */
  tabStop: boolean;
  onFocus: () => void;
  onOpen: () => void;
};

function NoteListItem({ note, body, now, selected, tabStop, onFocus, onOpen }: NoteListItemProps) {
  const t = useTranslations("attorney.notes");
  const format = useFormatter();
  const { title, preview } = splitNote(body);
  return (
    <li
      role="option"
      aria-selected={selected}
      data-note-id={note.id}
      tabIndex={tabStop ? 0 : -1}
      onFocus={onFocus}
      onClick={onOpen}
      className={cn(
        "grid cursor-pointer grid-cols-1 gap-y-0.5 rounded-lg px-3 py-2.5 text-ink outline-none transition-colors duration-(--duration-fast) ease-(--ease-standard) hover:bg-canvas-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        // From `sm` the open note is filled black; on phones the list is a page of its own, so nothing is highlighted.
        selected && "sm:bg-ink sm:text-white sm:hover:bg-ink",
      )}
    >
      <span className="truncate text-md font-semibold">{title || t("view.untitled")}</span>
      <span className={cn("flex min-w-0 items-center gap-x-1.5 text-sm text-ink-muted", selected && "sm:text-white/70")}>
        <time dateTime={note.updatedAt} className="shrink-0 tabular">
          {format.relativeTime(new Date(note.updatedAt), now)}
        </time>
        <span aria-hidden="true">·</span>
        <span className="truncate">{preview || t("noAdditionalText")}</span>
      </span>
    </li>
  );
}

type NoteEditorProps = {
  ref: RefObject<HTMLTextAreaElement | null>;
  note: AttorneyNote;
  body: string;
  isDraft: boolean;
  now: Date;
  autoFocus: boolean;
  error: string | null;
  saveState: "idle" | "saving" | "saved";
  onChange: (body: string) => void;
  onCommit: () => void;
  onBack: () => void;
  onDelete: () => void;
  /** Drops an empty new note. */
  onDiscard: () => void;
};

/** A plain editor: toolbar (back on phones, when it was edited, delete) over a borderless textarea. Saves on blur and Ctrl/⌘+Enter. */
function NoteEditor({ ref, note, body, isDraft, now, autoFocus, error, saveState, onChange, onCommit, onBack, onDelete, onDiscard }: NoteEditorProps) {
  const t = useTranslations("attorney.notes");
  const format = useFormatter();
  const id = useId();
  const edited = Date.parse(note.updatedAt) - Date.parse(note.createdAt) > 1000;
  const status =
    saveState === "saving"
      ? t("saving")
      : saveState === "saved"
        ? t("view.saved")
        : isDraft
          ? t("view.new")
          : t(edited ? "view.edited" : "view.created", { time: format.relativeTime(new Date(edited ? note.updatedAt : note.createdAt), now) });

  return (
    <div className="flex min-h-0 flex-1 flex-col has-[textarea:focus-visible]:[--editor-rail:var(--color-stamp)]">
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-(--editor-rail,var(--color-line)) px-3 transition-colors duration-(--duration-fast) sm:min-h-12 sm:px-4">
        <Button variant="ghost" size="sm" className="-ml-1 text-ink sm:hidden" data-autofocus={autoFocus ? undefined : true} onClick={onBack}>
          <ChevronLeftIcon aria-hidden="true" />
          {t("view.back")}
        </Button>
        <p role="status" className="min-w-0 truncate text-sm text-ink-muted tabular sm:pl-1">
          {status}
        </p>
        {isDraft ? (
          <Button variant="ghost" size="icon-sm" className="text-ink-muted hover:text-ink" aria-label={t("cancel")} onClick={onDiscard}>
            <XIcon aria-hidden="true" />
          </Button>
        ) : (
          <DeleteNoteButton onConfirm={onDelete} />
        )}
      </div>
      <Label htmlFor={id} className="sr-only">
        {t("view.editorLabel")}
      </Label>
      <textarea
        ref={ref}
        id={id}
        value={body}
        maxLength={NOTE_MAX_LENGTH}
        placeholder={t("view.editorPlaceholder")}
        data-autofocus={autoFocus ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onCommit();
          } else if (event.key === "Escape") {
            onCommit();
          }
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-0 w-full flex-1 resize-none bg-transparent px-5 py-4 text-md leading-relaxed text-ink outline-none placeholder:text-ink-subtle sm:px-6 sm:py-5"
      />
      {error && (
        <div id={`${id}-error`} className="border-t border-line px-5 py-3 sm:px-6">
          <NoteError error={error} />
        </div>
      )}
    </div>
  );
}

function DeleteNoteButton({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations("attorney.notes");
  const [open, setOpen] = useState(false);
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
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {t("confirmDelete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
