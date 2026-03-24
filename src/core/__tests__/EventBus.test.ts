import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '../EventBus'

describe('EventBus', () => {
  it('emit with no listeners does not throw', () => {
    const bus = new EventBus()
    expect(() => bus.emit('no-listeners', { data: 1 })).not.toThrow()
  })

  it('on + emit: listener receives emitted data', () => {
    const bus = new EventBus()
    const received: unknown[] = []
    bus.on('test', (data) => received.push(data))
    bus.emit('test', { value: 42 })
    expect(received).toHaveLength(1)
    expect(received[0]).toEqual({ value: 42 })
  })

  it('multiple listeners for same event: both fire', () => {
    const bus = new EventBus()
    const calls: number[] = []
    bus.on('evt', () => calls.push(1))
    bus.on('evt', () => calls.push(2))
    bus.emit('evt')
    expect(calls).toEqual([1, 2])
  })

  it('off removes listener — no call after off', () => {
    const bus = new EventBus()
    const spy = vi.fn()
    bus.on('x', spy)
    bus.emit('x')
    bus.off('x', spy)
    bus.emit('x')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('off non-existent listener does not throw', () => {
    const bus = new EventBus()
    const fn = vi.fn()
    expect(() => bus.off('nonexistent', fn)).not.toThrow()
  })

  it('once fires exactly one time — second emit does not trigger it', () => {
    const bus = new EventBus()
    const spy = vi.fn()
    bus.once('y', spy)
    bus.emit('y', 'first')
    bus.emit('y', 'second')
    bus.emit('y', 'third')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('first')
  })

  it('once cleans up after itself — subsequent emits do not trigger', () => {
    const bus = new EventBus()
    const spy = vi.fn()
    bus.once('z', spy)
    bus.emit('z')
    // After first fire, the listener should be removed
    bus.emit('z')
    bus.emit('z')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('emit passes complex data correctly', () => {
    const bus = new EventBus()
    const payload = { a: 1, b: { c: [1, 2, 3] }, d: 'hello' }
    let received: unknown
    bus.on('data-test', (d) => { received = d })
    bus.emit('data-test', payload)
    expect(received).toEqual(payload)
    expect(received).toBe(payload) // same reference
  })

  it('multiple events: listeners for event A do not fire on event B', () => {
    const bus = new EventBus()
    const spyA = vi.fn()
    const spyB = vi.fn()
    bus.on('eventA', spyA)
    bus.on('eventB', spyB)
    bus.emit('eventA', 'hello')
    expect(spyA).toHaveBeenCalledTimes(1)
    expect(spyB).not.toHaveBeenCalled()
  })

  it('clear removes all listeners for an event — emit after clear does nothing', () => {
    const bus = new EventBus()
    const spy = vi.fn()
    bus.on('clear-me', spy)
    bus.on('clear-me', spy)
    bus.clear('clear-me')
    bus.emit('clear-me')
    expect(spy).not.toHaveBeenCalled()
  })

  it('clearAll removes listeners for all events', () => {
    const bus = new EventBus()
    const spyA = vi.fn()
    const spyB = vi.fn()
    bus.on('a', spyA)
    bus.on('b', spyB)
    bus.clearAll()
    bus.emit('a')
    bus.emit('b')
    expect(spyA).not.toHaveBeenCalled()
    expect(spyB).not.toHaveBeenCalled()
  })

  it('fresh instance is independent — new EventBus() shares no state with singleton', () => {
    const bus1 = new EventBus()
    const bus2 = new EventBus()
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    bus1.on('shared-event', spy1)
    bus2.on('shared-event', spy2)
    bus1.emit('shared-event', 'bus1')
    expect(spy1).toHaveBeenCalledWith('bus1')
    expect(spy2).not.toHaveBeenCalled()
  })

  it('registering same callback twice calls it twice per emit', () => {
    const bus = new EventBus()
    const spy = vi.fn()
    bus.on('dup', spy)
    bus.on('dup', spy)
    bus.emit('dup', 'data')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
