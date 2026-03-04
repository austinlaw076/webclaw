import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import type { BlockDocBlock, BlockDocument } from './types'

export type BlockDocumentsState = {
  docsBySession: Partial<Record<string, BlockDocument>>
}

type BlockDocumentsStore = BlockDocumentsState & {
  getOrCreateDoc: (sessionKey: string) => BlockDocument
  upsertBlock: (sessionKey: string, block: BlockDocBlock) => void
  removeBlock: (sessionKey: string, blockId: string) => void
  reorderBlocks: (sessionKey: string, sourceIndex: number, targetIndex: number) => void
  migrateDocSessionKey: (fromSessionKey: string, toSessionKey: string) => void
  clearDoc: (sessionKey: string) => void
}

const FALLBACK_SESSION_KEY = 'main'

function normalizeSessionKey(sessionKey: string): string {
  const normalized = sessionKey.trim()
  return normalized.length > 0 ? normalized : FALLBACK_SESSION_KEY
}

function nowMs(): number {
  return Date.now()
}

function createEmptyDoc(sessionKey: string): BlockDocument {
  return {
    sessionKey,
    blocks: [],
    updatedAt: nowMs(),
  }
}

export function getOrCreateDoc(
  state: BlockDocumentsState,
  sessionKey: string,
): BlockDocument {
  const key = normalizeSessionKey(sessionKey)
  const existing = state.docsBySession[key]
  if (existing) {
    return existing
  }

  const created = createEmptyDoc(key)
  state.docsBySession[key] = created
  return created
}

export function upsertBlock(
  state: BlockDocumentsState,
  sessionKey: string,
  block: BlockDocBlock,
): BlockDocumentsState {
  const key = normalizeSessionKey(sessionKey)
  const previousDoc = state.docsBySession[key] ?? createEmptyDoc(key)
  const existingIndex = previousDoc.blocks.findIndex((item) => item.id === block.id)

  const nextBlocks = [...previousDoc.blocks]
  if (existingIndex >= 0) {
    nextBlocks[existingIndex] = block
  } else {
    nextBlocks.push(block)
  }

  return {
    docsBySession: {
      ...state.docsBySession,
      [key]: {
        ...previousDoc,
        blocks: nextBlocks,
        updatedAt: nowMs(),
      },
    },
  }
}

export function removeBlock(
  state: BlockDocumentsState,
  sessionKey: string,
  blockId: string,
): BlockDocumentsState {
  const key = normalizeSessionKey(sessionKey)
  const previousDoc = state.docsBySession[key]
  if (!previousDoc) return state

  const nextBlocks = previousDoc.blocks.filter((block) => block.id !== blockId)
  if (nextBlocks.length === previousDoc.blocks.length) return state

  return {
    docsBySession: {
      ...state.docsBySession,
      [key]: {
        ...previousDoc,
        blocks: nextBlocks,
        updatedAt: nowMs(),
      },
    },
  }
}

export function reorderBlocks(
  state: BlockDocumentsState,
  sessionKey: string,
  sourceIndex: number,
  targetIndex: number,
): BlockDocumentsState {
  const key = normalizeSessionKey(sessionKey)
  const previousDoc = state.docsBySession[key]
  if (!previousDoc) return state

  const totalBlocks = previousDoc.blocks.length
  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex >= totalBlocks ||
    targetIndex >= totalBlocks ||
    sourceIndex === targetIndex
  ) {
    return state
  }

  const nextBlocks = [...previousDoc.blocks]
  const [moved] = nextBlocks.splice(sourceIndex, 1)
  nextBlocks.splice(targetIndex, 0, moved)

  return {
    docsBySession: {
      ...state.docsBySession,
      [key]: {
        ...previousDoc,
        blocks: nextBlocks,
        updatedAt: nowMs(),
      },
    },
  }
}

export function clearDoc(
  state: BlockDocumentsState,
  sessionKey: string,
): BlockDocumentsState {
  const key = normalizeSessionKey(sessionKey)
  if (!state.docsBySession[key]) return state

  const nextDocsBySession = { ...state.docsBySession }
  delete nextDocsBySession[key]

  return {
    docsBySession: nextDocsBySession,
  }
}

function mergeDocBlocks(
  targetBlocks: Array<BlockDocBlock>,
  sourceBlocks: Array<BlockDocBlock>,
): Array<BlockDocBlock> {
  const merged = [...targetBlocks]
  for (const sourceBlock of sourceBlocks) {
    const existingIndex = merged.findIndex((block) => block.id === sourceBlock.id)
    if (existingIndex < 0) {
      merged.push(sourceBlock)
      continue
    }

    const existing = merged[existingIndex]
    if (sourceBlock.updatedAt >= existing.updatedAt) {
      merged[existingIndex] = sourceBlock
    }
  }

  return merged
}

export function migrateDocSessionKey(
  state: BlockDocumentsState,
  fromSessionKey: string,
  toSessionKey: string,
): BlockDocumentsState {
  const fromKey = normalizeSessionKey(fromSessionKey)
  const toKey = normalizeSessionKey(toSessionKey)
  if (fromKey === toKey) return state

  const sourceDoc = state.docsBySession[fromKey]
  if (!sourceDoc) return state

  const targetDoc = state.docsBySession[toKey]
  const nextTargetDoc: BlockDocument = targetDoc
    ? {
        ...targetDoc,
        sessionKey: toKey,
        blocks: mergeDocBlocks(targetDoc.blocks, sourceDoc.blocks),
        updatedAt: Math.max(targetDoc.updatedAt, sourceDoc.updatedAt),
      }
    : {
        ...sourceDoc,
        sessionKey: toKey,
      }

  const nextDocsBySession = { ...state.docsBySession, [toKey]: nextTargetDoc }
  delete nextDocsBySession[fromKey]

  return {
    docsBySession: nextDocsBySession,
  }
}

function createMemoryStorage(): StateStorage {
  const memory = new Map<string, string>()
  return {
    getItem: function getItem(name) {
      return memory.get(name) ?? null
    },
    setItem: function setItem(name, value) {
      memory.set(name, value)
    },
    removeItem: function removeItem(name) {
      memory.delete(name)
    },
  }
}

function resolvePersistStorage(): StateStorage {
  if (typeof window !== 'undefined') {
    return window.localStorage
  }

  return createMemoryStorage()
}

export const useBlockDocumentsStore = create<BlockDocumentsStore>()(
  persist(
    (set, get) => ({
      docsBySession: {},
      getOrCreateDoc: function getOrCreateDocAction(sessionKey) {
        const key = normalizeSessionKey(sessionKey)
        const existing = get().docsBySession[key]
        if (existing) return existing

        const created = createEmptyDoc(key)
        set((state) => ({
          docsBySession: {
            ...state.docsBySession,
            [key]: created,
          },
        }))
        return created
      },
      upsertBlock: function upsertBlockAction(sessionKey, block) {
        set((state) => upsertBlock(state, sessionKey, block))
      },
      removeBlock: function removeBlockAction(sessionKey, blockId) {
        set((state) => removeBlock(state, sessionKey, blockId))
      },
      reorderBlocks: function reorderBlocksAction(sessionKey, sourceIndex, targetIndex) {
        set((state) => reorderBlocks(state, sessionKey, sourceIndex, targetIndex))
      },
      migrateDocSessionKey: function migrateDocSessionKeyAction(
        fromSessionKey,
        toSessionKey,
      ) {
        set((state) => migrateDocSessionKey(state, fromSessionKey, toSessionKey))
      },
      clearDoc: function clearDocAction(sessionKey) {
        set((state) => clearDoc(state, sessionKey))
      },
    }),
    {
      name: 'chat-block-doc-v1',
      storage: createJSONStorage(resolvePersistStorage),
    },
  ),
)
