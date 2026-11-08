/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        damm: {
          50: '#fdf2f2',
          100: '#fde4e5',
          200: '#f9cbcd',
          300: '#f3a2a6',
          400: '#e86d74',
          500: '#db3f48',
          600: '#C8102E',
          700: '#9B0D23',
          800: '#7B0F1F',
          900: '#5A0F19',
          950: '#34050B',
          red: '#C8102E',
          darkred: '#9B0D23',
          gold: '#D4AF37',
          cream: '#FBF8F3',
          charcoal: '#1A1A1A',
          muted: '#666666',
        },
        gold: {
          50: '#fbf9ed',
          100: '#f5f0d3',
          200: '#ebe0a6',
          300: '#deca72',
          400: '#D4AF37',
          500: '#ba9427',
          600: '#9b761e',
          700: '#7c591a',
          800: '#67481b',
          900: '#573d1b',
        },
        ink: {
          50: '#f8f8fa',
          100: '#f0f0f4',
          200: '#e2e2ea',
          300: '#cacbd8',
          400: '#abaec1',
          500: '#8c91a9',
          600: '#6f748f',
          700: '#585c74',
          800: '#46495d',
          900: '#1A1A1A',
          950: '#111111',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        cardlg: '0 8px 30px -6px rgb(0 0 0 / 0.10), 0 4px 10px -4px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
