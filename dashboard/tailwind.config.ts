import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          app:     '#0a0a0a',
          sidebar: '#141414',
          card:    '#1a1a1a',
          hover:   '#222222',
        },
        border: {
          DEFAULT: '#222222',
          subtle:  '#1a1a1a',
        },
        text: {
          primary:   '#f0f0f0',
          secondary: '#888888',
          muted:     '#555555',
        },
        accent: {
          purple: '#7c3aed',
          blue:   '#0ea5e9',
          green:  '#22c55e',
          amber:  '#f59e0b',
          red:    '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
