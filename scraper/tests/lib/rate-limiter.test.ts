import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RateLimiter } from '../../src/lib/rate-limiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('resolves immediately on first call for a domain', async () => {
    const limiter = new RateLimiter({ defaultDelayMs: 2000 })
    const start = Date.now()
    await limiter.wait('amazon.in')
    expect(Date.now() - start).toBeLessThan(50)
  })

  it('waits delayMs before resolving second call for same domain', async () => {
    const limiter = new RateLimiter({ defaultDelayMs: 1000 })
    await limiter.wait('flipkart.com')
    let waited = false
    const p = limiter.wait('flipkart.com').then(() => { waited = true })
    expect(waited).toBe(false)
    vi.advanceTimersByTime(1000)
    await p
    expect(waited).toBe(true)
  })

  it('does not rate-limit different domains against each other', async () => {
    const limiter = new RateLimiter({ defaultDelayMs: 5000 })
    await limiter.wait('amazon.in')
    const start = Date.now()
    await limiter.wait('iherb.com')
    expect(Date.now() - start).toBeLessThan(50)
  })

  it('respects per-domain override', async () => {
    const limiter = new RateLimiter({
      defaultDelayMs: 2000,
      overrides: { 'fast.com': 100 },
    })
    await limiter.wait('fast.com')
    let done = false
    const p = limiter.wait('fast.com').then(() => { done = true })
    vi.advanceTimersByTime(100)
    await p
    expect(done).toBe(true)
  })
})
