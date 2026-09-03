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
        mediblue: {
          50: '#F0F7FF',
          100: '#E0F0FE',
          200: '#BAE0FD',
          300: '#7CC4FA',
          400: '#38A3F6',
          500: '#0E85E5',
          600: '#0267C1',
          700: '#02529E',
          800: '#064682',
          900: '#0B3B6D',
          950: '#072548',
        },
        navy: {
          800: '#1E293B',
          900: '#0F172A',
          950: '#0A0F1D',
        },
        clinical: {
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          subtle: '#F1F5F9',
          text: '#1E293B',
          muted: '#64748B',
        },
        teal: {
          500: '#0D9488',
          600: '#0F766E',
        },
        priority: {
          light: '#FEF2F2',
          border: '#FECACA',
          text: '#991B1B',
          solid: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser-scan': 'scan 2.5s ease-in-out infinite',
        'ripple': 'ripple 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'orb-float': 'orbFloat 4s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-8px) scale(1.03)' },
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'soft-lg': '0 10px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'glow-blue': '0 0 25px -3px rgba(14, 133, 229, 0.35)',
        'glow-teal': '0 0 25px -3px rgba(13, 148, 136, 0.35)',
        'glow-priority': '0 0 25px -3px rgba(220, 38, 38, 0.35)',
      }
    },
  },
  plugins: [],
}
