/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        moss: {
          deep: '#3d4127',
          primary: '#636b2f',
          sage: '#bac095',
          light: '#d4de95',
        },
        'paper-bg': '#fafaf6',
        'ink-text': '#23261a',
        'ink-muted': '#5c6152',
        hairline: '#dcdfc9',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(99, 107, 47, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(99, 107, 47, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
