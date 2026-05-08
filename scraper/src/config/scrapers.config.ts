export interface ScraperConfig {
  delayMs: number
  categories: string[]
  selectors: Record<string, string>
}

export const SCRAPER_CONFIGS: Record<string, ScraperConfig> = {
  'amazon-india': {
    delayMs: 2000,
    categories: ['supplements', 'protein', 'nutraceuticals', 'health-foods'],
    selectors: {
      searchUrl:      'https://www.amazon.in/s?k={query}&rh=n%3A1350380031',
      productCard:    '[data-component-type="s-search-result"]',
      productLink:    'h2 a',
      nextPage:       '.s-pagination-next',
      productTitle:   '#productTitle',
      brandLink:      '#bylineInfo',
      imageCarousel:  '#altImages img, #imgTagWrapperId img',
    },
  },
  'amazon-us': {
    delayMs: 2500,
    categories: ['supplements', 'protein', 'vitamins', 'functional-foods'],
    selectors: {
      searchUrl:      'https://www.amazon.com/s?k={query}&rh=n%3A3760901',
      productCard:    '[data-component-type="s-search-result"]',
      productLink:    'h2 a',
      nextPage:       '.s-pagination-next',
      productTitle:   '#productTitle',
      brandLink:      '#bylineInfo',
      imageCarousel:  '#altImages img, #imgTagWrapperId img',
    },
  },
  flipkart: {
    delayMs: 2000,
    categories: ['supplements', 'protein', 'health-foods'],
    selectors: {
      searchUrl:      'https://www.flipkart.com/search?q={query}&otracker=search',
      productCard:    '._1AtVbE',
      productLink:    'a._1fQZEK, a.s1Q9rs',
      nextPage:       'a._1LKTO3[aria-label="Next Page"]',
      productTitle:   '.B_NuCI',
      brandLink:      'a.G6XhRU',
      imageCarousel:  '._3GnUWp img, ._2r_T1I img',
    },
  },
  iherb: {
    delayMs: 3000,
    categories: ['supplements', 'vitamins', 'protein', 'sports-nutrition'],
    selectors: {
      searchUrl:      'https://www.iherb.com/search?kw={query}',
      productCard:    '.product-cell',
      productLink:    'a.absolute-link',
      nextPage:       'a[aria-label="Next page"]',
      productTitle:   'h1.product-title',
      brandLink:      'a.brand-name',
      imageCarousel:  '.slick-slide img, #productImage img',
    },
  },
}
