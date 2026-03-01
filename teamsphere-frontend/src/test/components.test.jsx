import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'

describe('Avatar', () => {
  it('renders initials from name', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeDefined()
  })

  it('renders with different sizes', () => {
    const { container } = render(<Avatar name="Alice" size="lg" />)
    expect(container.firstChild.className).toContain('w-12')
  })
})

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No results"
        description="Try different filters."
      />
    )
    expect(screen.getByText('No results')).toBeDefined()
    expect(screen.getByText('Try different filters.')).toBeDefined()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState
        title="Empty"
        action={<button>Create</button>}
      />
    )
    expect(screen.getByText('Create')).toBeDefined()
  })
})

describe('Pagination', () => {
  it('does not render when totalPages is 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => { }} totalItems={5} limit={10} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders page buttons', () => {
    render(
      <Pagination page={2} totalPages={5} onPageChange={() => { }} totalItems={50} limit={10} />
    )
    expect(screen.getByText('2')).toBeDefined()
  })

  it('calls onPageChange when next is clicked', () => {
    const onChange = vi.fn()
    render(
      <Pagination page={1} totalPages={3} onPageChange={onChange} totalItems={30} limit={10} />
    )
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[buttons.length - 1])
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('disables prev button on first page', () => {
    render(
      <Pagination page={1} totalPages={3} onPageChange={() => { }} totalItems={30} limit={10} />
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[0].disabled).toBe(true)
  })
})
