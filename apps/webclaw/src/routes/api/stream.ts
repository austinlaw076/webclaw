import { createFileRoute } from '@tanstack/react-router'
import { acquireGatewayClient, gatewayRpcShared } from '../../server/gateway'

type StreamEventPayload = {
  event: string
  payload?: unknown
  seq?: number
  stateVersion?: number
}

type StreamResources = {
  heartbeat: ReturnType<typeof setInterval> | null
  releaseClient: (() => void) | null
}

export function releaseStreamResources(
  resources: StreamResources,
): StreamResources {
  const { heartbeat, releaseClient } = resources
  if (heartbeat) {
    clearInterval(heartbeat)
  }
  releaseClient?.()
  return { heartbeat: null, releaseClient: null }
}

export const Route = createFileRoute('/api/stream')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const sessionKey = url.searchParams.get('sessionKey')?.trim() || ''
        const friendlyId = url.searchParams.get('friendlyId')?.trim() || ''
        const encoder = new TextEncoder()

        let releaseClient: (() => void) | null = null
        let heartbeat: ReturnType<typeof setInterval> | null = null
        let closed = false

        const stream = new ReadableStream({
          start(controller) {
            function cleanup() {
              const nextResources = releaseStreamResources({
                heartbeat,
                releaseClient,
              })
              heartbeat = nextResources.heartbeat
              releaseClient = nextResources.releaseClient
            }

            function send(data: StreamEventPayload) {
              if (closed) return
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                )
              } catch {
                closed = true
                cleanup()
                try {
                  controller.close()
                } catch {
                  return
                }
              }
            }

            heartbeat = setInterval(() => {
              if (closed) return
              try {
                controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'))
              } catch {
                closed = true
                cleanup()
                try {
                  controller.close()
                } catch {
                  return
                }
              }
            }, 15000)

            const key = sessionKey || friendlyId
            if (key) {
              void acquireGatewayClient(key, {
                onEvent(event) {
                  send({
                    event: event.event,
                    payload: event.payload,
                    seq: event.seq,
                    stateVersion: event.stateVersion,
                  })
                },
                onError(error) {
                  send({ event: 'error', payload: error.message })
                },
              })
                .then((handle) => {
                  if (closed) {
                    handle.release()
                    return
                  }
                  releaseClient = handle.release
                  if (sessionKey) {
                    void gatewayRpcShared(
                      'chat.history',
                      { sessionKey, limit: 1 },
                      sessionKey,
                    )
                  }
                })
                .catch((error: unknown) => {
                  if (closed) return
                  const message =
                    error instanceof Error ? error.message : String(error)
                  send({ event: 'error', payload: message })
                })
            }

            request.signal.addEventListener(
              'abort',
              () => {
                if (closed) return
                closed = true
                cleanup()
                try {
                  controller.close()
                } catch {
                  return
                }
              },
              { once: true },
            )
          },
          cancel() {
            if (closed) return
            closed = true
            const nextResources = releaseStreamResources({
              heartbeat,
              releaseClient,
            })
            heartbeat = nextResources.heartbeat
            releaseClient = nextResources.releaseClient
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      },
    },
  },
})
