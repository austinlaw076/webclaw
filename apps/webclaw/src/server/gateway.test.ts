import { describe, expect, it } from 'vitest'
import { createHandlerRegistry } from './gateway'

describe('createHandlerRegistry', function () {
  it('dispatches payloads to multiple subscribers', function () {
    const registry = createHandlerRegistry<number>()
    const receivedA: Array<number> = []
    const receivedB: Array<number> = []

    registry.subscribe(function onPayloadA(payload) {
      receivedA.push(payload)
    })
    registry.subscribe(function onPayloadB(payload) {
      receivedB.push(payload)
    })

    registry.emit(1)
    registry.emit(2)

    expect(receivedA).toEqual([1, 2])
    expect(receivedB).toEqual([1, 2])
  })

  it('supports per-subscriber unsubscribe and global clear', function () {
    const registry = createHandlerRegistry<string>()
    const receivedA: Array<string> = []
    const receivedB: Array<string> = []

    const unsubscribeA = registry.subscribe(function onPayloadA(payload) {
      receivedA.push(payload)
    })
    registry.subscribe(function onPayloadB(payload) {
      receivedB.push(payload)
    })

    registry.emit('before')
    unsubscribeA()
    registry.emit('after-unsubscribe')
    registry.clear()
    registry.emit('after-clear')

    expect(receivedA).toEqual(['before'])
    expect(receivedB).toEqual(['before', 'after-unsubscribe'])
  })
})
