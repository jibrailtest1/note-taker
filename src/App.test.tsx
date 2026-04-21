import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

function getStoredNotes() {
  return JSON.parse(window.localStorage.getItem('demo-note-taker-notes') ?? '[]') as Array<{
    title: string
    body: string
  }>
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('shows a list of notes on the homepage', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Note Taker' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /welcome to note taker/i })).toBeInTheDocument()
  })

  it('creates, edits, and deletes notes with persistence', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: /new note/i })[0])

    const [titleInput, bodyInput] = screen.getAllByRole('textbox')

    await user.clear(titleInput)
    await user.type(titleInput, 'Sprint demo note')
    await user.type(bodyInput, 'Ready to show the note-taking flow.')

    expect(screen.getByRole('button', { name: /sprint demo note/i })).toBeInTheDocument()

    const storedAfterEdit = getStoredNotes()
    expect(storedAfterEdit[0]?.title).toBe('Sprint demo note')
    expect(storedAfterEdit[0]?.body).toContain('Ready to show the note-taking flow.')

    await user.click(screen.getAllByRole('button', { name: /delete note/i })[0])

    expect(screen.queryByRole('button', { name: /sprint demo note/i })).not.toBeInTheDocument()
    expect(getStoredNotes().some((note) => note.title === 'Sprint demo note')).toBe(false)
  })
})
