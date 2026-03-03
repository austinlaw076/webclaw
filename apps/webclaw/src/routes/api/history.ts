import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayRpc } from '../../server/gateway'

type ChatHistoryResponse = {
  sessionKey: string
  sessionId?: string
  messages: Array<any>
  thinkingLevel?: string
}

type SessionsResolveResponse = {
  ok?: boolean
  key?: string
}

const DEFAULT_HISTORY_LIMIT = 200
const MAX_HISTORY_LIMIT = 500

export function normalizeHistoryLimit(rawLimit: string | null): number {
  const parsedLimit = Number(rawLimit ?? String(DEFAULT_HISTORY_LIMIT))
  if (!Number.isFinite(parsedLimit)) return DEFAULT_HISTORY_LIMIT
  const integerLimit = Math.trunc(parsedLimit)
  return Math.min(MAX_HISTORY_LIMIT, Math.max(1, integerLimit))
}

export const Route = createFileRoute('/api/history')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const limit = normalizeHistoryLimit(url.searchParams.get('limit'))
          const rawSessionKey = url.searchParams.get('sessionKey')?.trim()
          const friendlyId = url.searchParams.get('friendlyId')?.trim()

          let sessionKey =
            rawSessionKey && rawSessionKey.length > 0 ? rawSessionKey : ''

          if (!sessionKey && friendlyId) {
            const resolved = await gatewayRpc<SessionsResolveResponse>(
              'sessions.resolve',
              {
                key: friendlyId,
                includeUnknown: true,
                includeGlobal: true,
              },
            )
            const resolvedKey =
              typeof resolved.key === 'string' ? resolved.key.trim() : ''
            if (resolvedKey.length === 0) {
              return json({ error: 'session not found' }, { status: 404 })
            }
            sessionKey = resolvedKey
          }

          if (sessionKey.length === 0) {
            sessionKey = 'main'
          }

          const payload = await gatewayRpc<ChatHistoryResponse>(
            'chat.history',
            {
              sessionKey,
              limit,
            },
          )

          return json(payload)
        } catch (err) {
          return json(
            {
              error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
