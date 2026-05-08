interface RateLimiterOptions {
  defaultDelayMs: number
  overrides?: Record<string, number>
}

export class RateLimiter {
  private lastCallAt = new Map<string, number>()
  private readonly defaultDelayMs: number
  private readonly overrides: Record<string, number>

  constructor(options: RateLimiterOptions) {
    this.defaultDelayMs = options.defaultDelayMs
    this.overrides = options.overrides ?? {}
  }

  async wait(domain: string): Promise<void> {
    const delayMs = this.overrides[domain] ?? this.defaultDelayMs
    const last = this.lastCallAt.get(domain)
    const now = Date.now()

    if (last !== undefined) {
      const elapsed = now - last
      if (elapsed < delayMs) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, delayMs - elapsed)
        )
      }
    }

    this.lastCallAt.set(domain, Date.now())
  }
}
