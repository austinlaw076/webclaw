import { describe, expect, it } from 'vitest'
import { normalizeHistoryLimit } from './history'

describe('normalizeHistoryLimit', function () {
  it('uses default when limit is missing or invalid', function () {
    expect(normalizeHistoryLimit(null)).toBe(200)
    expect(normalizeHistoryLimit('abc')).toBe(200)
  })

  it('clamps lower bound and upper bound', function () {
    expect(normalizeHistoryLimit('-10')).toBe(1)
    expect(normalizeHistoryLimit('0')).toBe(1)
    expect(normalizeHistoryLimit('100000')).toBe(500)
  })

  it('truncates finite decimal values', function () {
    expect(normalizeHistoryLimit('12.9')).toBe(12)
  })
})
