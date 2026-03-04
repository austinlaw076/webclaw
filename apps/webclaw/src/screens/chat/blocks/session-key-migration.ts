import { randomUUID } from '@/lib/utils'

export const NEW_CHAT_DRAFT_KEY_PREFIX = 'draft:new:'

type ResolvePersistenceSessionKeyInput = {
  isNewChat: boolean
  draftSessionKey: string
  forcedSessionKey?: string
  resolvedSessionKey?: string
  activeSessionKey?: string
}

type SafeMigrationInput = {
  isNewChat: boolean
  previousBlockSessionKey: string | null
  persistenceSessionKey: string
  activeFriendlyId: string
}

function normalizeSessionKey(value?: string): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

export function createNewChatDraftSessionKey(
  generateId: () => string = randomUUID,
): string {
  const generated = generateId().trim() || randomUUID()
  return `${NEW_CHAT_DRAFT_KEY_PREFIX}${generated}`
}

export function resolveBlockPersistenceSessionKey({
  isNewChat,
  draftSessionKey,
  forcedSessionKey,
  resolvedSessionKey,
  activeSessionKey,
}: ResolvePersistenceSessionKeyInput): string {
  if (isNewChat) return normalizeSessionKey(draftSessionKey)

  const canonicalCandidates = [forcedSessionKey, resolvedSessionKey, activeSessionKey]
  for (const candidate of canonicalCandidates) {
    const normalized = normalizeSessionKey(candidate)
    if (normalized.length > 0) {
      return normalized
    }
  }

  return ''
}

export function resolveSafeBlockMigrations({
  isNewChat,
  previousBlockSessionKey,
  persistenceSessionKey,
  activeFriendlyId,
}: SafeMigrationInput): Array<{ fromSessionKey: string; toSessionKey: string }> {
  if (isNewChat) return []

  const toSessionKey = normalizeSessionKey(persistenceSessionKey)
  if (!toSessionKey) return []

  const migrations: Array<{ fromSessionKey: string; toSessionKey: string }> = []
  const seen = new Set<string>()

  const addMigration = (fromCandidate: string | null | undefined) => {
    const fromSessionKey = normalizeSessionKey(fromCandidate ?? '')
    if (!fromSessionKey || fromSessionKey === toSessionKey) return

    const signature = `${fromSessionKey}->${toSessionKey}`
    if (seen.has(signature)) return
    seen.add(signature)
    migrations.push({ fromSessionKey, toSessionKey })
  }

  if (previousBlockSessionKey && previousBlockSessionKey.startsWith(NEW_CHAT_DRAFT_KEY_PREFIX)) {
    addMigration(previousBlockSessionKey)
  }

  addMigration(activeFriendlyId)

  return migrations
}
