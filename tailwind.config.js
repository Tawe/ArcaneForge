/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{tsx,ts}',
    './components/**/*.{tsx,ts}',
    './pages/**/*.{tsx,ts}',
    './hooks/**/*.{tsx,ts}',
    './services/**/*.{tsx,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        fantasy: ['Cinzel', 'serif'],
        serif: ['"Crimson Text"', 'serif'],
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'spin-reverse': 'spin-reverse 1s linear infinite',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.perspective-1000': {
          perspective: '1000px',
        },
      });
    },
  ],
};
