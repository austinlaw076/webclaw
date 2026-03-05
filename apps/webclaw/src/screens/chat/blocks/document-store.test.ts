import { describe, expect, it } from 'vitest'
import {
  clearDoc,
  getOrCreateDoc,
  migrateDocSessionKey,
  removeBlock,
  reorderBlocks,
  upsertBlock,
} from './document-store'
import type { BlockDocumentsState } from './document-store'
import type { BlockDocBlock } from './types'

function makeState(): BlockDocumentsState {
  return { docsBySession: {} }
}

function makeRichtextBlock(id: string, markdown: string): BlockDocBlock {
  return {
    id,
    type: 'richtext',
    data: { markdown },
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('block document reducers', function () {
  it('creates doc lazily per session key', function () {
    const state = makeState()
    const doc = getOrCreateDoc(state, 'session-1')

    expect(doc.sessionKey).toBe('session-1')
    expect(doc.blocks).toEqual([])
    expect(state.docsBySession['session-1']).toBeDefined()
  })

  it('upserts blocks and replaces by id', function () {
    let state = makeState()
    state = upsertBlock(state, 'session-1', makeRichtextBlock('a', 'First'))
    state = upsertBlock(state, 'session-1', makeRichtextBlock('a', 'Second'))

    expect(state.docsBySession['session-1']?.blocks).toHaveLength(1)
    expect(state.docsBySession['session-1']?.blocks[0]).toMatchObject({
      id: 'a',
      data: { markdown: 'Second' },
    })
  })

  it('removes block and reorders by index', function () {
    let state = makeState()
    state = upsertBlock(state, 's', makeRichtextBlock('a', 'A'))
    state = upsertBlock(state, 's', makeRichtextBlock('b', 'B'))
    state = upsertBlock(state, 's', makeRichtextBlock('c', 'C'))

    state = removeBlock(state, 's', 'b')
    expect(state.docsBySession.s?.blocks.map((block) => block.id)).toEqual([
      'a',
      'c',
    ])

    state = reorderBlocks(state, 's', 1, 0)
    expect(state.docsBySession.s?.blocks.map((block) => block.id)).toEqual([
      'c',
      'a',
    ])
  })

  it('clears the whole document for one session', function () {
    let state = makeState()
    state = upsertBlock(state, 's', makeRichtextBlock('a', 'A'))

    state = clearDoc(state, 's')

    expect(state.docsBySession.s).toBeUndefined()
  })

  it('migrates one doc to a canonical session key', function () {
    let state = makeState()
    state = upsertBlock(state, 'draft-key', makeRichtextBlock('a', 'A'))

    state = migrateDocSessionKey(state, 'draft-key', 'session-key')

    expect(state.docsBySession['draft-key']).toBeUndefined()
    expect(
      state.docsBySession['session-key']?.blocks.map((block) => block.id),
    ).toEqual(['a'])
  })

  it('merges blocks during migration and keeps newer content', function () {
    let state = makeState()
    state = upsertBlock(state, 'from-key', {
      ...makeRichtextBlock('shared', 'old'),
      updatedAt: 100,
    })
    state = upsertBlock(state, 'to-key', {
      ...makeRichtextBlock('shared', 'new'),
      updatedAt: 200,
    })
    state = upsertBlock(
      state,
      'from-key',
      makeRichtextBlock('source-only', 'S'),
    )

    state = migrateDocSessionKey(state, 'from-key', 'to-key')

    expect(
      state.docsBySession['to-key']?.blocks.find(
        (block) => block.id === 'shared',
      )?.data,
    ).toEqual({ markdown: 'new' })
    expect(
      state.docsBySession['to-key']?.blocks.find(
        (block) => block.id === 'source-only',
      )?.data,
    ).toEqual({ markdown: 'S' })
  })
})
