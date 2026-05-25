import { describe, beforeEach, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App, { STORAGE_KEY } from './App'

describe('App', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('creates, edits, and persists a note', async () => {
    const user = userEvent.setup()

    const { unmount } = render(<App />)

    expect(screen.getByRole('heading', { name: 'Notes', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('No note selected')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Create note' })[0])

    const titleInput = screen.getByLabelText('Title')
    const bodyInput = screen.getByLabelText('Body')

    await user.clear(titleInput)
    await user.type(titleInput, 'Shopping list')
    await user.clear(bodyInput)
    await user.type(bodyInput, 'Milk, bread, apples')

    expect(screen.getByDisplayValue('Shopping list')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Milk, bread, apples')).toBeInTheDocument()

    const savedNotes = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<{
      title: string
      body: string
    }>

    expect(savedNotes).toHaveLength(1)
    expect(savedNotes[0]).toMatchObject({
      title: 'Shopping list',
      body: 'Milk, bread, apples',
    })

    unmount()
    render(<App />)

    expect(screen.getByDisplayValue('Shopping list')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Milk, bread, apples')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open note 1' })).toBeInTheDocument()
  })

  it('deletes an existing note', async () => {
    const user = userEvent.setup()

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'note-1',
          title: 'Temporary note',
          body: 'Delete me',
          updatedAt: '2026-05-25T07:56:00.000Z',
        },
      ]),
    )

    render(<App />)

    expect(screen.getByDisplayValue('Temporary note')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete note' }))

    expect(screen.getByText('No note selected')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Temporary note')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([])
  })
})
