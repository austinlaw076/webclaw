import { describe, expect, it } from 'vitest'
import {
  appendInsertionToPrompt,
  buildPromptInsertionFromBlocks,
} from './insert-to-prompt'
import type { BlockDocBlock } from './types'

function makeBlock(id: string, markdown: string): BlockDocBlock {
  return {
    id,
    type: 'richtext',
    data: { markdown },
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('buildPromptInsertionFromBlocks', function () {
  it('builds markdown payload from selected blocks preserving order', function () {
    const blocks = [makeBlock('a', 'Alpha'), makeBlock('b', 'Beta')]

    expect(
      buildPromptInsertionFromBlocks(blocks, {
        selectedBlockIds: ['b', 'a'],
      }),
    ).toBe('Alpha\n\nBeta')
  })

  it('returns empty string when selected ids are missing', function () {
    const blocks = [makeBlock('a', 'Alpha')]

    expect(
      buildPromptInsertionFromBlocks(blocks, {
        selectedBlockIds: ['x'],
      }),
    ).toBe('')
  })
})

describe('appendInsertionToPrompt', function () {
  it('appends insertion with safe newline spacing', function () {
    expect(appendInsertionToPrompt('Hello', 'World')).toBe('Hello\n\nWorld')
    expect(appendInsertionToPrompt('', 'World')).toBe('World')
    expect(appendInsertionToPrompt('Hello', '')).toBe('Hello')
  })

  it('preserves leading whitespace in insertion content', function () {
    expect(appendInsertionToPrompt('Hello', '  - nested item')).toBe(
      'Hello\n\n  - nested item',
    )
  })

  it('supports form block insertion updater behavior', function () {
    const insertion = buildPromptInsertionFromBlocks([
      {
        id: 'form-1',
        type: 'form',
        data: {
          schema: [{ id: 'name', label: 'Name', type: 'text' }],
          values: { name: 'Alice' },
        },
        createdAt: 1,
        updatedAt: 1,
      },
    ])

    expect(appendInsertionToPrompt('Prompt', insertion)).toBe(
      'Prompt\n\nName: Alice',
    )
  })
})
