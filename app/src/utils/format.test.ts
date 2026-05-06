import { describe, it, expect } from 'vitest'
import { formatCurrency } from './format'

describe('formatCurrency', () => {
  it('formats numbers as BRL by default', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50')
  })

  it('accepts string input', () => {
    expect(formatCurrency('10')).toBe('R$ 10,00')
  })

  it('returns null for invalid input', () => {
    expect(formatCurrency('abc')).toBeNull()
  })
})
