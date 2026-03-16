import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'hill-black': '#0a0a0a',
        'hill-dark': '#111111',
        'hill-gray': '#1a1a1a',
        'hill-border': '#2a2a2a',
        'hill-orange': '#ff6b00',
        'hill-orange-dark': '#cc5500',
        'hill-green': '#00ff88',
        'hill-green-dark': '#00cc6a',
        'hill-red': '#ff3b3b',
        'hill-blue': '#4da6ff',
        'hill-white': '#ffffff',
        'hill-text': '#e0e0e0',
        'hill-muted': '#888888',
      },
      fontFamily: {
        mono: ["'SF Mono'", 'Consolas', 'Monaco', 'monospace'],
        sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        livePulse: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(0, 255, 136, 0.7)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 4px rgba(0, 255, 136, 0)' },
        },
      },
      animation: {
        'live-pulse': 'livePulse 2s infinite',
      },
    },
  },
  plugins: [],
}

export default config
