import { describe, expect, it } from 'vitest'
import { serializeBlockToMarkdown, serializeBlocksToMarkdown } from './markdown-serializer'
import type { BlockDocBlock } from './types'

describe('serializeBlockToMarkdown', function () {
  it('serializes richtext block content as markdown text', function () {
    const block: BlockDocBlock = {
      id: 'b1',
      type: 'richtext',
      data: { markdown: '## Title\n\nHello **world**' },
      createdAt: 1,
      updatedAt: 1,
    }

    expect(serializeBlockToMarkdown(block)).toBe('## Title\n\nHello **world**')
  })

  it('serializes todo block into markdown check list', function () {
    const block: BlockDocBlock = {
      id: 'b2',
      type: 'todo',
      data: {
        items: [
          { id: 't1', text: 'First', checked: false },
          { id: 't2', text: 'Second', checked: true },
        ],
      },
      createdAt: 1,
      updatedAt: 1,
    }

    expect(serializeBlockToMarkdown(block)).toBe('- [ ] First\n- [x] Second')
  })

  it('serializes table block to markdown table syntax', function () {
    const block: BlockDocBlock = {
      id: 'b3',
      type: 'table',
      data: {
        columns: ['Name', 'Score'],
        rows: [
          ['Alice', '10'],
          ['Bob', '8'],
        ],
      },
      createdAt: 1,
      updatedAt: 1,
    }

    expect(serializeBlockToMarkdown(block)).toBe(
      '| Name | Score |\n| --- | --- |\n| Alice | 10 |\n| Bob | 8 |',
    )
  })

  it('serializes callout block using admonition-style quote', function () {
    const block: BlockDocBlock = {
      id: 'b4',
      type: 'callout',
      data: {
        variant: 'warning',
        markdown: 'Watch this\nNow',
      },
      createdAt: 1,
      updatedAt: 1,
    }

    expect(serializeBlockToMarkdown(block)).toBe('> [!WARNING]\n> Watch this\n> Now')
  })

  it('serializes code block to fenced code', function () {
    const block: BlockDocBlock = {
      id: 'b5',
      type: 'code',
      data: {
        language: 'ts',
        code: 'const a = 1',
      },
      createdAt: 1,
      updatedAt: 1,
    }

    expect(serializeBlockToMarkdown(block)).toBe('```ts\nconst a = 1\n```')
  })

  it('uses a longer fence when code contains triple backticks', function () {
    const block: BlockDocBlock = {
      id: 'b6',
      type: 'code',
      data: {
        language: 'md',
        code: 'before\n```json\n{"a":1}\n```\nafter',
      },
      createdAt: 1,
      updatedAt: 1,
    }

    expect(serializeBlockToMarkdown(block)).toBe(
      '````md\nbefore\n```json\n{"a":1}\n```\nafter\n````',
    )
  })
})

describe('serializeBlocksToMarkdown', function () {
  it('joins serialized blocks with blank line separators', function () {
    const blocks: Array<BlockDocBlock> = [
      {
        id: 'rich',
        type: 'richtext',
        data: { markdown: 'Hello' },
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'todo',
        type: 'todo',
        data: { items: [{ id: '1', text: 'Task', checked: false }] },
        createdAt: 1,
        updatedAt: 1,
      },
    ]

    expect(serializeBlocksToMarkdown(blocks)).toBe('Hello\n\n- [ ] Task')
  })
})
