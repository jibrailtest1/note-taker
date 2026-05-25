import { useEffect, useMemo, useState } from 'react'

type Note = {
  id: string
  title: string
  body: string
  updatedAt: string
}

export const STORAGE_KEY = 'demo-note-taker-notes'

function createNoteId() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createEmptyNote(): Note {
  return {
    id: createNoteId(),
    title: '',
    body: '',
    updatedAt: new Date().toISOString(),
  }
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.body === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

function loadNotes(): Note[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return []
    }

    const parsed = JSON.parse(saved) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isNote)
  } catch {
    return []
  }
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = loadNotes()
    return savedNotes.length > 0 ? savedNotes : [createEmptyNote()]
  })
  const [selectedNoteId, setSelectedNoteId] = useState<string>(() => loadNotes()[0]?.id ?? '')

  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0].id)
    }
  }, [notes, selectedNoteId])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    if (!notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(notes[0]?.id ?? '')
    }
  }, [notes, selectedNoteId])

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null,
    [notes, selectedNoteId],
  )

  const createNote = () => {
    const newNote = createEmptyNote()
    setNotes((current) => [newNote, ...current])
    setSelectedNoteId(newNote.id)
  }

  const updateNote = (patch: Partial<Pick<Note, 'title' | 'body'>>) => {
    if (!selectedNote) {
      return
    }

    setNotes((current) =>
      current
        .map((note) =>
          note.id === selectedNote.id
            ? {
                ...note,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : note,
        )
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    )
  }

  const deleteNote = () => {
    if (!selectedNote || !window.confirm('Delete this note? This cannot be undone.')) {
      return
    }

    setNotes((current) => current.filter((note) => note.id !== selectedNote.id))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__header">
          <h1>Notes</h1>
          <button type="button" className="primary-button" onClick={createNote}>
            Create note
          </button>
        </div>

        <div className="notes-list" aria-label="Notes list">
          {notes.map((note, index) => (
            <button
              key={note.id}
              type="button"
              className={`note-card ${note.id === selectedNote?.id ? 'note-card--active' : ''}`}
              onClick={() => setSelectedNoteId(note.id)}
              aria-label={`Open note ${index + 1}`}
            >
              <div className="note-card__top">
                <strong>{note.title.trim() || 'Untitled note'}</strong>
                <span>{formatUpdatedAt(note.updatedAt)}</span>
              </div>
              <p>{note.body.trim() || 'Start typing to capture your note.'}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="editor-panel">
        <section className={`editor-card ${selectedNote ? '' : 'editor-card--empty'}`}>
          {selectedNote ? (
            <>
              <div className="editor-card__header">
                <div>
                  <h2>Edit note</h2>
                  <p className="editor-card__hint">Your first draft is ready — just add a title and notes.</p>
                </div>
                <button type="button" className="ghost-button danger-button" onClick={deleteNote}>
                  Delete note
                </button>
              </div>

              <label className="field" htmlFor="note-title">
                <span>Title</span>
                <input
                  id="note-title"
                  value={selectedNote.title}
                  onChange={(event) => updateNote({ title: event.target.value })}
                  placeholder="Note title"
                />
              </label>

              <label className="field field--grow" htmlFor="note-body">
                <span>Body</span>
                <textarea
                  id="note-body"
                  value={selectedNote.body}
                  onChange={(event) => updateNote({ body: event.target.value })}
                  placeholder="Write your note..."
                />
              </label>
            </>
          ) : (
            <div className="empty-state">
              <h2>No note selected</h2>
              <p>Create a note to get started.</p>
              <button type="button" className="primary-button" onClick={createNote}>
                Create note
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
