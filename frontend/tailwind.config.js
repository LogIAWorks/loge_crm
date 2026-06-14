/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy: {
          900: '#0A0F1E',
          800: '#0F1A2E',
          700: '#152238',
          600: '#1B2B45',
          500: '#243B5C',
        },
        brand: {
          DEFAULT: '#0EA5E9',
          light: '#38BDF8',
          dark: '#0284C7',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.06), 0 4px 10px -3px rgba(0,0,0,0.03)',
        'sidebar': '2px 0 20px rgba(10,15,30,0.15)',
        'modal': '0 25px 50px -12px rgba(0,0,0,0.15)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse_dot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-dot': 'pulse_dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
