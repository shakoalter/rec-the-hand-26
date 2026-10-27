/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          darkest: '#05080C',
          bg: '#070C12',
          surface: '#0D1624',
          surfaceElevated: '#132032',
          surfaceHover: '#142032',
          surfaceActive: '#1A2A42',
          heroSurface: '#0B261C',
          border: '#1E2E42',
          borderSubtle: '#1C2B3E',
          borderStrong: '#263B54',
          emerald: '#10B981',
          emeraldDark: '#059669',
          emeraldLight: '#34D399',
          emeraldGlow: '#00E676',
          text: '#F8FAFC',
          textMuted: '#94A3B8',
          textDim: '#64748B',
          actionFold: '#1E2632',
          actionCall: '#1D72FE',
          actionRaise: '#EF4444',
          actionLimp: '#10B981',
        }
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '19': '4.75rem',
        '21': '5.25rem',
      },
      scale: {
        '98': '0.98',
      },
      boxShadow: {
        'neon-emerald': '0 0 14px rgba(16, 185, 129, 0.45)',
        'neon-emerald-lg': '0 0 24px rgba(16, 185, 129, 0.65)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
