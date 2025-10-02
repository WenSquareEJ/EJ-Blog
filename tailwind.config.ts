import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mc: {
          grass: '#3CAB3A',
          grassDark: '#2F8E2F',
          dirt: '#7A4E1D',
          dirtDark: '#5C3A15',
          sky: '#E8F5FF',
          stone: '#6B7280',
          sand: '#E4C16F',
          leaf: '#49B265',
          water: '#4FC3F7'
        }
      },
      boxShadow: {
        block: '0 6px 0 0 #2F8E2F, 0 6px 12px rgba(0,0,0,.15)',
        soft: '0 6px 24px rgba(0,0,0,.06)'
      },
      borderRadius: {
        block: '12px'
      },
      fontFamily: {
        pixel: ['"Pixelify Sans"', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: []
}
export default config
