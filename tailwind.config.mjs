/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Colores oficiales Manual de Identidad COHONDUCAFE v1.0 ── */
        forest:  { DEFAULT: '#1A6B40', light: '#25904F', dark: '#0F3D28' },
        coffee:  { DEFAULT: '#6B3F1E', light: '#9B6240', dark: '#3E2410' },
        cream:   { DEFAULT: '#F5EFE0', light: '#FBF8F2', dark: '#E8DCC8' },
        gold:    { DEFAULT: '#C49A3C', light: '#E0BA64', dark: '#8F6E28' },
        earth:   { DEFAULT: '#8C6239', light: '#B38E6A', dark: '#5C3D1E' },
        vino:    { DEFAULT: '#7B2D38', light: '#A34455', dark: '#4F1B23' },
      },
      fontFamily: {
        sans:    ['Montserrat', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
