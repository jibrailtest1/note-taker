import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App, { STORAGE_KEY } from './App'

describe('App', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with a ready-to-edit draft note and persists edits', async () => {
    const user = userEvent.setup()

    const { unmount } = render(<App />)

    expect(screen.getByRole('heading', { name: 'Notes', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Your first draft is ready — just add a title and notes.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open note 1' })).toBeInTheDocument()

    const titleInput = screen.getByLabelText('Title')
    const bodyInput = screen.getByLabelText('Body')

    await user.type(titleInput, 'Shopping list')
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

  it('requires confirmation before deleting an existing note', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')

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

    confirmSpy.mockReturnValueOnce(false)
    const { unmount } = render(<App />)

    await user.click(screen.getByRole('button', { name: 'Delete note' }))

    expect(confirmSpy).toHaveBeenCalledWith('Delete this note? This cannot be undone.')
    expect(screen.getByDisplayValue('Temporary note')).toBeInTheDocument()

    unmount()

    confirmSpy.mockReturnValueOnce(true)
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Delete note' }))

    expect(screen.queryByDisplayValue('Temporary note')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([])
  })
})
