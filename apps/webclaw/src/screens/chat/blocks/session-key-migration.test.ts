import { describe, expect, it } from 'vitest'

import {
  NEW_CHAT_DRAFT_KEY_PREFIX,
  createNewChatDraftSessionKey,
  resolveBlockPersistenceSessionKey,
  resolveSafeBlockMigrations,
} from './session-key-migration'

describe('createNewChatDraftSessionKey', function () {
  it('creates unique prefixed draft keys', function () {
    const keyA = createNewChatDraftSessionKey(() => 'a')
    const keyB = createNewChatDraftSessionKey(() => 'b')

    expect(keyA).toBe(`${NEW_CHAT_DRAFT_KEY_PREFIX}a`)
    expect(keyB).toBe(`${NEW_CHAT_DRAFT_KEY_PREFIX}b`)
    expect(keyA).not.toBe(keyB)
  })
})

describe('resolveBlockPersistenceSessionKey', function () {
  it('uses draft key for /new and canonical key for existing chats', function () {
    expect(
      resolveBlockPersistenceSessionKey({
        isNewChat: true,
        draftSessionKey: `${NEW_CHAT_DRAFT_KEY_PREFIX}draft1`,
        forcedSessionKey: 'forced',
        resolvedSessionKey: 'resolved',
        activeSessionKey: 'active',
      }),
    ).toBe(`${NEW_CHAT_DRAFT_KEY_PREFIX}draft1`)

    expect(
      resolveBlockPersistenceSessionKey({
        isNewChat: false,
        draftSessionKey: `${NEW_CHAT_DRAFT_KEY_PREFIX}draft1`,
        forcedSessionKey: '',
        resolvedSessionKey: 'resolved-key',
        activeSessionKey: 'active-key',
      }),
    ).toBe('resolved-key')

    expect(
      resolveBlockPersistenceSessionKey({
        isNewChat: false,
        draftSessionKey: `${NEW_CHAT_DRAFT_KEY_PREFIX}draft1`,
        forcedSessionKey: ' ',
        resolvedSessionKey: '',
        activeSessionKey: '',
      }),
    ).toBe('')
  })
})

describe('resolveSafeBlockMigrations', function () {
  it('allows draft->canonical and same-chat friendly->canonical migration', function () {
    expect(
      resolveSafeBlockMigrations({
        isNewChat: false,
        previousBlockSessionKey: `${NEW_CHAT_DRAFT_KEY_PREFIX}draft1`,
        persistenceSessionKey: 'session-1',
        activeFriendlyId: 'friendly-1',
      }),
    ).toEqual([
      {
        fromSessionKey: `${NEW_CHAT_DRAFT_KEY_PREFIX}draft1`,
        toSessionKey: 'session-1',
      },
      { fromSessionKey: 'friendly-1', toSessionKey: 'session-1' },
    ])
  })

  it('does not migrate arbitrary previous canonical key across chats', function () {
    expect(
      resolveSafeBlockMigrations({
        isNewChat: false,
        previousBlockSessionKey: 'session-a',
        persistenceSessionKey: 'session-b',
        activeFriendlyId: 'friendly-b',
      }),
    ).toEqual([{ fromSessionKey: 'friendly-b', toSessionKey: 'session-b' }])
  })
})
