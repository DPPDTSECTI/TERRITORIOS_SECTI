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
        // === PALETA ESTRUTURAL DA SECTI ===
        navy: {
          DEFAULT: '#1D3557',
          dark: '#0F1D30',
          light: '#2B4C7E',
        },
        steel: {
          DEFAULT: '#457B9D',
          light: '#6B9BB8',
        },
        ice: {
          DEFAULT: '#A8DADC',
          light: '#EBF4FF',
        },
        skysoft: {
          DEFAULT: '#D6EAF8',
          light: '#F0F7FD',
        },
        royal: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },

        // === PALETA DE ATIVOS CTI (EFEITO CASCATA) ===
        asset: {
          privada: '#60A5FA',
          estadual: '#2563EB',
          federal: '#1E40AF',
          if: '#0EA5E9',
          aceleradora: '#10B981',
          dinamizador: '#06B6D4',
          incubadora: '#38BDF8',
          parque: '#1D3557',
          ict: '#0284C7',
          pesquisa: '#457B9D',
        },

        // Brand legacy
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
        'card-soft': '0 4px 24px rgba(29, 53, 87, 0.04)',
        'card-hover': '0 12px 32px rgba(29, 53, 87, 0.1)',
      }
    },
  },
  plugins: [],
}