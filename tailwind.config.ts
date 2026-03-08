import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Design token aliases
        surface: '#18181b',   // zinc-900
        border: '#3f3f46',    // zinc-700
      },
    },
  },
  plugins: [],
}

export default config
