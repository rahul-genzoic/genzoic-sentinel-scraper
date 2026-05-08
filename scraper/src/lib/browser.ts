import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

export interface ProxyConfig {
  server: string
  username?: string
  password?: string
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
}

export async function createContext(
  browser: Browser,
  proxy?: ProxyConfig
): Promise<BrowserContext> {
  return browser.newContext({
    proxy,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
}

export async function newPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage()
  page.setDefaultNavigationTimeout(30_000)
  page.setDefaultTimeout(15_000)
  return page
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt))
      }
    }
  }
  throw lastError
}
