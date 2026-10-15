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
          surface: '#0E1724',
          surfaceHover: '#142032',
          surfaceActive: '#1A2A42',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: '#1C2B3E',
          emerald: '#10B981',
          emeraldDark: '#059669',
          emeraldLight: '#34D399',
          emeraldGlow: '#00E676',
          text: '#F8FAFC',
          textMuted: '#94A3B8',
          textDim: '#64748B',
          actionFold: '#374151',
          actionCall: '#2563EB',
          actionRaise: '#DC2626',
          actionLimp: '#059669',
        }
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
