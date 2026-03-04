import { describe, expect, it } from 'vitest'

import {
  buildFormJsonExport,
  buildFormMarkdownExport,
  createDefaultFormBlock,
  resetFormValues,
  resolveFormBlock,
  withFormValue,
} from './form-actions'

describe('form block actions', function () {
  it('updates values by field id', function () {
    let block = createDefaultFormBlock()
    block = withFormValue(block, 'name', 'Alice')
    block = withFormValue(block, 'approved', true)

    expect(block.data.values.name).toBe('Alice')
    expect(block.data.values.approved).toBe(true)
  })

  it('resets values while preserving schema', function () {
    let block = createDefaultFormBlock()
    block = withFormValue(block, 'name', 'Alice')
    block = resetFormValues(block)

    expect(block.data.values).toEqual({})
    expect(block.data.schema.length).toBeGreaterThan(0)
  })

  it('exports markdown and json deterministically', function () {
    let block = createDefaultFormBlock()
    block = withFormValue(block, 'name', 'Alice')
    block = withFormValue(block, 'status', 'Ready')
    block = withFormValue(block, 'approved', true)

    expect(buildFormMarkdownExport(block.data)).toContain('Name: Alice')
    expect(buildFormMarkdownExport(block.data)).toContain('Status: Ready')
    expect(buildFormMarkdownExport(block.data)).toContain('Approved: true')

    expect(buildFormJsonExport(block.data)).toBe(
      '{\n  "name": "Alice",\n  "status": "Ready",\n  "approved": true\n}',
    )
  })

  it('resolves default block when none exists', function () {
    const block = resolveFormBlock([])
    expect(block.type).toBe('form')
  })
})
