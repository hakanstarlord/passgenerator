import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'events'
import { registerLockTriggers, LOCK_EVENTS } from '../lockTriggers.js'

describe('registerLockTriggers', () => {
  it('ekran kilidi ve uykuyu dinler', () => {
    expect(LOCK_EVENTS).toEqual(['lock-screen', 'suspend'])
  })

  it('lock-screen ve suspend olaylarında nedeniyle birlikte kilitler', () => {
    const powerMonitor = new EventEmitter()
    const onLock = vi.fn()
    registerLockTriggers({ powerMonitor, onLock })
    powerMonitor.emit('lock-screen')
    powerMonitor.emit('suspend')
    expect(onLock.mock.calls).toEqual([['lock-screen'], ['suspend']])
  })

  it('kilit açma, uyanma ve diğer olaylarda kilitlemez', () => {
    const powerMonitor = new EventEmitter()
    const onLock = vi.fn()
    registerLockTriggers({ powerMonitor, onLock })
    for (const event of ['unlock-screen', 'resume', 'on-ac', 'on-battery']) powerMonitor.emit(event)
    expect(onLock).not.toHaveBeenCalled()
  })

  it('kaldırma fonksiyonu dinleyicileri siler', () => {
    const powerMonitor = new EventEmitter()
    const onLock = vi.fn()
    const unregister = registerLockTriggers({ powerMonitor, onLock })
    unregister()
    powerMonitor.emit('lock-screen')
    powerMonitor.emit('suspend')
    expect(onLock).not.toHaveBeenCalled()
    expect(powerMonitor.listenerCount('lock-screen')).toBe(0)
  })
})
