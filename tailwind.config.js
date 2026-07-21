/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Roboto Flex"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Righteous', 'cursive'],
      },
      colors: {
        // Paleta de Cores do Sistema de Design Gov.br & Variantes
        'gov-blue': '#005A9C',
        'gov-blue-dark': '#004A80',
        'gov-green': '#28A745',
        'gov-green-dark': '#0F8243',
        'gov-yellow': '#FFC107',
        'gov-yellow-dark': '#E0A000',
        'gov-red': '#DC3545',
        'gov-red-dark': '#B02532',
        'gov-cyan': '#17A2B8',
        'gov-cyan-dark': '#117A8B',
        'gov-purple': '#6610F2',
        'gov-purple-dark': '#520DC2',
        'gov-pink': '#E83E8C',
        'gov-pink-dark': '#C2185B',
        'gov-orange': '#FD7E14',
        'gov-orange-dark': '#D96B00',
        'gov-teal': '#20C997',
        'gov-teal-dark': '#158C69',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.05)',
        'glass-hover': '0 12px 48px 0 rgba(0, 90, 156, 0.12)',
      }
    },
  },
  plugins: [],
}