/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Roboto Flex"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Righteous', 'cursive'],
      },
      colors: {
        // Paleta de Cores
        'brand': {
          1: '#3117ea',
          2: '#5f3bef',
          3: '#8d5ef5',
          4: '#bb82fa',
          5: '#e9a6ff',
        },
        'neon-purple': '#3117ea',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.05)',
        'glass-hover': '0 12px 48px 0 rgba(49, 23, 234, 0.12)',
      }
    },
  },
  plugins: [],
}