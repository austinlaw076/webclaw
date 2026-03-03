import { describe, expect, it, vi } from 'vitest'
import { releaseStreamResources } from './stream'

describe('releaseStreamResources', function () {
  it('clears heartbeat timer and releases shared gateway client', function () {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const releaseClient = vi.fn()
    const heartbeat = setInterval(function noop() {
      return
    }, 5000)

    const next = releaseStreamResources({
      heartbeat,
      releaseClient,
    })

    expect(clearIntervalSpy).toHaveBeenCalledWith(heartbeat)
    expect(releaseClient).toHaveBeenCalledTimes(1)
    expect(next).toEqual({ heartbeat: null, releaseClient: null })

    clearIntervalSpy.mockRestore()
  })

  it('is safe when resources are already empty', function () {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const next = releaseStreamResources({
      heartbeat: null,
      releaseClient: null,
    })

    expect(clearIntervalSpy).not.toHaveBeenCalled()
    expect(next).toEqual({ heartbeat: null, releaseClient: null })

    clearIntervalSpy.mockRestore()
  })
})
