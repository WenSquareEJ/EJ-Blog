import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { brand: { DEFAULT: '#2dbb7d', dark: '#1c8a5b' } },
    fontFamily: { display: ["'Trebuchet MS'", 'system-ui', 'sans-serif'] }
  }},
  plugins: []
}
export default config
