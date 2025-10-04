import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'mc-ink': 'var(--mc-ink)',
        'mc-stone': 'var(--mc-stone)',
        'mc-sky': 'var(--mc-sky)',
      },
    },
  },
  safelist: [
    'text-mc-ink',
    'text-mc-stone',
    'text-mc-sky',
    'home-card-title',
    'home-card-meta',
    'home-card-body',
    'section-title',
    'section-label',
  ],
  plugins: [],
} satisfies Config
