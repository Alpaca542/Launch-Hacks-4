/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "../../launchhacks/index.html",
    "../../launchhacks/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        gray: {
          850: '#1a1f29',
          950: '#0f1419',
        },
        blue: {
          400: '#4f8cff',
          500: '#4f8cff',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-out-right': 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-gray-600': {
          'scrollbar-color': '#4b5563 transparent',
        },
        '.scrollbar-thumb-gray-700': {
          'scrollbar-color': '#374151 transparent',
        },
        '.scrollbar-track-gray-800': {
          'scrollbar-color': '#1f2937 transparent',
        },
        '.scrollbar-track-gray-900': {
          'scrollbar-color': '#111827 transparent',
        },
      });
    },
  ],
}

