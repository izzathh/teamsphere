import { describe, it, expect } from 'vitest'
import {
  formatDate,
  isOverdue,
  getInitials,
  extractError,
  cn,
} from '../utils/helpers'

describe('helpers', () => {
  describe('formatDate', () => {
    it('returns — for null/undefined', () => {
      expect(formatDate(null)).toBe('—')
      expect(formatDate(undefined)).toBe('—')
    })

    it('formats ISO string correctly', () => {
      const result = formatDate('2024-06-15T00:00:00.000Z')
      expect(result).toMatch(/Jun 15, 2024/)
    })
  })

  describe('isOverdue', () => {
    it('returns false for null dueDate', () => {
      expect(isOverdue(null)).toBe(false)
    })

    it('returns true for past date', () => {
      expect(isOverdue('2020-01-01')).toBe(true)
    })

    it('returns false for future date', () => {
      const future = new Date()
      future.setFullYear(future.getFullYear() + 1)
      expect(isOverdue(future.toISOString())).toBe(false)
    })
  })

  describe('getInitials', () => {
    it('returns first letters of name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('handles single word', () => {
      expect(getInitials('Alice')).toBe('AL')
    })

    it('caps at 2 chars', () => {
      expect(getInitials('A B C D')).toBe('AB')
    })

    it('handles empty string', () => {
      expect(getInitials('')).toBe('')
    })
  })

  describe('extractError', () => {
    it('extracts message from axios error', () => {
      const err = { response: { data: { message: 'Unauthorized' } } }
      expect(extractError(err)).toBe('Unauthorized')
    })

    it('falls back to err.message', () => {
      const err = { message: 'Network Error' }
      expect(extractError(err)).toBe('Network Error')
    })

    it('returns fallback for empty error', () => {
      expect(extractError({})).toBe('Something went wrong')
    })
  })

  describe('cn', () => {
    it('joins class names', () => {
      expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
    })

    it('filters falsy values', () => {
      expect(cn('a', null, undefined, false, 'b')).toBe('a b')
    })
  })
})
