import { Check, Pencil, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { deleteNote, putNote, type Note } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/format";

type Props = { notes: Note[]; onChanged: () => void };

function NoteRow({ note, onChanged }: { note: Note; onChanged: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(note.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [note.blob]);

  async function save() {
    await putNote({ ...note, title: title.trim() || note.title });
    setEditing(false);
    onChanged();
  }

  return (
    <li className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Note title"
            className="w-full rounded-xl bg-secondary px-3 py-2 text-sm text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
          />
        ) : (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{note.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(note.createdAt)} · {formatDuration(note.duration)}
            </p>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <button onClick={save} aria-label="Save title" className="rounded-full p-2 text-primary hover:bg-secondary">
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setTitle(note.title);
                  setEditing(false);
                }}
                aria-label="Cancel rename"
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                aria-label="Rename note"
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={async () => {
                  await deleteNote(note.id);
                  onChanged();
                }}
                aria-label="Delete note"
                className="rounded-full p-2 text-destructive hover:bg-secondary"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
      {url && <audio controls src={url} preload="metadata" className="mt-3 w-full" />}
    </li>
  );
}

export function NoteList({ notes, onChanged }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => notes.filter((n) => n.title.toLowerCase().includes(query.trim().toLowerCase())),
    [notes, query],
  );

  return (
    <section className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes"
          aria-label="Search notes"
          className="w-full rounded-2xl bg-card py-3 pl-11 pr-4 text-sm text-foreground ring-1 ring-border outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
          {notes.length === 0 ? "No notes yet. Record your first thought." : "No notes match that search."}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((n) => (
            <NoteRow key={n.id} note={n} onChanged={onChanged} />
          ))}
        </ul>
      )}
    </section>
  );
}
