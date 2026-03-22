import { describe, it, expect } from 'vitest'
import { midPosition } from '../src/lib/utils'

describe('midPosition', () => {
  it('returns midpoint between two positions', () => {
    expect(midPosition(1, 3)).toBe(2)
  })

  it('returns 1 when both are null', () => {
    expect(midPosition(null, null)).toBe(1)
  })

  it('returns value after last item when after is null', () => {
    const result = midPosition(5, null)
    expect(result).toBeGreaterThan(5)
  })

  it('returns value before first item when before is null', () => {
    const result = midPosition(null, 2)
    expect(result).toBeLessThan(2)
    expect(result).toBeGreaterThanOrEqual(0)
  })
})
