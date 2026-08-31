/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#141219',
        surface: {
          DEFAULT: '#211E26',
          lowest: '#0F0D14',
          low: '#1D1A22',
          high: '#2B2930',
          highest: '#36333B',
          bright: '#3B3840',
        },
        violet: {
          DEFAULT: '#A78BF9',
          dim: '#8065D0',
          light: '#CEBDFF',
          container: '#4953BC',
        },
        lavender: {
          DEFAULT: '#CCBFF0',
          dim: '#7C719D',
          container: '#4D436C',
        },
        gold: {
          DEFAULT: '#DBC839',
          dim: '#AF9E00',
        },
        neutral: {
          txt: '#E6E0EB',
          variant: '#CAC4D4',
          muted: '#948E9D',
          border: 'rgba(148, 142, 157, 0.2)',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'violet-glow': '0px 4px 20px rgba(167, 139, 249, 0.25)',
        'gold-glow': '0px 4px 20px rgba(219, 200, 57, 0.25)',
      }
    },
  },
  plugins: [],
}
