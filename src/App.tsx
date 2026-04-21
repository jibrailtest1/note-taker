import { useEffect, useMemo, useState } from 'react'

type Note = {
  id: string
  title: string
  body: string
  updatedAt: string
}

const STORAGE_KEY = 'demo-note-taker-notes'

function createNoteId() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const seedNotes: Note[] = [
  {
    id: createNoteId(),
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
    if (!notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(notes[0]?.id ?? '')
    }
  }, [notes, selectedNoteId])

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null,
    [notes, selectedNoteId],
  )

  const createNote = () => {
    const newNote: Note = {
      id: createNoteId(),
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
          <button type="button" className="primary-button" onClick={createNote}>
            + New note
          </button>
        </div>

        <div className="notes-list">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              className={`note-card ${note.id === selectedNote?.id ? 'note-card--active' : ''}`}
              onClick={() => setSelectedNoteId(note.id)}
            >
              <div className="note-card__top">
                <strong>{note.title.trim() || 'Untitled note'}</strong>
                <span>{formatUpdatedAt(note.updatedAt)}</span>
              </div>
              <p>{note.body.trim() || 'No content yet.'}</p>
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
                  <p className="eyebrow">Selected note</p>
                  <h2>Edit your note</h2>
                </div>
                <button type="button" className="ghost-button danger-button" onClick={deleteNote}>
                  Delete note
                </button>
              </div>

              <label className="field">
                <span>Title</span>
                <input
                  id="note-title"
                  value={selectedNote.title}
                  onChange={(event) => updateNote({ title: event.target.value })}
                  placeholder="Give your note a title"
                />
              </label>

              <label className="field field--grow">
                <span>Body</span>
                <textarea
                  id="note-body"
                  value={selectedNote.body}
                  onChange={(event) => updateNote({ body: event.target.value })}
                  placeholder="Write anything you want to remember..."
                />
              </label>
            </>
          ) : (
            <div className="empty-state">
              <h2>No notes yet</h2>
              <p>Create your first note to get started.</p>
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
