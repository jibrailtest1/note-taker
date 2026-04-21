import { useEffect, useMemo, useState } from 'react'

type Note = {
  id: string
  title: string
  body: string
  updatedAt: string
}

const STORAGE_KEY = 'demo-note-taker-notes'

const seedNotes: Note[] = [
  {
    id: crypto.randomUUID(),
    title: 'Welcome to Note Taker',
    body:
      'This demo app stores notes in your browser so they stay here after refresh. Create a new note, edit the title or body, and delete anything you do not need.',
    updatedAt: new Date().toISOString(),
  },
]

function loadNotes(): Note[] {
  const fallback = seedNotes

  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return fallback
    }

    const parsed = JSON.parse(saved) as Note[]
    return parsed.length > 0 ? parsed : fallback
  } catch {
    return fallback
  }
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [selectedNoteId, setSelectedNoteId] = useState<string>(() => loadNotes()[0]?.id ?? '')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    if (!notes.some((note) => note.id === selectedNoteId) && notes[0]) {
      setSelectedNoteId(notes[0].id)
    }
  }, [notes, selectedNoteId])

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null,
    [notes, selectedNoteId],
  )

  const createNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled note',
      body: '',
      updatedAt: new Date().toISOString(),
    }

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
    if (!selectedNote) {
      return
    }

    const confirmed = window.confirm(`Delete "${selectedNote.title}"?`)
    if (!confirmed) {
      return
    }

    setNotes((current) => current.filter((note) => note.id !== selectedNote.id))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__header">
          <div>
            <p className="eyebrow">Demo-ready notes</p>
            <h1>Note Taker</h1>
          </div>
          <button className="primary-button" onClick={createNote}>
            + New note
          </button>
        </div>

        <div className="note-list">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              className={`note-card ${note.id === selectedNote?.id ? 'note-card--active' : ''}`}
              onClick={() => setSelectedNoteId(note.id)}
            >
              <div className="note-card__title-row">
                <strong>{note.title.trim() || 'Untitled note'}</strong>
                <span>{formatUpdatedAt(note.updatedAt)}</span>
              </div>
              <p>{note.body.trim() || 'No content yet.'}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="editor-panel">
        {selectedNote ? (
          <>
            <div className="editor-panel__header">
              <div>
                <p className="eyebrow">Selected note</p>
                <h2>Edit your note</h2>
              </div>
              <button className="ghost-button" onClick={deleteNote}>
                Delete note
              </button>
            </div>

            <label className="field-label" htmlFor="note-title">
              Title
            </label>
            <input
              id="note-title"
              className="text-input"
              value={selectedNote.title}
              onChange={(event) => updateNote({ title: event.target.value })}
              placeholder="Give your note a title"
            />

            <label className="field-label" htmlFor="note-body">
              Body
            </label>
            <textarea
              id="note-body"
              className="text-area"
              value={selectedNote.body}
              onChange={(event) => updateNote({ body: event.target.value })}
              placeholder="Write anything you want to remember..."
            />
          </>
        ) : (
          <div className="empty-state">
            <h2>No notes yet</h2>
            <p>Create your first note to get started.</p>
            <button className="primary-button" onClick={createNote}>
              Create note
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
